const path = require("path");
const fs = require("fs");

try {
  const backendEnv = path.join(__dirname, "..", ".env");
  const rootEnv = path.join(__dirname, "..", "..", ".env");
  if (fs.existsSync(backendEnv)) {
    require("dotenv").config({ path: backendEnv });
  } else if (fs.existsSync(rootEnv)) {
    require("dotenv").config({ path: rootEnv });
  } else {
    require("dotenv").config();
  }
} catch (_) {
  // Gracefully continue if dotenv fails or environment variables are provided directly by hosting (e.g., Render)
}
