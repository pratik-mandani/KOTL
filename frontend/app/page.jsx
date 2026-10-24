'use client';

import React, { useState } from 'react';

export default function Dashboard() {
  const [currentSection, setCurrentSection] = useState('report');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [isLogSicknessOpen, setIsLogSicknessOpen] = useState(false);
  const [isUpdateVitalsOpen, setIsUpdateVitalsOpen] = useState(false);
  const [isAddVaccineOpen, setIsAddVaccineOpen] = useState(false);
  const [isAssignQuestOpen, setIsAssignQuestOpen] = useState(false);
  const [isEditMedicalIdOpen, setIsEditMedicalIdOpen] = useState(false);
  const [isAddWordBookOpen, setIsAddWordBookOpen] = useState(false);
  const [isLogPlayOpen, setIsLogPlayOpen] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    name: 'Parth',
    age: 6,
    gender: 'Boy',
    bedtime: '21:00'
  });

  // Quests State
  const [quests, setQuests] = useState([
    {
      id: "q-1",
      title: "🌱 My First Plant in a Cup (School Science Project)",
      category: "School Project",
      goal: "Plant a gram seed in moist soil and observe daily sprout growth",
      mentor_hints: [
        "What do seeds need to wake up? Water, soil, or juice?",
        "Where should we keep our cup so sunlight can touch it?",
        "Let us draw a tiny leaf on our chart when it sprouts!"
      ],
      status: "in_progress",
      reward_badge: "⭐ Master Botanist"
    },
    {
      id: "q-2",
      title: "🧸 Space Station Desk Organizer (Training Mission)",
      category: "Life Skill",
      goal: "Sort study desk items by size: big storybooks, pencils, and pack toys",
      mentor_hints: [
        "Big books are heavy rocket fuel tanks! Where should they sit?",
        "Color crayons are launch control buttons! Can they go in the pencil cup?",
        "Look how clean your space station desk looks now!"
      ],
      status: "in_progress",
      reward_badge: "🚀 Space Commander"
    },
    {
      id: "q-3",
      title: "🎨 Golden Thank-You Card for Dadi (Family Quest)",
      category: "Family Kindness",
      goal: "Draw a colorful greeting card with a smiling sun for Dadi",
      mentor_hints: [
        "What is Dadi's favorite bright color? Yellow or Sky Blue?",
        "Can we draw 5 sun rays and say 'Thank you Dadi for yummy food'?"
      ],
      status: "completed",
      reward_badge: "💖 Kindness Champion"
    }
  ]);

  // Medical Vitals & Logs State
  const [medicalId, setMedicalId] = useState({
    blood_group: 'B+',
    allergies: 'Dust / Pollen (Mild), Raw Bitter Vegetables',
    pediatrician_name: 'Dr. A. Mehta, MD (Pediatrics)',
    phone: '+91 98765 43210',
    clinic: 'Rainbow Kids Clinic'
  });

  const [vitals, setVitals] = useState({ height: 116, weight: 21.5, bmi: 15.9 });
  const [sicknessLogs, setSicknessLogs] = useState([
    {
      id: "sick-1",
      date: "Oct 18, 2026",
      symptom: "Mild Cold & Runny Nose",
      doctor: "Dr. A. Mehta, MD (Pediatrics)",
      medicines: "Saline nasal drops & warm fluids",
      dosage: "2 drops morning & bedtime",
      status: "recovered",
      remedy: "Warm turmeric milk with a drop of organic honey"
    }
  ]);

  const [vaccinations, setVaccinations] = useState([
    { id: "vac-1", name: "MMR Booster Vaccine", age_due: "5-6 Years", status: "completed", date: "April 2026" },
    { id: "vac-2", name: "DPT Booster 2", age_due: "5-6 Years", status: "completed", date: "July 2026" },
    { id: "vac-3", name: "Typhoid Conjugate Booster", age_due: "6 Years", status: "upcoming", due_date: "November 2026" },
    { id: "vac-4", name: "Annual Flu Shot (Influenza)", age_due: "Annual", status: "upcoming", due_date: "December 2026" }
  ]);

  // Learn & Play State
  const [mannerStars, setMannerStars] = useState(12);
  const [activePlayMins, setActivePlayMins] = useState(45);
  const [sightWords, setSightWords] = useState([
    { word: 'Orbit', meaning: 'Planetary path' },
    { word: 'Stamina', meaning: 'Natural endurance energy' },
    { word: 'Telescope', meaning: 'Star viewing instrument' },
    { word: 'Curious', meaning: 'Eager to discover and learn' },
    { word: 'Twinkle', meaning: 'Gentle shining light' }
  ]);
  const [books, setBooks] = useState([
    { title: 'The Little Star Explorer', desc: 'Bedtime exploration of lunar mountains and constellations' },
    { title: 'Where Do Clouds Go to Sleep?', desc: 'Calm soothing rain cycle story with KOTL ambient audio' }
  ]);

  // Day-Wise Chat History State
  const [daysHistory, setDaysHistory] = useState([
    {
      id: "day-today",
      date: "2026-10-24",
      label: "Today",
      sublabel: "Oct 24, 2026",
      badge: "🌟 Live Active",
      turns: [
        {
          id: "turn-t1",
          time: "10:15 AM",
          child: { name: "Parth", source: "esp32", text: "Hello KOTL!" },
          kotl: { name: "KOTL", text: "Hello Parth! I am so happy to see you, buddy. How is your day going, champ?" }
        },
        {
          id: "turn-t2",
          time: "11:35 AM",
          child: { name: "Parth", source: "esp32", text: "KOTL, how do stars shine at night?" },
          kotl: { name: "KOTL", text: "Stars are huge glowing balls of bright gas, like giant friendly suns far away in space, Parth! They twinkle because their light travels across the sky to say hello to you!" }
        },
        {
          id: "turn-t3",
          time: "01:20 PM",
          child: { name: "Parth", source: "esp32", text: "I drew a rocket and cleaned up my colors!" },
          kotl: { name: "KOTL", text: "That is wonderful, Parth! What vibrant colors did you use for your rocket? And super proud of you for keeping your colors neatly in place, champ!" }
        }
      ]
    },
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
          child: { name: "Parth", source: "esp32", text: "Why do astronauts eat from special food bags in space?" },
          kotl: { name: "KOTL", text: "Because in space there is zero gravity, Parth! Food would float away into the air! Their bags keep delicious soup safe so they can eat like champions!" }
        },
        {
          id: "turn-y2",
          time: "08:15 PM",
          child: { name: "Parth", source: "esp32", text: "Mummy gave me green spinach soup! Will it give me superhero power?" },
          kotl: { name: "KOTL", text: "Yes, absolutely, champ! Green spinach is loaded with iron and healthy energy fuel! It makes your muscles strong and gives you immense running stamina!" }
        },
        {
          id: "turn-y3",
          time: "08:55 PM",
          child: { name: "Parth", source: "esp32", text: "It is 9 PM bedtime. Will you tell me a calm star story?" },
          kotl: { name: "KOTL", text: "Close your eyes, brave astronaut. High above our roof, the friendly stars are shining softly to guard your peaceful dreams. Sleep well, sweet dreams Parth!" }
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
          child: { name: "Parth", source: "esp32", text: "Can little sparrows fly higher than commercial airplanes?" },
          kotl: { name: "KOTL", text: "Sparrows love staying close to lovely gardens and trees where seeds grow! Airplanes have huge jet engines to fly way high in the sky where the air is very thin!" }
        },
        {
          id: "turn-o22-2",
          time: "06:10 PM",
          child: { name: "Parth", source: "esp32", text: "I helped Dadi carry her warm water bottle and said thank you!" },
          kotl: { name: "KOTL", text: "You are the sweetest, kindest boy, Parth! Helping Dadi and speaking with love makes your family's heart so bright and proud!" }
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
          child: { name: "Parth", source: "esp32", text: "How big is our sun compared to our Earth?" },
          kotl: { name: "KOTL", text: "Our sun is so enormous that more than one million Earths could fit right inside it, Parth! It is our planet's giant warm campfire in space!" }
        },
        {
          id: "turn-o20-2",
          time: "06:45 PM",
          child: { name: "Parth", source: "esp32", text: "I drank two big glasses of water after playing cricket!" },
          kotl: { name: "KOTL", text: "Super high-five, Parth! Pure water hydrates your muscles and keeps your brain crystal clear and energized for playground fun!" }
        }
      ]
    }
  ]);
  const [activeDayId, setActiveDayId] = useState('day-today');
  const [searchDialogueQuery, setSearchDialogueQuery] = useState('');
  const [testChatMessage, setTestChatMessage] = useState('');

  // Walkie-Talkie & Dialogue
  const [isRecording, setIsRecording] = useState(false);
  const [walkieStatus, setWalkieStatus] = useState('Tap to record a voice memo from Mummy or Papa');
  const [customMemoText, setCustomMemoText] = useState('');

  // Modals form states
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestCategory, setNewQuestCategory] = useState('School Project');
  const [newQuestGoal, setNewQuestGoal] = useState('');
  const [newQuestHint, setNewQuestHint] = useState('');
  const [newQuestBadge, setNewQuestBadge] = useState('⭐ Star Explorer');

  const [sickSymptom, setSickSymptom] = useState('');
  const [sickDoctor, setSickDoctor] = useState('Dr. A. Mehta, MD (Pediatrics)');
  const [sickMedicines, setSickMedicines] = useState('');
  const [sickStatus, setSickStatus] = useState('recovered');
  const [sickRemedy, setSickRemedy] = useState('');

  const [inputHeight, setInputHeight] = useState(116);
  const [inputWeight, setInputWeight] = useState(21.5);

  const [newVacName, setNewVacName] = useState('');
  const [newVacAge, setNewVacAge] = useState('6 Years');
  const [newVacStatus, setNewVacStatus] = useState('completed');
  const [newVacDate, setNewVacDate] = useState('October 2026');

  const [wbType, setWbType] = useState('word');
  const [wbTitle, setWbTitle] = useState('');
  const [wbDesc, setWbDesc] = useState('');

  const [playActivity, setPlayActivity] = useState('');
  const [playMinutes, setPlayMinutes] = useState(20);

  const playVoice = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-IN';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  const handleToggleQuest = (id) => {
    setQuests(prev => prev.map(q => q.id === id ? { ...q, status: q.status === 'completed' ? 'in_progress' : 'completed' } : q));
  };

  const handleAddQuest = (e) => {
    e.preventDefault();
    if (!newQuestTitle.trim()) return;
    const item = {
      id: 'q-' + Date.now(),
      title: newQuestTitle.trim(),
      category: newQuestCategory,
      goal: newQuestGoal.trim(),
      mentor_hints: newQuestHint ? [newQuestHint] : ['Think step-by-step with KOTL!'],
      status: 'in_progress',
      reward_badge: newQuestBadge || '⭐ Star Badge'
    };
    setQuests(prev => [item, ...prev]);
    setIsAssignQuestOpen(false);
    setNewQuestTitle('');
    setNewQuestGoal('');
    setNewQuestHint('');
  };

  const handleToggleVaccine = (id) => {
    setVaccinations(prev => prev.map(v => v.id === id ? { ...v, status: v.status === 'completed' ? 'upcoming' : 'completed' } : v));
  };

  const handleAddVaccine = (e) => {
    e.preventDefault();
    if (!newVacName.trim()) return;
    const item = {
      id: 'vac-' + Date.now(),
      name: newVacName.trim(),
      age_due: newVacAge,
      status: newVacStatus,
      date: newVacStatus === 'completed' ? newVacDate : null,
      due_date: newVacStatus === 'upcoming' ? newVacDate : null
    };
    setVaccinations(prev => [...prev, item]);
    setIsAddVaccineOpen(false);
    setNewVacName('');
  };

  const handleSaveVitals = (e) => {
    e.preventDefault();
    const h = Number(inputHeight);
    const w = Number(inputWeight);
    const bmi = Number((w / ((h / 100) * (h / 100))).toFixed(1));
    setVitals({ height: h, weight: w, bmi });
    setIsUpdateVitalsOpen(false);
  };

  const handleSaveSickness = (e) => {
    e.preventDefault();
    if (!sickSymptom.trim()) return;
    const item = {
      id: 'sick-' + Date.now(),
      date: 'Oct 24, 2026',
      symptom: sickSymptom.trim(),
      doctor: sickDoctor.trim(),
      medicines: sickMedicines.trim() || 'Prescribed fluids',
      dosage: 'As prescribed by doctor',
      status: sickStatus,
      remedy: sickRemedy.trim()
    };
    setSicknessLogs(prev => [item, ...prev]);
    setIsLogSicknessOpen(false);
    setSickSymptom('');
    setSickMedicines('');
  };

  const handleSaveMedicalId = (e) => {
    e.preventDefault();
    setIsEditMedicalIdOpen(false);
  };

  const handleSaveWordBook = (e) => {
    e.preventDefault();
    if (!wbTitle.trim()) return;
    if (wbType === 'word') {
      setSightWords(prev => [{ word: wbTitle.trim(), meaning: wbDesc.trim() || 'New Phonics Word' }, ...prev]);
    } else {
      setBooks(prev => [{ title: wbTitle.trim(), desc: wbDesc.trim() || 'Favorite storybook' }, ...prev]);
    }
    setIsAddWordBookOpen(false);
    setWbTitle('');
    setWbDesc('');
  };

  const handleSavePlay = (e) => {
    e.preventDefault();
    const mins = Number(playMinutes) || 20;
    setActivePlayMins(prev => prev + mins);
    setIsLogPlayOpen(false);
    setPlayActivity('');
  };

  const handleAwardStar = () => {
    setMannerStars(prev => prev + 1);
    playVoice('Super star for Parth! You are demonstrating wonderful manners!');
  };

  const handleSendTestChat = () => {
    if (!testChatMessage.trim()) return;
    const msg = testChatMessage.trim();
    setTestChatMessage('');

    const newTurn = {
      id: 'turn-test-' + Date.now(),
      time: 'Just now',
      child: { name: 'Parth', source: 'web_dashboard', text: msg },
      kotl: {
        name: 'KOTL',
        text: 'That is a brilliant thought, Parth! Let us explore and learn more about that together, champ!'
      }
    };

    setDaysHistory(prev => {
      const today = prev.find(d => d.id === 'day-today') || prev[0];
      const updatedToday = { ...today, turns: [...today.turns, newTurn] };
      return [updatedToday, ...prev.filter(d => d.id !== 'day-today')];
    });

    playVoice('That is a brilliant thought, Parth! Let us explore and learn more about that together, champ!');
  };

  const handleToggleWalkie = () => {
    if (!isRecording) {
      setIsRecording(true);
      setWalkieStatus('● Recording Voice Memo... Tap again to transmit');
    } else {
      setIsRecording(false);
      setWalkieStatus('✓ Audio memo transmitted to KOTL speaker!');
      setTimeout(() => setWalkieStatus('Tap to record a voice memo from Mummy or Papa'), 4000);
    }
  };

  const sendPresetVoice = (preset, text) => {
    playVoice(text);
    alert('Transmitted "' + preset + '" to KOTL speaker!');
  };

  const sendCustomVoice = () => {
    if (!customMemoText.trim()) return;
    playVoice(customMemoText.trim());
    setCustomMemoText('');
    alert('Speaking memo through KOTL!');
  };

  const activeDay = daysHistory.find(d => d.id === activeDayId) || daysHistory[0];
  const filteredTurns = (activeDay && activeDay.turns) ? activeDay.turns.filter(t => {
    if (!searchDialogueQuery.trim()) return true;
    const q = searchDialogueQuery.toLowerCase();
    return (t.child && t.child.text && t.child.text.toLowerCase().includes(q)) ||
           (t.kotl && t.kotl.text && t.kotl.text.toLowerCase().includes(q));
  }) : [];

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-800 font-sans selection:bg-amber-200">
      
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 border-2 border-amber-500 flex items-center justify-center text-2xl shadow-xs">
              🧒
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-fredoka text-lg sm:text-xl font-bold tracking-tight text-slate-800">KOTL</span>
                <span className="text-[10px] font-fredoka font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                  Kindergarten v2.2
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Parth's AI Companion & Pediatric Cockpit</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div id="deviceStatusPill" className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-full font-bold border border-emerald-300 flex items-center gap-2 shadow-xs whitespace-nowrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>• ESP32 Live</span>
            </div>
            <button onClick={() => setIsQuotaModalOpen(true)} className="hidden sm:flex items-center gap-1 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl transition-all shadow-2xs">
              <span>⚡</span><span>Groq: 14,380 Left</span>
            </button>
            <button onClick={() => setIsProfileModalOpen(true)} className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-all shadow-2xs">
              <span>⚙️</span><span className="hidden md:inline">Child Profile</span>
            </button>
          </div>
        </div>
      </header>

      {/* 5 DEDICATED SUPER-HUB TABS */}
      <div className="section-nav-bar relative z-20 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-2 pb-2">
        <div className="bg-amber-50/90 backdrop-blur-sm border-2 border-amber-200 rounded-2xl p-1.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shadow-xs">
          <button onClick={() => setCurrentSection('report')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'report' ? 'bg-[#0284C7] text-white shadow-md' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>📜</span><span>School Report</span>
          </button>
          <button onClick={() => setCurrentSection('quests')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'quests' ? 'bg-[#0284C7] text-white shadow-md' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>🧭</span><span>Mentor Quests</span>
          </button>
          <button onClick={() => setCurrentSection('growth')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'growth' ? 'bg-[#0284C7] text-white shadow-md' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>🎨</span><span>Learn & Play</span>
          </button>
          <button onClick={() => setCurrentSection('health')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'health' ? 'bg-[#0284C7] text-white shadow-md' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>🏥</span><span>Health Passport</span>
          </button>
          <button onClick={() => setCurrentSection('parent')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'parent' ? 'bg-[#0284C7] text-white shadow-md' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>🎙️</span><span>Parent & Voice</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEW CONTENT (BENTO COCKPIT) */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-2 pb-24">

        {/* SECTION 1: SCHOOL REPORT */}
        {currentSection === 'report' && (
          <div className="space-y-5">
            <div className="relative overflow-hidden bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-[32px] p-6 text-white shadow-md border-3 border-amber-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-18 h-18 rounded-3xl bg-white/20 border-2 border-white/50 flex items-center justify-center text-4xl shadow-inner">
                    🧒
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-fredoka text-2xl sm:text-3xl font-bold">{profile.name}</h2>
                      <span className="bg-white/25 text-white text-xs font-bold px-3 py-1 rounded-full border border-white/40">
                        Senior KG (KG-2)
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-50 font-medium">
                      {profile.age} Years Old • Boy • Bedtime: <strong>09:00 PM</strong> • Academic Term 2026
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/15 rounded-2xl p-3.5 border border-white/30">
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase text-amber-100">Overall Grade</div>
                    <div className="font-fredoka text-3xl font-bold text-white">A+</div>
                    <div className="text-[10px] text-amber-100">(89/100 • Advanced)</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-fredoka text-lg font-bold text-slate-800">📋 Kindergarten Developmental Marksheet</h3>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">Official Term</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-slate-400 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">Subject / Domain</th>
                        <th className="py-2 px-3">Key Observation</th>
                        <th className="py-2 px-3">Score</th>
                        <th className="py-2 px-3">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      <tr>
                        <td className="py-2.5 px-3 font-bold">🔤 English & Phonics</td>
                        <td className="py-2.5 px-3 text-slate-500">Learned 30+ multisyllabic terms ('orbit', 'stamina')</td>
                        <td className="py-2.5 px-3 font-bold text-sky-700">88/100</td>
                        <td className="py-2.5 px-3"><span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">A+</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold">🔬 Curiosity & STEM</td>
                        <td className="py-2.5 px-3 text-slate-500">Profound 'why' questions regarding planetary orbits</td>
                        <td className="py-2.5 px-3 font-bold text-purple-700">94/100</td>
                        <td className="py-2.5 px-3"><span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">A+</span></td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold">❤️ Emotional & Empathy</td>
                        <td className="py-2.5 px-3 text-slate-500">Polite turn-taking, cheerful respect for elders</td>
                        <td className="py-2.5 px-3 font-bold text-rose-700">90/100</td>
                        <td className="py-2.5 px-3"><span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">A+</span></td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-fredoka text-xs font-bold text-slate-800">1-Minute AI Audio Briefing</h4>
                      <p className="text-[11px] text-slate-500">Executive voice summary of Parth's cognitive progress</p>
                    </div>
                    <button onClick={() => playVoice("Parth had an extraordinary learning day! His cognitive curiosity reached ninety-four percent, asking advanced questions about planetary orbits and space exploration. He also demonstrated polite conversational turn taking with family.")} className="px-3 py-1.5 bg-sky-500 text-white font-fredoka font-bold text-xs rounded-xl shadow-xs">
                      ▶ Play Briefing
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <h3 className="font-fredoka text-lg font-bold text-slate-800 border-b pb-2">🧠 Core Skill Analytics</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold"><span>Curiosity & STEM</span><span className="text-purple-600">94%</span></div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full"><div className="bg-purple-500 h-full rounded-full" style={{ width: '94%' }}></div></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold"><span>English Vocabulary</span><span className="text-sky-600">88%</span></div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full"><div className="bg-sky-500 h-full rounded-full" style={{ width: '88%' }}></div></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold"><span>Emotional Kindness</span><span className="text-rose-600">90%</span></div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full"><div className="bg-rose-500 h-full rounded-full" style={{ width: '90%' }}></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: MENTOR QUESTS */}
        {currentSection === 'quests' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-[32px] p-6 text-white shadow-md border-3 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-fredoka text-xl sm:text-2xl font-bold">AI Socratic Mentor Quests</h2>
                <p className="text-xs text-amber-100">KOTL guides Parth step-by-step through school tasks & curiosity projects</p>
              </div>
              <button onClick={() => setIsAssignQuestOpen(true)} className="px-4 py-2 bg-white text-amber-900 rounded-xl font-fredoka font-bold text-xs shadow-sm">
                ➕ Assign New Quest
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 space-y-4">
                {quests.map(q => {
                  const isDone = q.status === 'completed';
                  return (
                    <div key={q.id} className={`p-4 rounded-3xl border-2 transition-all ${isDone ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-amber-200'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{isDone ? '🏆' : '🧭'}</span>
                            <h3 className="font-fredoka text-base font-bold text-slate-800">{q.title}</h3>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{q.goal}</p>
                        </div>
                        <button onClick={() => handleToggleQuest(q.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                          {isDone ? '✓ Completed' : 'Mark Done'}
                        </button>
                      </div>
                      {q.mentor_hints && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 text-xs text-slate-700 space-y-0.5">
                          <strong>🤖 KOTL Socratic Prompts:</strong>
                          <ul className="list-disc pl-4">{q.mentor_hints.map((h, i) => <li key={i}>{h}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <h3 className="font-fredoka text-base font-bold text-slate-800 border-b pb-2">🏆 Badge Hall of Fame</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-center">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">🌱 <strong>Master Botanist</strong></div>
                    <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">🚀 <strong>Space Commander</strong></div>
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">💖 <strong>Kindness Champion</strong></div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">🥦 <strong>Stamina Star</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: LEARN & PLAY */}
        {currentSection === 'growth' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[32px] p-6 text-white shadow-md border-3 border-emerald-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-fredoka text-xl sm:text-2xl font-bold">Learn & Play (360° Life Growth)</h2>
                <p className="text-xs text-emerald-100">Literacy phonics, 60m active sports play, and social manners</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsAddWordBookOpen(true)} className="px-3 py-1.5 bg-white text-emerald-900 rounded-xl font-fredoka font-bold text-xs">
                  ➕ Add Word / Book
                </button>
                <button onClick={() => setIsLogPlayOpen(true)} className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl font-fredoka font-bold text-xs">
                  ⚽ Log Play Time
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6 space-y-5">
                <div className="bg-white border-2 border-emerald-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <h3 className="font-fredoka text-base font-bold text-slate-800 border-b pb-2">🔤 English Phonics Words</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {sightWords.map((w, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center">
                        <div><strong>{w.word}</strong><div className="text-[10px] text-slate-500">{w.meaning}</div></div>
                        <button onClick={() => playVoice(w.word)} className="text-emerald-700">🔊</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-5">
                <div className="bg-white border-2 border-emerald-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-fredoka text-base font-bold text-slate-800">⚽ Physical Movement Goal</h3>
                    <button onClick={() => setIsLogPlayOpen(true)} className="text-xs font-bold text-emerald-700">+ Log Play</button>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-2xl flex items-center justify-between">
                    <div>
                      <strong>{activePlayMins} of 60 Minutes Active Today</strong>
                      <p className="text-xs text-slate-600">High physical stamina from cricket & cycling</p>
                    </div>
                    <span className="font-fredoka text-xl font-bold text-emerald-800">{activePlayMins}m</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-slate-700">⭐ {mannerStars} Manner Stars Earned</span>
                    <button onClick={handleAwardStar} className="px-3 py-1 bg-amber-400 font-bold text-xs rounded-xl shadow-2xs">Award Manner Star</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: HEALTH PASSPORT */}
        {currentSection === 'health' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-[32px] p-6 text-white shadow-md border-3 border-rose-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-fredoka text-xl sm:text-2xl font-bold">Child Health Passport</h2>
                <p className="text-xs text-rose-100">Emergency medical profile, sickness log, vaccines & vitals</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsEditMedicalIdOpen(true)} className="px-3 py-1.5 bg-white text-rose-900 rounded-xl font-fredoka font-bold text-xs">
                  ✏️ Edit ID
                </button>
                <button onClick={() => setIsLogSicknessOpen(true)} className="px-3 py-1.5 bg-rose-700 text-white rounded-xl font-fredoka font-bold text-xs">
                  ➕ Log Sickness
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6 space-y-5">
                <div className="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-fredoka text-base font-bold text-slate-800">🚨 Emergency Medical Identification</h3>
                    <button onClick={() => setIsEditMedicalIdOpen(true)} className="text-xs text-rose-700 font-bold">✏️ Edit</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-rose-50 rounded-xl">
                      <span className="text-[10px] text-rose-900 font-bold uppercase">Blood Group</span>
                      <div className="font-fredoka text-xl text-rose-700 font-bold">{medicalId.blood_group}</div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl">
                      <span className="text-[10px] text-amber-900 font-bold uppercase">Allergies</span>
                      <div className="text-[11px] font-bold text-amber-900">{medicalId.allergies}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <strong>{medicalId.pediatrician_name}</strong>
                      <div className="text-[11px] text-slate-500">{medicalId.clinic}</div>
                    </div>
                    <a href={"tel:" + medicalId.phone.replace(/\\s+/g, '')} className="px-3 py-1 bg-emerald-500 text-white font-bold rounded-xl text-xs">📞 Call</a>
                  </div>
                </div>

                <div className="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-fredoka text-base font-bold text-slate-800">🤒 Sickness & Medicine History</h3>
                    <button onClick={() => setIsLogSicknessOpen(true)} className="text-xs text-rose-700 font-bold">+ Log</button>
                  </div>
                  {sicknessLogs.map(s => (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>{s.symptom}</span>
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[10px]">Recovered ✓</span>
                      </div>
                      <div className="text-slate-500">Doctor: {s.doctor}</div>
                      <div>Medicines: <strong className="text-rose-900">{s.medicines}</strong></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 space-y-5">
                <div className="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-fredoka text-base font-bold text-slate-800">💉 Vaccination Tracker</h3>
                    <button onClick={() => setIsAddVaccineOpen(true)} className="text-xs text-rose-700 font-bold">+ Add</button>
                  </div>
                  {vaccinations.map(v => (
                    <div key={v.id} className="p-2.5 rounded-xl border flex justify-between items-center text-xs">
                      <div>
                        <strong>{v.name}</strong>
                        <div className="text-[10px] text-slate-500">{v.status === 'completed' ? ('Done: ' + v.date) : ('Due: ' + (v.due_date || 'Upcoming'))}</div>
                      </div>
                      <button onClick={() => handleToggleVaccine(v.id)} className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${v.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                        {v.status === 'completed' ? 'Done ✓' : 'Mark Done'}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-fredoka text-base font-bold text-slate-800">📏 Vitals</h3>
                    <button onClick={() => setIsUpdateVitalsOpen(true)} className="text-xs text-rose-700 font-bold">✏️ Update</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl">Height: <strong>{vitals.height} cm</strong></div>
                    <div className="p-3 bg-slate-50 rounded-xl">Weight: <strong>{vitals.weight} kg</strong></div>
                    <div className="p-3 bg-emerald-50 rounded-xl">BMI: <strong>{vitals.bmi}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: PARENT HUB & DAY-WISE CHAT HISTORY */}
        {currentSection === 'parent' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-[32px] p-6 text-white shadow-md border-3 border-sky-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-fredoka text-xl sm:text-2xl font-bold">Parent Hub & Voice Operations</h2>
                <p className="text-xs text-sky-100">Live walkie mic, talk curfews, safety guardrails & day-wise chat archive</p>
              </div>
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">MAX98357A I2S Active</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Col: Walkie Transmitter & Controls */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white border-2 border-sky-300 rounded-[32px] p-5 shadow-sm space-y-3">
                  <h3 className="font-fredoka text-base font-bold text-slate-800">🎙️ Walkie-Talkie Mic</h3>
                  <div className="p-4 rounded-2xl bg-sky-50 text-center space-y-3">
                    <button onClick={handleToggleWalkie} className={`w-16 h-16 rounded-full text-2xl mx-auto flex items-center justify-center text-white transition-all ${isRecording ? 'bg-rose-500 scale-110 animate-pulse' : 'bg-sky-500'}`}>
                      🎙️
                    </button>
                    <div className="text-xs font-bold text-slate-700">{walkieStatus}</div>
                    
                    {/* Presets */}
                    <div className="grid grid-cols-2 gap-2 text-left">
                      <button onClick={() => sendPresetVoice('Drink Water', 'Parth beta, drink your fresh glass of water and stay energized!')} className="p-2 bg-white rounded-xl text-xs font-bold border border-sky-200">💧 Drink Water</button>
                      <button onClick={() => sendPresetVoice('Lunch Greens', 'Parth, remember your superhero green veggies for stamina!')} className="p-2 bg-white rounded-xl text-xs font-bold border border-amber-200">🥦 Eat Greens</button>
                      <button onClick={() => sendPresetVoice('Pack Toys', 'Time to place toys neatly back into the organizer box, champion!')} className="p-2 bg-white rounded-xl text-xs font-bold border border-emerald-200">🧸 Pack Toys</button>
                      <button onClick={() => sendPresetVoice('Bedtime Hug', 'Bedtime soon champ! Let us listen to KOTL star story and sleep on time.')} className="p-2 bg-white rounded-xl text-xs font-bold border border-purple-200">🌙 Bedtime Hug</button>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <input type="text" value={customMemoText} onChange={e => setCustomMemoText(e.target.value)} placeholder="Type voice memo..." className="flex-1 text-xs px-3 py-2 rounded-xl border bg-white" />
                      <button onClick={sendCustomVoice} className="bg-sky-500 text-white font-bold text-xs px-4 py-2 rounded-xl">Speak</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-2 border-slate-200 rounded-[32px] p-5 shadow-sm space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <strong>Daily Talk Time Limit:</strong>
                    <span className="font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">30 Mins / Day</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <strong>Strict Bedtime Curfew:</strong>
                    <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">09:00 PM</span>
                  </div>
                </div>
              </div>

              {/* Right Col: 📅 DAY-WISE COMPANION DIALOGUE ARCHIVE */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white border-2 border-indigo-200 rounded-[32px] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                    <div>
                      <h3 className="font-fredoka text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span>📅 Day-Wise Dialogue Archive</span>
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{activeDay ? activeDay.label : 'Today'}</span>
                      </h3>
                      <p className="text-xs text-slate-500">Every conversation turn between Parth & KOTL organized by day</p>
                    </div>
                    <input type="text" placeholder="Search conversations..." value={searchDialogueQuery} onChange={e => setSearchDialogueQuery(e.target.value)} className="text-xs px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 focus:bg-white" />
                  </div>

                  {/* Date Selector Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {daysHistory.map(day => (
                      <button key={day.id} onClick={() => setActiveDayId(day.id)} className={`px-3 py-1.5 rounded-xl text-xs font-fredoka font-bold flex items-center gap-1.5 whitespace-nowrap ${activeDayId === day.id ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-900 border border-indigo-200'}`}>
                        <span>{day.label === 'Today' ? '🌟' : '📅'}</span>
                        <span>{day.label}</span>
                        <span className="text-[10px] opacity-80">({day.turns ? day.turns.length : 0})</span>
                      </button>
                    ))}
                  </div>

                  {/* Dialogue Turns Feed */}
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {filteredTurns.map((turn, idx) => (
                      <div key={turn.id || idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <div className="flex justify-between text-[11px] text-slate-400 font-semibold border-b pb-1">
                          <span>Turn #{idx + 1} • {turn.time}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">{turn.child?.source === 'web_dashboard' ? '💻 Web Chat' : '🎙️ Mic Input (ESP32)'}</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-amber-200 flex items-center justify-center text-xs">🧒</div>
                          <div className="flex-1 bg-amber-50 p-2.5 rounded-xl text-xs text-slate-800">
                            <strong className="text-amber-900 text-[10px] uppercase block">Parth:</strong>
                            {turn.child?.text}
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 pl-4">
                          <div className="w-7 h-7 rounded-full bg-sky-200 flex items-center justify-center text-xs">🤖</div>
                          <div className="flex-1 bg-sky-50 p-2.5 rounded-xl text-xs text-slate-800">
                            <div className="flex justify-between items-center mb-0.5">
                              <strong className="text-sky-900 text-[10px] uppercase">KOTL:</strong>
                              <button onClick={() => playVoice(turn.kotl?.text || '')} className="text-[10px] font-bold bg-sky-500 text-white px-2 py-0.5 rounded-md">▶ Listen</button>
                            </div>
                            {turn.kotl?.text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Parent Simulation Console */}
                  <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center gap-2">
                    <input type="text" value={testChatMessage} onChange={e => setTestChatMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSendTestChat(); }} placeholder="Type a test question as Parth (e.g. 'What is a comet?')..." className="flex-1 text-xs px-3 py-2 rounded-xl border border-indigo-200 bg-white" />
                    <button onClick={handleSendTestChat} className="px-3.5 py-2 bg-indigo-600 text-white font-fredoka font-bold text-xs rounded-xl whitespace-nowrap">
                      Send 🚀
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FIXED MOBILE BOTTOM NAVIGATION */}
      <nav id="mobileBottomNav" className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-2 border-amber-200 py-2 px-2 flex justify-around items-center z-50 lg:hidden shadow-lg">
        <button onClick={() => setCurrentSection('report')} className={`flex flex-col items-center font-bold text-[10px] ${currentSection === 'report' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">📜</span><span>Report</span>
        </button>
        <button onClick={() => setCurrentSection('quests')} className={`flex flex-col items-center font-bold text-[10px] ${currentSection === 'quests' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">🧭</span><span>Quests</span>
        </button>
        <button onClick={() => setCurrentSection('growth')} className={`flex flex-col items-center font-bold text-[10px] ${currentSection === 'growth' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">🎨</span><span>Learn</span>
        </button>
        <button onClick={() => setCurrentSection('health')} className={`flex flex-col items-center font-bold text-[10px] ${currentSection === 'health' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">🏥</span><span>Health</span>
        </button>
        <button onClick={() => setCurrentSection('parent')} className={`flex flex-col items-center font-bold text-[10px] ${currentSection === 'parent' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">🎙️</span><span>Parent</span>
        </button>
      </nav>

      {/* MODALS */}
      {/* 1. Profile Modal */}
      {isProfileModalOpen && (
        <div id="childProfileModal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl relative space-y-3">
            <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold">✕</button>
            <h2 className="font-fredoka text-lg font-bold text-slate-800">Child Profile & Safety Settings</h2>
            <div className="space-y-2 text-xs font-semibold">
              <div><label>Name</label><input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl border" /></div>
              <div><label>Age</label><input type="number" value={profile.age} onChange={e => setProfile(p => ({ ...p, age: parseInt(e.target.value, 10) }))} className="w-full px-3 py-2 rounded-xl border" /></div>
              <button onClick={() => setIsProfileModalOpen(false)} className="w-full py-2 bg-amber-500 text-white font-bold rounded-xl font-fredoka">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Quota Modal */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 space-y-3 bg-white border-2 border-amber-300 rounded-[32px] shadow-2xl relative text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 font-fredoka">Groq API Quota</h3>
              <button onClick={() => setIsQuotaModalOpen(false)}>✕</button>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl space-y-1">
              <div>Daily Requests: <strong>14,380 Left</strong></div>
              <div>Tokens Per Min: <strong>598,200 Left</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Assign Quest Modal */}
      {isAssignQuestOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddQuest} className="bg-white border-2 border-amber-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-3 text-xs font-semibold">
            <h3 className="font-fredoka text-lg font-bold text-slate-800">Assign Socratic Quest</h3>
            <div><label>Title</label><input type="text" value={newQuestTitle} onChange={e => setNewQuestTitle(e.target.value)} required className="w-full p-2 border rounded-xl" /></div>
            <div><label>Category</label><select value={newQuestCategory} onChange={e => setNewQuestCategory(e.target.value)} className="w-full p-2 border rounded-xl"><option value="School Project">School Project</option><option value="Life Skill">Life Skill</option><option value="Family Kindness">Family Kindness</option></select></div>
            <div><label>Goal</label><input type="text" value={newQuestGoal} onChange={e => setNewQuestGoal(e.target.value)} className="w-full p-2 border rounded-xl" /></div>
            <div><label>KOTL Mentor Hint</label><input type="text" value={newQuestHint} onChange={e => setNewQuestHint(e.target.value)} className="w-full p-2 border rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsAssignQuestOpen(false)}>Cancel</button><button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-xl">Assign</button></div>
          </form>
        </div>
      )}

      {/* 4. Edit Medical ID Modal */}
      {isEditMedicalIdOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveMedicalId} className="bg-white border-2 border-rose-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-3 text-xs font-semibold">
            <h3 className="font-fredoka text-lg font-bold text-slate-800">Edit Emergency Medical ID</h3>
            <div><label>Blood Group</label><input type="text" value={medicalId.blood_group} onChange={e => setMedicalId(p => ({ ...p, blood_group: e.target.value }))} className="w-full p-2 border rounded-xl" /></div>
            <div><label>Allergies</label><input type="text" value={medicalId.allergies} onChange={e => setMedicalId(p => ({ ...p, allergies: e.target.value }))} className="w-full p-2 border rounded-xl" /></div>
            <div><label>Pediatrician</label><input type="text" value={medicalId.pediatrician_name} onChange={e => setMedicalId(p => ({ ...p, pediatrician_name: e.target.value }))} className="w-full p-2 border rounded-xl" /></div>
            <div><label>Phone</label><input type="text" value={medicalId.phone} onChange={e => setMedicalId(p => ({ ...p, phone: e.target.value }))} className="w-full p-2 border rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsEditMedicalIdOpen(false)}>Cancel</button><button type="submit" className="px-4 py-2 bg-rose-500 text-white rounded-xl">Save</button></div>
          </form>
        </div>
      )}

      {/* 5. Sickness Modal */}
      {isLogSicknessOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveSickness} className="bg-white border-2 border-rose-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-3 text-xs font-semibold">
            <h3 className="font-fredoka text-lg font-bold text-slate-800">Log Sickness Episode</h3>
            <div><label>Symptom</label><input type="text" value={sickSymptom} onChange={e => setSickSymptom(e.target.value)} required className="w-full p-2 border rounded-xl" /></div>
            <div><label>Medicines & Dosage</label><input type="text" value={sickMedicines} onChange={e => setSickMedicines(e.target.value)} className="w-full p-2 border rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsLogSicknessOpen(false)}>Cancel</button><button type="submit" className="px-4 py-2 bg-rose-500 text-white rounded-xl">Save</button></div>
          </form>
        </div>
      )}

      {/* 6. Vitals Modal */}
      {isUpdateVitalsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveVitals} className="bg-white border-2 border-rose-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-3 text-xs font-semibold">
            <h3 className="font-fredoka text-lg font-bold text-slate-800">Update Height & Weight</h3>
            <div><label>Height (cm)</label><input type="number" step="0.5" value={inputHeight} onChange={e => setInputHeight(e.target.value)} className="w-full p-2 border rounded-xl" /></div>
            <div><label>Weight (kg)</label><input type="number" step="0.1" value={inputWeight} onChange={e => setInputWeight(e.target.value)} className="w-full p-2 border rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsUpdateVitalsOpen(false)}>Cancel</button><button type="submit" className="px-4 py-2 bg-rose-500 text-white rounded-xl">Save</button></div>
          </form>
        </div>
      )}

      {/* 7. Add Vaccine Modal */}
      {isAddVaccineOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddVaccine} className="bg-white border-2 border-rose-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-3 text-xs font-semibold">
            <h3 className="font-fredoka text-lg font-bold text-slate-800">Add Vaccine</h3>
            <div><label>Name</label><input type="text" value={newVacName} onChange={e => setNewVacName(e.target.value)} required className="w-full p-2 border rounded-xl" /></div>
            <div><label>Date / Due Date</label><input type="text" value={newVacDate} onChange={e => setNewVacDate(e.target.value)} className="w-full p-2 border rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsAddVaccineOpen(false)}>Cancel</button><button type="submit" className="px-4 py-2 bg-rose-500 text-white rounded-xl">Add</button></div>
          </form>
        </div>
      )}

      {/* 8. Add Word / Book Modal */}
      {isAddWordBookOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveWordBook} className="bg-white border-2 border-emerald-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-3 text-xs font-semibold">
            <h3 className="font-fredoka text-lg font-bold text-slate-800">Add Word or Book</h3>
            <div><label>Type</label><select value={wbType} onChange={e => setWbType(e.target.value)} className="w-full p-2 border rounded-xl"><option value="word">🔤 Phonics Word</option><option value="book">📖 Storybook</option></select></div>
            <div><label>Title / Word</label><input type="text" value={wbTitle} onChange={e => setWbTitle(e.target.value)} required className="w-full p-2 border rounded-xl" /></div>
            <div><label>Description / Meaning</label><input type="text" value={wbDesc} onChange={e => setWbDesc(e.target.value)} className="w-full p-2 border rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsAddWordBookOpen(false)}>Cancel</button><button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded-xl">Add</button></div>
          </form>
        </div>
      )}

      {/* 9. Log Play Time Modal */}
      {isLogPlayOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSavePlay} className="bg-white border-2 border-emerald-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-3 text-xs font-semibold">
            <h3 className="font-fredoka text-lg font-bold text-slate-800">Log Physical Play Time</h3>
            <div><label>Activity</label><input type="text" value={playActivity} onChange={e => setPlayActivity(e.target.value)} placeholder="Cricket, Running, Cycling..." required className="w-full p-2 border rounded-xl" /></div>
            <div><label>Minutes Played</label><input type="number" min="5" max="180" value={playMinutes} onChange={e => setPlayMinutes(e.target.value)} className="w-full p-2 border rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsLogPlayOpen(false)}>Cancel</button><button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded-xl">Save</button></div>
          </form>
        </div>
      )}

    </div>
  );
}
