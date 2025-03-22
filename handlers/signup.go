package handlers

import (
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func Signup(w http.ResponseWriter, r *http.Request) {
	_, _, isValid := checkHttpRequest(w, r, "guest", http.MethodPost)
	if !isValid {
		return
	}

	u := &user{}
	if !getJSON(w, r, u) {
		return
	}

	// check that credentials are valid
	e := checkCredentials(u)
	if e != nil {
		executeJSON(w, MsgData{e.Error()}, http.StatusBadRequest)
		return
	}
	passwdHash, err := bcrypt.GenerateFromPassword([]byte(u.Passwd), 0)
	if err != nil {
		executeJSON(w, MsgData{"Error creating user"}, http.StatusInternalServerError)
		return
	}

	u.TypeID = 1
	u.PwHash = passwdHash
	u.ID, err = db.InsertUser(u)
	if err != nil {
		executeJSON(w, MsgData{"Error creating user"}, http.StatusInternalServerError)
		return
	}
	createSession(w, u)
	executeJSON(w, MsgData{"Signup succesful"}, http.StatusOK)
}
