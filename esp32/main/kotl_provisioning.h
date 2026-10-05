#pragma once

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <HTTPClient.h>

static const byte DNS_PORT = 53;
static DNSServer dnsServer;
static WebServer server(80);
static Preferences prefs;

// Runtime dynamic configurations
static String g_wifi_ssid = "";
static String g_wifi_pass = "";
static String g_backend_url = "";
static int g_config_version = 1;
static bool g_in_ap_mode = false;
static uint32_t g_last_heartbeat_ms = 0;
static const uint32_t kHeartbeatIntervalMs = 30000; // Check for Admin updates every 30s

// HTML Template for Captive Portal (Monochrome Minimalist)
static const char CAPTIVE_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KOTL AI - Setup</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #000; color: #fff; padding: 24px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: #111; border: 1px solid #27272a; border-radius: 16px; padding: 24px; max-width: 380px; width: 100%; }
    .logo { width: 36px; height: 36px; background: #fff; color: #000; font-weight: bold; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-family: monospace; font-size: 18px; }
    h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    p { font-size: 12px; color: #71717a; margin-bottom: 20px; }
    label { font-size: 11px; text-transform: uppercase; color: #a1a1aa; font-family: monospace; display: block; margin-bottom: 6px; }
    input { width: 100%; background: #000; border: 1px solid #27272a; border-radius: 10px; padding: 12px; color: #fff; font-size: 13px; margin-bottom: 16px; outline: none; }
    input:focus { border-color: #fff; }
    button { width: 100%; background: #fff; color: #000; font-weight: 600; padding: 12px; border: none; border-radius: 10px; font-size: 14px; cursor: pointer; }
    button:active { background: #d4d4d8; }
    .footer { text-align: center; font-size: 11px; color: #52525b; margin-top: 16px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">K</div>
    <h1>KOTL AI Setup</h1>
    <p>Configure Wi-Fi and Cloud Backend Server connection.</p>
    <form action="/save" method="POST">
      <label>Wi-Fi Name (SSID)</label>
      <input type="text" name="ssid" placeholder="e.g. Altius" required>
      
      <label>Wi-Fi Password</label>
      <input type="password" name="pass" placeholder="••••••••">
      
      <label>Hostinger / Render / Cloud Backend URL</label>
      <input type="text" name="backend" placeholder="https://kotl.onrender.com or http://192.168.1.13:3000" value="https://kotl.onrender.com" required>
      
      <button type="submit">Save & Connect</button>
    </form>
    <div class="footer">KOTL 2.0 • Embedded AI Companion</div>
  </div>
</body>
</html>
)rawliteral";

// Success Page Template
static const char SUCCESS_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KOTL AI - Saved</title>
  <style>
    body { background: #000; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .card { background: #111; border: 1px solid #27272a; border-radius: 16px; padding: 32px; max-width: 360px; }
    h2 { margin-bottom: 10px; font-size: 18px; }
    p { color: #a1a1aa; font-size: 13px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Credentials Saved!</h2>
    <p>ESP32 is rebooting and connecting to your Wi-Fi.<br><br>You can now close this window and talk to KOTL.</p>
  </div>
</body>
</html>
)rawliteral";

inline void initPersistentConfig() {
  prefs.begin("kotl_cfg", false);
  g_wifi_ssid = prefs.getString("ssid", "");
  g_wifi_pass = prefs.getString("pass", "");
  g_backend_url = prefs.getString("backend", "");
  g_config_version = prefs.getInt("version", 1);

  // Fallback to kotl_config.h defaults if NVS is empty
#if defined(KOTL_WIFI_SSID)
  if (g_wifi_ssid.length() == 0 && strlen(KOTL_WIFI_SSID) > 0) {
    g_wifi_ssid = String(KOTL_WIFI_SSID);
    g_wifi_pass = String(KOTL_WIFI_PASSWORD);
  }
#endif
#if defined(KOTL_BACKEND_BASE_URL)
  if (g_backend_url.length() == 0 && strlen(KOTL_BACKEND_BASE_URL) > 0) {
    g_backend_url = String(KOTL_BACKEND_BASE_URL);
  }
#endif

  if (g_backend_url.length() == 0) {
    g_backend_url = "https://kotl.onrender.com";
  }
}

inline void savePersistentConfig(const String &ssid, const String &pass, const String &backend, int version = 1) {
  prefs.putString("ssid", ssid);
  prefs.putString("pass", pass);
  prefs.putString("backend", backend);
  prefs.putInt("version", version);
  g_wifi_ssid = ssid;
  g_wifi_pass = pass;
  g_backend_url = backend;
  g_config_version = version;
  Serial.printf("[Config] Saved to NVS (v%d): SSID='%s', Backend='%s'\n", version, ssid.c_str(), backend.c_str());
}

inline void handleCaptiveRoot() {
  server.send(200, "text/html", CAPTIVE_HTML);
}

inline void handleCaptiveSave() {
  String ssid = server.hasArg("ssid") ? server.arg("ssid") : "";
  String pass = server.hasArg("pass") ? server.arg("pass") : "";
  String backend = server.hasArg("backend") ? server.arg("backend") : "";

  if (ssid.length() > 0) {
    savePersistentConfig(ssid, pass, backend, 1);
    server.send(200, "text/html", SUCCESS_HTML);
    delay(2000);
    ESP.restart();
  } else {
    server.send(400, "text/plain", "SSID cannot be empty.");
  }
}

inline void startCaptivePortal() {
  g_in_ap_mode = true;
  WiFi.mode(WIFI_AP);
  WiFi.softAP("KOTL-SETUP");
  delay(100);

  IPAddress apIP(192, 168, 4, 1);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));

  dnsServer.start(DNS_PORT, "*", apIP);

  server.on("/", handleCaptiveRoot);
  server.on("/save", HTTP_POST, handleCaptiveSave);
  server.onNotFound(handleCaptiveRoot); // Redirect all captive requests
  server.begin();

  Serial.println("[Setup Mode] AP started: 'KOTL-SETUP' (IP: 192.168.4.1)");
}

inline void serviceCaptivePortal() {
  if (g_in_ap_mode) {
    dnsServer.processNextRequest();
    server.handleClient();
  }
}

// Helper to begin HTTPClient with automatic SSL/HTTPS support
inline bool beginHttpWithOptionalSsl(HTTPClient &http, WiFiClientSecure &sslClient, const String &url) {
  if (url.startsWith("https://")) {
    sslClient.setInsecure();
    return http.begin(sslClient, url);
  }
  return http.begin(url);
}

// Background Remote Sync with Admin Dashboard
inline void checkRemoteAdminUpdates() {
  if (WiFi.status() != WL_CONNECTED || g_in_ap_mode || g_backend_url.length() == 0) {
    return;
  }

  uint32_t now = millis();
  if (now - g_last_heartbeat_ms < kHeartbeatIntervalMs) {
    return;
  }
  g_last_heartbeat_ms = now;

  HTTPClient http;
  WiFiClientSecure sslClient;
  String heartbeatUrl = g_backend_url + "/api/device/heartbeat";
  
  if (!beginHttpWithOptionalSsl(http, sslClient, heartbeatUrl)) {
    return;
  }
  
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"version\":" + String(g_config_version) + 
                   ",\"ip\":\"" + WiFi.localIP().toString() + 
                   "\",\"rssi\":" + String(WiFi.RSSI()) + "}";

  int httpCode = http.POST(payload);
  if (httpCode == 200) {
    String response = http.getString();
    // Simple JSON check for update
    if (response.indexOf("\"has_update\":true") != -1) {
      Serial.println("[Admin Sync] Received new configuration from Web Admin Panel! Applying...");
      
      // Fetch full config
      HTTPClient httpCfg;
      WiFiClientSecure sslCfgClient;
      String cfgUrl = g_backend_url + "/api/device/config";
      
      if (beginHttpWithOptionalSsl(httpCfg, sslCfgClient, cfgUrl)) {
        int cfgCode = httpCfg.GET();
        if (cfgCode == 200) {
          String cfgJson = httpCfg.getString();
          
          int ssidIdx = cfgJson.indexOf("\"wifi_ssid\":\"");
          int passIdx = cfgJson.indexOf("\"wifi_pass\":\"");
          int backIdx = cfgJson.indexOf("\"backend_url\":\"");
          int verIdx = cfgJson.indexOf("\"version\":");

          if (ssidIdx != -1 && backIdx != -1) {
            String newSsid = cfgJson.substring(ssidIdx + 13, cfgJson.indexOf("\"", ssidIdx + 13));
            String newPass = (passIdx != -1) ? cfgJson.substring(passIdx + 13, cfgJson.indexOf("\"", passIdx + 13)) : "";
            String newBack = cfgJson.substring(backIdx + 15, cfgJson.indexOf("\"", backIdx + 15));
            int newVer = (verIdx != -1) ? cfgJson.substring(verIdx + 10, cfgJson.indexOf(",", verIdx + 10)).toInt() : g_config_version + 1;

            if (newSsid.length() > 0) {
              savePersistentConfig(newSsid, newPass, newBack, newVer);
              Serial.println("[Admin Sync] Applied! Restarting with new Wi-Fi credentials...");
              delay(1000);
              ESP.restart();
            }
          }
        }
        httpCfg.end();
      }
    }
  }
  http.end();
}
