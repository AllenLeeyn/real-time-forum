# real-time-forum
This forum has the functionality of registration/ login, posts/ commenting and private messages. It should make proper use of JS for frontend and Golang for backend.

Note: we are building a single page application (SPA). We have only one HTML and all changes of the page is done by JS.

### Single Page Application (SPA)
---
- A single page load. No refresh.
- The appropriate resources are dynamically loaded and added to the page as necessary. (JS fetch)
- Smaller load, faster transition.

### Objectives
---
- For registration, users must provide:
  - Nickname
  - Age
  - Gender
  - First Name
  - Last Name
  - E-mail
  - Password

- user can log in with nickname or e-mail combined with password.

- user can log out from any page? (we only have one page...)

- create post with categories
- create comments on posts
- see posts in a feed display (show comments only when user click on a post)

- users can send private messages to each other
  - show a section who is online/offline and able to talk:
    - must be visible at all times.
    - arrange by last message sent first, user name second.
    - must be able to send PMs to online users
  - show a messenger section:
   - reloads past messages by chunks of 10.
   - show current chat too.
  - message format:
    - [date | username] message
  - work in real time
  - receive notification when message receive without refreshing page
    - WebSockets in frontend and backend

### Areas of concern
---
- Database with SQLite3
- Backend with Golang
- Frontend with JS, HTML and CSS
- password encryption with bcrypt
- session id with UUID

### Tasks
---
Design SPA layout
- width design: 1024 (max), 768 (mid), 320 (min)
- top nav bar
- categories on the left
- posts section in the middle
- feed display/ create post as a tab in post section
- register/login/logout/users section on the right?
- messenger as a pop up in bottom right (closer previous when a new on is requested?)

Focus on making base forum into SPA first.
- update SQLite3 database
- update DBTools
- Golang request handlers
  - update login to accept email and nickname and create cookie for sessionID
  - update endpoints to send JSON instead of rendering pages
- one page HTML/ CSS/ JS
  - Add JS functions to send request to different endpoints and render accordingly

Private messenger
- Add chat table in SQLite3 database
- Add DBTools for chat functionality
- Add endpoint handler for chat functionality
- Add JS functions for chat functionality

