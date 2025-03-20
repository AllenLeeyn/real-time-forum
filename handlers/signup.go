package handlers

import (
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func Signup(w http.ResponseWriter, r *http.Request) {
	_, _, isValid := checkPostRequest(w, r, "guest")
	if !isValid {
		return
	}

	// check that credentials are valid
	name, email, passwd, e := getCredentials(r, true)
	if e != nil {
		executeJSON(w, MsgData{e.Error()}, http.StatusBadRequest)
		return
	}
	passwdHash, err := bcrypt.GenerateFromPassword([]byte(passwd), 0)
	if err != nil {
		executeJSON(w, MsgData{"Error creating user"}, http.StatusInternalServerError)
		return
	}

	// add the user to the database
	user := &user{
		TypeID:   1,
		NickName: name,
		Email:    email,
		PwHash:   passwdHash,
	}
	user.ID, err = db.InsertUser(user)
	if err != nil {
		executeJSON(w, MsgData{"Error creating user"}, http.StatusInternalServerError)
		return
	}
	createSession(w, user)
	executeJSON(w, MsgData{"Signup succesful"}, http.StatusOK)
}
