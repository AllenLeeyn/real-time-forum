package dbTools

import (
	"database/sql"
	"time"
)

type User struct {
	ID            int
	TypeID        int
	FirstName     string `json:"firstName"`
	LastName      string `json:"lastName"`
	NickName      string `json:"nickName"`
	Gender        string `json:"gender"`
	Age           int    `json:"age"`
	Email         string `json:"email"`
	Passwd        string `json:"password"`
	ConfirmPasswd string `json:"confirmPassword"`
	PwHash        []byte
	RegDate       time.Time
	LastLogin     time.Time
}

type Session struct {
	ID         string
	UserID     int
	IsActive   bool
	StartTime  time.Time
	ExpireTime time.Time
	LastAccess time.Time
}

type Post struct {
	ID           int
	UserID       int
	UserName     string
	CommentCount int
	LikeCount    int
	DislikeCount int
	Title        string `json:"title"`
	Content      string `json:"content"`
	CreatedAt    time.Time
	Categories   []int `json:"categories"`
	CatNames     string
	Rating       int
}

type Comment struct {
	ID           int
	UserID       int
	UserName     string
	ParentID     sql.NullInt64
	PostID       int    `json:"postID"`
	Content      string `json:"content"`
	LikeCount    int
	DislikeCount int
	CreatedAt    time.Time
	Rating       int
}

type Feedback struct {
	Tgt       string `json:"tgt"`
	UserID    int
	ParentID  int `json:"parentID"`
	Rating    int `json:"rating"`
	CreatedAt time.Time
}
