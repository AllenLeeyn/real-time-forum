package handlers

import (
	"net/http"
	"strconv"
)

// Profile page
func Profile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		executeJSON(w, MsgData{"Method not allowed"}, http.StatusMethodNotAllowed)
		return
	}
	sessionCookie, userID := checkSessionValidity(w, r)

	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		executeJSON(w, MsgData{"Invalid profile ID"}, http.StatusBadRequest)
		return
	}
	user, err := db.SelectUserByField("id", id)
	if err != nil || user == nil {
		executeJSON(w, MsgData{"Error getting user details"}, http.StatusInternalServerError)
		return
	}
	posts, err := db.SelectPosts("createdBy", "", id, userID)
	if err != nil {
		executeJSON(w, MsgData{"Error getting user posts"}, http.StatusInternalServerError)
		return
	}
	extendSession(w, sessionCookie)
	executeJSON(w, profileData{
		Name:  user.NickName,
		Posts: posts,
	}, http.StatusOK)
}
