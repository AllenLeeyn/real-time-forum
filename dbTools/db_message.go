package dbTools

import (
	"time"
)

func (db *DBContainer) InsertMessage(m *Message) error {
	qry := `INSERT INTO messages 
			(sender_id, receiver_id, content, created_at) 
			VALUES (?, ?, ?, ?)`
	_, err := db.conn.Exec(qry,
		m.SenderID,
		m.ReceiverID,
		m.Content,
		m.CreatedAt,
	)
	return err
}

func (db *DBContainer) UpdateMessage(m *Message) error {
	qry := `UPDATE messages SET read_at = ? WHERE id = ?`
	_, err := db.conn.Exec(qry,
		m.ReadAt,
		m.ID,
	)
	return err
}

func (db *DBContainer) SelectMessages(id_1, id_2 int, fromTime time.Time) (*[]Message, error) {
	qry := `SELECT * FROM messages
			WHERE (sender_id = ? AND receiver_id = ? OR sender_id = ? AND receiver_id = ?)
			AND created_at < ?
			ORDER BY created_at DESC
			LIMIT 10`

	rows, err := db.conn.Query(qry, id_1, id_2, id_2, id_1, fromTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var m Message
		err := rows.Scan(
			&m.ID,
			&m.SenderID,
			&m.ReceiverID,
			&m.Content,
			&m.CreatedAt,
			&m.ReadAt,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	if err := rows.Err(); err != nil {
		return nil, checkErrNoRows(err)
	}
	return &messages, nil
}

func (db *DBContainer) SelectUnreadMessages(receiverID int) (*[]string, error) {
	qry := `SELECT DISTINCT u.nick_name FROM messages m
			JOIN users u ON m.sender_id = u.id
			WHERE receiver_id = ? AND read_at IS NULL`

	rows, err := db.conn.Query(qry, receiverID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var names []string
	for rows.Next() {
		var n string
		err := rows.Scan(&n)
		if err != nil {
			return nil, err
		}
		names = append(names, n)
	}
	if err := rows.Err(); err != nil {
		return nil, checkErrNoRows(err)
	}
	return &names, nil
}
