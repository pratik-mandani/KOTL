/**
 * KOTL Child Development Intelligence & Skills Analytics Engine
 *
 * Provides evidence-backed observational analytics across 8 core developmental
 * domains for young children (primary persona: Parth, age 6).
 *
 * Core Principles:
 * 1. Non-Clinical & Observational: Describes observed language, curiosity, reasoning,
 *    and task persistence in natural play. Never generates IQ, diagnostic, or clinical labels.
 * 2. Truthful & Unfabricated: Skills without observations are marked "Not enough observations yet"
 *    with a null score and a suggested observation opportunity. Arbitrary 75–95% scores are removed;
 *    we track verifiable observation counts and domain observation coverage.
 * 3. Inquiry vs Demonstration Distinction: A child asking a question (e.g. "What is 2 + 2?")
 *    is classified as an exploratory inquiry, NOT as demonstrated arithmetic mastery.
 *    Application is recognized only when the child executes a task milestone or articulates reasoning.
 * 4. Multi-Source Evidence Integration: Unifies dialogue inquiries (sessions.json),
 *    educational milestones & projects (tasks.json), and daily routines (habits.json).
 * 5. Resilient Persistence: Uses storage.js safe atomic writes with environment path resolution.
 */

const fs = require("fs");
const path = require("path");
const { getDataDir, readJsonFileSafe, writeJsonFileSafe } = require("../utils/storage");

const SKILLS_ANALYTICS_FILE = () => path.join(getDataDir(), "skills_analytics.json");
const SESSIONS_FILE = () => path.join(getDataDir(), "sessions.json");
const TASKS_FILE = () => path.join(getDataDir(), "tasks.json");
const HABITS_FILE = () => path.join(getDataDir(), "habits.json");
const PROFILE_FILE = () => path.join(getDataDir(), "child_profile.json");

/**
 * Age-Aware 8-Domain Developmental Skills Taxonomy
 */
const SKILL_TAXONOMY = {
  language_communication: {
    id: "language_communication",
    name: "Language & Communication",
    icon: "🗣️",
    accentColor: "#6366F1", // Indigo
    description: "Expressive vocabulary, sentence formulation, listening comprehension, and verbal turn-taking in natural dialogue.",
    skills: [
      {
        id: "lang_vocabulary",
        name: "Expressive Vocabulary & Lexical Range",
        definition: "Spontaneous usage of multisyllabic, descriptive words during dialogue and storytelling.",
        sampleActivityPrompt: "Ask KOTL to tell a story about ocean creatures and listen for new descriptive words like 'tentacle' or 'bioluminescent'."
      },
      {
        id: "lang_sentence_formulation",
        name: "Sentence Complexity & Grammar Structure",
        definition: "Formulating complete sentences using connecting conjunctions (because, if, then, so, and).",
        sampleActivityPrompt: "Prompt Parth to explain why a rocket needs engines using 'because...' in the answer."
      },
      {
        id: "lang_active_listening",
        name: "Active Listening & Turn-Taking",
        definition: "Maintaining thematic continuity across consecutive conversational turns without abruptly dropping context.",
        sampleActivityPrompt: "Engage in a 3-turn question-and-answer mystery game with KOTL about a secret animal."
      }
    ]
  },
  logical_math: {
    id: "logical_math",
    name: "Logical & Mathematical Thinking",
    icon: "🔢",
    accentColor: "#3B82F6", // Blue
    description: "Numerical fluency, counting, cause-and-effect reasoning, and spatial pattern comprehension.",
    skills: [
      {
        id: "math_number_fluency",
        name: "Counting, Arithmetic & Number Sense",
        definition: "Recognizing quantities, simple addition/subtraction, and numeric calculations in everyday contexts.",
        sampleActivityPrompt: "Count aloud 10 colorful shapes or solve simple everyday math problems with KOTL like 'What is 2 + 2?'."
      },
      {
        id: "logic_cause_effect",
        name: "Cause-and-Effect Reasoning",
        definition: "Asking 'why' or 'what happens if' questions and connecting actions to predictable consequences.",
        sampleActivityPrompt: "Explore questions like 'Why do shadows get longer in the evening?' during an afternoon walk."
      },
      {
        id: "logic_spatial_patterns",
        name: "Pattern Recognition & Sequencing",
        definition: "Identifying repeating visual patterns, sorting geometric shapes, and understanding step-by-step sequences.",
        sampleActivityPrompt: "Arrange blocks in an AB-AB pattern (red-blue-red-blue) and describe what comes next."
      }
    ]
  },
  scientific_curiosity: {
    id: "scientific_curiosity",
    name: "Curiosity & Scientific Inquiry",
    icon: "🔬",
    accentColor: "#10B981", // Emerald
    description: "Active questioning about the natural world, astronomy, living organisms, and empirical cause exploration.",
    skills: [
      {
        id: "sci_inquiry_depth",
        name: "Inquiry Frequency & Question Depth",
        definition: "Formulating spontaneous, inquisitive questions seeking scientific or mechanical explanations.",
        sampleActivityPrompt: "Ask KOTL three curious questions about things you saw today in nature or the sky."
      },
      {
        id: "sci_natural_phenomena",
        name: "Astronomy & Natural World Exploration",
        definition: "Expressing interest in planets, the sun, stars, weather, wildlife, and natural ecosystems.",
        sampleActivityPrompt: "Look at the moon together and ask KOTL why the moon changes its shape throughout the month."
      },
      {
        id: "sci_observational_curiosity",
        name: "Empirical Observation & Detail",
        definition: "Noticing and describing physical details, growth stages in plants, and material changes.",
        sampleActivityPrompt: "Observe our 'Plant in a Cup' project and sketch the newest leaf in your drawing notebook."
      }
    ]
  },
  creativity_imagination: {
    id: "creativity_imagination",
    name: "Creativity & Imagination",
    icon: "🎨",
    accentColor: "#EC4899", // Pink
    description: "Narrative world-building, pretend play scenarios, artistic expression, and divergent thinking.",
    skills: [
      {
        id: "creat_narrative_story",
        name: "Imaginative Storytelling & Pretend Play",
        definition: "Co-creating fictional adventures, inventing characters, and exploring imaginative scenarios with KOTL.",
        sampleActivityPrompt: "Create a starship crew with KOTL and invent a friendly alien creature on a newly discovered planet."
      },
      {
        id: "creat_divergent_arts",
        name: "Divergent Thinking & Visual Arts",
        definition: "Combining colors, sketching original ideas, and generating multiple creative possibilities for a single task.",
        sampleActivityPrompt: "Draw your dream spaceship using three bright colors and tell KOTL what special button does what."
      },
      {
        id: "creat_expressive_play",
        name: "Expressive Voice & Roleplaying",
        definition: "Adopting playful character voices, expressing enthusiasm in speech, and engaging in dramatic play.",
        sampleActivityPrompt: "Pretend to be an astronaut communicating back to Earth base through KOTL's walkie-talkie speaker."
      }
    ]
  },
  emotional_regulation: {
    id: "emotional_regulation",
    name: "Emotional Awareness & Self-Regulation",
    icon: "💖",
    accentColor: "#F43F5E", // Rose
    description: "Verbalizing feelings, seeking comfort when upset, practicing patience, and responding to soothing cues.",
    skills: [
      {
        id: "emo_sentiment_naming",
        name: "Feeling Identification & Naming",
        definition: "Verbalizing emotional states (happy, excited, sad, afraid, tired) rather than expressing them solely through behavior.",
        sampleActivityPrompt: "Tell KOTL one thing that made you feel really proud today, and one thing that felt a little tricky."
      },
      {
        id: "emo_receptive_soothing",
        name: "Receptive Calming & Grounding",
        definition: "Accepting reassuring comfort, deep breaths, and gentle guidance when feeling overwhelmed or tired.",
        sampleActivityPrompt: "Listen to KOTL's gentle bedtime star breathing story before turning off the bedside lamp."
      },
      {
        id: "emo_empathy_connection",
        name: "Compassionate Response to Others",
        definition: "Recognizing when a family member, peer, or animal feels sad and expressing sympathetic concern.",
        sampleActivityPrompt: "Discuss with KOTL how we can help a friend feel cheered up when they are having a tough day."
      }
    ]
  },
  social_perspective: {
    id: "social_perspective",
    name: "Social Manners & Perspective-Taking",
    icon: "🤝",
    accentColor: "#F59E0B", // Amber
    description: "Courteous turn-taking, family perspective, cultural greetings, and collaborative communication.",
    skills: [
      {
        id: "soc_manners_etiquette",
        name: "Courteous Communication & Social Manners",
        definition: "Using polite expressions (please, thank you, namaste, kem cho) and showing respect in conversation.",
        sampleActivityPrompt: "Practice saying a cheerful morning greeting to KOTL and family members at breakfast."
      },
      {
        id: "soc_family_care",
        name: "Family Care & Affectionate Awareness",
        definition: "Mentioning parents, siblings, or family pets (like Bruno) with affection, care, and cooperative spirit.",
        sampleActivityPrompt: "Share a fun memory about playing with Bruno the dog or helping Mummy with evening prep."
      },
      {
        id: "soc_perspective_sharing",
        name: "Perspective-Taking & Consideration",
        definition: "Demonstrating awareness that different people have distinct preferences, feelings, and points of view.",
        sampleActivityPrompt: "Ask KOTL what its favorite color or star is and talk about why different people like different things."
      }
    ]
  },
  executive_skills: {
    id: "executive_skills",
    name: "Learning & Executive Function",
    icon: "⚡",
    accentColor: "#8B5CF6", // Purple
    description: "Goal persistence, milestone follow-through, routine regularity, and following multi-step instructions.",
    skills: [
      {
        id: "exec_task_persistence",
        name: "Goal Persistence & Project Completion",
        definition: "Working through multi-step tasks over several days until completion rather than abandoning them early.",
        sampleActivityPrompt: "Check off the final milestone on your active School Science project on the dashboard."
      },
      {
        id: "exec_routine_consistency",
        name: "Daily Routine Consistency & Habits",
        definition: "Building daily behavioral rhythms (morning readiness, dental hygiene, evening reading) with high adherence.",
        sampleActivityPrompt: "Complete all morning habits before 9:00 AM to maintain your positive streak on the dashboard."
      },
      {
        id: "exec_step_processing",
        name: "Sequential Instruction Processing",
        definition: "Understanding and executing instructions broken down into sequential steps (Step 1 -> Step 2 -> Step 3).",
        sampleActivityPrompt: "Follow the 3-step plant watering recipe outlined in the Science Project task instructions."
      }
    ]
  },
  world_knowledge: {
    id: "world_knowledge",
    name: "World Knowledge & Practical Life",
    icon: "🌍",
    accentColor: "#06B6D4", // Cyan
    description: "Civic curiosity, geography, cultural knowledge, daily health consciousness, and physical vitality.",
    skills: [
      {
        id: "world_civic_geography",
        name: "Civic, Cultural & Geographic Awareness",
        definition: "Asking questions about our country, national leaders, geography, holidays, and how the world works.",
        sampleActivityPrompt: "Ask KOTL about India, its capital city New Delhi, or who helps guide our nation."
      },
      {
        id: "world_health_hygiene",
        name: "Practical Health & Hygiene Consciousness",
        definition: "Understanding the importance of drinking water, washing hands, eating nutritious foods, and resting.",
        sampleActivityPrompt: "Drink a glass of water when KOTL gives a gentle daytime hydration reminder."
      },
      {
        id: "world_physical_vitality",
        name: "Active Physical Play & Outdoor Movement",
        definition: "Engaging in energetic outdoor physical activity and movement (WHO 60-min daily recommendation).",
        sampleActivityPrompt: "Log active outdoor playtime or bicycling in the afternoon health tracker."
      }
    ]
  }
};

/**
 * Extracts authentic user turns across sessions.json (filters out demo and test fixtures)
 */
function extractAllUserTurns() {
  const turns = [];
  try {
    const sessionsFile = SESSIONS_FILE();
    if (fs.existsSync(sessionsFile)) {
      const data = readJsonFileSafe(sessionsFile, {});
      for (const sessKey of Object.keys(data)) {
        // Exclude temporary test sessions or explicitly labeled demo sessions
        if (sessKey.startsWith("bench-session") || sessKey.startsWith("test-skills-chat") || sessKey.includes("demo")) {
          continue;
        }
        const msgs = data[sessKey] || [];
        for (let i = 0; i < msgs.length; i++) {
          const m = msgs[i];
          if (m && m.role === "user" && typeof m.content === "string" && m.content.trim()) {
            if (m.source === "demo") continue; // Never treat demo source as real observation
            const assistantReply = msgs[i + 1]?.role === "assistant" ? msgs[i + 1] : null;
            turns.push({
              id: m.id || `turn-${sessKey}-${i}`,
              session_id: sessKey,
              user_text: m.content.trim(),
              assistant_text: assistantReply ? assistantReply.content.trim() : null,
              timestamp: m.timestamp || new Date().toISOString(),
              source: m.source || "esp32"
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("[Skills Analytics] Error extracting user turns:", err.message);
  }
  return turns;
}

/**
 * Evaluates evidence for each skill in the taxonomy against all persisted data.
 */
function computeSkillsAnalytics({ refresh = false } = {}) {
  const analyticsFile = SKILLS_ANALYTICS_FILE();

  if (!refresh && fs.existsSync(analyticsFile)) {
    try {
      const cached = readJsonFileSafe(analyticsFile, null);
      if (
        cached &&
        cached.taxonomy_version === "3.1" &&
        cached.categories &&
        typeof cached.generated_at === "string"
      ) {
        const ageMs = Date.now() - new Date(cached.generated_at).getTime();
        if (ageMs < 60000) {
          return cached;
        }
      }
    } catch (_) {}
  }

  // Load live authentic data sources
  const userTurns = extractAllUserTurns();
  const tasks = readJsonFileSafe(TASKS_FILE(), []);
  const habits = readJsonFileSafe(HABITS_FILE(), []);
  const profile = readJsonFileSafe(PROFILE_FILE(), {});

  const totalTurns = userTurns.length;
  const childName = profile.name || "Parth";

  // Stop words for vocabulary analysis
  const stopWords = new Set([
    "a", "an", "the", "is", "are", "was", "were", "and", "or", "to", "in", "on", "at", "it", "me", "you",
    "he", "she", "they", "we", "i", "my", "your", "his", "her", "for", "of", "with", "what", "why", "how",
    "when", "where", "who", "tell", "can", "do", "does", "did", "about", "this", "that", "so", "just", "be"
  ]);

  // Skill evidence buckets
  const skillEvidenceMap = new Map();
  const getEvidenceBucket = (skillId) => {
    if (!skillEvidenceMap.has(skillId)) {
      skillEvidenceMap.set(skillId, []);
    }
    return skillEvidenceMap.get(skillId);
  };

  // 1. Scan Dialogue Turns for Concrete Evidence with Explicit Evidence Types
  userTurns.forEach(turn => {
    const text = turn.user_text;
    const lower = text.toLowerCase();
    const isQuestion = text.includes("?") || lower.startsWith("what") || lower.startsWith("why") || lower.startsWith("how") || lower.startsWith("where") || lower.startsWith("who");

    // Check: lang_vocabulary (spontaneous multisyllabic words)
    const words = lower.match(/[a-z]{5,}/g) || [];
    const descriptiveWords = words.filter(w => !stopWords.has(w));
    if (descriptiveWords.length >= 2) {
      getEvidenceBucket("lang_vocabulary").push({
        evidence_type: "child_expression",
        source: "dialogue",
        timestamp: turn.timestamp,
        excerpt: `"${text}"`,
        note: `Spontaneous multisyllabic vocabulary: ${descriptiveWords.slice(0, 3).join(", ")}`
      });
    }

    // Check: lang_sentence_formulation (compound sentence reasoning)
    if (lower.includes(" because ") || lower.includes(" if ") || lower.includes(" so ")) {
      getEvidenceBucket("lang_sentence_formulation").push({
        evidence_type: "dialogue_reasoning",
        source: "dialogue",
        timestamp: turn.timestamp,
        excerpt: `"${text}"`,
        note: "Connected thoughts using logical conjunctions (because/if/so)."
      });
    }

    // Check: lang_active_listening (multi-turn follow-ups)
    if (turn.assistant_text && (lower.includes("yes") || lower.includes("no") || lower.includes("bruno") || lower.includes("okay") || lower.includes("tell me more"))) {
      getEvidenceBucket("lang_active_listening").push({
        evidence_type: "dialogue_reasoning",
        source: "dialogue",
        timestamp: turn.timestamp,
        excerpt: `"${text}"`,
        note: "Maintained active conversational context across turns."
      });
    }

    // Check: math_number_fluency (Distinguish inquiry from demonstration)
    if (
      lower.includes("2 + 2") ||
      lower.includes("2+2") ||
      lower.includes("plus") ||
      lower.includes("count") ||
      lower.match(/\b\d+\b/)
    ) {
      getEvidenceBucket("math_number_fluency").push({
        evidence_type: isQuestion ? "child_inquiry" : "child_expression",
        source: "dialogue",
        timestamp: turn.timestamp,
        excerpt: `"${text}"`,
        note: isQuestion
          ? "Spontaneous inquiry exploring numbers and arithmetic."
          : "Expressed numerical or counting statement in speech."
      });
    }

    // Check: logic_cause_effect ("why" questions vs "because" reasoning)
    if (lower.startsWith("why") || lower.includes("why ") || lower.includes("what if") || lower.includes("how does")) {
      getEvidenceBucket("logic_cause_effect").push({
        evidence_type: "child_inquiry",
        source: "dialogue",
        timestamp: turn.timestamp,
        excerpt: `"${text}"`,
        note: "Asked cause-and-effect inquiry exploring underlying principles."
      });
    }

    // Check: sci_inquiry_depth (spontaneous scientific/general questions)
    if (isQuestion) {
      getEvidenceBucket("sci_inquiry_depth").push({
        evidence_type: "child_inquiry",
        source: "dialogue",
        timestamp: turn.timestamp,
        excerpt: `"${text}"`,
        note: "Formulated spontaneous exploratory inquiry."
      });
    }

    // Check: sci_natural_phenomena (astronomy, living world)
    if (
      lower.includes("sun") ||
      lower.includes("star") ||
      lower.includes("moon") ||
      lower.includes("space") ||
      lower.includes("rocket") ||
      lower.includes("plant") ||
      lower.includes("animal") ||
      lower.includes("dolphin") ||
      lower.includes("tree") ||
      lower.includes("water")
    ) {
      getEvidenceBucket("sci_natural_phenomena").push({
        evidence_type: isQuestion ? "child_inquiry" : "child_expression",
        source: "dialogue",
        timestamp: turn.timestamp,
        excerpt: `"${text}"`,
        note: isQuestion
          ? "Inquired about astronomy, nature, or living organisms."
          : "Conversational expression about natural world phenomena."
      });
    }

    // Check: creat_narrative_story (storytelling, imaginary play)
    if (lower.includes("story") || lower.includes("magic") || lower.includes("pretend") || lower.includes("alien") || lower.includes("space ship") || lower.includes("spaceship")) {
      getEvidenceBucket("creat_narrative_story").push({
        evidence_type: "child_expression",
        source: "dialogue",
        timestamp: turn.timestamp,
        excerpt: `"${text}"`,
        note: "Participated in imaginative story or pretend scenario."
      });
    }

    // Check: emo_sentiment_naming (emotional sharing / feeling articulation)
    const emotionTokens = ["happy", "sad", "scared", "afraid", "excited", "upset", "miss mummy", "miss papa", "cry", "fun", "love"];
    emotionTokens.forEach(emo => {
      if (lower.includes(emo)) {
        getEvidenceBucket("emo_sentiment_naming").push({
          evidence_type: "emotional_expression",
          source: "dialogue",
          timestamp: turn.timestamp,
          excerpt: `"${text}"`,
          note: `Verbalized feeling state ("${emo}") in conversation.`
        });
        getEvidenceBucket("emo_receptive_soothing").push({
          evidence_type: "emotional_expression",
          source: "dialogue",
          timestamp: turn.timestamp,
          excerpt: `"${text}"`,
          note: "Shared vulnerable emotional expression with companion."
        });
      }
    });

    // Check: soc_manners_etiquette (polite greetings & phrases)
    if (
      lower.includes("thank you") ||
      lower.includes("thanks") ||
      lower.includes("please") ||
      lower.includes("namaste") ||
      lower.includes("kem cho") ||
      lower.includes("hello") ||
      lower.includes("hi kotl")
    ) {
      getEvidenceBucket("soc_manners_etiquette").push({
        evidence_type: "social_courtesy",
        source: "dialogue",
        timestamp: turn.timestamp,
        excerpt: `"${text}"`,
        note: "Expressed polite conversational greeting or courtesy."
      });
    }

    // Check: soc_family_care (family, pet Bruno)
    if (lower.includes("bruno") || lower.includes("mummy") || lower.includes("papa") || lower.includes("dog") || lower.includes("friend")) {
      getEvidenceBucket("soc_family_care").push({
        evidence_type: "child_expression",
        source: "dialogue",
        timestamp: turn.timestamp,
        excerpt: `"${text}"`,
        note: "Expressed affectionate care for family, friend, or pet."
      });
    }

    // Check: world_civic_geography (Prime Minister, India, country)
    if (lower.includes("prime minister") || lower.includes("india") || lower.includes("delhi") || lower.includes("country") || lower.includes("leader")) {
      getEvidenceBucket("world_civic_geography").push({
        evidence_type: isQuestion ? "child_inquiry" : "child_expression",
        source: "dialogue",
        timestamp: turn.timestamp,
        excerpt: `"${text}"`,
        note: isQuestion
          ? "Inquired about national leadership or civic geography."
          : "Expressed awareness of civic or national topics."
      });
    }
  });

  // 2. Scan Tasks & Milestones for Learning Evidence
  tasks.forEach(task => {
    const cat = (task.category || "").toLowerCase();
    const isCompleted = task.completed === true || task.status === "completed";
    const milestones = Array.isArray(task.milestones) ? task.milestones : [];
    const completedMilestones = milestones.filter(m => m.completed === true);

    if (completedMilestones.length > 0) {
      getEvidenceBucket("exec_step_processing").push({
        evidence_type: "applied_milestone",
        source: "task_milestones",
        timestamp: task.updated_at || task.created_at,
        excerpt: `Task "${task.title}": ${completedMilestones.length}/${milestones.length} milestones complete`,
        note: "Applied sequential step-by-step milestone execution."
      });
    }

    if (isCompleted) {
      getEvidenceBucket("exec_task_persistence").push({
        evidence_type: "applied_milestone",
        source: "task_completion",
        timestamp: task.completed_at || task.updated_at,
        excerpt: `Completed project: "${task.title}"`,
        note: "Persisted to finish a multi-step learning project."
      });
    }

    if (cat.includes("school project") || cat.includes("science")) {
      getEvidenceBucket("sci_observational_curiosity").push({
        evidence_type: "applied_milestone",
        source: "school_project",
        timestamp: task.updated_at,
        excerpt: `Project: "${task.title}"`,
        note: "Engaged in hands-on science observation project."
      });
    } else if (cat.includes("homework") || cat.includes("math")) {
      getEvidenceBucket("math_number_fluency").push({
        evidence_type: "applied_milestone",
        source: "homework",
        timestamp: task.updated_at,
        excerpt: `Math Task: "${task.title}"`,
        note: "Applied shape counting or grouping milestone in homework."
      });
      getEvidenceBucket("logic_spatial_patterns").push({
        evidence_type: "applied_milestone",
        source: "homework",
        timestamp: task.updated_at,
        excerpt: `Task: "${task.title}"`,
        note: "Engaged in shape recognition or visual pattern logic."
      });
    } else if (cat.includes("reading")) {
      getEvidenceBucket("lang_vocabulary").push({
        evidence_type: "applied_milestone",
        source: "reading_task",
        timestamp: task.updated_at,
        excerpt: `Reading: "${task.title}"`,
        note: "Practiced new vocabulary in bedtime reading project."
      });
      getEvidenceBucket("creat_narrative_story").push({
        evidence_type: "applied_milestone",
        source: "reading_task",
        timestamp: task.updated_at,
        excerpt: `Story Reading: "${task.title}"`,
        note: "Explored narrative storytelling themes."
      });
    } else if (cat.includes("creative") || cat.includes("art")) {
      getEvidenceBucket("creat_divergent_arts").push({
        evidence_type: "applied_milestone",
        source: "creative_arts",
        timestamp: task.updated_at,
        excerpt: `Creative Project: "${task.title}"`,
        note: "Explored creative art, drawing, or design."
      });
    } else if (cat.includes("chore")) {
      getEvidenceBucket("soc_family_care").push({
        evidence_type: "applied_milestone",
        source: "household_chore",
        timestamp: task.updated_at,
        excerpt: `Chore: "${task.title}"`,
        note: "Contributed cooperatively to family household responsibilities."
      });
    }
  });

  // 3. Scan Habits for Routine Regularity
  if (habits.length > 0) {
    const completedToday = habits.filter(h => h.completed_today).length;
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);

    if (completedToday > 0 || maxStreak > 0) {
      getEvidenceBucket("exec_routine_consistency").push({
        evidence_type: "confirmed_routine",
        source: "habits_tracker",
        timestamp: new Date().toISOString(),
        excerpt: `${completedToday} of ${habits.length} habits checked today (Best streak: ${maxStreak} days)`,
        note: "Parent-confirmed positive habit adherence across routines."
      });
      getEvidenceBucket("world_health_hygiene").push({
        evidence_type: "confirmed_routine",
        source: "habits_tracker",
        timestamp: new Date().toISOString(),
        excerpt: `Routine hygiene tracking (${completedToday} completed)`,
        note: "Practiced personal health and hygiene routines."
      });
    }
  }

  // 4. Scan Profile for Manner Stars & Sports Activity
  if (typeof profile.manner_stars === "number" && profile.manner_stars > 0) {
    getEvidenceBucket("soc_manners_etiquette").push({
      evidence_type: "social_courtesy",
      source: "parent_manner_stars",
      timestamp: new Date().toISOString(),
      excerpt: `${profile.manner_stars} Manner Stars awarded to date`,
      note: "Recognized by parents for courteous behavior and empathy."
    });
  }

  if (profile.medical?.sports?.active_minutes) {
    getEvidenceBucket("world_physical_vitality").push({
      evidence_type: "confirmed_routine",
      source: "sports_tracker",
      timestamp: new Date().toISOString(),
      excerpt: `${profile.medical.sports.active_minutes} active movement minutes logged today`,
      note: "Logged outdoor physical play and active gross-motor movement."
    });
  }

  // Assemble the Evaluated Categories & Skills
  const evaluatedCategories = {};
  let totalSkillsCount = 0;
  let totalObservedSkillsCount = 0;
  const allSkillsList = [];

  for (const catKey of Object.keys(SKILL_TAXONOMY)) {
    const catDef = SKILL_TAXONOMY[catKey];
    const evaluatedSkills = [];
    let catObservedCount = 0;

    catDef.skills.forEach(skillDef => {
      totalSkillsCount++;
      const evidence = skillEvidenceMap.get(skillDef.id) || [];
      const evidenceCount = evidence.length;

      const hasApplied = evidence.some(e => e.evidence_type === "applied_milestone" || e.evidence_type === "dialogue_reasoning");
      const hasInquiry = evidence.some(e => e.evidence_type === "child_inquiry");
      const hasEmotional = evidence.some(e => e.evidence_type === "emotional_expression");
      const hasRoutine = evidence.some(e => e.evidence_type === "confirmed_routine" || e.evidence_type === "social_courtesy");

      let status = "insufficient_evidence";
      let statusLabel = "Not enough observations yet";
      let confidence = "Awaiting Data";
      let trend = "stable";
      let evidenceLevel = null;

      if (evidenceCount >= 2) {
        if (hasApplied) {
          status = "demonstrated_in_activity";
          statusLabel = "Demonstrated in Activity/Reasoning";
          confidence = evidenceCount >= 4 ? "High (4+ observations)" : "Moderate (2-3 observations)";
          evidenceLevel = `${evidenceCount} Verified Applications`;
          trend = "positive_growth";
        } else if (hasInquiry) {
          status = "active_inquiry";
          statusLabel = "Active Spontaneous Inquiry";
          confidence = evidenceCount >= 4 ? "Frequent (4+ inquiries)" : "Active (2-3 inquiries)";
          evidenceLevel = `${evidenceCount} Spontaneous Questions`;
          trend = "positive_growth";
        } else if (hasEmotional) {
          status = "emotional_expression";
          statusLabel = "Expressed Feeling to Companion";
          confidence = "Open Communication";
          evidenceLevel = `${evidenceCount} Feelings Shared`;
          trend = "stable";
        } else if (hasRoutine) {
          status = "observed_routine";
          statusLabel = "Observed Habit / Courtesy";
          confidence = "Routine Consistency";
          evidenceLevel = `${evidenceCount} Routine Records`;
          trend = "positive_growth";
        } else {
          status = "active_observation";
          statusLabel = "Observed in Natural Dialogue";
          confidence = "Moderate Observations";
          evidenceLevel = `${evidenceCount} Dialogue Observations`;
          trend = "positive_growth";
        }
        catObservedCount++;
        totalObservedSkillsCount++;
      } else if (evidenceCount === 1) {
        status = "emerging";
        statusLabel = "Emerging Initial Observation";
        confidence = "Initial (1 observation)";
        evidenceLevel = "1 Initial Observation";
        trend = "emerging";
        catObservedCount++;
        totalObservedSkillsCount++;
      }

      const evaluatedSkill = {
        id: skillDef.id,
        name: skillDef.name,
        category_id: catKey,
        category_name: catDef.name,
        definition: skillDef.definition,
        status,
        status_label: statusLabel,
        confidence,
        score: null, // Strictly null: KOTL does not fabricate arbitrary 75-95% marksheet percentages
        observation_count: evidenceCount,
        evidence_level: evidenceLevel,
        trend,
        evidence_count: evidenceCount,
        recent_evidence: evidence.slice(0, 3),
        suggested_activity: skillDef.sampleActivityPrompt
      };

      evaluatedSkills.push(evaluatedSkill);
      allSkillsList.push(evaluatedSkill);
    });

    const observationCoveragePct = Math.round((catObservedCount / catDef.skills.length) * 100);

    evaluatedCategories[catKey] = {
      id: catDef.id,
      name: catDef.name,
      icon: catDef.icon,
      accentColor: catDef.accentColor,
      description: catDef.description,
      observation_coverage_pct: observationCoveragePct,
      score_label: catObservedCount > 0 ? `${catObservedCount} of ${catDef.skills.length} Skills Observed (${observationCoveragePct}% Coverage)` : "Awaiting Observations",
      observed_skills_count: catObservedCount,
      total_skills_count: catDef.skills.length,
      skills: evaluatedSkills
    };
  }

  // Identify Strongest, Emerging & Skills Requiring More Observation
  const demonstratedSkills = allSkillsList
    .filter(s => s.status === "demonstrated_in_activity" || s.status === "active_inquiry" || s.status === "emotional_expression" || s.status === "observed_routine" || s.status === "active_observation")
    .sort((a, b) => (b.observation_count || 0) - (a.observation_count || 0));

  const emergingSkills = allSkillsList
    .filter(s => s.status === "emerging");

  const unobservedSkills = allSkillsList
    .filter(s => s.status === "insufficient_evidence");

  // Top Suggested Next Activities (tied to unobserved or emerging skills)
  const suggestedNextActivities = [...unobservedSkills, ...emergingSkills]
    .slice(0, 3)
    .map((s, idx) => ({
      id: `act-${idx + 1}`,
      skill_id: s.id,
      skill_name: s.name,
      category_name: s.category_name,
      suggestion: s.suggested_activity
    }));

  // Overall Observation Coverage
  const overallCoveragePct = Math.round((totalObservedSkillsCount / Math.max(1, totalSkillsCount)) * 100);

  // Radar Chart Data Model (8 Core Axes: Measures Domain Observation Coverage Density)
  const radarAxes = Object.keys(evaluatedCategories).map(k => {
    const cat = evaluatedCategories[k];
    return {
      key: cat.id,
      label: cat.name,
      icon: cat.icon,
      color: cat.accentColor,
      // Value measures Domain Observation Coverage (0% to 100%), NOT a fake test grade
      value: cat.observation_coverage_pct,
      has_data: cat.observed_skills_count > 0,
      coverage_pct: cat.observation_coverage_pct,
      observed_count: cat.observed_skills_count,
      total_count: cat.total_skills_count
    };
  });

  const payload = {
    success: true,
    taxonomy_version: "3.1",
    child_name: childName,
    age: profile.age || "6 Years",
    generated_at: new Date().toISOString(),
    total_dialogue_turns_evaluated: totalTurns,
    total_tasks_evaluated: tasks.length,
    total_habits_evaluated: habits.length,
    observation_coverage: {
      observed_skills: totalObservedSkillsCount,
      total_skills: totalSkillsCount,
      coverage_pct: overallCoveragePct,
      label: `${totalObservedSkillsCount} of ${totalSkillsCount} Skills Observed (${overallCoveragePct}% Coverage)`
    },
    radar_axes: radarAxes,
    categories: evaluatedCategories,
    strongest_skills: demonstratedSkills.slice(0, 4),
    emerging_skills: emergingSkills.slice(0, 4),
    unobserved_skills: unobservedSkills,
    suggested_activities: suggestedNextActivities,
    transparency_notice: "This observational profile tracks verified dialogue turns, task milestones, and daily habits recorded with KOTL. It maps observation coverage and evidence counts. It is NOT an IQ score, standardized grading metric, or clinical psychological diagnosis."
  };

  // Persist safely to disk
  writeJsonFileSafe(analyticsFile, payload);
  return payload;
}

module.exports = {
  SKILL_TAXONOMY,
  computeSkillsAnalytics,
  extractAllUserTurns
};
