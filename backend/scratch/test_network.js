const { getLocalIPv4Address } = require("../utils/network");

console.log("===== TESTING LOCAL NETWORK IP DETECTION =====");
try {
  const localIP = getLocalIPv4Address();
  console.log(`Detected Active IPv4 Address: ${localIP}`);
  
  if (localIP === "127.0.0.1") {
    console.log("Result: WARNING (Loopback address returned, check if physical network adapter is connected and active)");
  } else {
    console.log("Result: SUCCESS (Active network IP detected)");
  }
} catch (error) {
  console.error("Test failed with error:", error);
}
