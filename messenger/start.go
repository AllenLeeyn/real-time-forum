package messenger

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"real-time-forum/dbTools"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

var db *dbTools.DBContainer
var upgrader = websocket.Upgrader{}

type message = dbTools.Message
type user = dbTools.User

type Messenger struct {
	clients     map[int]*client
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
		clients:     make(map[int]*client),
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

		msgData := message{Action: "message"}
		err = json.Unmarshal(msg, &msgData)
		if err != nil {
			log.Println("Invalid message format")
			continue
		}

		isValidMsg, sanitizeMsg := checkMessage(msgData.Content)
		if !isValidMsg {
			log.Println("Invalid message format")
			continue
		}

		receiver, err := db.SelectUserByField("id", msgData.ReceiverID)
		if err != nil || receiver == nil {
			log.Println("Receiver not found:", err)
			continue
		}

		msgData.SenderID = cl.UserID
		msgData.Content = sanitizeMsg
		msgData.CreatedAt = time.Now()

		err = db.InsertMessage(&msgData)
		if err != nil {
			log.Println("Error inserting message:", err)
			continue
		}
		m.msgQueue <- message{
			SenderID:   -1,
			ReceiverID: cl.UserID,
			Action:     "messageSendOK",
		}
		m.msgQueue <- msgData
	}
	m.clientQueue <- action{"offline", cl}
	cl.Conn.Close()
}

func checkMessage(message string) (bool, string) {
	message = strings.TrimSpace(message)
	if len(message) == 0 {
		return false, "Too short"
	} else if len(message) > 1000 {
		return false, "Too long"
	}
	return true, message
}
func (m *Messenger) listener() {
	for action := range m.clientQueue {
		if action.kind == "join" {
			m.clients[action.client.UserID] = action.client
			m.sendClientList(action.client, -1)
		}
		if action.kind == "online" {
			log.Println("online:", action.client.UserName)
			m.clients[action.client.UserID] = action.client
			m.sendClientList(action.client, 0)
			idStr := strconv.Itoa(action.client.UserID)
			m.msgQueue <- message{
				SenderID:   -1,
				ReceiverID: -1,
				Content:    `{"action": "online", "id": "` + idStr + `"}`,
			}
		}
		if action.kind == "offline" {
			log.Println("offline:", action.client.UserName)
			delete(m.clients, action.client.UserID)
			idStr := strconv.Itoa(action.client.UserID)
			m.msgQueue <- message{
				SenderID:   -1,
				ReceiverID: -1,
				Content:    `{"action":"offline","id":"` + idStr + `"}`,
			}
		}
	}
}

func (m *Messenger) broadcaster() {
	for {
		msg := <-m.msgQueue
		log.Println(msg.Content)

		if msg.Action == "message" || msg.Action == "messageSendOK" {
			content, err := json.Marshal(msg)
			if err != nil {
				log.Printf("Error generating JSON: %v", err)
			}
			msg.Content = string(content)
		}

		if msg.ReceiverID == -1 {
			for _, client := range m.clients {
				err := client.Conn.WriteMessage(websocket.TextMessage, []byte(msg.Content))
				if err != nil {
					log.Printf("Error sending message to %v: %v", msg.ReceiverID, err)
				}
			}
		} else {
			receiver, exists := m.clients[msg.ReceiverID]
			if exists {
				err := receiver.Conn.WriteMessage(websocket.TextMessage, []byte(msg.Content))
				if err != nil {
					log.Printf("Error sending message to %v: %v", msg.ReceiverID, err)
				}
			} else {
				log.Printf("Receiver %v not found", msg.ReceiverID)
			}
		}
	}
}

func (m *Messenger) sendClientList(cl *client, receiver int) {
	type data struct {
		Action           string   `json:"action"`
		AllClients       []string `json:"allClients"`
		ClientIDs        []int    `json:"clientIDs"`
		OnlineClients    []int    `json:"onlineClients"`
		UnreadMsgClients []int    `json:"unreadMsgClients"`
	}
	d := data{Action: "start"}
	clientList, clientIDs, err := db.SelectUserList("clientList", cl.UserID)
	if err != nil {
		log.Println("Error fetching client list:", err)
		return
	}
	d.AllClients = *clientList
	d.ClientIDs = *clientIDs

	_, unreadList, err := db.SelectUserList("unreadMsg", cl.UserID)
	if err != nil {
		log.Println("Error fetching client list:", err)
		return
	}
	d.UnreadMsgClients = *unreadList

	for userID := range m.clients {
		d.OnlineClients = append(d.OnlineClients, userID)
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
		SenderID:   -1,
		ReceiverID: receiver,
		Content:    string(jsonData),
	}
}

func (m *Messenger) CloseConn(s *dbTools.Session) error {
	u, err := db.SelectUserByField("id", s.UserID)
	if err != nil || u == nil {
		return fmt.Errorf("failed to find user: %w", err)
	}
	cl, exists := m.clients[u.ID]
	if !exists {
		return fmt.Errorf("user %v not found in clients map", u.ID)
	}
	cl.Conn.Close()
	return nil
}
