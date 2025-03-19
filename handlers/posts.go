package handlers

import (
	"net/http"
	"strconv"
)

// Posts() grabs all posts for main page.
// Checks for valid sessions to populate feedback data.
func Posts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		executeJSON(w, MsgData{"Method not allowed"}, http.StatusMethodNotAllowed)
		return
	}
	sessionCookie, userID := checkSessionValidity(w, r)

	userName := "Guest"
	u, err := db.SelectUserByField("id", userID)
	if err == nil && u != nil {
		userName = u.NickName
	}

	filterBy := r.URL.Query().Get("filterBy")
	orderBy := r.URL.Query().Get("orderBy")
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id > len(db.Categories) {
		id = -1
	}

	if filterBy != "category" {
		id = userID
	}
	selectedPosts, err := db.SelectPosts(filterBy, orderBy, id, userID)
	if err != nil {
		executeJSON(w, MsgData{"Error getting posts"}, http.StatusInternalServerError)
		return
	}
	extendSession(w, sessionCookie)
	executeJSON(w,
		postsData{
			IsValidSession: sessionCookie != nil,
			Categories:     db.Categories,
			Posts:          selectedPosts,
			UserName:       userName,
		},
		http.StatusOK,
	)
}
