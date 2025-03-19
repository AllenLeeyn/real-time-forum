package handlers

import (
	"fmt"
	"html"
	"net/http"
	"real-time-forum/dbTools"
	"strconv"
)

// Page for viewing individual post
func ViewPost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		executeJSON(w, ErrorData{"Method not allowed"}, http.StatusMethodNotAllowed)
		return
	}

	// check session from cookie to get feedback data
	sessionCookie, userID := checkSessionValidity(w, r)

	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		executeJSON(w, ErrorData{"Invalid post ID"}, http.StatusBadRequest)
		return
	}
	
	post, err := db.SelectPost(id, userID)
	if err != nil {
		executeJSON(w, ErrorData{"Error getting post"}, http.StatusBadRequest)
		return
	}
	if post == nil {
		executeJSON(w, ErrorData{"Post not found"}, http.StatusNotFound)
		return
	}
	comments, err := db.SelectComments(id, userID, "oldest")
	if err != nil {
		executeJSON(w, ErrorData{"Error getting comments"}, http.StatusInternalServerError)
		return
	}
	extendSession(w, sessionCookie)
	executeJSON(w, postpageData{
		sessionCookie,
		*post,
		comments,
		db.Categories,
	}, http.StatusOK)
}

// Page for user to draft their post (if method == get), otherwise post it (if method == post)
func NewPost(w http.ResponseWriter, r *http.Request) {
	// check if user is logged in using session id
	sessionCookie, userID := checkSessionValidity(w, r)
	if userID == -1 {
		executeJSON(w, ErrorData{"Please login and try again"}, http.StatusUnauthorized)
		return
	}

	if r.Method != http.MethodPost {
		executeJSON(w, ErrorData{"Method not allowed"}, http.StatusMethodNotAllowed)
		return
	}

	title, content, categoriesInt, err := GetData(w, r)
	if err != nil {
		executeJSON(w, ErrorData{"Error getting form data"}, http.StatusBadRequest)
		return
	}
	titleIsValid, titleError := CheckPostValidity(title, "postTitle")
	contentIsValid, contentError := CheckPostValidity(content, "postContent")
	if !(titleIsValid && contentIsValid) {
		executeJSON(w, ErrorData{"Error: " + titleError + contentError}, http.StatusBadRequest)
		return
	}
	post := dbTools.Post{
		UserID:     userID,
		Title:      title,
		Content:    content,
		Categories: categoriesInt,
	}
	postNum, err := db.InsertPost(post)
	if err != nil {
		executeJSON(w,
			ErrorData{"Error creating post. Must select at least one category."},
			http.StatusInternalServerError)
		return
	}
	extendSession(w, sessionCookie)
	postID := "/post?id=" + strconv.Itoa(postNum)
	http.Redirect(w, r, postID, http.StatusSeeOther)

}

/*----------- helper functions for posts -----------*/

// Checks the validity of posts (like length requirements)
func CheckPostValidity(input string, dataType string) (bool, string) {
	//	Add to these conditions later, including special character check
	if dataType == "postTitle" {
		if len(input) < 10 {
			return false, "*Title too short"
		} else if len(input) > 200 {
			return false, "*Title too long"
		}
	} else if dataType == "postContent" {
		if len(input) < 10 {
			return false, "*Content too short"
		} else if len(input) > 2000 {
			return false, "*Content too long"
		}
	}
	return true, ""
}

// Gets and parses data from front end post
func GetData(w http.ResponseWriter, r *http.Request) (string, string, []int, error) {
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		return "", "", nil, fmt.Errorf("error parsing form data")
	}
	title := html.EscapeString(r.FormValue("threadTitle"))
	content := html.EscapeString(r.FormValue("threadContent"))
	categoriesStr := r.Form["category"]
	categoriesInt := []int{}
	for _, value := range categoriesStr {
		intVal, err := strconv.Atoi(value)
		if err != nil {
			return "", "", nil, fmt.Errorf("error parsing categories")
		}
		categoriesInt = append(categoriesInt, intVal)
	}
	return title, content, categoriesInt, nil
}
