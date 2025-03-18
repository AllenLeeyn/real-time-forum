package dbTools

import (
	"database/sql"
	"time"
)

type User struct {
	ID        int
	TypeID    int
	FirstName string
	LastName  string
	NickName  string
	Gender    string
	Age       int
	Email     string
	PwHash    []byte
	RegDate   time.Time
	LastLogin time.Time
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
	Title        string
	Content      string
	CreatedAt    time.Time
	TimeAgo      string
	Categories   []int
	CatNames     string
	Rating       int
}

type Comment struct {
	ID           int
	UserID       int
	UserName     string
	ParentID     sql.NullInt64
	PostID       int
	Content      string
	LikeCount    int
	DislikeCount int
	CreatedAt    time.Time
	TimeAgo      string
	Rating       int
}

type Feedback struct {
	UserID    int
	ParentID  int
	Rating    int
	CreatedAt time.Time
}
