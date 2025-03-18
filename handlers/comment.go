package handlers

import (
	"encoding/json"
	"html"
	"io"
	"net/http"
	"strconv"
)

func Comment(w http.ResponseWriter, r *http.Request) {
	sessionCookie, userID := checkSessionValidity(w, r)
	if userID == -1 {
		executeJSON(w, ErrorData{"Please login and try again"}, http.StatusUnauthorized)
		return
	}
	if r.Method != http.MethodPost {
		executeJSON(w, ErrorData{"Method not allowed"}, http.StatusMethodNotAllowed)
		return
	}

	s := struct {
		Comment string
	}{}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		executeJSON(w, ErrorData{"Error reading body"}, http.StatusInternalServerError)
		return
	}
	if err = json.Unmarshal(body, &s); err != nil {
		executeJSON(w, ErrorData{"Error reading json"}, http.StatusInternalServerError)
		return
	} else if bodyIsValid, bodyErr := CheckPostValidity(s.Comment, "postContent"); !bodyIsValid {
		executeJSON(w, ErrorData{bodyErr}, http.StatusInternalServerError)
		return
	}

	postId := r.URL.Query().Get("postId")
	pId, err := strconv.Atoi(postId)
	if err != nil {
		executeJSON(w, ErrorData{"Invalid post ID"}, http.StatusBadRequest)
		return
	}

	post, err := db.SelectPost(pId, userID)
	if err != nil || post == nil {
		executeJSON(w, ErrorData{"Post not found"}, http.StatusNotFound)
		return
	}

	user, err := db.SelectUserByField("id", userID)
	if err != nil || user == nil {
		executeJSON(w, ErrorData{"User not found"}, http.StatusNotFound)
		return
	}
	c := comment{
		UserID:   userID,
		PostID:   pId,
		Content:  html.EscapeString(s.Comment),
		UserName: user.NickName}

	if err := db.InsertComment(c); err != nil {
		executeJSON(w, ErrorData{"Error creating comment"}, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	extendSession(w, sessionCookie)
}
