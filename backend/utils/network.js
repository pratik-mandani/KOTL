const os = require("os");

function getLocalIPv4Address() {
  const interfaces = os.networkInterfaces();
  
  // First pass: try to find a physical adapter by ignoring virtual/loopback interfaces
  for (const interfaceName in interfaces) {
    const lowerName = interfaceName.toLowerCase();
    if (
      lowerName.includes("virtual") ||
      lowerName.includes("docker") ||
      lowerName.includes("vethernet") ||
      lowerName.includes("vmware") ||
      lowerName.includes("vbox") ||
      lowerName.includes("wsl") ||
      lowerName.includes("loopback")
    ) {
      continue;
    }

    const iface = interfaces[interfaceName];
    if (!iface) continue;
    
    for (const alias of iface) {
      if (alias.family === "IPv4" && !alias.internal) {
        return alias.address;
      }
    }
  }

  // Fallback: return any external IPv4 if the strict check above yielded nothing
  for (const interfaceName in interfaces) {
    const iface = interfaces[interfaceName];
    if (!iface) continue;

    for (const alias of iface) {
      if (alias.family === "IPv4" && !alias.internal) {
        return alias.address;
      }
    }
  }

  return "127.0.0.1";
}

module.exports = {
  getLocalIPv4Address,
};
