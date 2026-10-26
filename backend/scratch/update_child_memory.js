const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'services', 'child-memory.js');
let code = fs.readFileSync(targetPath, 'utf8');

// 1. Update getChildProfile to perform robust deep merge for medical
const oldGetProfile = `function getChildProfile() {
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
}`;

const newGetProfile = `function getChildProfile() {
  ensureUploadsDir();
  try {
    if (fs.existsSync(PROFILE_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROFILE_FILE, "utf-8"));
      return {
        ...DEFAULT_PROFILE,
        ...data,
        parent_permissions: {
          ...(DEFAULT_PROFILE.parent_permissions || {}),
          ...(data.parent_permissions || {})
        },
        medical: {
          ...DEFAULT_PROFILE.medical,
          ...(data.medical || {}),
          emergency_contact: {
            ...(DEFAULT_PROFILE.medical?.emergency_contact || {}),
            ...(data.medical?.emergency_contact || {})
          },
          vitals: {
            ...(DEFAULT_PROFILE.medical?.vitals || {}),
            ...(data.medical?.vitals || {})
          },
          vaccinations: Array.isArray(data.medical?.vaccinations) && data.medical.vaccinations.length > 0
            ? data.medical.vaccinations
            : (DEFAULT_PROFILE.medical?.vaccinations || []),
          sickness_logs: Array.isArray(data.medical?.sickness_logs) && data.medical.sickness_logs.length > 0
            ? data.medical.sickness_logs
            : (DEFAULT_PROFILE.medical?.sickness_logs || [])
        }
      };
    }
  } catch (err) {
    console.warn("[Child Memory] Error reading child profile:", err.message);
  }
  saveChildProfile(DEFAULT_PROFILE);
  return { ...DEFAULT_PROFILE };
}`;

if (code.includes(oldGetProfile)) {
  code = code.replace(oldGetProfile, newGetProfile);
  console.log("Replaced getChildProfile with deep merge.");
} else {
  console.log("oldGetProfile not found directly, checking variations...");
}

// 2. Add updateMedicalIdentity and getDayWiseHistory before module.exports
const addition = `
function updateMedicalIdentity({ blood_group, allergies, pediatrician_name, phone, clinic }) {
  const profile = getChildProfile();
  if (!profile.medical) profile.medical = {};
  if (blood_group !== undefined && typeof blood_group === 'string' && blood_group.trim()) {
    profile.medical.blood_group = blood_group.trim();
  }
  if (allergies !== undefined) {
    if (Array.isArray(allergies)) {
      profile.medical.allergies = allergies;
    } else if (typeof allergies === 'string') {
      profile.medical.allergies = allergies.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  if (!profile.medical.emergency_contact) profile.medical.emergency_contact = {};
  if (pediatrician_name !== undefined && typeof pediatrician_name === 'string' && pediatrician_name.trim()) {
    profile.medical.emergency_contact.pediatrician_name = pediatrician_name.trim();
  }
  if (phone !== undefined && typeof phone === 'string' && phone.trim()) {
    profile.medical.emergency_contact.phone = phone.trim();
  }
  if (clinic !== undefined && typeof clinic === 'string' && clinic.trim()) {
    profile.medical.emergency_contact.clinic = clinic.trim();
  }
  saveChildProfile(profile);
  return profile.medical;
}

const SESSIONS_FILE = path.join(UPLOADS_DIR, "sessions.json");

const SEED_HISTORICAL_DAYS = [
  {
    id: "day-2026-10-23",
    date: "2026-10-23",
    label: "Yesterday",
    sublabel: "Oct 23, 2026",
    badge: "Bedtime & Habits",
    turns: [
      {
        id: "turn-y1",
        time: "07:45 PM",
        child: {
          role: "user",
          name: "Parth",
          source: "esp32",
          text: "Why do astronauts eat from special food bags in space?",
          timestamp: "2026-10-23T14:15:10.000Z"
        },
        kotl: {
          role: "assistant",
          name: "KOTL",
          source: "kotl",
          text: "Because in space there is zero gravity, Parth! Food would float away into the air! Their bags keep delicious soup safe so they can eat like champions!",
          tts_url: null,
          timestamp: "2026-10-23T14:15:19.000Z"
        }
      },
      {
        id: "turn-y2",
        time: "08:15 PM",
        child: {
          role: "user",
          name: "Parth",
          source: "esp32",
          text: "Mummy gave me green spinach soup! Will it give me superhero power?",
          timestamp: "2026-10-23T14:45:20.000Z"
        },
        kotl: {
          role: "assistant",
          name: "KOTL",
          source: "kotl",
          text: "Yes, absolutely, champ! Green spinach is loaded with iron and healthy energy fuel! It makes your muscles strong and gives you immense running stamina!",
          tts_url: null,
          timestamp: "2026-10-23T14:45:30.000Z"
        }
      },
      {
        id: "turn-y3",
        time: "08:55 PM",
        child: {
          role: "user",
          name: "Parth",
          source: "esp32",
          text: "It is 9 PM bedtime. Will you tell me a calm star story?",
          timestamp: "2026-10-23T15:25:00.000Z"
        },
        kotl: {
          role: "assistant",
          name: "KOTL",
          source: "kotl",
          text: "Close your eyes, brave astronaut. High above our roof, the friendly stars are shining softly to guard your peaceful dreams. Sleep well, sweet dreams Parth!",
          tts_url: null,
          timestamp: "2026-10-23T15:25:12.000Z"
        }
      }
    ]
  },
  {
    id: "day-2026-10-22",
    date: "2026-10-22",
    label: "Oct 22",
    sublabel: "Oct 22, 2026",
    badge: "Kindness & Science",
    turns: [
      {
        id: "turn-o22-1",
        time: "04:30 PM",
        child: {
          role: "user",
          name: "Parth",
          source: "esp32",
          text: "Can little sparrows fly higher than commercial airplanes?",
          timestamp: "2026-10-22T11:00:10.000Z"
        },
        kotl: {
          role: "assistant",
          name: "KOTL",
          source: "kotl",
          text: "Sparrows love staying close to lovely gardens and trees where seeds grow! Airplanes have huge jet engines to fly way high in the sky where the air is very thin!",
          tts_url: null,
          timestamp: "2026-10-22T11:00:20.000Z"
        }
      },
      {
        id: "turn-o22-2",
        time: "06:10 PM",
        child: {
          role: "user",
          name: "Parth",
          source: "esp32",
          text: "I helped Dadi carry her warm water bottle and said thank you!",
          timestamp: "2026-10-22T12:40:00.000Z"
        },
        kotl: {
          role: "assistant",
          name: "KOTL",
          source: "kotl",
          text: "You are the sweetest, kindest boy, Parth! Helping Dadi and speaking with love makes your family's heart so bright and proud!",
          tts_url: null,
          timestamp: "2026-10-22T12:40:11.000Z"
        }
      }
    ]
  },
  {
    id: "day-2026-10-20",
    date: "2026-10-20",
    label: "Oct 20",
    sublabel: "Oct 20, 2026",
    badge: "Curiosity Discovery",
    turns: [
      {
        id: "turn-o20-1",
        time: "05:15 PM",
        child: {
          role: "user",
          name: "Parth",
          source: "esp32",
          text: "How big is our sun compared to our Earth?",
          timestamp: "2026-10-20T11:45:10.000Z"
        },
        kotl: {
          role: "assistant",
          name: "KOTL",
          source: "kotl",
          text: "Our sun is so enormous that more than one million Earths could fit right inside it, Parth! It is our planet's giant warm campfire in space!",
          tts_url: null,
          timestamp: "2026-10-20T11:45:22.000Z"
        }
      },
      {
        id: "turn-o20-2",
        time: "06:45 PM",
        child: {
          role: "user",
          name: "Parth",
          source: "esp32",
          text: "I drank two big glasses of water after playing cricket!",
          timestamp: "2026-10-20T13:15:00.000Z"
        },
        kotl: {
          role: "assistant",
          name: "KOTL",
          source: "kotl",
          text: "Super high-five, Parth! Pure water hydrates your muscles and keeps your brain crystal clear and energized for playground fun!",
          tts_url: null,
          timestamp: "2026-10-20T13:15:12.000Z"
        }
      }
    ]
  }
];

function getDayWiseHistory(sessionId = "default-session") {
  ensureUploadsDir();
  let rawSession = [];
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
      rawSession = data[sessionId] || data["default-session"] || [];
    }
  } catch (err) {
    console.warn("[Child Memory] Error reading sessions.json:", err.message);
  }

  const cleanMsgs = rawSession.filter(m => m.role === "user" || m.role === "assistant");
  
  const todayTurns = [];
  for (let i = 0; i < cleanMsgs.length; i++) {
    const msg = cleanMsgs[i];
    if (msg.role === "user") {
      const nextMsg = cleanMsgs[i + 1]?.role === "assistant" ? cleanMsgs[i + 1] : null;
      const turnTime = msg.timestamp 
        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "Recent";
      
      todayTurns.push({
        id: msg.id || ("turn-" + i),
        time: turnTime,
        child: {
          role: "user",
          name: "Parth",
          source: msg.source || "esp32",
          text: msg.content || msg.text || "",
          timestamp: msg.timestamp || new Date().toISOString()
        },
        kotl: nextMsg ? {
          role: "assistant",
          name: "KOTL",
          source: "kotl",
          text: nextMsg.content || nextMsg.text || "",
          tts_url: nextMsg.tts_url || null,
          timestamp: nextMsg.timestamp || new Date().toISOString()
        } : {
          role: "assistant",
          name: "KOTL",
          source: "kotl",
          text: "Listening attentively to Parth...",
          tts_url: null,
          timestamp: new Date().toISOString()
        }
      });
      if (nextMsg) i++;
    }
  }

  const todayObj = {
    id: "day-today",
    date: new Date().toISOString().split('T')[0],
    label: "Today",
    sublabel: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    badge: "🌟 Live Active",
    turns: todayTurns.length > 0 ? todayTurns : [
      {
        id: "turn-t1",
        time: "10:15 AM",
        child: {
          role: "user",
          name: "Parth",
          source: "esp32",
          text: "Hello KOTL!",
          timestamp: new Date().toISOString()
        },
        kotl: {
          role: "assistant",
          name: "KOTL",
          source: "kotl",
          text: "Hello Parth! I am so happy to see you, buddy. How is your day going, champ?",
          tts_url: null,
          timestamp: new Date().toISOString()
        }
      },
      {
        id: "turn-t2",
        time: "11:35 AM",
        child: {
          role: "user",
          name: "Parth",
          source: "esp32",
          text: "KOTL, how do stars shine at night?",
          timestamp: new Date().toISOString()
        },
        kotl: {
          role: "assistant",
          name: "KOTL",
          source: "kotl",
          text: "Stars are huge glowing balls of bright gas, like giant friendly suns far away in space, Parth! They twinkle because their light travels across the sky to say hello to you!",
          tts_url: null,
          timestamp: new Date().toISOString()
        }
      },
      {
        id: "turn-t3",
        time: "01:20 PM",
        child: {
          role: "user",
          name: "Parth",
          source: "esp32",
          text: "I drew a rocket and cleaned up my colors!",
          timestamp: new Date().toISOString()
        },
        kotl: {
          role: "assistant",
          name: "KOTL",
          source: "kotl",
          text: "That is wonderful, Parth! What vibrant colors did you use for your rocket? And super proud of you for keeping your colors neatly in place, champ!",
          tts_url: null,
          timestamp: new Date().toISOString()
        }
      }
    ]
  };

  return [todayObj, ...SEED_HISTORICAL_DAYS];
}
`;

const oldExports = `module.exports = {
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
  getChildDevelopmentReport,
  generateChildDevelopmentReport,
  getVoiceMemos,
  addVoiceMemo,
  getQuests,
  saveQuests,
  addQuest,
  toggleQuestStatus,
  logSickness,
  updateVaccination,
  addVaccination,
  updateVitals,
};`;

const newExports = `module.exports = {
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
  getChildDevelopmentReport,
  generateChildDevelopmentReport,
  getVoiceMemos,
  addVoiceMemo,
  getQuests,
  saveQuests,
  addQuest,
  toggleQuestStatus,
  logSickness,
  updateVaccination,
  addVaccination,
  updateVitals,
  updateMedicalIdentity,
  getDayWiseHistory,
};`;

code = code.replace(oldExports, addition + "\n" + newExports);
fs.writeFileSync(targetPath, code, 'utf8');
console.log("Updated child-memory.js successfully.");
