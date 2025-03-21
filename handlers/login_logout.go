package handlers

import (
	"errors"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func Login(w http.ResponseWriter, r *http.Request) {
	_, _, isValid := checkHttpRequest(w, r, "guest", http.MethodPost)
	if !isValid {
		return
	}

	u := &user{}
	if !getJSON(w, r, u) {
		return
	}

	e := checkLoginCredentials(u)
	if e != nil {
		executeJSON(w, MsgData{e.Error()}, http.StatusBadRequest)
		return
	}

	// check that user exists
	user, _ := db.SelectUserByField("nick_name", u.NickName)
	if user == nil {
		user, _ = db.SelectUserByField("email", u.Email)
	}
	if user == nil || bcrypt.CompareHashAndPassword(user.PwHash, []byte(u.Passwd)) != nil {
		executeJSON(w, MsgData{"Incorrect username and/or password"}, http.StatusBadRequest)
		return
	}

	s, e := db.SelectActiveSessionBy("user_id", user.ID)
	if e == nil {
		expireSession(w, s.ID)
	}
	createSession(w, user)
	executeJSON(w, MsgData{"Login succesful"}, http.StatusOK)
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

func checkLoginCredentials(u *user) error {
	emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	usernameRegex := `^[a-zA-Z0-9_-]{3,16}$`

	if !validRegex(u.NickName, usernameRegex) {
		u.NickName = ""
	}
	if !validRegex(u.Email, emailRegex) {
		u.Email = ""
	}
	if !validPsswrd(u.Passwd) {
		return errors.New("password must be 8 characters or longer.\n" +
			"Include at least a lower case character, an upper case character, a number and one of '@$!%*?&'")
	}
	return nil
}
