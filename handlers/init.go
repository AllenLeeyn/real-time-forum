package handlers

import (
	"encoding/json"
	"errors"
	"html"
	"io"
	"net/http"
	"real-time-forum/dbTools"
	"regexp"
	"strings"
)

var db *dbTools.DBContainer

type user = dbTools.User
type session = dbTools.Session
type post = dbTools.Post
type feedback = dbTools.Feedback
type comment = dbTools.Comment

type postsData struct {
	IsValidSession bool     `json:"isValidSession"`
	Categories     []string `json:"categories"`
	Posts          []post   `json:"posts"`
	UserName       string   `json:"userName"`
}

type postData struct {
	Post     post      `json:"post"`
	Comments []comment `json:"comments"`
}

type profileData struct {
	Name  string `json:"name"`
	Posts []post `json:"posts"`
}

type MsgData struct {
	Message string `json:"message"`
}

// Initializes all html files in templates folder
func Init(dbMain *dbTools.DBContainer) {
	db = dbMain
}

func checkContent(input string, min, max int) (bool, string) {
	input = strings.TrimSpace(input)
	if len(input) < min {
		return false, "*Title too short"
	} else if len(input) > max {
		return false, "*Title too long"
	}
	return true, html.EscapeString(input)
}

func checkPostRequest(w http.ResponseWriter, r *http.Request, checkFor string) (*http.Cookie, int, bool) {
	sessionCookie, userID := checkSessionValidity(w, r)
	isValid := true
	if checkFor == "guest" && sessionCookie != nil {
		executeJSON(w, MsgData{"You are logged in"}, http.StatusBadRequest)
		isValid = false
	}
	if checkFor == "user" && userID == -1 {
		executeJSON(w, MsgData{"Please login and try again"}, http.StatusUnauthorized)
		isValid = false
	}
	if r.Method != http.MethodPost {
		executeJSON(w, MsgData{"Method not allowed"}, http.StatusMethodNotAllowed)
		isValid = false
	}
	return sessionCookie, userID, isValid
}

/*----------- JSON func -----------*/
func getJSON(w http.ResponseWriter, r *http.Request, data interface{}) bool {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		executeJSON(w, MsgData{"Error reading body"}, http.StatusInternalServerError)
		return false
	}
	if err = json.Unmarshal(body, &data); err != nil {
		executeJSON(w, MsgData{"Error reading json"}, http.StatusInternalServerError)
		return false
	}
	return true
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
