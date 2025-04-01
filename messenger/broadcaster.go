package messenger

import (
	"encoding/json"
	"log"

	"github.com/gorilla/websocket"
)

func (m *Messenger) broadcaster() {
	for {
		msg := <-m.msgQueue

		if msg.Action == "message" || msg.Action == "messageHistory" {
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
			err := m.sendMessage(msg, msg.ReceiverID)
			if err != nil {
				log.Printf("Error sending message to %v: %v", msg.ReceiverID, err)
			}
			if msg.SenderID != -1 && msg.SenderID != msg.ReceiverID {
				err = m.sendMessage(msg, msg.SenderID)
				if err != nil {
					log.Printf("Error sending message to %v: %v", msg.SenderID, err)
				}
			}
		}
	}
}
