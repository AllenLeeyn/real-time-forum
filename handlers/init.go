package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"real-time-forum/dbTools"
	"regexp"
	"time"

	"github.com/gofrs/uuid"
)

// handler functions for different functionality.
// returns JSON and let JS on frontend to handle rendering

var db *dbTools.DBContainer

type user = dbTools.User
type session = dbTools.Session
type post = dbTools.Post
type feedback = dbTools.Feedback
type comment = dbTools.Comment

type homepageData struct {
	IsValidSession bool     `json:"isValidSession"`
	Categories     []string `json:"categories"`
	Posts          []post   `json:"posts"`
	UserName       string   `json:"userName"`
}

type postpageData struct {
	SessionCookie *http.Cookie
	Post          post
	Comments      []comment
	Categories    []string
}

type profilepageData struct {
	ProfileID     int
	ViewerID      int
	Name          string
	Email         string
	Posts         []post
	SessionCookie *http.Cookie
	Categories    []string
}

type ErrorData struct {
	Message string `json:"message"`
}

// Initializes all html files in templates folder
func Init(dbMain *dbTools.DBContainer) {
	db = dbMain
}

func executeJSON(w http.ResponseWriter, data interface{}, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(data)
}

/*----------- aunthenticate func -----------*/

// need to check for new requirements
func getCredentials(r *http.Request, isSignup bool) (string, string, string, error) {
	username := r.FormValue("username")
	email := r.FormValue("email")
	passwd := r.FormValue("password")

	emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	usernameRegex := `^[a-zA-Z0-9_-]{3,16}$`

	if r.Method != "POST" {
		return "", "", "", errors.New("invalid method")
	}
	if !validRegex(username, usernameRegex) {
		return "", "", "", errors.New("user name must be between 3 to 16 alphanumeric characters, '_' or '-'")
	}
	if !validPsswrd(passwd) {
		return "", "", "", errors.New("password must be 8 characters or longer.\n" +
			"Include at least a lower case character, an upper case character, a number and one of '@$!%*?&'")
	}
	if isSignup && (passwd != r.FormValue("confirm-password")) {
		return "", "", "", errors.New("passwords do not match")
	}
	if isSignup && !validRegex(email, emailRegex) {
		return "", "", "", errors.New("invalid email")
	}
	if user, _ := db.SelectUserByField("email", email); isSignup && user != nil {
		return "", "", "", errors.New("email is already used")
	}
	if user, _ := db.SelectUserByField("name", username); isSignup && user != nil {
		return "", "", "", errors.New("name is already used")
	}
	return username, email, passwd, nil
}

func validRegex(input, pattern string) bool {
	re := regexp.MustCompile(pattern)
	return re.MatchString(input)
}

func validPsswrd(password string) bool {
	hasLowercase := regexp.MustCompile(`[a-z]`).MatchString
	hasUppercase := regexp.MustCompile(`[A-Z]`).MatchString
	hasDigit := regexp.MustCompile(`\d`).MatchString
	hasSpecial := regexp.MustCompile(`[@$!%*?&]`).MatchString
	isValidLength := len(password) >= 8

	return hasLowercase(password) &&
		hasUppercase(password) &&
		hasDigit(password) &&
		hasSpecial(password) &&
		isValidLength
}

/*----------- session func -----------*/

func checkSessionValidity(w http.ResponseWriter, r *http.Request) (*http.Cookie, int) {
	sessionCookie, err := r.Cookie("session-id")
	if err != nil || sessionCookie == nil {
		return nil, -1
	}
	sessionID := sessionCookie.Value
	s, err := db.SelectActiveSessionBy("id", sessionID)
	if err != nil || s.ExpireTime.Before(time.Now()) {
		expireSession(w, sessionCookie.Value)
		return nil, -1
	}
	return sessionCookie, s.UserID
}

func createSession(w http.ResponseWriter, user *dbTools.User) {
	// generate a uuid for the session and set it into a cookie
	id, _ := uuid.NewV4()
	cookie := &http.Cookie{
		Name:     "session-id",
		Value:    id.String(),
		MaxAge:   7200,
		HttpOnly: true,
	}
	http.SetCookie(w, cookie)

	db.InsertSession(&dbTools.Session{
		ID:         id.String(),
		UserID:     user.ID,
		IsActive:   true,
		ExpireTime: time.Now().Add(2 * time.Hour),
	})
}

func extendSession(w http.ResponseWriter, sessionCookie *http.Cookie) {
	if sessionCookie == nil {
		return
	}
	// generate a uuid for the session and set it into a cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session-id",
		Value:    sessionCookie.Value,
		MaxAge:   7200,
		HttpOnly: true,
	})
	db.UpdateSession(&session{
		IsActive:   true,
		ExpireTime: time.Now().Add(2 * time.Hour),
		LastAccess: time.Now(),
		ID:         sessionCookie.Value,
	})
}

func expireSession(w http.ResponseWriter, sessionId string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "session-id",
		Value:    "", // Empty the cookie's value
		MaxAge:   -1, // Invalidate the cookie immediately
		HttpOnly: true,
	})
	db.UpdateSession(&session{
		IsActive:   false,
		ExpireTime: time.Now(),
		LastAccess: time.Now(),
		ID:         sessionId,
	})
}
