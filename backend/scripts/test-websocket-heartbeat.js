/**
 * Automated Verification: WebSocket Heartbeat & Connection Tracking
 *
 * Tests:
 * 1. Protocol compatibility (hello handshake, ping/pong, register)
 * 2. Truthful identity: Generic clients do not trigger physical robot status
 * 3. ESP32 registration: Sets device online and updates last_seen
 * 4. Rate-limiting: Activity events do not cause excessive heartbeat writes
 * 5. Connection tracking: Multi-connection resilience and proper offline marking on final disconnect
 */

const http = require("http");
const WebSocket = require("ws");
const { initWebSocketServer } = require("../services/websocket");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("====================================================");
  console.log("   KOTL WEBSOCKET HEARTBEAT & IDENTITY TEST SUITE    ");
  console.log("====================================================\n");

  // Mock device state store
  let deviceStatus = {
    ip: null,
    rssi: null,
    online: false,
    last_seen: null,
    last_seen_seconds_ago: null,
  };

  let touchCallCount = 0;
  let offlineCallCount = 0;

  function mockTouchHeartbeat(ip = null, rssi = null) {
    touchCallCount++;
    deviceStatus = {
      ip: ip || deviceStatus.ip,
      rssi: rssi !== null ? rssi : deviceStatus.rssi,
      online: true,
      last_seen: new Date().toISOString(),
      last_seen_seconds_ago: 0,
    };
  }

  function mockMarkOffline() {
    offlineCallCount++;
    deviceStatus.online = false;
  }

  function mockGetDeviceConfig() {
    return { device_status: { ...deviceStatus } };
  }

  // Spin up test HTTP server on random available port
  const server = http.createServer((_req, res) => {
    res.writeHead(200);
    res.end("OK");
  });

  const wss = initWebSocketServer(server, {
    touchDeviceHeartbeat: mockTouchHeartbeat,
    markDeviceOffline: mockMarkOffline,
    getDeviceConfig: mockGetDeviceConfig,
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const wsUrl = `ws://127.0.0.1:${port}/ws`;
  console.log(`Test server running at ${wsUrl}\n`);

  try {
    // --- TEST 1: Generic Client Identity Protection ---
    console.log(">>> Test 1: Generic WebSocket Client (Truthful Identity)");
    {
      const client = new WebSocket(wsUrl);
      const messages = [];

      client.on("message", (raw) => {
        try {
          messages.push(JSON.parse(raw.toString()));
        } catch (_) {}
      });

      await new Promise((resolve, reject) => {
        client.on("open", resolve);
        client.on("error", reject);
      });

      // Wait for server hello handshake
      await new Promise((r) => setTimeout(r, 100));
      assert(messages.length >= 1 && messages[0].type === "hello", "Server sends 'hello' handshake on connection");

      // Register as generic dashboard client
      client.send(JSON.stringify({ type: "register", device_id: "browser-dashboard-123" }));
      await new Promise((r) => setTimeout(r, 100));

      const regAck = messages.find((m) => m.type === "registered");
      assert(regAck && regAck.device_id === "browser-dashboard-123", "Server acknowledges generic client registration");
      assert(deviceStatus.online === false, "Generic client registration does NOT mark physical robot online");
      assert(touchCallCount === 0, "touchDeviceHeartbeat was NOT called for generic client");

      // Disconnect generic client
      client.close();
      await new Promise((r) => setTimeout(r, 100));
      assert(offlineCallCount === 0, "Generic client disconnect does NOT trigger markDeviceOffline");
    }

    // --- TEST 2: Physical Robot Registration ---
    console.log("\n>>> Test 2: Physical ESP32 Robot Registration ('KOTL-ESP32')");
    let esp32Client1;
    {
      esp32Client1 = new WebSocket(wsUrl);
      const messages = [];

      await new Promise((resolve, reject) => {
        esp32Client1.on("open", resolve);
        esp32Client1.on("error", reject);
      });

      esp32Client1.on("message", (raw) => {
        try {
          messages.push(JSON.parse(raw.toString()));
        } catch (_) {}
      });

      // Register with official hardware device_id and RSSI
      esp32Client1.send(JSON.stringify({ type: "register", device_id: "KOTL-ESP32", rssi: -58 }));
      await new Promise((r) => setTimeout(r, 100));

      const regAck = messages.find((m) => m.type === "registered");
      assert(regAck && regAck.device_id === "KOTL-ESP32" && regAck.status === "ok", "Server registers physical robot");
      assert(deviceStatus.online === true, "Physical robot registration marks device_status.online = true");
      assert(deviceStatus.rssi === -58, "Physical robot RSSI is stored correctly (-58 dBm)");
      assert(touchCallCount === 1, "touchDeviceHeartbeat called exactly once on registration");
    }

    // --- TEST 3: Activity Rate Limiting ---
    console.log("\n>>> Test 3: Activity Refresh Rate Limiting (Prevent Disk Thrashing)");
    {
      // Send 10 rapid binary audio frames (simulating microphone stream)
      const fakePcmChunk = Buffer.alloc(1024, 0);
      for (let i = 0; i < 10; i++) {
        esp32Client1.send(fakePcmChunk);
      }
      // Send rapid pings
      esp32Client1.send(JSON.stringify({ type: "ping" }));
      esp32Client1.send(JSON.stringify({ type: "ping" }));

      await new Promise((r) => setTimeout(r, 200));

      assert(
        touchCallCount === 1,
        `Rapid activity within 10s did not thrash disk (touch count remained 1, got ${touchCallCount})`
      );
    }

    // --- TEST 4: Multi-Connection Resilience & Disconnect Handling ---
    console.log("\n>>> Test 4: Multi-Connection Resilience & Clean Disconnect");
    {
      // Connect a second ESP32 client (e.g. quick reconnect before old socket terminates)
      const esp32Client2 = new WebSocket(wsUrl);
      await new Promise((resolve, reject) => {
        esp32Client2.on("open", resolve);
        esp32Client2.on("error", reject);
      });

      esp32Client2.send(JSON.stringify({ type: "register", device_id: "KOTL-ESP32" }));
      await new Promise((r) => setTimeout(r, 100));

      // Disconnect first ESP32 client
      esp32Client1.close();
      await new Promise((r) => setTimeout(r, 150));

      assert(
        deviceStatus.online === true,
        "Device remains online when 1 of 2 physical robot connections disconnects"
      );
      assert(offlineCallCount === 0, "markDeviceOffline was not called prematurely");

      // Disconnect the final ESP32 client
      esp32Client2.close();
      await new Promise((r) => setTimeout(r, 150));

      assert(offlineCallCount === 1, "markDeviceOffline called when last physical robot disconnects");
      assert(deviceStatus.online === false, "device_status.online transitioned to false");
    }

    // --- TEST 5: Protocol Compliance (Ping / Pong) ---
    console.log("\n>>> Test 5: Protocol Compliance");
    {
      const client = new WebSocket(wsUrl);
      const messages = [];
      await new Promise((resolve) => client.on("open", resolve));
      client.on("message", (raw) => {
        try {
          messages.push(JSON.parse(raw.toString()));
        } catch (_) {}
      });

      client.send(JSON.stringify({ type: "ping" }));
      await new Promise((r) => setTimeout(r, 100));

      const pong = messages.find((m) => m.type === "pong");
      assert(pong && typeof pong.timestamp === "number", "Server responds to ping with valid pong timestamp");
      client.close();
    }
  } finally {
    wss.close();
    await new Promise((resolve) => server.close(resolve));
  }

  console.log("\n====================================================");
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed === 0) {
    console.log("STATUS: [GREEN / PASSED] - All WebSocket heartbeat tests passed!");
    console.log("====================================================");
    process.exit(0);
  } else {
    console.log("STATUS: [RED / FAILED] - Some tests failed.");
    console.log("====================================================");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered error:", err);
  process.exit(1);
});
