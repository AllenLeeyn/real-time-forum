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
	catIdStr := r.URL.Query().Get("id")
	catId, err := strconv.Atoi(catIdStr)
	if err != nil || catId > len(db.Categories) {
		catId = -1
	}

	if filterBy != "category" {
		catId = userID
	}
	selectedPosts, err := db.SelectPosts(filterBy, orderBy, catId, userID)
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
