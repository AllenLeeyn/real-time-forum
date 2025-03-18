package handlers

import (
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func Signup(w http.ResponseWriter, r *http.Request) {
	sessionCookie, _ := checkSessionValidity(w, r)
	if sessionCookie != nil {
		http.Redirect(w, r, "/", http.StatusFound)
		return
	}

	if r.Method != http.MethodPost {
		executeJSON(w, ErrorData{"Method not allowed"}, http.StatusMethodNotAllowed)
		return
	}

	// check that credentials are valid
	name, email, passwd, e := getCredentials(r, true)
	if e != nil {
		executeJSON(w, ErrorData{e.Error()}, http.StatusBadRequest)
		return
	}
	passwdHash, err := bcrypt.GenerateFromPassword([]byte(passwd), 0)
	if err != nil {
		executeJSON(w, ErrorData{"Error creating user"}, http.StatusInternalServerError)
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
		executeJSON(w, ErrorData{"Error creating user"}, http.StatusInternalServerError)
		return
	}

	createSession(w, user)
	http.Redirect(w, r, "./", http.StatusSeeOther)
}
