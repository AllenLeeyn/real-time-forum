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

	if r.Method == http.MethodGet {
		ExecuteTmpl(w, "signup.html", nil)
		return
	} else if r.Method != http.MethodPost {
		ExecuteError(w, "Tmpl", "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// check that credentials are valid
	name, email, passwd, e := getCredentials(r, true)
	if e != nil {
		ExecuteError(w, "json", e.Error(), http.StatusBadRequest)
		return
	}
	passwdHash, err := bcrypt.GenerateFromPassword([]byte(passwd), 0)
	if err != nil {
		ExecuteError(w, "json", "Error creating user", http.StatusInternalServerError)
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
		ExecuteError(w, "json", "Error creating user", http.StatusInternalServerError)
		return
	}

	createSession(w, user)
	http.Redirect(w, r, "./", http.StatusSeeOther)
}

// Terms page
func Terms(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		ExecuteTmpl(w, "terms.html", nil)
	} else {
		ExecuteError(w, "Tmpl", "Invalid User Method", http.StatusMethodNotAllowed)
		return
	}
}
