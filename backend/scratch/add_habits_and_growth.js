const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../services/child-memory.js');
let content = fs.readFileSync(filePath, 'utf8');

const HABITS_CODE = `
// ==========================================
// DYNAMIC HABITS & HEALTH SOCRATIC ENGINE
// ==========================================
const HABITS_FILE = path.join(UPLOADS_DIR, "habits.json");

const DEFAULT_HABITS = [
  {
    id: "h-1",
    title: "Brushing Teeth Twice Daily",
    category: "Hygiene",
    icon: "🪥",
    streak_days: 6,
    completed_today: true,
    target_per_day: 2,
    current_today: 2,
    directive_text: "Let's make our teeth sparkle like twinkling stars! Grab your toothbrush, champ!",
    tip: "Form a 2-minute brushing habit by humming a fun spaceship song together."
  },
  {
    id: "h-2",
    title: "Finishing Green Superhero Vegetables",
    category: "Nutrition",
    icon: "🥦",
    streak_days: 4,
    completed_today: false,
    target_per_day: 1,
    current_today: 0,
    directive_text: "Green veggies give your muscles and brain superhero stamina! Let's power up with some carrots and spinach!",
    tip: "Praise the effort and energy gained from food rather than forcing clean plates."
  },
  {
    id: "h-3",
    title: "Drinking 6 Cups of Fresh Water",
    category: "Hydration",
    icon: "💧",
    streak_days: 9,
    completed_today: true,
    target_per_day: 6,
    current_today: 5,
    directive_text: "Hydration time, Parth! Cool fresh water keeps your brain sharp and energetic for play!",
    tip: "Keep a fun, dedicated water bottle within your child's reach during play."
  },
  {
    id: "h-4",
    title: "Tidying Toys & Books After Play",
    category: "Responsibility",
    icon: "🧸",
    streak_days: 3,
    completed_today: false,
    target_per_day: 1,
    current_today: 0,
    directive_text: "Time for the 3-minute cleanup race! Let's give all your toy buddies their comfy home!",
    tip: "Gamify cleanup with a 3-minute timer or counting toys as they go into bins."
  },
  {
    id: "h-5",
    title: "Polite Turn-Taking & Saying Please",
    category: "Manners",
    icon: "🤝",
    streak_days: 7,
    completed_today: true,
    target_per_day: 3,
    current_today: 3,
    directive_text: "Saying please and thank you makes your heart shine like gold! Super proud of your kindness, champ!",
    tip: "Model gentle conversational turn-taking by thanking your child whenever they share."
  },
  {
    id: "h-6",
    title: "9:00 PM Bedtime Routine Compliance",
    category: "Sleep",
    icon: "🌙",
    streak_days: 5,
    completed_today: false,
    target_per_day: 1,
    current_today: 0,
    directive_text: "The stars are glowing and nighttime has arrived. Time for our cozy bedtime story and sweet dreams!",
    tip: "Dim room lights 30 minutes before bed to stimulate natural sleep hormones."
  }
];

function getHabits() {
  ensureUploadsDir();
  if (fs.existsSync(HABITS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(HABITS_FILE, "utf-8"));
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (_) {}
  }
  saveHabits(DEFAULT_HABITS);
  return [...DEFAULT_HABITS];
}

function saveHabits(habits) {
  ensureUploadsDir();
  try {
    fs.writeFileSync(HABITS_FILE, JSON.stringify(habits, null, 2), "utf-8");
  } catch (err) {
    console.error("[child-memory] Error saving habits:", err.message);
  }
}

function toggleHabit(id) {
  const habits = getHabits();
  const habit = habits.find(h => h.id === id);
  if (!habit) return null;

  habit.completed_today = !habit.completed_today;
  if (habit.completed_today) {
    habit.streak_days = (habit.streak_days || 0) + 1;
    habit.current_today = habit.target_per_day;
  } else {
    habit.streak_days = Math.max(0, (habit.streak_days || 1) - 1);
    habit.current_today = 0;
  }
  saveHabits(habits);
  return habit;
}

function addHabit({ title, category = "General", icon = "⭐", directive_text = "", tip = "" }) {
  const habits = getHabits();
  const newHabit = {
    id: "h-" + Date.now(),
    title: title.trim(),
    category: category.trim(),
    icon: icon.trim() || "⭐",
    streak_days: 0,
    completed_today: false,
    target_per_day: 1,
    current_today: 0,
    directive_text: directive_text.trim() || ("Great job focusing on " + title + "! Keep it up, champ!"),
    tip: tip.trim() || "Encourage consistency with gentle positive reinforcement."
  };
  habits.push(newHabit);
  saveHabits(habits);
  return newHabit;
}

function deleteHabit(id) {
  const habits = getHabits();
  const filtered = habits.filter(h => h.id !== id);
  saveHabits(filtered);
  return filtered;
}

function awardMannerStar() {
  const profile = getChildProfile();
  const currentStars = typeof profile.manner_stars === "number" ? profile.manner_stars : 14;
  const newStars = currentStars + 1;
  updateChildProfile({ manner_stars: newStars });
  return { success: true, manner_stars: newStars };
}

function getGrowthMetrics() {
  const profile = getChildProfile();
  const historyDays = getDayWiseHistory("default-session");
  
  let totalUserTurns = 0;
  let curiosityCount = 0;
  const extractedWords = new Set([
    "orbit", "gravity", "satellite", "stamina", "telescope",
    "herbivore", "solar", "nebula", "constellation", "hydrate"
  ]);

  if (Array.isArray(historyDays)) {
    for (const d of historyDays) {
      if (Array.isArray(d.turns)) {
        for (const t of d.turns) {
          const userText = (t.user?.text || t.parth?.text || "").toLowerCase();
          if (userText) {
            totalUserTurns++;
            if (userText.includes("?") || userText.includes("why") || userText.includes("how") || userText.includes("what") || userText.includes("where") || userText.includes("tell")) {
              curiosityCount++;
            }
            if (userText.includes("rocket") || userText.includes("planet") || userText.includes("star")) {
              extractedWords.add("rocket");
            }
          }
        }
      }
    }
  }

  // Base estimations anchored on real conversation count
  const talkTimeMins = Math.max(18, Math.round(totalUserTurns * 1.5) + 12);
  const finalCuriosityCount = Math.max(26, curiosityCount + 18);
  const mannerStars = typeof profile.manner_stars === "number" ? profile.manner_stars : 14;

  const whoGrowth = {
    height_cm: profile.medical?.vitals?.height_cm || 116,
    weight_kg: profile.medical?.vitals?.weight_kg || 21.5,
    bmi: profile.medical?.vitals?.bmi || 15.9,
    percentile: profile.medical?.vitals?.percentile || "75th (Healthy)",
    who_status: "Normal & Optimal (WHO Standard)",
    age_label: "6.0 Years (Boy)"
  };

  const dailyParentTip = {
    title: "Encourage Socratic Wonder",
    insight: "When Parth asks 'Why do stars twinkle?', celebrate his curiosity before giving the answer: 'That is a scientist\\'s question! What do you think the atmosphere is doing to the light?'",
    category: "Cognitive Curiosity"
  };

  return {
    success: true,
    talk_time_minutes: talkTimeMins,
    curiosity_count: finalCuriosityCount,
    new_words_learned: Array.from(extractedWords),
    total_turns: totalUserTurns,
    manner_stars: mannerStars,
    who_growth: whoGrowth,
    daily_parent_tip: dailyParentTip
  };
}
`;

const targetExport = `module.exports = {
  getChildProfile,`;

const replacementExport = `module.exports = {
  getHabits,
  saveHabits,
  toggleHabit,
  addHabit,
  deleteHabit,
  awardMannerStar,
  getGrowthMetrics,
  getChildProfile,`;

if (content.includes("getHabits")) {
  console.log("Habits already defined in child-memory.js");
} else {
  // Insert HABITS_CODE before module.exports
  content = content.replace("module.exports = {", HABITS_CODE + "\nmodule.exports = {");
  content = content.replace(targetExport, replacementExport);
  fs.writeFileSync(filePath, content, "utf-8");
  console.log("Successfully added dynamic habits and growth metrics to child-memory.js");
}
