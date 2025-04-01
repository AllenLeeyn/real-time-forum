package messenger

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"real-time-forum/dbTools"
	"sort"
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

// func (m *Messenger) handleConnection(cl *client) {
// 	for {
// 		_, msg, err := cl.Conn.ReadMessage()
// 		if err != nil {
// 			log.Println("Error reading message:", err)
// 			break
// 		}
// 		log.Println("Message from", ":", string(msg))

// 		// adding
// 		var messageData map[string]interface{}
// 		err = json.Unmarshal(msg, &messageData)
// 		if err != nil {
// 			log.Println("Error unmarshaling message:", err)
// 			continue
// 		}

// 		action, ok := messageData["action"].(string)
// 		if !ok {
// 			log.Println("Invalid message format")
// 			continue
// 		}

// 		if action == "message" {
// 			content, _ := messageData["content"].(string)
// 			sender, _ := messageData["sender"].(string)
// 			recipient, _ := messageData["recipient"].(string)

// 			// Store message in database using dbTools.StoreMessage
// 			err := db.StoreMessage(content, cl.UserID, m.getUserID(recipient))
// 			if err != nil {
// 				log.Println("Error storing message:", err)
// 			}

// 			// Broadcast message to recipient
// 			m.msgQueue <- message{
// 				SenderID:     cl.UserID,
// 				ReceiverID:   m.getUserID(recipient),
// 				Content:      fmt.Sprintf(`{"action": "message", "content": "%s", "sender": "%s"}`, content, sender),
// 				ReceiverName: recipient,
// 			}
// 		} else if action == "mark-as-read" {
// 			recipient, _ := messageData["recipient"].(string)
// 			recipientID := m.getUserID(recipient)
// 			// Mark messages as read
// 			qry := `UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE receiver_id = ? AND sender_id = ? AND read_at IS NULL`
// 			_, err = db.conn.Exec(qry, cl.UserID, recipientID)
// 			if err != nil {
// 				log.Println("Error marking messages as read:", err)
// 			}
// 		}
// 	}
// 	m.clientQueue <- action{"offline", cl}
// 	cl.Conn.Close()
// }

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
		log.Println("Sending message:", msg.Content)

		if msg.ReceiverID == -1 {
			for _, client := range m.clients {
				log.Printf("Sending to all clients: %s", client.UserName)
				err := client.Conn.WriteMessage(websocket.TextMessage, []byte(msg.Content))
				if err != nil {
					log.Printf("Error sending message to %s: %v", msg.ReceiverName, err)
				}
			}
		} else {
			receiver, exists := m.clients[msg.ReceiverName]
			if exists {
				err := receiver.Conn.WriteMessage(websocket.TextMessage, []byte(msg.Content))
				log.Printf("Sending to %s", msg.ReceiverName)
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

	// Remove duplicates from the client list
	uniqueClients := make(map[string]bool)
	for _, client := range *clientList {
		uniqueClients[client] = true
	}

	// Convert map to a sorted slice
	var sortedClients []string
	for client := range uniqueClients {
		sortedClients = append(sortedClients, client)
	}
	sort.Strings(sortedClients) // Sort the slice alphabetically
	d.AllClients = sortedClients

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
// grabbing userID
func (m *Messenger) getUserID(username string) int {
	user, err := db.SelectUserByField("nick_name", username)
	if err != nil || user == nil {
		log.Printf("User %s not found", username)
		return -1
	}
	return user.ID
}

// func (m *Messenger) markAsRead(w http.ResponseWriter, r *http.Request) {
// 	var data map[string]interface{}
// 	err := json.NewDecoder(r.Body).Decode(&data)
// 	if err != nil {
// 		log.Println("Error decoding request:", err)
// 		return
// 	}
// 	messageID, ok := data["messageID"].(int)
// 	if !ok {
// 		log.Println("Invalid messageID in request")
// 		return
// 	}
// 	err = db.MarkMessageAsRead(senderID, recipientID)
// 	if err != nil {
// 		log.Println("Error updating read status:", err)
// 	}
// }

type MessageResponse struct {
	Action   string            `json:"action"`
	Messages []dbTools.Message `json:"messages"`
}

func (m *Messenger) handleConnection(cl *client) {
	for {
		_, msg, err := cl.Conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			break
		}
		log.Println("Message from", ":", string(msg))

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
			// Handle message sending
			content, _ := messageData["content"].(string)
			sender, _ := messageData["sender"].(string)
			recipient, _ := messageData["recipient"].(string)

			err := db.StoreMessage(content, cl.UserID, m.getUserID(recipient))
			if err != nil {
				log.Println("Error storing message:", err)
			}

			m.msgQueue <- message{
				SenderID:     cl.UserID,
				ReceiverID:   m.getUserID(recipient),
				Content:      fmt.Sprintf(`{"action": "message", "content": "%s", "sender": "%s"}`, content, sender),
				ReceiverName: recipient,
			}
		} else if action == "fetch-messages" {
			recipient, _ := messageData["recipient"].(string)
			recipientID := m.getUserID(recipient)
			senderID := cl.UserID

			messages, err := db.SelectMessages(senderID, recipientID, time.Now())
			if err != nil {
				log.Println("Error fetching messages:", err)
				return
			}

			var messageResponse MessageResponse
			messageResponse.Action = "messages"
			messageResponse.Messages = make([]dbTools.Message, 0, len(*messages))

			for _, message := range *messages {
				userData, err := db.SelectUserByField("id", message.SenderID)
				if err != nil || userData == nil {
					log.Println("Error fetching user data")
					continue
				}
				messageResponse.Messages = append(messageResponse.Messages, dbTools.Message{
					ID:           message.ID,
					Action:       "",
					SenderID:     message.SenderID,
					ReceiverID:   message.ReceiverID,
					Content:      message.Content,
					CreatedAt:    message.CreatedAt,
					ReadAt:       message.ReadAt,
					ReceiverName: userData.NickName,
				})
			}

			// Reverse the order of messages
			// for i, j := 0, len(messageResponse.Messages)-1; i < j; i, j = i+1, j-1 {
			// 	messageResponse.Messages[i], messageResponse.Messages[j] = messageResponse.Messages[j], messageResponse.Messages[i]
			// }
			sort.Slice(messageResponse.Messages, func(i, j int) bool {
				return messageResponse.Messages[i].CreatedAt.Before(messageResponse.Messages[j].CreatedAt)
			})

			// Mark messages as read
			err = db.MarkMessagesAsRead(senderID, recipientID)
			if err != nil {
				log.Println("Error marking messages as read:", err)
			}

			jsonContent, err := json.Marshal(messageResponse)
			if err != nil {
				log.Println("Error marshaling messages:", err)
				return
			}

			// Send messages back to the client
			m.msgQueue <- message{
				SenderID:     -1,
				ReceiverID:   cl.UserID,
				Content:      string(jsonContent),
				ReceiverName: cl.UserName,
			}
		} else if action == "mark-as-read" {
			recipient, _ := messageData["recipient"].(string)
			recipientID := m.getUserID(recipient)
			senderID := cl.UserID

			err = db.MarkMessagesAsRead(senderID, recipientID)
			if err != nil {
				log.Println("Error marking messages as read:", err)
			}
		}
	}
	m.clientQueue <- action{"offline", cl}
	cl.Conn.Close()
}
