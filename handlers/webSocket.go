package handlers

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type webSocketHandler struct {
	upgrader websocket.Upgrader
}

func (wsh webSocketHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	c, err := wsh.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("error %s when upgrading connection to websocket", err)
		return
	}
	defer c.Close()

	// Send a message to the client upon connection establishment
	if err := c.WriteMessage(websocket.TextMessage, []byte("Hello There!")); err != nil {
		log.Println(err)
		return
	}

	// handle message from the client
	for {
		// continually listening for messages
		messageType, message, err := c.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		// Echo the message back to the client
		if err := c.WriteMessage(messageType, message); err != nil {
			log.Println(err)
			return
		}
	}
}

func NewWebSocketHandler() webSocketHandler {
	return webSocketHandler{
		upgrader: websocket.Upgrader{},
	}
}

// func main() {
// 	webSocketHandler := webSocketHandler{
// 		upgrader: websocket.Upgrader{},
// 	}

// 	// Serve static files
// 	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
// 		http.ServeFile(w, r, "index.html")
// 	})

// 	http.HandleFunc("/websocket.js", func(w http.ResponseWriter, r *http.Request) {
// 		http.ServeFile(w, r, "websocket.js")
// 	})

// 	// Handle WebSocket connections at /ws
// 	http.Handle("/ws", webSocketHandler)

// 	log.Print("Starting Server...Listening on :8989")
// 	log.Fatal(http.ListenAndServe(":8989", nil))
// }
