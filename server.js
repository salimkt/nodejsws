const WebSocket = require("ws");

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

// Event listener for new connections
wss.on("connection", function connection(ws) {
  console.log("New client connected");

  // Event listener for messages from clients
  ws.on("message", function incoming(message) {
    console.log("received: %s", message);

    // Broadcast the received message to all connected clients
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`Server received: ${message}`);
      }
    });
  });

  // Event listener for client disconnections
  ws.on("close", function () {
    console.log("Client disconnected");
  });

  // Send a message to the connected client
  ws.send("Welcome to the WebSocket server!");
});

console.log("WebSocket server is running on ws://localhost:8080");
