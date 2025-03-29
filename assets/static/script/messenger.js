import { currentState, MESSENGER_DISPLAY, showTab, renderDisplay } from "./main.js";
import { templateUserList, templateChat } from "./template.js";

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
        updateUserListItems(data.userName, "online")

    } else if (data.action === "offline") {
        updateUserListItems(data.userName, "offline")
    };
}

function addUserListItems(data) {
    USER_LIST.innerHTML = templateUserList(data.allClients)
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

