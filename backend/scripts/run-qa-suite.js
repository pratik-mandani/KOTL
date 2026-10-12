const { spawn } = require("child_process");
const path = require("path");

const TEST_PORT = 3189;
const SERVER_PATH = path.join(__dirname, "..", "server.js");
const QA_SCRIPT = path.join(__dirname, "qa-audio-tests.js");

console.log("[QA Harness] Starting test backend on port " + TEST_PORT + "...");
const serverProcess = spawn("node", [SERVER_PATH], {
  cwd: path.join(__dirname, ".."),
  env: { ...process.env, PORT: String(TEST_PORT) },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverReady = false;

serverProcess.stdout.on("data", (data) => {
  const str = data.toString();
  if (str.includes("listening on http") && !serverReady) {
    serverReady = true;
    console.log("[QA Harness] Backend ready! Launching acoustic QA test suite...\n");
    runTests();
  }
});

serverProcess.stderr.on("data", (data) => {
  console.error("[Backend Error]", data.toString());
});

function runTests() {
  const testProcess = spawn("node", [QA_SCRIPT], {
    cwd: path.join(__dirname, ".."),
    env: { ...process.env, TEST_PORT: String(TEST_PORT) },
    stdio: "inherit",
  });

  testProcess.on("exit", (code) => {
    console.log(`\n[QA Harness] Tests finished with exit code ${code}. Stopping backend server...`);
    serverProcess.kill();
    process.exit(code);
  });
}

setTimeout(() => {
  if (!serverReady) {
    console.error("[QA Harness] Server startup timeout!");
    serverProcess.kill();
    process.exit(1);
  }
}, 15000);
