package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"real-time-forum/dbTools"
	"strconv"
	"sync"

	"github.com/gorilla/websocket"
)

type Client struct {
	ID   string
	Conn *websocket.Conn
}

type Hub struct {
	Clients map[string]*Client
	mu      sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		Clients: make(map[string]*Client),
	}
}

func (h *Hub) AddClient(clientID string, conn *websocket.Conn) {
	h.mu.Lock()
	h.Clients[clientID] = &Client{ID: clientID, Conn: conn}
	h.mu.Unlock()
	log.Printf("Client %v added", clientID)
}

func (h *Hub) RemoveClient(clientID string) {
	h.mu.Lock()
	delete(h.Clients, clientID)
	h.mu.Unlock()
	log.Printf("Client %v removed", clientID)
}

func (h *Hub) BroadcastMessage(message []byte, senderID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	for id, client := range h.Clients {
		if id != senderID {
			if err := client.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Println(err)
			}
		}
	}
}

func (h *Hub) SendMessageToClient(clientID string, message []byte) {
	h.mu.Lock()
	if client, ok := h.Clients[clientID]; ok {
		if err := client.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
			log.Println(err)
		}
	}
	h.mu.Unlock()
}

// / Handling to Front
type webSocketHandler struct {
	upgrader websocket.Upgrader
	hub      *Hub
	db       *dbTools.DBContainer
}

func NewWebSocketHandler(db *dbTools.DBContainer) *webSocketHandler {
	return &webSocketHandler{
		upgrader: websocket.Upgrader{},
		hub:      NewHub(),
		db:       db,
	}
}

// handshake
func (wsh webSocketHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := wsh.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("error %s when upgrading connection to websocket", err)
		return
	}
	defer conn.Close()

	// Extract client ID from cookie.
	cookie, err := r.Cookie("session-id")
	if err != nil {
		log.Println(err)
		return
	}
	sessionID := cookie.Value
	log.Printf("Extracted Session ID: %v", sessionID)

	session, err := wsh.db.SelectActiveSessionBy("id", sessionID)
	if err != nil {
		log.Println(err)
		return
	}

	clientID := strconv.Itoa(session.UserID)
	log.Printf("Client ID (UserID): %v", clientID)

	wsh.hub.AddClient(clientID, conn)

	if err := conn.WriteMessage(websocket.TextMessage, []byte("Hello There!")); err != nil {
		log.Println(err)
		return
	}

	connectedUsers := wsh.getConnectedUsers()
	updateMessage := []byte(`{"type": "updateUsers", "users": ` + connectedUsers + `}`)
	wsh.hub.BroadcastMessage(updateMessage, clientID)

	// Handle client messages.
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			wsh.hub.RemoveClient(clientID)
			connectedUsers = wsh.getConnectedUsers()
			updateMessage = []byte(`{"type": "updateUsers", "users": ` + connectedUsers + `}`)
			wsh.hub.BroadcastMessage(updateMessage, clientID)
			return
		}

		if messageType == websocket.TextMessage {
			senderMessage := []byte(`{"type": "message", "sender": "` + clientID + `", "message": "` + string(message) + `"}`)
			wsh.hub.BroadcastMessage(senderMessage, clientID)
		}
	}
}

func (wsh webSocketHandler) getConnectedUsers() string {

	wsh.hub.mu.Lock()         
	defer wsh.hub.mu.Unlock() 

	var users []string
	for _, client := range wsh.hub.Clients {
		users = append(users, client.ID)
	}

	// Convert the slice of users to a JSON string.
	jsonUsers, _ := json.Marshal(users)
	return string(jsonUsers)
}
