package handlers

import (
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func Login(w http.ResponseWriter, r *http.Request) {
	_, _, isValid := checkPostRequest(w, r, "guest")
	if !isValid {
		return
	}

	username, _, passwd, e := getCredentials(r, false)
	if e != nil {
		executeJSON(w, MsgData{e.Error()}, http.StatusBadRequest)
		return
	}

	// check that user exists
	user, _ := db.SelectUserByField("name", username)
	if user == nil || bcrypt.CompareHashAndPassword(user.PwHash, []byte(passwd)) != nil {
		executeJSON(w, MsgData{"Incorrect username and/or password"}, http.StatusBadRequest)
		return
	}

	s, e := db.SelectActiveSessionBy("user_id", user.ID)
	if e == nil {
		expireSession(w, s.ID)
	}
	createSession(w, user)
	http.Redirect(w, r, "./", http.StatusSeeOther)
}

func LogOut(w http.ResponseWriter, r *http.Request) {
	sessionCookie, _ := r.Cookie("session-id")
	if sessionCookie == nil {
		executeJSON(w, MsgData{"You're not logged in"}, http.StatusBadRequest)
		return
	} else {
		expireSession(w, sessionCookie.Value)
	}
	http.Redirect(w, r, "./", http.StatusSeeOther)
}
