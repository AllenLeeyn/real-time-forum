package handlers

import (
	"net/http"
	"strconv"
)

// Profile page
func ViewProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		idStr := r.URL.Query().Get("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			executeJSON(w, ErrorData{"Invalid profile ID"}, http.StatusBadRequest)
			return
		}
		user, err := db.SelectUserByField("id", id)
		if err != nil || user == nil {
			executeJSON(w, ErrorData{"Error getting user details"}, http.StatusInternalServerError)
			return
		}
		sessionCookie, userID := checkSessionValidity(w, r)
		if sessionCookie != nil {
			extendSession(w, sessionCookie)
		}
		posts, err := db.SelectPosts("createdBy", "", id, userID)
		if err != nil {
			executeJSON(w, ErrorData{"Error getting user posts"}, http.StatusInternalServerError)
			return
		}
		data := profilepageData{
			ProfileID:     id,
			ViewerID:      userID,
			Name:          user.NickName,
			Email:         user.Email,
			Posts:         posts,
			SessionCookie: sessionCookie,
			Categories:    db.Categories,
		}
		if userID == id {
			data.Email = user.Email
			data.SessionCookie = sessionCookie
		}
		executeJSON(w, data, http.StatusOK)
	} else {
		executeJSON(w, ErrorData{"Method not allowed"}, http.StatusMethodNotAllowed)
		return
	}
}
