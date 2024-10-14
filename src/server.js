const WebSocket = require("ws");
const {
  explaineCode,
  pushLogs,
  serializeMsg,
} = require("./utils/commonUtils.js");
const { startAppServer, verifyKey } = require("./utils/app_server_utils.js");
// const { GlobalStore } = require("./utils/store/globalstore.js");

// const { serialize } = require("v8");

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 8030 });

// Event listener for new connections
wss.on("connection", async function connection(ws, req) {
  const auth = req.headers["sec-websocket-protocol"];
  const verifyKeyRes = await verifyKey(auth)
  const companyName = verifyKeyRes.companyName
  if (!(verifyKeyRes?.result)) {
    ws.close(4001, "Unauthorized access");
    ws.terminate();
  }
  // ws.close(4001, "Unauthorized access"); // Send a status code and reason
  // ws.terminate();

  // Event listener for messages from clients
  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
    let msg = JSON.parse(message);
    if (msg?.code) {
      console.log("Code________");
      msg = {
        ...msg,
        description: explaineCode(msg.code),
      };
      pushLogs(serializeMsg(msg), msg?.time, companyName);
      return;
    }
    pushLogs(serializeMsg(msg), msg.time, companyName);
    // Broadcast the received message to all connected clients
    // wss.clients.forEach(function each(client) {
    //   if (client.readyState === WebSocket.OPEN) {
    //     client.send(`Server received: ${message}`);
    //   }
    // });
  });

  // Event listener for client disconnections
  ws.on("close", function () {
    console.log("Client disconnected");
  });

  // Send a message to the connected client
  ws.send("Welcome to the WebSocket server!");
});

startAppServer();
console.log("WebSocket server is running on ws://localhost:8030");
