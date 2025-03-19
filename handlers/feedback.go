package handlers

import (
	"encoding/json"
	"io"
	"net/http"
)

func Feedback(w http.ResponseWriter, r *http.Request) {
	sessionCookie, userID := checkSessionValidity(w, r)
	if userID == -1 {
		executeJSON(w, ErrorData{"Please login and try again"}, http.StatusUnauthorized)
		return
	}
	if r.Method != http.MethodPost {
		executeJSON(w, ErrorData{"Method not allowed"}, http.StatusMethodNotAllowed)
		return
	}

	userFeedback := struct {
		Tgt      string `json:"tgt"`
		ParentID int    `json:"parentID"`
		Rating   int    `json:"rating"`
	}{}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		executeJSON(w, ErrorData{"Error reading body"}, http.StatusInternalServerError)
		return
	}
	if err = json.Unmarshal(body, &userFeedback); err != nil {
		executeJSON(w, ErrorData{"Error reading json"}, http.StatusInternalServerError)
		return
	}

	fb, err := db.SelectFeedback(userFeedback.Tgt, userID, userFeedback.ParentID)
	if err != nil {
		executeJSON(w, ErrorData{"Error reading feedback"}, http.StatusInternalServerError)
		return
	} else if fb == nil {
		fb = &feedback{
			UserID:   userID,
			ParentID: userFeedback.ParentID,
			Rating:   userFeedback.Rating}
		if err = db.InsertFeedback(userFeedback.Tgt, *fb); err != nil {
			executeJSON(w, ErrorData{"Error reading feedback"}, http.StatusInternalServerError)
			return
		}
	} else {
		fb.Rating = userFeedback.Rating
		if err = db.UpdateFeedback(userFeedback.Tgt, *fb); err != nil {
			executeJSON(w, ErrorData{"Error reading feedback"}, http.StatusInternalServerError)
			return
		}
	}
	w.WriteHeader(http.StatusOK)
	extendSession(w, sessionCookie)
}
