const socket = new WebSocket('ws://localhost:8080'); // Replace with your WebSocket server URL

// Handle incoming messages
socket.onmessage = function(event) {
    console.log('Received message:', event.data);
    // Update your chat interface with the new message
};

// Handle errors
socket.onerror = function(error) {
    console.log('Error occurred:', error);
};

// Handle disconnections
socket.onclose = function() {
    console.log('Disconnected from the WebSocket server.');
};

// Send message when user clicks the send button
document.getElementById('send-button').addEventListener('click', function() {
    const message = document.getElementById('message-input').value;
    socket.send(message);
    document.getElementById('message-input').value = '';
});
