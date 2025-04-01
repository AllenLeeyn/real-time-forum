import { currentState, MESSENGER_DISPLAY, showTab, renderDisplay } from "./main.js";
import { templateUserList, templateChat } from "./template.js";

const USER_LIST = document.getElementById("userList");
let MESSAGE_CONTAINER = document.getElementById("message-container");

let socket;
let currentRecipientUsername = null;

export function openWebSocket() {
    console.log("connecting WebSocket");
    socket = new WebSocket("/ws");
    socket.onopen = function() {
        console.log("WebSocket connection established");
    };
    socket.onmessage = function(event) {
        console.log("Message received:", event.data);
        onMessageHandler(event.data)
    };
    socket.onerror = function(error) {
        console.error("WebSocket error:", error);
    };
    socket.onclose = function() {
        console.log("WebSocket connection closed");
    };
}

function onMessageHandler(dataString) {
    const data = JSON.parse(dataString)
    
    if (data.action === "start") {
        addUserListItems(data)

    } else if (data.action === "online") {
        updateUserListItems(data.userName, "online")

    } else if (data.action === "offline") {
        updateUserListItems(data.userName, "offline")

    } else if (data.action === "message") {
        if (currentRecipientUsername === data.sender) {
            appendMessage(data.content, data.sender, "left");
        } else {
            // Update user list to indicate unread message
            const clientElement = document.getElementById(`user-${data.sender}`);
            if (clientElement) {
                clientElement.classList.add("unread");
            }
        }
    } else if (data.action === "messages") {
        MESSAGE_CONTAINER.innerHTML = '';
        // data.messages.forEach(message => {
        //     appendMessage(message.content, message.ReceiverName, message.ReceiverName === localStorage.getItem('username') ? "right" : "left");
        // });
        if (Array.isArray(data.messages)) {
            data.messages.forEach(message => {
                appendMessage(message.content, message.ReceiverName, message.ReceiverName === localStorage.getItem('username') ? "right" : "left");
            });
        } else {
            console.error("Expected an array of messages but got:", data.messages);
        }
    };
}



// function addUserListItems(data) {
//     // this is the block where we can filter.
//     // const currentUser = localStorage.getItem('username');
//     // const allUsers = [...new Set([...data.allClients, ...data.onlineClients])].filter(user => user !== currentUser);

//     const allUsers = [...new Set([...data.allClients, ...data.onlineClients])];
//     allUsers.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
//     USER_LIST.innerHTML = templateUserList(allUsers)

//     data.onlineClients.forEach(client=>{
//         const clientElement = document.getElementById(`user-${client}`);
//         clientElement.classList.add("online");
//     })
//     addUserListItemListeners();
// }

function addUserListItems(data) {
    const allUsers = [...new Set([...data.allClients, ...data.onlineClients])];
    
    const onlineUsers = data.onlineClients.filter(user => allUsers.includes(user));
    const offlineUsers = allUsers.filter(user => !onlineUsers.includes(user));
    
    onlineUsers.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    offlineUsers.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    
    const sortedUsers = [...onlineUsers, ...offlineUsers];
    
    USER_LIST.innerHTML = templateUserList(sortedUsers)

    sortedUsers.forEach(client=>{
        const clientElement = document.getElementById(`user-${client}`);
        if (onlineUsers.includes(client)) {
            clientElement.classList.add("online");
        }
    })
    addUserListItemListeners();
}


function addUserListItemListeners() {
    const listItems = document.querySelectorAll(".user-item");
    listItems.forEach(item => addUserListItemListener(item));
}

function addUserListItemListener(item) {
    const userName = item.textContent;
    item.onclick = (event) => {
        event.preventDefault();

        MESSENGER_DISPLAY.innerHTML = templateChat();
        currentState.display =  MESSENGER_DISPLAY;
        showTab("chat", userName);
        renderDisplay();

        currentRecipientUsername = userName; 

        MESSAGE_CONTAINER = document.getElementById("message-container");

        document.getElementById("submit-message").addEventListener('click', sendMessage);

        document.getElementById("message-input").addEventListener('keydown', event => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });

        const clientElement = document.getElementById(`user-${userName}`);
        if (clientElement) {
            clientElement.classList.remove("unread");
            markAsRead();
        }
        
        MESSAGE_CONTAINER.innerHTML = '';

        const messageData = {
            action: 'fetch-messages',
            recipient: userName
        };
        socket.send(JSON.stringify(messageData));
    }
}

function updateUserListItems(client, action) {
    const clientElement = document.getElementById(`user-${client}`);
    if (action === "online") {
        clientElement.classList.add(action);
    }  else if (action === "offline") {
        clientElement.classList.remove("online");
    }
}

// Added
function appendMessage(messageText, sender, status = 'sent') {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    if (sender === 'You') {
        messageDiv.classList.add('sent');
    } else {
        messageDiv.classList.add('received');
    }
    messageDiv.innerHTML = `<p>${messageText}</p>`;

    if (MESSAGE_CONTAINER) {
        MESSAGE_CONTAINER.appendChild(messageDiv);
        MESSAGE_CONTAINER.scrollTop = MESSAGE_CONTAINER.scrollHeight; 
    } else {
        console.error("MESSAGE_CONTAINER not found.");
    }
}

// using localStorage in the main.js after profileID to get the username to get the sender name
// so we can connect the WS and for future DB use
function sendMessage() {
    const messageInputField = document.getElementById("message-input");
    const messageText = messageInputField.value.trim();

    if (messageText) {
        const senderUsername = localStorage.getItem('username');
        const messageData = {
            action: 'message',
            content: messageText,
            sender: senderUsername, 
            recipient: currentRecipientUsername
        };
        socket.send(JSON.stringify(messageData));
        appendMessage(messageText, "You", "right");
        messageInputField.value = ""
    }
}

// When marking messages as read
function markAsRead() {
    const messageData = {
        action: 'mark-as-read',
        recipient: currentRecipientUsername
    };
    socket.send(JSON.stringify(messageData));
}