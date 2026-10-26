const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'server.js');
let code = fs.readFileSync(serverPath, 'utf8');

// 1. Update imports
const oldImports = `  updateVaccination,
  addVaccination,
  updateVitals,
} = require("./services/child-memory");`;

const newImports = `  updateVaccination,
  addVaccination,
  updateVitals,
  updateMedicalIdentity,
  getDayWiseHistory,
} = require("./services/child-memory");`;

if (code.includes(oldImports)) {
  code = code.replace(oldImports, newImports);
  console.log("Updated child-memory imports in server.js");
}

// 2. Add /api/history/daywise endpoint after /api/history
const oldHistoryRoute = `app.get("/api/history", (req, res) => {
  const sessionId = typeof req.query?.sessionId === "string" && req.query.sessionId.trim() 
    ? req.query.sessionId.trim() 
    : "default-session";
  const history = getSessionHistory(sessionId);
  res.json({ success: true, sessionId, history });
});`;

const newHistoryRoutes = `app.get("/api/history", (req, res) => {
  const sessionId = typeof req.query?.sessionId === "string" && req.query.sessionId.trim() 
    ? req.query.sessionId.trim() 
    : "default-session";
  const history = getSessionHistory(sessionId);
  res.json({ success: true, sessionId, history });
});

app.get("/api/history/daywise", (req, res) => {
  const sessionId = typeof req.query?.sessionId === "string" && req.query.sessionId.trim() 
    ? req.query.sessionId.trim() 
    : "default-session";
  const days = getDayWiseHistory(sessionId);
  res.json({ success: true, sessionId, days });
});

app.post("/api/test/chat", async (req, res) => {
  try {
    const { message, sessionId = "default-session" } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: "Empty message" });
    }
    const replyResult = await generateAssistantReply({
      transcript: message.trim(),
      sessionId,
      source: "web_dashboard"
    });
    const days = getDayWiseHistory(sessionId);
    res.json({ success: true, reply: replyResult.reply, days });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});`;

if (code.includes(oldHistoryRoute)) {
  code = code.replace(oldHistoryRoute, newHistoryRoutes);
  console.log("Added /api/history/daywise and /api/test/chat routes to server.js");
}

// 3. Add /api/medical/identity endpoint
const oldVitalsRoute = `app.post("/api/medical/vitals", (req, res) => {
  try {
    const { height_cm, weight_kg } = req.body || {};
    const vitals = updateVitals({ height_cm, weight_kg });
    res.json({ success: true, vitals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});`;

const newVitalsAndIdRoutes = `app.post("/api/medical/vitals", (req, res) => {
  try {
    const { height_cm, weight_kg } = req.body || {};
    const vitals = updateVitals({ height_cm, weight_kg });
    res.json({ success: true, vitals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/medical/identity", (req, res) => {
  try {
    const { blood_group, allergies, pediatrician_name, phone, clinic } = req.body || {};
    const medical = updateMedicalIdentity({ blood_group, allergies, pediatrician_name, phone, clinic });
    res.json({ success: true, medical });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});`;

if (code.includes(oldVitalsRoute)) {
  code = code.replace(oldVitalsRoute, newVitalsAndIdRoutes);
  console.log("Added /api/medical/identity route to server.js");
}

fs.writeFileSync(serverPath, code, 'utf8');
console.log("server.js updated successfully.");
