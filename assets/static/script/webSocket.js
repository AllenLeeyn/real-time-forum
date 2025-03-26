const socket = new WebSocket('ws://localhost:8080/ws');

// Handle connection establishment
socket.onopen = function() {
    console.log("WebSocket connection opened");
    appendMessage("Connected to WebSocket server", "system", "left");
};

// Handle incoming messages
socket.onmessage = function(event) {
    console.log('Message from server: ', event.data);
    appendMessage(event.data, "Server", "left");
};

// Handle errors
socket.onerror = function(error) {
    console.log('Error occurred:', error);
};

// Handle disconnections
socket.onclose = function() {
    console.log('Disconnected from the WebSocket server.');
};

// Send message when user clicks the send button or presses Enter
document.getElementById("messageInput").addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

document.getElementById('send-button').addEventListener('click', sendMessage);

function sendMessage() {
    let message = document.getElementById("messageInput").value;
    socket.send(message);
    document.getElementById("messageInput").value = "";
    appendMessage(message, "You", "right");
}

function appendMessage(message, sender, alignment) {
    let messageList = document.getElementById("messages");
    let messageHTML = `
        <div class="message ${alignment}">
            <span class="sender">${sender}</span>
            <span class="timestamp">Now</span>
            <div class="message-content">${message}</div>
        </div>
    `;
    messageList.innerHTML += messageHTML;
}
