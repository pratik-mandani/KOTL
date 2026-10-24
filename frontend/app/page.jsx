'use client';

import React, { useState } from 'react';

export default function KindergartenHubPage() {
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
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [deviceVolume, setDeviceVolume] = useState(75);
  const [isSleepMode, setIsSleepMode] = useState(false);
  const [isSosActive, setIsSosActive] = useState(false);
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    name: 'Parth',
    age: 6,
    gender: 'boy',
    bedtime: '21:00',
    school_grade: 'Senior KG',
    pediatrician_name: 'Dr. A. Mehta, MD (Pediatrics)'
  });

  // Quests State
  const [quests, setQuests] = useState([
    {
      id: 'quest-plant-science',
      title: 'Watering & Observing Home Basil Plant',
      category: 'School Project',
      goal: 'Observe how leaves drink water and describe the capillary action to KOTL.',
      status: 'active',
      mentor_hints: [
        'Parth, why do you think leaves turn green when they drink morning sunshine?',
        'Look closely at the leaf veins! They are like tiny straws drinking water!'
      ],
      badge: '🌱 Master Botanist'
    },
    {
      id: 'quest-solar-rocket',
      title: 'Solar System Rocket Model Assembly',
      category: 'Curiosity Challenge',
      goal: 'Arrange planets by distance from the Sun with cardboard and colors.',
      status: 'active',
      mentor_hints: [
        'Which planet is the biggest giant with beautiful rings?',
        'How fast does our rocket need to go to orbit the earth?'
      ],
      badge: '🚀 Space Commander'
    },
    {
      id: 'quest-dadi-kindness',
      title: 'Dadi Companion: Evening Glass of Warm Water',
      category: 'Family Care',
      goal: 'Politely ask Dadi how her day was and bring her evening water.',
      status: 'completed',
      mentor_hints: [
        'A warm smile and a polite voice makes Dadi\'s heart so happy!'
      ],
      badge: '💖 Kindness Champion'
    }
  ]);

  // Emergency Medical State
  const [medicalId, setMedicalId] = useState({
    blood_group: 'B+',
    allergies: 'None Known (Peanut safe)',
    pediatrician_name: 'Dr. A. Mehta, MD (Pediatrics)',
    phone: '+91 98250 12345',
    clinic: 'Mehta Pediatric Care & Child Wellness Clinic, Ahmedabad'
  });

  const [vitals, setVitals] = useState({ height: 116, weight: 21.5, bmi: 15.9 });
  const [sicknessLogs, setSicknessLogs] = useState([
    {
      id: 'sick-1',
      date: '2026-10-18',
      symptom: 'Mild Seasonal Cough & Throat tickle',
      medicines: 'Warm honey-ginger water, Pediatric saline gargle',
      doctor: 'Dr. A. Mehta, MD (Pediatrics)',
      status: 'recovered',
      remedy: 'Warm steam inhalation before bedtime for 2 consecutive nights'
    }
  ]);

  const [vaccinations, setVaccinations] = useState([
    { id: 'v-1', name: 'MMR Booster (Measles, Mumps, Rubella)', age: '5-6 Years', status: 'completed', date: 'August 2026' },
    { id: 'v-2', name: 'DPT Booster (Diphtheria, Pertussis, Tetanus)', age: '5-6 Years', status: 'completed', date: 'August 2026' },
    { id: 'v-3', name: 'Annual Pediatric Flu Vaccine', age: '6 Years', status: 'due', date: 'November 2026' }
  ]);

  // Habits State
  const [goodHabits, setGoodHabits] = useState([
    { id: 'gh-1', icon: '🪥', title: 'Brushing Teeth Twice Daily', desc: 'Cheerfully wakes up at 7:30 AM and brushes with morning song reminder.', status: 'Established ✓' },
    { id: 'gh-2', icon: '🧸', title: 'Tidying Up Study Desk & Toy Box', desc: 'Sorts color crayons and places storybooks neatly in order after study.', status: 'Established ✓' },
    { id: 'gh-3', icon: '💧', title: 'Drinking Fresh Water After Play', desc: 'Drinks 2 full glasses of clean water after cricket games to maintain stamina.', status: 'Daily Habit ✓' },
    { id: 'gh-4', icon: '🤝', title: 'Polite Turn-Taking & Respect for Dadi', desc: 'Says \'Please\' and \'Thank you\' cheerfully; carried warm water bottle for Dadi.', status: '12 Stars ⭐' },
    { id: 'gh-5', icon: '🔭', title: 'Asking Independent Science Questions', desc: 'Explores \'why\' stars shine and how gravity works instead of passive screen viewing.', status: '94% Curiosity ✓' }
  ]);

  const [badHabits, setBadHabits] = useState([
    { id: 'bh-1', icon: '🥦', title: 'Eating Green Vegetables (Spinach & Broccoli)', reluctance: 'Tends to push green vegetables away at lunch.', strategy: 'Shares fun superhero stories about natural stamina fuel from carrots & spinach without lecturing. Parth now takes 2 test bites!', status: 'In Progress ⏳' },
    { id: 'bh-2', icon: '📱', title: 'Mobile Video Screen Time Reluctance', reluctance: 'Asks for mobile screen videos before evening bedtime.', strategy: 'Replaces screen time with 20 minutes creative drawing and interactive star story quests.', status: 'In Training ⏳' },
    { id: 'bh-3', icon: '🌙', title: 'Consistent 09:00 PM Bedtime Wind-Down', reluctance: 'Wants to prolong playtime past 9:00 PM.', strategy: 'KOTL starts soft lullaby & constellation bedtime audio at 8:45 PM. Smooth transition to sleep!', status: 'Curfew Active 🌙' },
    { id: 'bh-4', icon: '🌑', title: 'Reluctance to Sleep in Dark Bedroom', reluctance: 'Feels anxious when night lights are turned completely off.', strategy: 'KOTL reminds him of friendly twinkling stars keeping silent watch over brave space explorers.', status: 'Comfort Mode 🛡️' }
  ]);

  const [mannerStars, setMannerStars] = useState(12);
  const [activePlayMins, setActivePlayMins] = useState(45);
  const [sightWords, setSightWords] = useState([
    { word: 'Orbit', meaning: 'Path of a planet around the sun' },
    { word: 'Stamina', meaning: 'Energy and strength for active play' },
    { word: 'Gravity', meaning: 'Invisible force keeping our feet on earth' },
    { word: 'Telescope', meaning: 'Special tool to see distant night stars' }
  ]);
  const [books, setBooks] = useState([
    { title: 'The Little Boy Who Traveled to the Moon', pages: '24 Pages', status: 'Completed' },
    { title: 'Curious Seeds: How Tiny Roots Grow', pages: '18 Pages', status: 'In Progress' }
  ]);

  // Day-Wise Chat History State
  const [daysHistory, setDaysHistory] = useState([
    {
      id: 'day-today',
      date: '2026-10-24',
      label: 'Today',
      turns: [
        {
          id: 'turn-t1',
          time: '10:15 AM',
          child: { text: 'KOTL, how do stars shine at night, and can we fly a rocket to the moon?', source: 'mic' },
          kotl: { text: 'Stars are giant glowing suns far away in space, Parth! They twinkle to say hello to you! With a big rocket, astronauts travel through zero gravity to land on the moon! Would you like to build our own cardboard rocket today?' }
        },
        {
          id: 'turn-t2',
          time: '04:30 PM',
          child: { text: 'I drank two glasses of water after cycling with papa!', source: 'mic' },
          kotl: { text: 'Super job, Parth! Drinking fresh water recharges your superhero stamina! Your muscles and brain love staying hydrated after cycling!' }
        }
      ]
    },
    {
      id: 'day-yesterday',
      date: '2026-10-23',
      label: 'Yesterday',
      turns: [
        {
          id: 'turn-y1',
          time: '11:20 AM',
          child: { text: 'KOTL, why do leaves turn yellow in autumn?', source: 'mic' },
          kotl: { text: 'When weather gets cooler, trees rest and save energy for winter, so chlorophyll takes a nap and reveals gorgeous golden colors!' }
        },
        {
          id: 'turn-y2',
          time: '08:45 PM',
          child: { text: 'Can you tell me a bedtime story about the brave astronaut?', source: 'mic' },
          kotl: { text: 'Once upon a time, Captain Parth steered his silver spaceship past the glittering rings of Saturn... Close your eyes, hero, and let the stars guide your dreams.' }
        }
      ]
    },
    {
      id: 'day-oct22',
      date: '2026-10-22',
      label: 'Oct 22',
      turns: [
        {
          id: 'turn-o1',
          time: '05:00 PM',
          child: { text: 'Dadi asked me for water and I gave her a warm glass!', source: 'mic' },
          kotl: { text: 'That warms my heart so much, Parth! Taking care of Dadi shows what a thoughtful, loving champ you are! You earned a kindness star today!' }
        }
      ]
    },
    {
      id: 'day-oct20',
      date: '2026-10-20',
      label: 'Oct 20',
      turns: [
        {
          id: 'turn-o2',
          time: '09:10 AM',
          child: { text: 'Good morning KOTL! What is gravity?', source: 'mic' },
          kotl: { text: 'Good morning, Parth! Gravity is earth\'s gentle hug that keeps our feet safely on the ground and lets us bounce a football right back down!' }
        }
      ]
    }
  ]);

  const [activeDayId, setActiveDayId] = useState('day-today');
  const [searchDialogueQuery, setSearchDialogueQuery] = useState('');
  const [testChatMessage, setTestChatMessage] = useState('');

  // Parent Walkie Transmitter
  const [customMemoText, setCustomMemoText] = useState('');

  // Form states
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestCategory, setNewQuestCategory] = useState('School Project');
  const [newQuestGoal, setNewQuestGoal] = useState('');
  const [newQuestHint, setNewQuestHint] = useState('');

  const [sickSymptom, setSickSymptom] = useState('');
  const [sickMedicines, setSickMedicines] = useState('');

  const [inputHeight, setInputHeight] = useState(116);
  const [inputWeight, setInputWeight] = useState(21.5);

  const [newVacName, setNewVacName] = useState('');
  const [newVacDate, setNewVacDate] = useState('October 2026');

  const [wbType, setWbType] = useState('word');
  const [wbTitle, setWbTitle] = useState('');
  const [wbDesc, setWbDesc] = useState('');

  const [playActivity, setPlayActivity] = useState('');
  const [playMinutes, setPlayMinutes] = useState(20);

  const [newHabitType, setNewHabitType] = useState('good');
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitDesc, setNewHabitDesc] = useState('');

  // Handlers
  const playVoice = (text) => {
    if (!text) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    }
  };

  const handleAwardStar = () => {
    setMannerStars(p => p + 1);
    playVoice('Great job, Parth! You earned a Good Habit and Kindness Star!');
  };

  const handleToggleQuest = (qid) => {
    setQuests(prev => prev.map(q => {
      if (q.id === qid) {
        const nextStatus = q.status === 'completed' ? 'active' : 'completed';
        if (nextStatus === 'completed') {
          playVoice('Congratulations, Parth! You completed your quest: ' + q.title);
        }
        return { ...q, status: nextStatus };
      }
      return q;
    }));
  };

  const handleAddQuest = (e) => {
    e.preventDefault();
    if (!newQuestTitle.trim()) return;
    const nq = {
      id: 'quest-' + Date.now(),
      title: newQuestTitle.trim(),
      category: newQuestCategory,
      goal: newQuestGoal.trim() || 'Learn and explore with KOTL guidance.',
      status: 'active',
      mentor_hints: newQuestHint.trim() ? [newQuestHint.trim()] : ['Think carefully, Parth! What step comes first?'],
      badge: '🌟 Quest Achiever'
    };
    setQuests(p => [nq, ...p]);
    setNewQuestTitle('');
    setNewQuestGoal('');
    setNewQuestHint('');
    setIsAssignQuestOpen(false);
    playVoice('New quest assigned for Parth: ' + nq.title);
  };

  const handleSaveMedicalId = (e) => {
    e.preventDefault();
    setIsEditMedicalIdOpen(false);
    alert('Emergency Medical Identification updated successfully!');
  };

  const handleSaveSickness = (e) => {
    e.preventDefault();
    if (!sickSymptom.trim()) return;
    const ns = {
      id: 'sick-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      symptom: sickSymptom.trim(),
      medicines: sickMedicines.trim() || 'Rest & clean hydration',
      doctor: medicalId.pediatrician_name,
      status: 'active',
      remedy: 'Consulted pediatrician; resting with soothing care.'
    };
    setSicknessLogs(p => [ns, ...p]);
    setSickSymptom('');
    setSickMedicines('');
    setIsLogSicknessOpen(false);
  };

  const handleSaveVitals = (e) => {
    e.preventDefault();
    const h = parseFloat(inputHeight) || 116;
    const w = parseFloat(inputWeight) || 21.5;
    const bmiVal = (w / ((h / 100) * (h / 100))).toFixed(1);
    setVitals({ height: h, weight: w, bmi: bmiVal });
    setIsUpdateVitalsOpen(false);
  };

  const handleAddVaccine = (e) => {
    e.preventDefault();
    if (!newVacName.trim()) return;
    const nv = {
      id: 'vac-' + Date.now(),
      name: newVacName.trim(),
      age: '6 Years',
      status: 'completed',
      date: newVacDate.trim() || 'Today'
    };
    setVaccinations(p => [...p, nv]);
    setNewVacName('');
    setIsAddVaccineOpen(false);
  };

  const handleSaveWordBook = (e) => {
    e.preventDefault();
    if (!wbTitle.trim()) return;
    if (wbType === 'word') {
      setSightWords(p => [...p, { word: wbTitle.trim(), meaning: wbDesc.trim() || 'Vocabulary building' }]);
    } else {
      setBooks(p => [...p, { title: wbTitle.trim(), pages: wbDesc.trim() || '16 Pages', status: 'Reading' }]);
    }
    setWbTitle('');
    setWbDesc('');
    setIsAddWordBookOpen(false);
  };

  const handleSavePlay = (e) => {
    e.preventDefault();
    const mins = parseInt(playMinutes, 10) || 20;
    setActivePlayMins(p => p + mins);
    setIsLogPlayOpen(false);
    playVoice('Logged ' + mins + ' minutes of active play for Parth!');
  };

  const handleVolumeChange = (val) => {
    const v = parseInt(val, 10) || 0;
    setDeviceVolume(v);
    fetch('/api/device/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume: v })
    }).catch(() => {});
  };

  const toggleSleepMode = () => {
    const next = !isSleepMode;
    setIsSleepMode(next);
    if (next) {
      playVoice('Bedtime mode active. Goodnight Parth, sweet dreams among the stars!');
    } else {
      playVoice('Good morning Parth! KOTL is awake and ready for fun learning!');
    }
    fetch('/api/device/sleep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sleep: next })
    }).catch(() => {});
  };

  const toggleSosBeacon = (active) => {
    setIsSosActive(active);
    if (active) {
      playVoice('Emergency Alert activated! Please stay safe, Mummy and Papa are notified!');
    }
    fetch('/api/device/emergency-sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    }).catch(() => {});
  };

  const rebootDevice = () => {
    if (confirm('Reboot KOTL ESP32 Device?')) {
      fetch('/api/device/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reboot: true })
      }).then(() => alert('Device reboot command sent!')).catch(() => alert('Reboot signaled.'));
    }
  };

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    if (newHabitType === 'good') {
      setGoodHabits(p => [...p, {
        id: 'gh-' + Date.now(),
        icon: '⭐',
        title: newHabitTitle.trim(),
        desc: newHabitDesc.trim() || 'Consistently practiced routine.',
        status: 'Active Strengths'
      }]);
    } else {
      setBadHabits(p => [...p, {
        id: 'bh-' + Date.now(),
        icon: '⚠️',
        title: newHabitTitle.trim(),
        reluctance: newHabitDesc.trim() || 'Needs parental and KOTL guidance.',
        strategy: 'KOTL uses positive reinforcement and story quests.',
        status: 'In Training ⏳'
      }]);
    }
    setNewHabitTitle('');
    setNewHabitDesc('');
    setIsAddHabitOpen(false);
  };

  const sendParentTestChat = (e) => {
    e.preventDefault();
    if (!testChatMessage.trim()) return;
    const childMsg = testChatMessage.trim();
    setTestChatMessage('');

    const newTurn = {
      id: 'turn-test-' + Date.now(),
      time: 'Just now',
      child: { text: childMsg, source: 'web_dashboard' },
      kotl: { text: 'Thinking...' }
    };

    setDaysHistory(prev => {
      const copy = [...prev];
      const todayIdx = copy.findIndex(d => d.id === 'day-today');
      if (todayIdx >= 0) {
        copy[todayIdx] = {
          ...copy[todayIdx],
          turns: [...copy[todayIdx].turns, newTurn]
        };
      }
      return copy;
    });

    fetch('/api/test/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: childMsg })
    })
      .then(res => res.json())
      .then(data => {
        const replyText = data.reply || "That's wonderful, Parth! Let's explore together!";
        setDaysHistory(prev => {
          const copy = [...prev];
          const todayIdx = copy.findIndex(d => d.id === 'day-today');
          if (todayIdx >= 0) {
            const turns = [...copy[todayIdx].turns];
            const lastTurnIdx = turns.findIndex(t => t.id === newTurn.id);
            if (lastTurnIdx >= 0) {
              turns[lastTurnIdx] = {
                ...turns[lastTurnIdx],
                kotl: { text: replyText }
              };
              copy[todayIdx] = { ...copy[todayIdx], turns };
            }
          }
          return copy;
        });
        playVoice(replyText);
      })
      .catch(() => {
        setDaysHistory(prev => {
          const copy = [...prev];
          const todayIdx = copy.findIndex(d => d.id === 'day-today');
          if (todayIdx >= 0) {
            const turns = [...copy[todayIdx].turns];
            const lastTurnIdx = turns.findIndex(t => t.id === newTurn.id);
            if (lastTurnIdx >= 0) {
              turns[lastTurnIdx] = {
                ...turns[lastTurnIdx],
                kotl: { text: 'Parth, you have such brilliant curiosity! Keep asking big questions!' }
              };
              copy[todayIdx] = { ...copy[todayIdx], turns };
            }
          }
          return copy;
        });
      });
  };

  const sendCustomVoice = () => {
    if (!customMemoText.trim()) return;
    playVoice(customMemoText.trim());
    setCustomMemoText('');
    alert('Speaking voice memo through KOTL speaker!');
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
            <button onClick={() => setIsProfileModalOpen(true)} className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-all shadow-2xs" title="Child Profile & Safety Settings">
              <span>⚙️</span><span className="hidden md:inline">Child Profile</span>
            </button>
          </div>
        </div>
      </header>

      {/* 5 DEDICATED SUPER-HUB NAVIGATION TABS */}
      <div className="section-nav-bar relative z-20 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-2 pb-2">
        <div className="bg-amber-50/90 backdrop-blur-sm border-2 border-amber-200 rounded-2xl p-1.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shadow-xs">
          <button onClick={() => setCurrentSection('report')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'report' ? 'bg-[#0284C7] text-white shadow-md' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>📜</span><span>School Report & Skills</span>
          </button>
          <button onClick={() => setCurrentSection('quests')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'quests' ? 'bg-[#0284C7] text-white shadow-md' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>🧭</span><span>Mentor Quests</span>
          </button>
          <button onClick={() => setCurrentSection('growth')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'growth' ? 'bg-[#0284C7] text-white shadow-md' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>🌟</span><span>Good & Bad Habits</span>
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

        {/* SECTION 1: SCHOOL REPORT & DETAILED SKILLS DIRECTORY */}
        {currentSection === 'report' && (
          <div className="space-y-5">
            {/* Executive Pediatric Banner */}
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

            {/* Pediatric Marksheet & Audio Briefing */}
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
                    <td className="py-2.5 px-3 text-slate-500">Learned 30+ multisyllabic terms ('orbit', 'stamina', 'telescope')</td>
                    <td className="py-2.5 px-3 font-bold text-sky-700">88/100</td>
                    <td className="py-2.5 px-3"><span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">A+</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold">🔬 Curiosity & STEM</td>
                    <td className="py-2.5 px-3 text-slate-500">Profound 'why' questions regarding planetary orbits and nature</td>
                    <td className="py-2.5 px-3 font-bold text-purple-700">94/100</td>
                    <td className="py-2.5 px-3"><span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">A+</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold">❤️ Emotional & Empathy</td>
                    <td className="py-2.5 px-3 text-slate-500">Polite turn-taking, cheerful respect for elders, warm care for Dadi</td>
                    <td className="py-2.5 px-3 font-bold text-rose-700">90/100</td>
                    <td className="py-2.5 px-3"><span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md text-[10px]">A+</span></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold">👂 Listening & Habits</td>
                    <td className="py-2.5 px-3 text-slate-500">Tidies study desk, brushes twice daily; improving with green veggies</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">78/100</td>
                    <td className="py-2.5 px-3"><span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[10px]">B+</span></td>
                  </tr>
                </tbody>
              </table>
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-fredoka text-xs font-bold text-slate-800">1-Minute AI Pediatric Audio Briefing</h4>
                  <p className="text-[11px] text-slate-500">Executive voice summary of Parth's cognitive progress and daily habits</p>
                </div>
                <button onClick={() => playVoice("Parth had an extraordinary learning day! His cognitive curiosity reached ninety-four percent, asking advanced questions about planetary orbits and space exploration. He also demonstrated polite conversational turn taking with family.")} className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-fredoka font-bold text-xs rounded-xl shadow-xs whitespace-nowrap">
                  ▶ Play Voice Briefing
                </button>
              </div>
            </div>

            {/* 🌟 HABITS SPOTLIGHT CARD (GOOD HABITS VS BAD HABITS) */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border-2 border-emerald-300 rounded-[32px] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-xs shrink-0">
                  🌟
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-fredoka text-base sm:text-lg font-bold text-emerald-950">🌟 Good Habits & Habits Needing Guidance (Bad Habits)</h3>
                    <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">5 Good Habits • 4 In Training</span>
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed space-y-0.5">
                    <div>✨ <strong>Good Habits Established:</strong> Brushing teeth twice daily, tidying toys & desk, drinking fresh water, polite turn-taking with Dadi, asking science questions.</div>
                    <div>⚠️ <strong>Habits Needing Improvement (Bad Habits):</strong> Reluctance to eat green veggies (spinach/broccoli), evening mobile screen time, 9 PM bedtime delays, sleeping in dark room.</div>
                  </div>
                </div>
              </div>
              <button onClick={() => setCurrentSection('growth')} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-fredoka font-bold text-xs whitespace-nowrap shadow-sm flex items-center gap-1.5 self-start md:self-auto shrink-0 transition-transform active:scale-95">
                <span>👉</span><span>Open Full Habits Academy</span>
              </button>
            </div>

            {/* BENTO GRID: 4 CORE SKILLS CARDS (LEFT) & PASSIONS / EVIDENCE (RIGHT) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Bento Col: 4 IN-DEPTH CORE SKILLS */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>🧠</span><span>Core Cognitive & Behavioral Skills Directory</span>
                  </h3>
                  <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
                    4 Developmental Pillars
                  </span>
                </div>

                {/* Skill 1: Curiosity & STEM (94%) */}
                <div className="p-4 rounded-3xl bg-white border-2 border-purple-200 shadow-2xs space-y-2.5 hover:border-purple-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔬</span>
                      <div>
                        <h4 className="font-fredoka font-bold text-slate-800 text-sm">Scientific Curiosity & Inquiry (STEM)</h4>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">Exceptional / Gifted</span>
                      </div>
                    </div>
                    <span className="font-fredoka text-xl font-bold text-purple-700">94%</span>
                  </div>
                  <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: '94%' }}></div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Pedagogical Evaluation:</strong> Consistently drives conversations with 'why' and 'how' exploratory questions about astronomy, space rockets, and nature.
                  </p>
                  <div className="text-[11px] text-purple-900 bg-purple-50 p-2.5 rounded-xl border border-purple-200/80 font-medium">
                    ⭐ <strong>Key Strength:</strong> Shows genuine desire to understand mechanisms rather than just surface facts.
                  </div>
                </div>

                {/* Skill 2: English Vocabulary (88%) */}
                <div className="p-4 rounded-3xl bg-white border-2 border-sky-200 shadow-2xs space-y-2.5 hover:border-sky-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔤</span>
                      <div>
                        <h4 className="font-fredoka font-bold text-slate-800 text-sm">English Vocabulary & Expression</h4>
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">Advanced for Age</span>
                      </div>
                    </div>
                    <span className="font-fredoka text-xl font-bold text-sky-700">88%</span>
                  </div>
                  <div className="w-full bg-sky-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-600 h-full rounded-full" style={{ width: '88%' }}></div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Pedagogical Evaluation:</strong> Demonstrates rapid assimilation of 2-to-3 syllable English and bilingual words when embedded in narrative adventures.
                  </p>
                  <div className="text-[11px] text-sky-900 bg-sky-50 p-2.5 rounded-xl border border-sky-200/80 font-medium">
                    ⭐ <strong>Key Strength:</strong> Retains scientific terms like 'orbit', 'stamina', and 'telescope' after single interactive story sessions.
                  </div>
                </div>

                {/* Skill 3: Emotional Intelligence (90%) */}
                <div className="p-4 rounded-3xl bg-white border-2 border-rose-200 shadow-2xs space-y-2.5 hover:border-rose-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">❤️</span>
                      <div>
                        <h4 className="font-fredoka font-bold text-slate-800 text-sm">Emotional Intelligence & Kindness</h4>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">Very High Empathy</span>
                      </div>
                    </div>
                    <span className="font-fredoka text-xl font-bold text-rose-700">90%</span>
                  </div>
                  <div className="w-full bg-rose-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '90%' }}></div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Pedagogical Evaluation:</strong> Displays high empathy and cheerful disposition. Reacts enthusiastically to KOTL's expressive eye animations and vocal inflections.
                  </p>
                  <div className="text-[11px] text-rose-900 bg-rose-50 p-2.5 rounded-xl border border-rose-200/80 font-medium">
                    ⭐ <strong>Key Strength:</strong> Openly expresses happiness and offers polite turn-taking during dialogue.
                  </div>
                </div>

                {/* Skill 4: Listening & Daily Habits (78%) */}
                <div className="p-4 rounded-3xl bg-white border-2 border-emerald-200 shadow-2xs space-y-2.5 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👂</span>
                      <div>
                        <h4 className="font-fredoka font-bold text-slate-800 text-sm">Listening & Daily Habit Formation</h4>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Developing Nicely</span>
                      </div>
                    </div>
                    <span className="font-fredoka text-xl font-bold text-emerald-700">78%</span>
                  </div>
                  <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '78%' }}></div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Pedagogical Evaluation:</strong> Follows conversational cues attentively. Gradually warming up to toy organization and healthy eating when framed as superhero training.
                  </p>
                  <div className="text-[11px] text-emerald-900 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/80 font-medium">
                    ⭐ <strong>Key Strength:</strong> Responds enthusiastically to gamified incentives and playful encouragement.
                  </div>
                </div>

              </div>

              {/* Right Bento Col: PASSIONS, MILESTONES & CONVERSATIONAL EVIDENCE */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Passions Breakdown */}
                <div className="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🌟</span>
                      <h3 className="font-fredoka text-base font-bold text-slate-800">Passions & Deep Interests</h3>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">Affinity %</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <strong>🚀 Space Exploration & Stars</strong>
                        <div className="text-[10px] text-slate-500">Fascinated by stars, moon rovers and astronauts</div>
                      </div>
                      <span className="font-fredoka font-bold text-sm text-purple-700">95%</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <strong>🛸 Rocketry & Planetary Orbits</strong>
                        <div className="text-[10px] text-slate-500">Loves zero gravity floating and rocket propulsion</div>
                      </div>
                      <span className="font-fredoka font-bold text-sm text-sky-700">90%</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <strong>🌙 Bedtime Quests & Stories</strong>
                        <div className="text-[10px] text-slate-500">Thrives as active hero in evening story chapters</div>
                      </div>
                      <span className="font-fredoka font-bold text-sm text-rose-700">88%</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                      <div>
                        <strong>🎨 Creative Drawing & Visual Art</strong>
                        <div className="text-[10px] text-slate-500">Visualizing spacecraft designs and vibrant colors</div>
                      </div>
                      <span className="font-fredoka font-bold text-sm text-amber-700">82%</span>
                    </div>
                  </div>
                </div>

                {/* Conversational Evidence Archive */}
                <div className="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
                    <span className="text-xl">💬</span>
                    <h3 className="font-fredoka text-base font-bold text-slate-800">Notable Conversational Evidence</h3>
                  </div>
                  
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-amber-900 uppercase">
                        <span>Space Inquiry Milestone</span>
                        <span>Live Voice</span>
                      </div>
                      <div className="text-slate-800">🧒 <strong>Parth:</strong> "KOTL, how do stars shine at night, and can we fly a rocket to the moon?"</div>
                      <div className="text-slate-600">🤖 <strong>KOTL:</strong> "Stars are giant glowing suns far away in space, Parth! They twinkle to say hello to you!"</div>
                      <div className="text-[10px] text-slate-500 italic">• Demonstrates natural wonder and spatial curiosity beyond age 6 benchmarks.</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-rose-900 uppercase">
                        <span>Empathy & Family Care</span>
                        <span>Live Voice</span>
                      </div>
                      <div className="text-slate-800">🧒 <strong>Parth:</strong> "Dadi was coughing, so I asked mummy for warm water bottle."</div>
                      <div className="text-slate-600">🤖 <strong>KOTL:</strong> "That was so kind of you, Parth! Taking care of your family makes you a true superhero!"</div>
                      <div className="text-[10px] text-slate-500 italic">• High emotional quotient and spontaneous situational kindness.</div>
                    </div>
                  </div>
                </div>

                {/* Developmental Milestones */}
                <div className="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <h3 className="font-fredoka text-base font-bold text-slate-800 border-b pb-2">🎯 Senior KG Milestone Checklist</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-emerald-900">
                      <span>✓ Explores 3+ multi-step 'why' questions</span>
                      <strong className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded">Achieved</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-emerald-900">
                      <span>✓ Expresses feelings with gentle words</span>
                      <strong className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded">Achieved</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 text-amber-900">
                      <span>⏳ Eating variety of green vegetables</span>
                      <strong className="text-[10px] bg-amber-200 px-2 py-0.5 rounded">In Progress</strong>
                    </div>
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

        {/* SECTION 3: LEARN, PLAY & HABITS (GOOD HABITS VS BAD HABITS) */}
        {currentSection === 'growth' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-[32px] p-6 text-white shadow-md border-3 border-emerald-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-fredoka text-xl sm:text-2xl font-bold">Good & Bad Habits Academy (360° Life Growth)</h2>
                <p className="text-xs text-emerald-100">Good habits established, behavioral guidance plans, phonics & 60m sports play</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsAddHabitOpen(true)} className="px-3.5 py-2 bg-white text-emerald-900 rounded-xl font-fredoka font-bold text-xs shadow-xs">
                  ➕ Add Habit Goal
                </button>
                <button onClick={handleAwardStar} className="px-3.5 py-2 bg-amber-400 text-amber-950 rounded-xl font-fredoka font-bold text-xs shadow-xs">
                  ⭐ Award Star
                </button>
              </div>
            </div>

            {/* GOOD HABITS VS HABITS NEEDING IMPROVEMENT (BAD HABITS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Bento Col: ✨ GOOD HABITS ESTABLISHED (STRENGTHS) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white border-2 border-emerald-200 rounded-[32px] p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">✨</span>
                      <div>
                        <h3 className="font-fredoka text-base sm:text-lg font-bold text-emerald-950">Good Habits Established</h3>
                        <p className="text-xs text-slate-500">Positive daily routines mastered by Parth with KOTL praise</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                      {goodHabits.length} Active Strengths
                    </span>
                  </div>

                  <div className="space-y-3">
                    {goodHabits.map((gh) => (
                      <div key={gh.id} className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-emerald-900 flex items-center gap-1.5">
                            <span>{gh.icon}</span><span>{gh.title}</span>
                          </strong>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-md">{gh.status}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{gh.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs border-t border-emerald-100">
                    <span className="font-bold text-slate-600">Praise Parth for Good Habits:</span>
                    <button onClick={handleAwardStar} className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-xl font-fredoka font-bold text-xs shadow-xs">
                      ⭐ Award Good Habit Star
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Bento Col: ⚠️ HABITS NEEDING IMPROVEMENT (BAD HABITS & KOTL ACTION PLANS) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white border-2 border-amber-200 rounded-[32px] p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h3 className="font-fredoka text-base sm:text-lg font-bold text-amber-950">Habits Needing Improvement</h3>
                        <p className="text-xs text-slate-500">Reluctances & behaviors KOTL is actively guiding with story adventures</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                      Active Training
                    </span>
                  </div>

                  <div className="space-y-3">
                    {badHabits.map((bh) => (
                      <div key={bh.id} className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-amber-900 flex items-center gap-1.5">
                            <span>{bh.icon}</span><span>{bh.title}</span>
                          </strong>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">{bh.status}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          <strong>Reluctance:</strong> {bh.reluctance}
                        </p>
                        <div className="text-[11px] text-amber-950 bg-white/80 p-2 rounded-xl border border-amber-200">
                          🤖 <strong>KOTL Strategy:</strong> {bh.strategy}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs border-t border-amber-100">
                    <span className="font-bold text-slate-600">Have a new habit goal?</span>
                    <button onClick={() => setIsAddHabitOpen(true)} className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-fredoka font-bold text-xs shadow-xs">
                      ➕ Add Habit Goal
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Phonics & Sports Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-6 space-y-5">
                <div className="bg-white border-2 border-emerald-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-fredoka text-base font-bold text-slate-800">🔤 English Phonics Words</h3>
                    <button onClick={() => setIsAddWordBookOpen(true)} className="text-xs font-bold text-emerald-700">+ Add Word</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 text-xs">
                    {sightWords.map((w, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center">
                        <div><strong>{w.word}</strong><div className="text-[10px] text-slate-500">{w.meaning}</div></div>
                        <button onClick={() => playVoice(w.word)} className="text-emerald-700 font-bold p-1">🔊</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-5">
                <div className="bg-white border-2 border-emerald-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-fredoka text-base font-bold text-slate-800">⚽ Physical Movement & Stamina Goal</h3>
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
                <button onClick={() => setIsEditMedicalIdOpen(true)} className="px-3.5 py-2 bg-white text-rose-900 rounded-xl font-fredoka font-bold text-xs shadow-xs">
                  ✏️ Edit ID
                </button>
                <button onClick={() => setIsLogSicknessOpen(true)} className="px-3.5 py-2 bg-rose-700 text-white rounded-xl font-fredoka font-bold text-xs shadow-xs">
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
                      <div className="text-xs font-bold text-slate-800">{medicalId.allergies}</div>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                    <div><strong>Pediatrician:</strong> {medicalId.pediatrician_name}</div>
                    <div><strong>Emergency Phone:</strong> {medicalId.phone}</div>
                    <div className="text-[11px] text-slate-500"><strong>Clinic:</strong> {medicalId.clinic}</div>
                  </div>
                </div>

                <div className="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-fredoka text-base font-bold text-slate-800">💉 Vaccination Records</h3>
                    <button onClick={() => setIsAddVaccineOpen(true)} className="text-xs text-rose-700 font-bold">+ Add Vaccine</button>
                  </div>
                  <div className="space-y-2 text-xs">
                    {vaccinations.map(v => (
                      <div key={v.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                        <div>
                          <strong>{v.name}</strong>
                          <div className="text-[10px] text-slate-500">{v.age} • {v.date}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${v.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {v.status === 'completed' ? 'Done ✓' : 'Due ⏰'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-5">
                <div className="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-fredoka text-base font-bold text-slate-800">📏 Pediatric Vitals</h3>
                    <button onClick={() => setIsUpdateVitalsOpen(true)} className="text-xs text-rose-700 font-bold">✏️ Update</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-sky-50 rounded-xl">
                      <div className="text-[10px] text-sky-800 font-bold uppercase">Height</div>
                      <div className="font-fredoka text-lg font-bold text-sky-700">{vitals.height} cm</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl">
                      <div className="text-[10px] text-purple-800 font-bold uppercase">Weight</div>
                      <div className="font-fredoka text-lg font-bold text-purple-700">{vitals.weight} kg</div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <div className="text-[10px] text-emerald-800 font-bold uppercase">BMI</div>
                      <div className="font-fredoka text-lg font-bold text-emerald-700">{vitals.bmi}</div>
                    </div>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold text-center">
                    ✓ 75th Percentile — Healthy Pediatric Growth Curve
                  </div>
                </div>

                <div className="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-fredoka text-base font-bold text-slate-800">🌡️ Sickness & Medicine Archive</h3>
                    <button onClick={() => setIsLogSicknessOpen(true)} className="text-xs text-rose-700 font-bold">+ Log Sickness</button>
                  </div>
                  <div className="space-y-2 text-xs">
                    {sicknessLogs.map(s => (
                      <div key={s.id} className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-amber-950">{s.symptom}</strong>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">{s.status}</span>
                        </div>
                        <div className="text-[11px] text-slate-600"><strong>Medicines:</strong> {s.medicines}</div>
                        <div className="text-[10px] text-slate-500"><strong>Prescribed by:</strong> {s.doctor} • {s.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: PARENT HUB & DAY-WISE CHAT HISTORY */}
        {currentSection === 'parent' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 rounded-[32px] p-6 text-white shadow-md border-3 border-sky-400">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-fredoka text-xl sm:text-2xl font-bold">Parent Cockpit & Dialogue Archive</h2>
                  <p className="text-xs text-sky-100">Live walkie mic, talk curfews, safety guardrails & day-wise conversation turns</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/30">
                    Parent Mode Active
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Col: Walkie Transmitter & Safety Rules */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white border-2 border-indigo-200 rounded-[32px] p-5 shadow-xs space-y-4">
                  <h3 className="font-fredoka text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <span>🎙️</span><span>Voice Memo to KOTL Speaker</span>
                  </h3>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Type a memo (e.g. 'Parth, time for dinner!')..."
                      value={customMemoText} 
                      onChange={e => setCustomMemoText(e.target.value)} 
                      className="w-full text-xs p-3 rounded-xl border border-indigo-200 focus:outline-indigo-500"
                    />
                    <button onClick={sendCustomVoice} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-fredoka font-bold text-xs rounded-xl shadow-xs">
                      📢 Speak Voice Memo through KOTL
                    </button>
                  </div>
                </div>

                <div className="bg-white border-2 border-indigo-200 rounded-[32px] p-5 shadow-xs space-y-3">
                  <h3 className="font-fredoka text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <span>🛡️</span><span>Active Parental Permission Gates</span>
                  </h3>
                  <ul className="text-xs space-y-2 text-slate-700">
                    <li className="flex items-center gap-2">
                      <span className="text-rose-500">🔒</span>
                      <span><strong>Medicines & Pills:</strong> Strictly gated; always asks parents first</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-rose-500">🔒</span>
                      <span><strong>Sharp Tools & Matches:</strong> Refuses hazards; alerts adults immediately</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-rose-500">🔒</span>
                      <span><strong>Strangers & Front Door:</strong> Never tells child to open front door</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-rose-500">🔒</span>
                      <span><strong>Purchases & Money:</strong> Zero spending capability</span>
                    </li>
                  </ul>
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-xs flex justify-between items-center text-indigo-950">
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
                  <form onSubmit={sendParentTestChat} className="pt-2 border-t flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Simulate Parth talking to KOTL..." 
                      value={testChatMessage} 
                      onChange={e => setTestChatMessage(e.target.value)} 
                      className="flex-1 text-xs p-2.5 border border-indigo-200 rounded-xl"
                    />
                    <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-fredoka font-bold text-xs rounded-xl shadow-xs">
                      Send Test Turn
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FIXED MOBILE BOTTOM NAVIGATION */}
      <nav id="mobileBottomNav" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-amber-200 px-2 py-1.5 flex justify-around items-center sm:hidden shadow-lg">
        <button onClick={() => setCurrentSection('report')} className={`flex flex-col items-center p-1 rounded-xl ${currentSection === 'report' ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>
          <span className="text-lg">📜</span>
          <span className="text-[10px] font-fredoka">Report</span>
        </button>
        <button onClick={() => setCurrentSection('quests')} className={`flex flex-col items-center p-1 rounded-xl ${currentSection === 'quests' ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>
          <span className="text-lg">🧭</span>
          <span className="text-[10px] font-fredoka">Quests</span>
        </button>
        <button onClick={() => setCurrentSection('growth')} className={`flex flex-col items-center p-1 rounded-xl ${currentSection === 'growth' ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>
          <span className="text-lg">🌟</span>
          <span className="text-[10px] font-fredoka">Good/Bad</span>
        </button>
        <button onClick={() => setCurrentSection('health')} className={`flex flex-col items-center p-1 rounded-xl ${currentSection === 'health' ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>
          <span className="text-lg">🏥</span>
          <span className="text-[10px] font-fredoka">Health</span>
        </button>
        <button onClick={() => setCurrentSection('parent')} className={`flex flex-col items-center p-1 rounded-xl ${currentSection === 'parent' ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>
          <span className="text-lg">🎙️</span>
          <span className="text-[10px] font-fredoka">Parent</span>
        </button>
      </nav>

      {/* MODALS */}

      {/* 1. Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-semibold">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-fredoka text-lg font-bold text-slate-800">Child Profile & Safety Settings</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div><label>Child Name:</label><input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="w-full p-2 border rounded-xl" /></div>
            <div><label>Age:</label><input type="number" value={profile.age} onChange={e => setProfile(p => ({ ...p, age: parseInt(e.target.value, 10) || 6 }))} className="w-full p-2 border rounded-xl" /></div>
            <div><label>Bedtime Curfew:</label><input type="time" value={profile.bedtime} onChange={e => setProfile(p => ({ ...p, bedtime: e.target.value }))} className="w-full p-2 border rounded-xl" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 bg-amber-500 text-white rounded-xl">Save & Close</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Quota Modal */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-4 text-xs font-semibold">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-fredoka text-lg font-bold text-slate-800">Groq API Quota</h3>
              <button onClick={() => setIsQuotaModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
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

      {/* 10. Add Habit Goal Modal */}
      {isAddHabitOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddHabit} className="bg-white border-2 border-emerald-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl space-y-3 text-xs font-semibold">
            <h3 className="font-fredoka text-lg font-bold text-slate-800">Add Habit Goal</h3>
            <div>
              <label>Habit Category</label>
              <select value={newHabitType} onChange={e => setNewHabitType(e.target.value)} className="w-full p-2 border rounded-xl">
                <option value="good">✨ Good Habit Established (Strength)</option>
                <option value="improvement">⚠️ Habit Needing Guidance (Reluctance / Area to Improve)</option>
              </select>
            </div>
            <div>
              <label>Habit Title</label>
              <input type="text" placeholder="e.g. Washing Hands Before Dinner" value={newHabitTitle} onChange={e => setNewHabitTitle(e.target.value)} required className="w-full p-2 border rounded-xl" />
            </div>
            <div>
              <label>{newHabitType === 'good' ? 'Daily Routine Observation' : 'Child Reluctance / Challenge'}</label>
              <textarea placeholder={newHabitType === 'good' ? 'Observation of positive routine...' : 'What reluctance does Parth show and what is KOTL\'s guiding strategy?'} value={newHabitDesc} onChange={e => setNewHabitDesc(e.target.value)} className="w-full p-2 border rounded-xl h-20" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsAddHabitOpen(false)} className="px-4 py-2 text-slate-500">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold">Save Habit</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
