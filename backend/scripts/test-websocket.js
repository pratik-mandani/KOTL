/**
 * Local WebSocket Test Script
 * Verifies that the KOTL WebSocket server starts, accepts connections,
 * handles registration, responds to ping/pong, and handles state changes.
 */

const { spawn } = require("child_process");
const WebSocket = require("ws");
const path = require("path");

const SERVER_PATH = path.join(__dirname, "..", "server.js");
const TEST_PORT = 3123;

console.log("[Test] Launching local backend on test port " + TEST_PORT + "...");

const serverProcess = spawn("node", [SERVER_PATH], {
  cwd: path.join(__dirname, ".."),
  env: { ...process.env, PORT: String(TEST_PORT) },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverReady = false;

serverProcess.stdout.on("data", (data) => {
  const line = data.toString();
  if (line.includes("WebSocket live")) {
    serverReady = true;
    runClientTest();
  }
});

serverProcess.stderr.on("data", (data) => {
  console.error("[Server STDERR]", data.toString());
});

serverProcess.on("exit", (code) => {
  console.log(`[Test] Server process exited with code ${code}`);
});

function runClientTest() {
  console.log("[Test] Server is live! Connecting WebSocket client...");

  const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws`);

  let helloReceived = false;
  let pongReceived = false;
  let registeredReceived = false;

  ws.on("open", () => {
    console.log("[Client] Connected to ws://localhost:" + TEST_PORT + "/ws");
  });

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log("[Client Received]:", JSON.stringify(msg));

      if (msg.type === "hello") {
        helloReceived = true;
        // Step 1: Register device
        ws.send(JSON.stringify({ type: "register", device_id: "KOTL-TEST-UNIT" }));
      } else if (msg.type === "registered") {
        registeredReceived = true;
        // Step 2: Send ping
        ws.send(JSON.stringify({ type: "ping" }));
      } else if (msg.type === "pong") {
        pongReceived = true;
        console.log("[Client] Ping/Pong test passed!");

        // Step 3: Test Start and Stop listen signals
        ws.send(JSON.stringify({ type: "start_listen" }));
      } else if (msg.type === "state" && msg.value === "LISTENING") {
        console.log("[Client] State transition to LISTENING verified!");
        ws.send(JSON.stringify({ type: "cancel" }));
      } else if (msg.type === "state" && msg.value === "IDLE") {
        console.log("[Client] State transition to IDLE verified!");
        finishTest(true);
      }
    } catch (e) {
      console.error("[Client Error]", e);
    }
  });

  ws.on("error", (err) => {
    console.error("[Client Connection Error]:", err.message);
    finishTest(false);
  });

  // Timeout safety
  setTimeout(() => {
    if (!pongReceived) {
      console.error("[Test] Timed out waiting for test completion!");
      finishTest(false);
    }
  }, 8000);

  function finishTest(success) {
    ws.close();
    serverProcess.kill();
    if (success && helloReceived && registeredReceived && pongReceived) {
      console.log("\n======================================");
      console.log(" SUCCESS: All WebSocket tests passed! ");
      console.log("======================================\n");
      process.exit(0);
    } else {
      console.error("\n FAILED: Some tests did not complete as expected.\n");
      process.exit(1);
    }
  }
}
