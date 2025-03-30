package messenger

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"real-time-forum/dbTools"
	"time"

	"github.com/gorilla/websocket"
)

var db *dbTools.DBContainer
var upgrader = websocket.Upgrader{}

type message = dbTools.Message
type user = dbTools.User

type Messenger struct {
	clients     map[string]*client
	msgQueue    chan message
	clientQueue chan action
}

type client struct {
	UserName  string
	UserID    int
	SessionID string
	Conn      *websocket.Conn
}

type action struct {
	kind   string
	client *client
}

func Start(dbMain *dbTools.DBContainer) Messenger {
	db = dbMain
	m := Messenger{
		clients:     make(map[string]*client),
		msgQueue:    make(chan message, 100),
		clientQueue: make(chan action, 100),
	}

	go m.listener()
	go m.broadcaster()
	return m
}

func (m *Messenger) WebSocketUpgrade(w http.ResponseWriter, r *http.Request, sessionID string, u *user) {

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection: ", err)
		return
	}

	cl := &client{
		u.NickName,
		u.ID,
		sessionID,
		conn,
	}

	if time.Since(u.RegDate) < time.Minute {
		m.clientQueue <- action{"join", cl}
	} else {
		m.clientQueue <- action{"online", cl}
	}
	go m.handleConnection(cl)
}

func (m *Messenger) handleConnection(cl *client) {
	for {
		_, msg, err := cl.Conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}
		log.Println("Message from", ":", string(msg))

		// adding
		var messageData map[string]interface{}
		err = json.Unmarshal(msg, &messageData)
		if err != nil {
			log.Println("Error unmarshaling message:", err)
			continue
		}

		action, ok := messageData["action"].(string)
		if !ok {
			log.Println("Invalid message format")
			continue
		}

		if action == "message" {
			content, _ := messageData["content"].(string)
			sender, _ := messageData["sender"].(string)
			recipient, _ := messageData["recipient"].(string)

			// Store message in database
			m.storeMessage(content, cl.UserID, m.getUserID(recipient))

			// Broadcast message to recipient
			m.msgQueue <- message{
				SenderID:     cl.UserID,
				ReceiverID:   m.getUserID(recipient),
				Content:      fmt.Sprintf(`{"action": "message", "content": "%s", "sender": "%s"}`, content, sender),
				ReceiverName: recipient,
			}
		}
	}
	m.clientQueue <- action{"offline", cl}
	cl.Conn.Close()
}

func (m *Messenger) listener() {
	for action := range m.clientQueue {
		if action.kind == "join" {
			m.clients[action.client.UserName] = action.client
			m.sendClientList(action.client, -1)
		}
		if action.kind == "online" {
			log.Println("online:", action.client.UserName)
			m.clients[action.client.UserName] = action.client
			m.sendClientList(action.client, 0)
			m.msgQueue <- message{
				SenderID:   -1,
				ReceiverID: -1,
				Content:    `{"action": "online", "userName": "` + action.client.UserName + `"}`,
			}
		}
		if action.kind == "offline" {
			log.Println("offline:", action.client.UserName)
			delete(m.clients, action.client.UserName)
			m.msgQueue <- message{
				SenderID:   -1,
				ReceiverID: -1,
				Content:    `{"action":"offline","userName":"` + action.client.UserName + `"}`,
			}
		}
	}
}

func (m *Messenger) broadcaster() {
	for {
		msg := <-m.msgQueue
		log.Println(msg.Content)

		if msg.ReceiverID == -1 {
			for _, client := range m.clients {
				err := client.Conn.WriteMessage(websocket.TextMessage, []byte(msg.Content))
				if err != nil {
					log.Printf("Error sending message to %s: %v", msg.ReceiverName, err)
				}
			}
		} else {
			receiver, exists := m.clients[msg.ReceiverName]
			if exists {
				err := receiver.Conn.WriteMessage(websocket.TextMessage, []byte(msg.Content))
				if err != nil {
					log.Printf("Error sending message to %s: %v", msg.ReceiverName, err)
				}
			} else {
				log.Printf("Receiver %s not found", msg.ReceiverName)
			}
		}
	}
}

func (m *Messenger) sendClientList(cl *client, receiver int) {
	type data struct {
		Action           string   `json:"action"`
		AllClients       []string `json:"allClients"`
		OnlineClients    []string `json:"onlineClients"`
		UnreadMsgClients []string `json:"unreadMsgClients"`
	}
	d := data{Action: "start"}
	clientList, err := db.SelectUserList("clientList", cl.UserID)
	if err != nil {
		log.Println("Error fetching client list:", err)
		return
	}
	d.AllClients = *clientList

	unreadList, err := db.SelectUserList("unreadMsg", cl.UserID)
	if err != nil {
		log.Println("Error fetching client list:", err)
		return
	}
	d.UnreadMsgClients = *unreadList

	for userName := range m.clients {
		d.OnlineClients = append(d.OnlineClients, userName)
	}

	jsonData, err := json.Marshal(d)
	if err != nil {
		log.Println("Error marshaling data to JSON:", err)
		return
	}
	if receiver != -1 {
		receiver = cl.UserID
	}
	m.msgQueue <- message{
		SenderID:     -1,
		ReceiverID:   receiver,
		Content:      string(jsonData),
		ReceiverName: cl.UserName,
	}
}

func (m *Messenger) CloseConn(s *dbTools.Session) error {
	u, err := db.SelectUserByField("id", s.UserID)
	if err != nil || u == nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	cl, exists := m.clients[u.NickName]
	if !exists {
		return fmt.Errorf("user %s not found in clients map", u.NickName)
	}
	cl.Conn.Close()
	return nil
}

// Adding
// grabbing userID and StoreMessage
func (m *Messenger) getUserID(username string) int {
	user, err := db.SelectUserByField("nick_name", username)
	if err != nil || user == nil {
		log.Printf("User %s not found", username)
		return -1
	}
	return user.ID
}

func (m *Messenger) storeMessage(content string, senderID int, receiverID int) {
	err := db.StoreMessage(content, senderID, receiverID) // check db_message.go for direct storeMessage function
	if err != nil {
		log.Println("Error storing message:", err)
	}
}
