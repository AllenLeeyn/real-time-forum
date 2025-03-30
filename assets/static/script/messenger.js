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
    appendMessage(data.content, data.sender, "left");
    };
}

function addUserListItems(data) {
    const allUsers = [...new Set([...data.allClients, ...data.onlineClients])];
    USER_LIST.innerHTML = templateUserList(allUsers)

    data.onlineClients.forEach(client=>{
        const clientElement = document.getElementById(`user-${client}`);
        clientElement.classList.add("online");
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
        MESSAGE_CONTAINER.innerHTML = '';
    }
}

function updateUserListItems(client, action) {
    const clientElement = document.getElementById(`user-${client}`);
    if (action === "online") {
        clientElement.classList.add(action);
    } else {
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