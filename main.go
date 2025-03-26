package main

import (
	"fmt"
	"log"
	"net/http"
	"real-time-forum/dbTools"
	"real-time-forum/handlers"
)

var db *dbTools.DBContainer

type user = dbTools.User
type session = dbTools.Session
type post = dbTools.Post
type feedback = dbTools.Feedback
type comment = dbTools.Comment

func init() {
	var err error
	db, err = dbTools.OpenDB("sqlite3", "./database/forum.db")
	if err != nil {
		log.Fatal("Error opening database: ", err)
	}

	db.Categories, _ = db.SelectFieldFromTable("name", "categories")
	handlers.Init(db)
}

func main() {
	http.Handle("/static/", http.FileServer(http.Dir("assets/")))
	http.HandleFunc("/", serveIndex)

	http.HandleFunc("/posts", handlers.Posts)
	http.HandleFunc("/post", handlers.Post)
	http.HandleFunc("/profile", handlers.Profile)

	http.HandleFunc("/signup", handlers.Signup)
	http.HandleFunc("/login", handlers.Login)
	http.HandleFunc("/logout", handlers.LogOut)

	http.HandleFunc("/create-post", handlers.CreatePost)
	http.HandleFunc("/create-comment", handlers.CreateComment)
	http.HandleFunc("/feedback", handlers.CreateFeedback)

	webSocketHandler := handlers.NewWebSocketHandler()
	http.Handle("/ws", webSocketHandler)

	fmt.Println("Starting Forum on http://localhost:8080/...")
	log.Fatal(http.ListenAndServe(":8080", nil))
	db.Close()
}

func serveIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.Redirect(w, r, "/", http.StatusFound)
	} else {
		http.ServeFile(w, r, "index.html")
	}
}
