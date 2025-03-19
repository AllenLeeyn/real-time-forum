package handlers

import (
	"net/http"
	"strconv"
)

// Home page
func Home(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/home" {
		executeJSON(w, ErrorData{"Page not found"}, http.StatusNotFound)
		return
	}
	if r.Method != http.MethodGet {
		executeJSON(w, ErrorData{"Method not allowed"}, http.StatusMethodNotAllowed)
		return
	}

	// check session from cookie to get feedback data
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
	posts, err := db.SelectPosts(filterBy, orderBy, id, userID)
	if err != nil {
		executeJSON(w, ErrorData{"Error getting posts"}, http.StatusInternalServerError)
		return
	}
	extendSession(w, sessionCookie)
	executeJSON(w,
		homepageData{
			isValidSession: sessionCookie != nil,
			Categories:     db.Categories,
			Posts:          posts,
			UserName:       userName,
		},
		http.StatusOK,
	)
}
