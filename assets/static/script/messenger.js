import { currentState, MESSENGER_DISPLAY, showMessage, showTab, renderDisplay } from "./main.js";
import { templateUserList, templateChat, templateChatHistory, templateChatMessage } from "./template.js";

const USER_LIST = document.getElementById("userList");

let socket;

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
        updateUserListItems(data.id, "online")

    } else if (data.action === "offline") {
        updateUserListItems(data.id, "offline")

    } else if (data.action === "messageSendOK") {
        const messageInput = document.getElementById('message-input');
        messageInput.value = "";

    } else if (data.action === "messageHistory") {
        const MESSAGE_CONTAINER = document.getElementById("message-container");
        const receiverID = parseInt(document.getElementById('submit-message').getAttribute('data-id'));

        const currentScrollPosition = MESSAGE_CONTAINER.scrollTop;
        const currentScrollHeight = MESSAGE_CONTAINER.scrollHeight;

        MESSAGE_CONTAINER.innerHTML = templateChatHistory(data.content, receiverID) + MESSAGE_CONTAINER.innerHTML;
        sendMessageAcknowledgement(receiverID);
        
        if (MESSAGE_CONTAINER.children.length <= 10) {
            MESSAGE_CONTAINER.scrollTop = MESSAGE_CONTAINER.scrollHeight;
        } else {
            const newScrollHeight = MESSAGE_CONTAINER.scrollHeight;
            const scrollDifference = newScrollHeight - currentScrollHeight;

            MESSAGE_CONTAINER.scrollTop = currentScrollPosition + scrollDifference;
        }
        const clientElement = document.getElementById(`user-${receiverID}`);
        clientElement.classList.remove("unread");

    } else if (data.action === "message") {
        const MESSAGE_CONTAINER = document.getElementById("message-container");
        const submit_message = document.getElementById('submit-message');
        let receiverID = -1
        if (submit_message !== null)
        receiverID = parseInt(submit_message.getAttribute('data-id'));

        if (data.receiverID === currentState.id && data.senderID === currentState.chatID) {
            MESSAGE_CONTAINER.innerHTML += templateChatMessage(data, receiverID);
            MESSAGE_CONTAINER.scrollTop = MESSAGE_CONTAINER.scrollHeight;
            sendMessageAcknowledgement(receiverID);

        } else if (data.senderID === currentState.id) {
            MESSAGE_CONTAINER.innerHTML += templateChatMessage(data, receiverID);
            MESSAGE_CONTAINER.scrollTop = MESSAGE_CONTAINER.scrollHeight;

        } else if (data.receiverID === currentState.id && data.senderID !== currentState.chatID) {
            const clientElement = document.getElementById(`user-${data.senderID}`);
            clientElement.classList.add("unread");
        }

        let clientElement = document.getElementById(`user-${data.receiverID}`).parentElement;
        if (data.receiverID === currentState.id) {
            clientElement = document.getElementById(`user-${data.senderID}`).parentElement;
        }
        USER_LIST.prepend(clientElement);

        const typingIndicator = document.getElementById('typing-indicator');
        typingIndicator.style.display = "none";

    } else if (data.action === "typing") {
        const typingIndicator = document.getElementById('typing-indicator');
        typingIndicator.textContent = `${data.senderName} is typing...`;
        typingIndicator.style.display = "block"
        setTimeout(() => {
            typingIndicator.style.display = "none"; // Hide after 5 seconds
        }, 3000);
    };
}

function addUserListItems(data) {
    const clientList = data.allClients.map((name, index) => ({
        name: name, id: data.clientIDs[index]
    }));
    console.log(clientList);

    USER_LIST.innerHTML = templateUserList(clientList);
    data.onlineClients.forEach(client=>{
        const clientElement = document.getElementById(`user-${client}`);
        clientElement.classList.add("online");
    });

    if (Array.isArray(data.unreadMsgClients))
    data.unreadMsgClients.forEach(client=>{
        const clientElement = document.getElementById(`user-${client}`);
        clientElement.classList.add("unread");
    });
    addUserListItemListeners();
}

function addUserListItemListeners() {
    const listItems = document.querySelectorAll(".user-item");
    listItems.forEach(item => addUserListItemListener(item));
}

function addUserListItemListener(item) {
    const userName = item.textContent;
    const userId = item.getAttribute("data-id");
    item.onclick = (event) => {
        event.preventDefault();

        MESSENGER_DISPLAY.innerHTML = templateChat(userId);
        currentState.display =  MESSENGER_DISPLAY;
        currentState.chat = userName;
        currentState.chatID = parseInt(userId);
        showTab("chat", userName);
        renderDisplay();
        requestMessages(userId, -1)

        const messageInput = document.getElementById('message-input');
        let typingTimeout;
        
        messageInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                submitMessage({ target: document.getElementById('submit-message') });
            } else {
                clearTimeout(typingTimeout); 
                typingTimeout = setTimeout(() => {
                    sendTypingEvent();
                }, 500); 
            }
        });

        document.getElementById('submit-message').onclick = submitMessage;
        isThrottled = false;
        document.getElementById("message-container").onscroll = (event) => {messageScollHandler(event, userId)};
    }
}

let isThrottled = false;
function messageScollHandler(event, userID){
    if (event.target.scrollTop > 20 || isThrottled) return;
    isThrottled = true;
    
    console.log("here")
    const firstChild = event.target.children[0];

    if (firstChild.textContent != " End of history ")
        setTimeout(() => {
            isThrottled = false;
        }, 300);

    if (firstChild && firstChild.dataset.id) {
        const msgId = firstChild.dataset.id;
        requestMessages(userID, msgId);
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

function submitMessage(event) {
    const receiverID = parseInt(event.target.getAttribute('data-id'));
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();

    if (messageText === "") {
            showMessage('Message cannot be empty!');
            return;
    }
    const messageData = {
        action: "message",
        receiverID: receiverID,
        content: messageText,
    }
    socket.send(JSON.stringify(messageData));
}

function requestMessages(receiverID, msgId) {
    const messageReq = {
        action: "messageReq",
        receiverID: parseInt(receiverID),
        content: String(msgId)
    }
    socket.send(JSON.stringify(messageReq))
}

function sendMessageAcknowledgement(receiverID){
    const messageAcknowledged = {
        action: "messageAck",
        receiverID: receiverID,
    }
    socket.send(JSON.stringify(messageAcknowledged))
}

// Sending Typing Event
function sendTypingEvent() {
    const receiverID = parseInt(document.getElementById('submit-message').getAttribute('data-id'));
    const typingData = {
        action: "typing",
        receiverID: receiverID,
        senderID: currentState.id,
        senderName: currentState.user, 
    }
    socket.send(JSON.stringify(typingData));
}