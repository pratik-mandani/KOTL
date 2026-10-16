/**
 * KOTL Child Memory, Intelligence Profile & Parent Mission Service
 * Manages persistent child profiles, parent missions/directives,
 * skill development analytics, and dynamic conversation memory extraction.
 */

const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const PROFILE_FILE = path.join(UPLOADS_DIR, "child_profile.json");
const MISSIONS_FILE = path.join(UPLOADS_DIR, "parent_missions.json");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

const DEFAULT_PROFILE = {
  name: "આરવ (Aarav)",
  age: "6 વર્ષ",
  avatar: "🧒",
  gender: "Boy",
  likes: [
    "વાર્તાઓ સાંભળવી (Stories)",
    "ડાયનાસોર (Dinosaurs)",
    "ડ્રોઇંગ અને રંગ પૂરવા (Drawing)",
    "અવકાશ અને તારા (Space & Stars)"
  ],
  dislikes: [
    "લીલા શાકભાજી ખાવા (Bitter veggies)",
    "અંધારામાં એકલા રહેવું (Darkness)",
    "મોટો અવાજ કે ઘોંઘાટ (Loud noise)"
  ],
  skills: {
    vocabulary: 84,
    curiosity: 92,
    emotional_tone: "ઉત્સાહી, પ્રેમાળ અને આનંદી (Cheerful & Caring)",
    languages: ["ગુજરાતી (મુખ્ય)", "Hindi", "English"]
  },
  improvement_areas: [
    {
      id: "imp-1",
      title: "લીલા શાકભાજી ખાવાની ટેવ (Healthy Food)",
      status: "in_progress",
      action_plan: "KOTL વાતચીતમાં શાકભાજીથી સુપરહીરો જેવી શક્તિ મળે છે તેવી રસપ્રદ વાર્તાઓ કહી પ્રોત્સાહિત કરે છે."
    },
    {
      id: "imp-2",
      title: "નવા અંગ્રેજી શબ્દો શીખવા (English Words)",
      status: "in_progress",
      action_plan: "દરરોજ વાર્તામાં 2 નવા અંગ્રેજી શબ્દો રમત-રમતમાં પૂછીને યાદ કરાવે છે."
    },
    {
      id: "imp-3",
      title: "રાત્રે 9 વાગ્યે સમયસર સૂઈ જવું (Bedtime)",
      status: "planning",
      action_plan: "રાત્રે મીઠી લોરી અને સૂવાની શાંત વાર્તા સંભળાવીને નિયમિત સૂવાની ટેવ પાડશે."
    }
  ],
  conversation_count: 14,
  last_interaction: new Date().toISOString(),
  last_updated: new Date().toISOString()
};

const DEFAULT_MISSIONS = [
  {
    id: "mission-1",
    title: "શાકભાજી ખાવા માટે બાળકને પ્રોત્સાહન આપો",
    directive: "જ્યારે બાળક સાથે વાત કરો ત્યારે પાલક અને ગાજર ખાવાથી કેવી સુપર પાવર મળે છે તે વિશે પ્રેમથી કહો.",
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "mission-2",
    title: "રમ્યા પછી રમકડાં વ્યવસ્થિત ગોઠવવાની ટેવ",
    directive: "વાતચીતમાં બાળકને પોતાના રમકડાં અને પુસ્તકો જગ્યા પર મૂકવા માટે શાબાશી અને પ્રોત્સાહન આપો.",
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "mission-3",
    title: "દરરોજ એક નવું કુતૂહલપ્રેરક જ્ઞાન આપો",
    directive: "પક્ષીઓ કેમ ઉડે છે, આકાશ કેમ વાદળી છે જેવા મજેદાર વિજ્ઞાનના તથ્યો સરળ ભાષામાં સમજાવો.",
    active: true,
    created_at: new Date().toISOString()
  }
];

function getChildProfile() {
  ensureUploadsDir();
  try {
    if (fs.existsSync(PROFILE_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROFILE_FILE, "utf-8"));
      return { ...DEFAULT_PROFILE, ...data };
    }
  } catch (err) {
    console.warn("[Child Memory] Error reading child profile:", err.message);
  }
  saveChildProfile(DEFAULT_PROFILE);
  return { ...DEFAULT_PROFILE };
}

function saveChildProfile(profile) {
  ensureUploadsDir();
  try {
    profile.last_updated = new Date().toISOString();
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[Child Memory] Error saving child profile:", err.message);
    return false;
  }
}

function updateChildProfile(updates) {
  const current = getChildProfile();
  const merged = {
    ...current,
    ...updates,
    skills: {
      ...current.skills,
      ...(updates.skills || {})
    },
    last_updated: new Date().toISOString()
  };
  saveChildProfile(merged);
  return merged;
}

function getParentMissions() {
  ensureUploadsDir();
  try {
    if (fs.existsSync(MISSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(MISSIONS_FILE, "utf-8"));
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn("[Child Memory] Error reading parent missions:", err.message);
  }
  saveParentMissions(DEFAULT_MISSIONS);
  return [...DEFAULT_MISSIONS];
}

function saveParentMissions(missions) {
  ensureUploadsDir();
  try {
    fs.writeFileSync(MISSIONS_FILE, JSON.stringify(missions, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[Child Memory] Error saving parent missions:", err.message);
    return false;
  }
}

function toggleParentMission(id, activeState) {
  const missions = getParentMissions();
  const target = missions.find(m => m.id === id);
  if (target) {
    target.active = typeof activeState === "boolean" ? activeState : !target.active;
    saveParentMissions(missions);
    return target;
  }
  return null;
}

function addParentMission({ title, directive }) {
  if (!title) return null;
  const missions = getParentMissions();
  const newMission = {
    id: "mission-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
    title: title.trim(),
    directive: (directive || "").trim(),
    active: true,
    created_at: new Date().toISOString()
  };
  missions.unshift(newMission);
  saveParentMissions(missions);
  return newMission;
}

function deleteParentMission(id) {
  const missions = getParentMissions();
  const filtered = missions.filter(m => m.id !== id);
  saveParentMissions(filtered);
  return filtered;
}

/**
 * Lightweight heuristic memory extractor:
 * Parses the child's spoken transcript to detect and update
 * personal preferences, feelings, or details.
 */
function extractMemoryFromDialogue(userText, assistantText) {
  if (!userText || typeof userText !== "string") return;
  const text = userText.trim();
  const profile = getChildProfile();
  let modified = false;

  // Increment conversation count
  profile.conversation_count = (profile.conversation_count || 0) + 1;
  profile.last_interaction = new Date().toISOString();
  modified = true;

  // 1. Name detection
  const nameMatchGuj = text.match(/મારું\s*નામ\s*([A-Za-z\u0A80-\u0AFF\u0900-\u097F]+)\s*છે/i);
  const nameMatchHi = text.match(/मेरा\s*नाम\s*([A-Za-z\u0A80-\u0AFF\u0900-\u097F]+)\s*है/i);
  const nameMatchEn = text.match(/my\s*name\s*is\s*([A-Za-z]+)/i);
  const detectedName = nameMatchGuj?.[1] || nameMatchHi?.[1] || nameMatchEn?.[1];
  if (detectedName && detectedName.length > 2 && !detectedName.toLowerCase().includes("kotl")) {
    profile.name = detectedName;
    modified = true;
  }

  // 2. Age detection
  const ageMatch = text.match(/(\d+)\s*(વર્ષ|साल|years?)/i);
  if (ageMatch && ageMatch[1]) {
    profile.age = `${ageMatch[1]} વર્ષ`;
    modified = true;
  }

  // 3. Likes detection
  const likeMatchGuj = text.match(/મને\s*([A-Za-z\u0A80-\u0AFF\u0900-\u097F\s]{2,20})\s*(બહુ\s*ગમે|ગમે)\s*છે/i);
  const likeMatchHi = text.match(/मुझे\s*([A-Za-z\u0A80-\u0AFF\u0900-\u097F\s]{2,20})\s*(बहुत\s*पसंद|पसंद)\s*है/i);
  const likedItem = (likeMatchGuj?.[1] || likeMatchHi?.[1])?.trim();
  if (likedItem && likedItem.length > 2 && !profile.likes.some(l => l.includes(likedItem))) {
    profile.likes.push(likedItem);
    if (profile.likes.length > 8) profile.likes.shift();
    modified = true;
  }

  // 4. Dislikes detection
  const dislikeMatchGuj = text.match(/મને\s*([A-Za-z\u0A80-\u0AFF\u0900-\u097F\s]{2,20})\s*(નથી\s*ગમતું|નથી\s*ભાવતું)/i);
  const dislikeMatchHi = text.match(/मुझे\s*([A-Za-z\u0A80-\u0AFF\u0900-\u097F\s]{2,20})\s*(पसंद\s*नहीं|अच्छा\s*नहीं)/i);
  const dislikedItem = (dislikeMatchGuj?.[1] || dislikeMatchHi?.[1])?.trim();
  if (dislikedItem && dislikedItem.length > 2 && !profile.dislikes.some(d => d.includes(dislikedItem))) {
    profile.dislikes.push(dislikedItem);
    if (profile.dislikes.length > 8) profile.dislikes.shift();
    modified = true;
  }

  // Curiosity progress
  if (text.includes("કેમ") || text.includes("શું") || text.includes("ક્યારે") || text.includes("क्यों") || text.includes("why") || text.includes("how")) {
    profile.skills.curiosity = Math.min(99, (profile.skills.curiosity || 85) + 1);
    modified = true;
  }

  if (modified) {
    saveChildProfile(profile);
  }
}

/**
 * Builds the dynamic child profile & parent directive context to inject
 * into KOTL's LLM system prompt.
 */
function buildChildContextPrompt() {
  const profile = getChildProfile();
  const missions = getParentMissions().filter(m => m.active);

  let prompt = `\n\nChild's Profile & Memory:
- Child's Name: ${profile.name || "Aarav"}
- Age: ${profile.age || "6 years"}
- Things the child loves/likes: ${(profile.likes || []).join(", ") || "Stories, Drawing, Stars"}
- Things the child dislikes/fears: ${(profile.dislikes || []).join(", ") || "Loud noise, Darkness"}
- Personality: ${profile.skills?.emotional_tone || "Cheerful & loving"}`;

  if (missions.length > 0) {
    prompt += `\n\nParent's Active Missions & Guidance for You:`;
    missions.forEach((m, idx) => {
      prompt += `\n${idx + 1}. [Mission: ${m.title}]: ${m.directive}`;
    });
    prompt += `\n(Guideline: Warmly and gently incorporate encouragement for these parent missions into your conversation when appropriate, without sounding pushy or lecturing).`;
  }

  return prompt;
}

module.exports = {
  getChildProfile,
  updateChildProfile,
  saveChildProfile,
  getParentMissions,
  saveParentMissions,
  toggleParentMission,
  addParentMission,
  deleteParentMission,
  extractMemoryFromDialogue,
  buildChildContextPrompt,
};
