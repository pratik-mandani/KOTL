const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// 1. Update imports from child-memory
const oldImport = `const {
  getChildProfile,`;

const newImport = `const {
  getHabits,
  toggleHabit,
  addHabit,
  deleteHabit,
  awardMannerStar,
  getGrowthMetrics,
  getChildProfile,`;

if (content.includes("getHabits,")) {
  console.log("getHabits already imported in server.js");
} else {
  content = content.replace(oldImport, newImport);
}

// 2. Add Habits, Health & Socratic Action Engine Routes
const routesCode = `
// --- Habits, Health & Socratic Action Engine Routes ---
app.get("/api/habits", (_req, res) => {
  try {
    res.json({ success: true, habits: getHabits() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/habits", (req, res) => {
  try {
    const { title, category, icon, directive_text, tip } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: "Habit title is required" });
    }
    const newHabit = addHabit({ title, category, icon, directive_text, tip });
    res.json({ success: true, habit: newHabit, habits: getHabits() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/habits/toggle", (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ success: false, error: "Habit ID is required" });
    }
    const updated = toggleHabit(id);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Habit not found" });
    }
    res.json({ success: true, habit: updated, habits: getHabits() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/habits/:id", (req, res) => {
  try {
    const habits = deleteHabit(req.params.id);
    res.json({ success: true, habits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/habits/award-star", (_req, res) => {
  try {
    const result = awardMannerStar();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/growth/metrics", (_req, res) => {
  try {
    res.json(getGrowthMetrics());
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/voice-directive", async (req, res) => {
  try {
    const { text, directive_text, title } = req.body || {};
    const textToSpeak = directive_text || text;
    if (!textToSpeak || !textToSpeak.trim()) {
      return res.status(400).json({ success: false, error: "directive text required" });
    }
    const ttsResult = await generateSpeech({ text: textToSpeak.trim() });
    if (ttsResult.success && ttsResult.url) {
      latestWebTtsBroadcast = {
        id: "directive-" + Date.now(),
        url: ttsResult.url,
        created_at: Date.now()
      };
      console.log(\`[Broadcast] Queued voice directive audio for ESP32 speaker: \${ttsResult.url}\`);
    }
    res.json({
      success: true,
      title: title || "Voice Directive",
      directive_text: textToSpeak,
      audio_url: ttsResult.url,
      tts: ttsResult
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
`;

if (!content.includes("/api/habits")) {
  const targetInsertion = `app.get("/api/parent/missions",`;
  content = content.replace(targetInsertion, routesCode + "\n" + targetInsertion);
}

// 3. Remove fake battery % and fake charging status in /api/device/state
content = content.replace(
  `battery_pct: typeof config.battery_pct === "number" ? config.battery_pct : 88,`,
  `battery_pct: null, // Removed fake mock battery per architecture audit`
);
content = content.replace(
  `battery_charging: config.battery_charging !== false,`,
  `battery_charging: null, // Removed fake mock charging per architecture audit`
);

fs.writeFileSync(serverPath, content, 'utf8');
console.log('Successfully updated backend/server.js');
