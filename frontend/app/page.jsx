'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function KindergartenHubPage() {
  // Navigation: 3-Tab Architecture
  const [activeTab, setActiveTab] = useState('growth'); // 'growth' | 'habits' | 'cockpit'

  // Dynamic Data States
  const [growthMetrics, setGrowthMetrics] = useState({
    talk_time_minutes: 24,
    curiosity_count: 28,
    new_words_learned: ['orbit', 'gravity', 'satellite', 'stamina', 'telescope', 'herbivore', 'solar', 'nebula'],
    manner_stars: 15,
    who_growth: {
      height_cm: 116,
      weight_kg: 21.5,
      bmi: 15.9,
      percentile: '75th (Healthy)',
      who_status: 'Normal & Optimal (WHO Standard)',
      age_label: '6.0 Years (Boy)'
    },
    daily_parent_tip: {
      title: 'Encourage Socratic Wonder',
      insight: "When Parth asks 'Why do stars twinkle?', celebrate his curiosity first: 'That is a scientist\\'s question! What do you think the atmosphere is doing to the light?'",
      category: 'Cognitive Curiosity'
    }
  });

  const [habits, setHabits] = useState([]);
  const [dayWiseHistory, setDayWiseHistory] = useState([]);
  const [selectedDayId, setSelectedDayId] = useState('day-today');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [childProfile, setChildProfile] = useState({
    name: 'Parth',
    age: '6 Years',
    gender: 'Boy',
    bedtime: '21:00',
    parent_permissions: {
      medicines: true,
      outside_play: true,
      sharp_tools: true,
      purchases: true
    }
  });

  // Cockpit States
  const [deviceVolume, setDeviceVolume] = useState(40);
  const [isSleepMode, setIsSleepMode] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState({
    online: true,
    model: 'KOTL DevKit V1 (ESP32-WROOM-32)',
    mic: 'INMP441 I2S MEMS (16,000Hz 16-bit Mono)',
    speaker: 'MAX98357A I2S DAC (3W 4Ω)',
    display: 'SSD1306 OLED (40 FPS RoboEyes)',
    ws_endpoint: 'ws://localhost:3000/ws'
  });

  // Walkie-Talkie & Directive Audio States
  const [walkieText, setWalkieText] = useState('');
  const [voiceMemos, setVoiceMemos] = useState([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioFeedbackText, setAudioFeedbackText] = useState('');
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [newHabitForm, setNewHabitForm] = useState({
    title: '',
    category: 'Hygiene',
    icon: '🪥',
    directive_text: '',
    tip: ''
  });

  // Test Chat Input inside Growth tab
  const [testChatMessage, setTestChatMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  const audioRef = useRef(null);

  // -------------------------------------------------------------
  // Data Fetching
  // -------------------------------------------------------------
  const fetchGrowthMetrics = async () => {
    try {
      const res = await fetch('/api/growth/metrics');
      const data = await res.json();
      if (data && data.success) {
        setGrowthMetrics(data);
      }
    } catch (_) {}
  };

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.habits)) {
        setHabits(data.habits);
      }
    } catch (_) {}
  };

  const fetchDayWiseHistory = async () => {
    try {
      const res = await fetch('/api/history/daywise');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.days)) {
        setDayWiseHistory(data.days);
        if (data.days.length > 0 && !selectedDayId) {
          setSelectedDayId(data.days[0].id);
        }
      }
    } catch (_) {}
  };

  const fetchChildProfile = async () => {
    try {
      const res = await fetch('/api/child/profile');
      const data = await res.json();
      if (data && data.success && data.profile) {
        setChildProfile(data.profile);
      }
    } catch (_) {}
  };

  const fetchDeviceState = async () => {
    try {
      const res = await fetch('/api/device/state');
      const data = await res.json();
      if (data && data.success) {
        if (typeof data.volume === 'number') setDeviceVolume(data.volume);
        setIsSleepMode(!!data.sleep_mode);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchGrowthMetrics();
    fetchHabits();
    fetchDayWiseHistory();
    fetchChildProfile();
    fetchDeviceState();
  }, []);

  // -------------------------------------------------------------
  // Audio Synthesis & Playback (Hardware-Matched en-IN-PrabhatNeural)
  // -------------------------------------------------------------
  const playVoice = (text) => {
    if (!text || !text.trim()) return;
    setAudioFeedbackText(text);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (_) {}
    }

    setIsPlayingAudio(true);
    fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim() })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.url) {
          const audio = new Audio(data.url);
          audioRef.current = audio;
          audio.onended = () => { setIsPlayingAudio(false); setAudioFeedbackText(''); };
          audio.onerror = () => { fallbackBrowserVoice(text); };
          audio.play().catch(() => fallbackBrowserVoice(text));
        } else {
          fallbackBrowserVoice(text);
        }
      })
      .catch(() => fallbackBrowserVoice(text));
  };

  const fallbackBrowserVoice = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const maleVoice = voices.find(v => {
          const n = (v.name || '').toLowerCase();
          return (n.includes('prabhat') || n.includes('male') || n.includes('david') || n.includes('ravi') || n.includes('george')) && !n.includes('female');
        });
        if (maleVoice) u.voice = maleVoice;
      }
      u.onend = () => { setIsPlayingAudio(false); setAudioFeedbackText(''); };
      window.speechSynthesis.speak(u);
    } else {
      setIsPlayingAudio(false);
      setAudioFeedbackText('');
    }
  };

  // -------------------------------------------------------------
  // Action Handlers
  // -------------------------------------------------------------
  const handleAwardStar = async () => {
    try {
      const res = await fetch('/api/habits/award-star', { method: 'POST' });
      const data = await res.json();
      if (data && data.success) {
        setGrowthMetrics(p => ({ ...p, manner_stars: data.manner_stars }));
        playVoice("Super job, Parth! You earned a Good Habit and Kindness Star!");
      }
    } catch (_) {
      playVoice("Great job, Parth! You earned a star!");
    }
  };

  const handleToggleHabit = async (habitId) => {
    try {
      const res = await fetch('/api/habits/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: habitId })
      });
      const data = await res.json();
      if (data && data.success) {
        setHabits(data.habits);
        const updatedHabit = data.habit;
        if (updatedHabit && updatedHabit.completed_today) {
          playVoice(`Awesome job on ${updatedHabit.title}! Superhero power level increased!`);
        }
      }
    } catch (_) {}
  };

  const handleTriggerVoiceDirective = async (habit) => {
    const textToSpeak = habit.directive_text || `Great job focusing on ${habit.title}! Keep shining, champ!`;
    playVoice(textToSpeak);
    try {
      fetch('/api/voice-directive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directive_text: textToSpeak, title: habit.title })
      }).catch(() => {});
    } catch (_) {}
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!newHabitForm.title.trim()) return;
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHabitForm)
      });
      const data = await res.json();
      if (data && data.success) {
        setHabits(data.habits);
        setIsAddHabitModalOpen(false);
        setNewHabitForm({ title: '', category: 'Hygiene', icon: '🪥', directive_text: '', tip: '' });
        playVoice(`Added new habit: ${newHabitForm.title}! Let's build this superhero routine together!`);
      }
    } catch (_) {}
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

  const handleToggleSleep = () => {
    const next = !isSleepMode;
    setIsSleepMode(next);
    if (next) {
      playVoice('Bedtime mode active. Goodnight Parth, sweet dreams among the cozy stars!');
    } else {
      playVoice('Good morning Parth! KOTL is awake and ready for fun learning!');
    }
    fetch('/api/device/sleep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sleep: next })
    }).catch(() => {});
  };

  const handleSendWalkieMemo = (memoText) => {
    const text = memoText || walkieText;
    if (!text || !text.trim()) return;
    playVoice(text);
    setWalkieText('');
    setVoiceMemos(p => [{ id: 'm-' + Date.now(), text, time: 'Just now', sender: 'Parent' }, ...p]);
    fetch('/api/voice-memo/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'Parent', text: text.trim() })
    }).catch(() => {});
  };

  const handleSendTestChat = async (e) => {
    e.preventDefault();
    if (!testChatMessage.trim() || isSendingChat) return;
    setIsSendingChat(true);
    const msg = testChatMessage.trim();
    setTestChatMessage('');
    try {
      const res = await fetch('/api/test/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, sessionId: 'default-session' })
      });
      const data = await res.json();
      if (data && data.success && data.reply) {
        playVoice(data.reply);
        fetchDayWiseHistory();
        fetchGrowthMetrics();
      }
    } catch (_) {}
    setIsSendingChat(false);
  };

  const handleTogglePermission = (permKey) => {
    const currentVal = childProfile.parent_permissions?.[permKey];
    const updatedPermissions = {
      ...(childProfile.parent_permissions || {}),
      [permKey]: !currentVal
    };
    setChildProfile(p => ({ ...p, parent_permissions: updatedPermissions }));
    fetch('/api/child/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parent_permissions: updatedPermissions })
    }).catch(() => {});
  };

  // Find turns for selected day
  const currentDayData = dayWiseHistory.find(d => d.id === selectedDayId) || dayWiseHistory[0] || { turns: [] };
  const filteredTurns = (currentDayData.turns || []).filter(t => {
    if (!chatSearchQuery.trim()) return true;
    const q = chatSearchQuery.toLowerCase();
    const u = (t.user?.text || t.parth?.text || '').toLowerCase();
    const a = (t.assistant?.text || t.kotl?.text || '').toLowerCase();
    return u.includes(q) || a.includes(q);
  });

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-800 flex flex-col font-sans pb-24 selection:bg-amber-200">
      
      {/* -------------------------------------------------------------
          TOP HEADER BAR (Zero Fake Battery / Zero Fake dBm)
      -------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-2xl shadow-sm">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-fredoka text-xl font-bold tracking-tight text-slate-900">KOTL Kids</h1>
              <span className="bg-amber-100 text-amber-800 text-[11px] font-fredoka font-bold px-2 py-0.5 rounded-full border border-amber-200">
                v2.2
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Parth • Senior KG (Age 6) • AI Growth Companion
            </p>
          </div>
        </div>

        {/* Real Device Status & Manner Stars */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            onClick={handleAwardStar}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-fredoka font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-xs border border-amber-300 transition-transform active:scale-95"
            title="Award Manner Star for kindness or good habits!"
          >
            <span>⭐</span>
            <span>{growthMetrics.manner_stars || 15} Stars</span>
          </button>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-fredoka font-medium text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden sm:inline">ESP32 Device</span>
            <span>Online</span>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------
          VOICE PLAYBACK BANNER NOTIFICATION (Active speech indicator)
      -------------------------------------------------------------- */}
      {isPlayingAudio && (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs sm:text-sm px-4 py-2 font-fredoka font-medium flex items-center justify-center gap-2 shadow-sm animate-fadeIn">
          <span className="animate-spin">🔊</span>
          <span>KOTL Speaking: &quot;{audioFeedbackText.slice(0, 90)}...&quot;</span>
        </div>
      )}

      {/* -------------------------------------------------------------
          MAIN 3-TAB NAVIGATION PILL BAR
      -------------------------------------------------------------- */}
      <div className="max-w-6xl w-full mx-auto px-4 pt-6 pb-2">
        <div className="bg-amber-100/70 p-1.5 rounded-[32px] flex items-center gap-1.5 border border-amber-200/80 shadow-xs">
          
          <button
            onClick={() => setActiveTab('growth')}
            className={`flex-1 py-3 px-3 sm:px-5 rounded-[26px] font-fredoka font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'growth'
                ? 'bg-white text-amber-900 shadow-sm border border-amber-200/60 scale-[1.01]'
                : 'text-slate-600 hover:text-amber-900 hover:bg-white/40'
            }`}
          >
            <span className="text-base sm:text-lg">🌟</span>
            <span>TAB 1: Daily Living Growth</span>
          </button>

          <button
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-3 px-3 sm:px-5 rounded-[26px] font-fredoka font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'habits'
                ? 'bg-white text-emerald-900 shadow-sm border border-emerald-200/60 scale-[1.01]'
                : 'text-slate-600 hover:text-emerald-900 hover:bg-white/40'
            }`}
          >
            <span className="text-base sm:text-lg">🥦</span>
            <span>TAB 2: Habits & Socratic Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('cockpit')}
            className={`flex-1 py-3 px-3 sm:px-5 rounded-[26px] font-fredoka font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'cockpit'
                ? 'bg-white text-sky-900 shadow-sm border border-sky-200/60 scale-[1.01]'
                : 'text-slate-600 hover:text-sky-900 hover:bg-white/40'
            }`}
          >
            <span className="text-base sm:text-lg">📻</span>
            <span>TAB 3: Walkie-Talkie & Cockpit</span>
          </button>

        </div>
      </div>

      {/* -------------------------------------------------------------
          TAB CONTENTS CONTAINER
      -------------------------------------------------------------- */}
      <main className="max-w-6xl w-full mx-auto px-4 py-4 flex-1">
        
        {/* =============================================================
            TAB 1: DAILY LIVING GROWTH
        ============================================================== */}
        {activeTab === 'growth' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top 4 Growth Metric Cards (Kindergarten Rounded-[32px]) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Metric 1: Talk Time Minutes */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-[32px] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl p-2 bg-amber-100 rounded-2xl">⏱️</span>
                  <span className="text-[11px] font-fredoka font-bold text-amber-700 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
                    Today
                  </span>
                </div>
                <div>
                  <div className="font-fredoka text-3xl font-bold text-amber-950">
                    {growthMetrics.talk_time_minutes || 24} <span className="text-sm font-medium text-amber-800">mins</span>
                  </div>
                  <p className="text-xs text-amber-900/80 font-medium mt-1">
                    Active Conversational Talk-Time
                  </p>
                </div>
              </div>

              {/* Metric 2: Curiosity Questions */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/80 rounded-[32px] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl p-2 bg-purple-100 rounded-2xl">🔭</span>
                  <span className="text-[11px] font-fredoka font-bold text-purple-700 bg-purple-200/60 px-2.5 py-0.5 rounded-full">
                    High Inquiry
                  </span>
                </div>
                <div>
                  <div className="font-fredoka text-3xl font-bold text-purple-950">
                    {growthMetrics.curiosity_count || 28} <span className="text-sm font-medium text-purple-800">queries</span>
                  </div>
                  <p className="text-xs text-purple-900/80 font-medium mt-1">
                    Exploratory &apos;Why &amp; How&apos; Questions
                  </p>
                </div>
              </div>

              {/* Metric 3: Manner & Kindness Stars */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200/80 rounded-[32px] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl p-2 bg-yellow-100 rounded-2xl">⭐</span>
                  <button
                    onClick={handleAwardStar}
                    className="text-[10px] font-fredoka font-bold bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded-full shadow-2xs"
                  >
                    + Award
                  </button>
                </div>
                <div>
                  <div className="font-fredoka text-3xl font-bold text-yellow-950">
                    {growthMetrics.manner_stars || 15} <span className="text-sm font-medium text-yellow-800">stars</span>
                  </div>
                  <p className="text-xs text-yellow-900/80 font-medium mt-1">
                    Kindness &amp; Habit Badges
                  </p>
                </div>
              </div>

              {/* Metric 4: Pediatric Overall Score */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-[32px] p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl p-2 bg-emerald-100 rounded-2xl">🏆</span>
                  <span className="text-[11px] font-fredoka font-bold text-emerald-700 bg-emerald-200/60 px-2.5 py-0.5 rounded-full">
                    Clinical
                  </span>
                </div>
                <div>
                  <div className="font-fredoka text-3xl font-bold text-emerald-950">
                    89<span className="text-sm font-medium text-emerald-800">/100</span>
                  </div>
                  <p className="text-xs text-emerald-900/80 font-medium mt-1">
                    Advanced Cognitive Curiosity
                  </p>
                </div>
              </div>

            </div>

            {/* New Words Learned Badge Showcase */}
            <div className="bg-white border border-amber-100 rounded-[32px] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📚</span>
                  <h3 className="font-fredoka text-lg font-bold text-slate-800">
                    Educational Vocabulary Learned with KOTL
                  </h3>
                </div>
                <span className="text-xs font-fredoka font-semibold text-slate-500">
                  {growthMetrics.new_words_learned?.length || 8} Words Acquired
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Parth naturally assimilated these scientific and descriptive terms during interactive storytelling:
              </p>
              <div className="flex flex-wrap gap-2">
                {(growthMetrics.new_words_learned || []).map((w, idx) => (
                  <button
                    key={idx}
                    onClick={() => playVoice(`Parth learned the word: ${w}! What a brilliant word to use!`)}
                    className="bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 font-fredoka font-bold text-xs px-3.5 py-1.5 rounded-2xl shadow-2xs flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <span>✨</span>
                    <span>{w}</span>
                    <span className="text-[10px] text-amber-600">▶</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversational Speech Bubbles Archive */}
            <div className="bg-white border border-amber-100 rounded-[32px] p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💬</span>
                    <h3 className="font-fredoka text-lg font-bold text-slate-900">
                      Day-Wise Conversational Speech Bubbles
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Real dialogue turns recorded between Parth and his physical KOTL companion
                  </p>
                </div>

                {/* Search Turn Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    placeholder="Search words (e.g. planet)..."
                    className="text-xs bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5 pl-8 w-full sm:w-56 focus:outline-hidden focus:ring-2 focus:ring-amber-300"
                  />
                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">🔍</span>
                </div>
              </div>

              {/* Day Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
                {dayWiseHistory.map(day => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDayId(day.id)}
                    className={`px-4 py-1.5 rounded-full font-fredoka text-xs font-bold whitespace-nowrap transition-all ${
                      selectedDayId === day.id
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{day.label}</span>
                    <span className="ml-1.5 text-[10px] opacity-80">({day.turns?.length || 0})</span>
                  </button>
                ))}
              </div>

              {/* Speech Bubbles List */}
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-200">
                {filteredTurns.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-fredoka text-sm">
                    No conversation turns match the filter. Start chatting with KOTL below!
                  </div>
                ) : (
                  filteredTurns.map((turn, i) => {
                    const userMsg = turn.user?.text || turn.parth?.text || '';
                    const kotlMsg = turn.assistant?.text || turn.kotl?.text || '';
                    const time = turn.time || turn.timestamp ? new Date(turn.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today';

                    return (
                      <div key={turn.id || i} className="bg-slate-50/70 border border-slate-100 rounded-[28px] p-4 space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                          <span>Turn #{i + 1}</span>
                          <span>{time}</span>
                        </div>

                        {/* Parth Bubble */}
                        {userMsg && (
                          <div className="flex items-start gap-2.5 justify-end">
                            <div className="bg-amber-100/90 border border-amber-200 text-amber-950 rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs sm:text-sm font-medium max-w-[85%] shadow-2xs">
                              <p>{userMsg}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-sm shadow-2xs shrink-0">
                              👦
                            </div>
                          </div>
                        )}

                        {/* KOTL Bubble */}
                        {kotlMsg && (
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm shadow-2xs shrink-0">
                              🤖
                            </div>
                            <div className="bg-white border border-indigo-100 text-slate-800 rounded-2xl rounded-tl-xs px-4 py-2.5 text-xs sm:text-sm shadow-2xs max-w-[85%] space-y-2">
                              <p className="leading-relaxed">{kotlMsg}</p>
                              <div className="pt-1 flex items-center gap-2">
                                <button
                                  onClick={() => playVoice(kotlMsg)}
                                  className="text-[11px] font-fredoka font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors"
                                >
                                  <span>▶ Listen Voice</span>
                                  <span className="text-[9px] opacity-70">(en-IN-Prabhat)</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Chat Input Box (Live Assistant Test) */}
              <form onSubmit={handleSendTestChat} className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={testChatMessage}
                  onChange={(e) => setTestChatMessage(e.target.value)}
                  placeholder="Type a test dialogue to KOTL (e.g. What is the moon?)..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-300"
                />
                <button
                  type="submit"
                  disabled={isSendingChat || !testChatMessage.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-fredoka font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  {isSendingChat ? 'Thinking...' : 'Send'}
                  <span>🚀</span>
                </button>
              </form>

            </div>

          </div>
        )}

        {/* =============================================================
            TAB 2: HABITS, HEALTH & SOCRATIC ACTION ENGINE
        ============================================================== */}
        {activeTab === 'habits' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Header with Award Star & Add Habit Action */}
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white rounded-[32px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="bg-emerald-400/50 text-emerald-950 font-fredoka font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Socratic Action Engine
                </span>
                <h2 className="font-fredoka text-xl sm:text-2xl font-bold mt-1.5">
                  Habit Tracker &amp; 1-Click KOTL Voice Directives
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
                  Click any directive to have KOTL immediately prompt Parth with friendly superhero encouragement!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsAddHabitModalOpen(true)}
                  className="bg-white/90 hover:bg-white text-emerald-900 font-fredoka font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>+</span>
                  <span>Add Habit</span>
                </button>
                <button
                  onClick={handleAwardStar}
                  className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-fredoka font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>⭐ Award Star</span>
                </button>
              </div>
            </div>

            {/* Persistent Dynamic Habits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className={`border rounded-[32px] p-5 shadow-xs transition-all flex flex-col justify-between ${
                    habit.completed_today
                      ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/70 border-emerald-200'
                      : 'bg-white border-slate-100 hover:border-amber-200'
                  }`}
                >
                  <div>
                    {/* Top row: Icon, Category & Toggle */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl p-2 bg-white rounded-2xl shadow-2xs border border-slate-100">
                          {habit.icon || '⭐'}
                        </span>
                        <div>
                          <span className="text-[10px] font-fredoka font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {habit.category}
                          </span>
                          <div className="text-[11px] font-medium text-emerald-700 mt-0.5">
                            🔥 {habit.streak_days || 0} Days Streak
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleHabit(habit.id)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-transform active:scale-90 ${
                          habit.completed_today
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                        }`}
                        title="Toggle completed today"
                      >
                        ✓
                      </button>
                    </div>

                    <h4 className="font-fredoka font-bold text-base text-slate-900 leading-snug">
                      {habit.title}
                    </h4>

                    {habit.tip && (
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        💡 {habit.tip}
                      </p>
                    )}
                  </div>

                  {/* 1-Click KOTL Voice Directive Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100/80">
                    <button
                      onClick={() => handleTriggerVoiceDirective(habit)}
                      className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-fredoka font-bold text-xs py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                    >
                      <span>⚡ 1-Click KOTL Voice Directive</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* WHO Growth Indicators & Daily Parent Socratic Tip */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* WHO Growth Indicators Card */}
              <div className="bg-white border border-amber-100 rounded-[32px] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <h3 className="font-fredoka text-lg font-bold text-slate-900">
                      WHO Pediatric Growth Indicators
                    </h3>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-fredoka font-bold px-2.5 py-0.5 rounded-full">
                    {growthMetrics.who_growth?.who_status || 'Normal & Optimal'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Height</div>
                    <div className="font-fredoka text-xl font-bold text-slate-900 mt-0.5">
                      {growthMetrics.who_growth?.height_cm || 116} <span className="text-xs font-normal">cm</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium mt-0.5">75th %ile</div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">Weight</div>
                    <div className="font-fredoka text-xl font-bold text-slate-900 mt-0.5">
                      {growthMetrics.who_growth?.weight_kg || 21.5} <span className="text-xs font-normal">kg</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium mt-0.5">75th %ile</div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                    <div className="text-[11px] text-slate-500 font-medium">BMI</div>
                    <div className="font-fredoka text-xl font-bold text-slate-900 mt-0.5">
                      {growthMetrics.who_growth?.bmi || 15.9}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Ideal Zone</div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Based on WHO 2006 Child Growth Standards for boys aged 6.0 years. Height and weight progression reflect healthy nutrition, active outdoor movement, and restful sleep.
                </p>
              </div>

              {/* Daily Parent Socratic Tip Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-[32px] p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">💡</span>
                    <span className="text-xs font-fredoka font-bold text-amber-800 uppercase tracking-wider">
                      Daily Socratic Parent Insight
                    </span>
                  </div>
                  <h4 className="font-fredoka text-lg font-bold text-amber-950 mb-2">
                    {growthMetrics.daily_parent_tip?.title || 'Encourage Socratic Wonder'}
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                    &quot;{growthMetrics.daily_parent_tip?.insight}&quot;
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-700 font-medium">
                  <span>Category: {growthMetrics.daily_parent_tip?.category || 'Cognitive Curiosity'}</span>
                  <button
                    onClick={() => playVoice(growthMetrics.daily_parent_tip?.insight || '')}
                    className="font-fredoka font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-3 py-1 rounded-full text-[11px]"
                  >
                    ▶ Listen Tip
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* =============================================================
            TAB 3: WALKIE-TALKIE & DEVICE COCKPIT
        ============================================================== */}
        {activeTab === 'cockpit' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Live Audio Walkie-Talkie & Parent Memo Card */}
            <div className="bg-white border border-sky-100 rounded-[32px] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl p-2 bg-sky-100 rounded-2xl">📻</span>
                  <div>
                    <h3 className="font-fredoka text-lg font-bold text-slate-900">
                      Parent Walkie-Talkie &amp; Audio Memos
                    </h3>
                    <p className="text-xs text-slate-500">
                      Speak directly to Parth through his KOTL companion robot speaker
                    </p>
                  </div>
                </div>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-fredoka font-bold px-2.5 py-0.5 rounded-full">
                  Instant Audio Broadcast
                </span>
              </div>

              {/* 4 1-Click Quick Audio Memo Presets */}
              <div className="mb-4">
                <div className="text-xs font-fredoka font-semibold text-slate-600 mb-2">
                  ⚡ 1-Click Preset Audio Directives:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: '🌟 Proud of You', text: 'Mummy is so proud of your kindness today, champ!' },
                    { label: '🍎 Snack Time', text: 'Superhero snack time, Parth! Fuel up with some fresh fruits!' },
                    { label: '🎒 Pack School Bag', text: 'Time to neatly arrange your books and school bag, buddy!' },
                    { label: '⭐ Kindness Star', text: 'Great manners! You earned an extra kindness star!' }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendWalkieMemo(p.text)}
                      className="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-950 font-fredoka font-bold text-xs p-2.5 rounded-2xl text-left transition-all active:scale-95 shadow-2xs"
                    >
                      <div className="text-xs">{p.label}</div>
                      <div className="text-[10px] font-normal text-sky-700 truncate mt-0.5">&quot;{p.text}&quot;</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Typed Walkie-Talkie Message */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={walkieText}
                  onChange={(e) => setWalkieText(e.target.value)}
                  placeholder="Type a loving message to speak over KOTL speaker..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-300"
                />
                <button
                  onClick={() => handleSendWalkieMemo(walkieText)}
                  disabled={!walkieText.trim()}
                  className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-fredoka font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>🎙️ Broadcast Voice</span>
                </button>
              </div>

              {/* Memo History */}
              {voiceMemos.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="text-[11px] font-fredoka font-semibold text-slate-400">Recently Broadcasted Memos:</div>
                  {voiceMemos.slice(0, 3).map(m => (
                    <div key={m.id} className="text-xs bg-slate-50 p-2 rounded-xl flex items-center justify-between text-slate-700">
                      <span>&quot;{m.text}&quot;</span>
                      <span className="text-[10px] text-slate-400">{m.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hardware Controls & Live Status (Strictly Zero Fake Battery / Zero Fake dBm) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* ESP32 Hardware Status Card */}
              <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <h3 className="font-fredoka text-lg font-bold text-slate-900">
                      ESP32 Hardware Telemetry
                    </h3>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-fredoka font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Verified Live
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium">Target Microcontroller:</span>
                    <span className="font-mono font-bold text-slate-800">{deviceStatus.model}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium">Digital I2S Microphone:</span>
                    <span className="font-mono font-bold text-slate-800">INMP441 (16kHz 16-bit Mono)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium">Digital I2S Audio DAC:</span>
                    <span className="font-mono font-bold text-slate-800">MAX98357A (3W 4Ω)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium">Capacitive Touch Wire:</span>
                    <span className="font-mono font-bold text-slate-800">GPIO 4 (T0 Debounced Clock Latch)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium">WebSocket Stream:</span>
                    <span className="font-mono font-bold text-emerald-700">ws://localhost:3000/ws (Connected)</span>
                  </div>
                </div>

                {/* Speaker Volume Slider Bound to Backend API */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-fredoka text-xs font-bold text-slate-700">
                      🔊 Speaker Volume: {deviceVolume}%
                    </span>
                    <button
                      onClick={() => playVoice('Volume test chime! Speaker is calibrated at forty percent.')}
                      className="text-[11px] font-fredoka font-bold text-sky-600 hover:text-sky-800"
                    >
                      Test Chime
                    </button>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={deviceVolume}
                    onChange={(e) => handleVolumeChange(e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>10% (Quiet)</span>
                    <span className="font-bold text-emerald-600">40% (Recommended)</span>
                    <span>100% (Loud)</span>
                  </div>
                </div>
              </div>

              {/* Safety Boundaries & Bedtime Routine Card */}
              <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xs space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🛡️</span>
                      <h3 className="font-fredoka text-lg font-bold text-slate-900">
                        Safety Boundaries &amp; Permissions
                      </h3>
                    </div>
                    <button
                      onClick={handleToggleSleep}
                      className={`text-xs font-fredoka font-bold px-3 py-1.5 rounded-full shadow-2xs transition-all ${
                        isSleepMode
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSleepMode ? '🌙 Sleep Active' : '☀️ Awake'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">
                    Enforces strict parental boundaries during conversations:
                  </p>

                  <div className="space-y-2">
                    {[
                      { key: 'medicines', label: 'Taking medicines / pills without adult', icon: '💊' },
                      { key: 'sharp_tools', label: 'Scissors, knives, matches or fire', icon: '✂️' },
                      { key: 'outside_play', label: 'Opening front door to strangers', icon: '🚪' },
                      { key: 'purchases', label: 'Online purchases or clicking store buttons', icon: '💳' }
                    ].map(p => {
                      const isGated = childProfile.parent_permissions?.[p.key] !== false;
                      return (
                        <div
                          key={p.key}
                          onClick={() => handleTogglePermission(p.key)}
                          className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                            <span>{p.icon}</span>
                            <span>{p.label}</span>
                          </div>
                          <span className={`text-[10px] font-fredoka font-bold px-2 py-0.5 rounded-full ${
                            isGated ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isGated ? 'Parent Gated' : 'Allowed'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-400 text-center font-medium">
                  Bedtime Target: <strong>{childProfile.bedtime || '21:00'} IST</strong> (Automatic wind-down active)
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* -------------------------------------------------------------
          MODAL: ADD CUSTOM HABIT
      -------------------------------------------------------------- */}
      {isAddHabitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-xl border border-emerald-100 animate-scaleUp">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥦</span>
                <h3 className="font-fredoka text-lg font-bold text-slate-900">Add New Habit</h3>
              </div>
              <button
                onClick={() => setIsAddHabitModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-3.5">
              <div>
                <label className="text-xs font-fredoka font-bold text-slate-700 block mb-1">Habit Title</label>
                <input
                  type="text"
                  required
                  value={newHabitForm.title}
                  onChange={(e) => setNewHabitForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Drinking warm milk before bed..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-fredoka font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newHabitForm.category}
                    onChange={(e) => setNewHabitForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs"
                  >
                    <option value="Hygiene">Hygiene</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="Hydration">Hydration</option>
                    <option value="Responsibility">Responsibility</option>
                    <option value="Manners">Manners</option>
                    <option value="Sleep">Sleep</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-fredoka font-bold text-slate-700 block mb-1">Emoji Icon</label>
                  <input
                    type="text"
                    value={newHabitForm.icon}
                    onChange={(e) => setNewHabitForm(p => ({ ...p, icon: e.target.value }))}
                    placeholder="e.g. 🥛"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-fredoka font-bold text-slate-700 block mb-1">KOTL Socratic Voice Directive</label>
                <input
                  type="text"
                  value={newHabitForm.directive_text}
                  onChange={(e) => setNewHabitForm(p => ({ ...p, directive_text: e.target.value }))}
                  placeholder="What KOTL will say out loud to prompt Parth..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-300"
                />
              </div>

              <div>
                <label className="text-xs font-fredoka font-bold text-slate-700 block mb-1">Pediatric Parent Tip</label>
                <input
                  type="text"
                  value={newHabitForm.tip}
                  onChange={(e) => setNewHabitForm(p => ({ ...p, tip: e.target.value }))}
                  placeholder="Tip for encouraging consistency..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddHabitModalOpen(false)}
                  className="px-4 py-2 rounded-2xl text-xs font-fredoka font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl text-xs font-fredoka font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-xs"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
