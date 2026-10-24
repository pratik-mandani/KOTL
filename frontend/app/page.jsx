'use client';

import React, { useState, useEffect } from 'react';
import KindergartenDoodles from '../components/KindergartenDoodles';

export default function KindergartenDashboard() {
  const [profile, setProfile] = useState({
    name: 'Parth',
    age: 6,
    gender: 'Boy',
    bedtime: '21:00'
  });
  const [currentSection, setCurrentSection] = useState('report');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [deviceOnline, setDeviceOnline] = useState(true);

  // Dynamic Habits & Missions State
  const [missions, setMissions] = useState([
    { id: '1', title: '🪥 Morning & Night Brushing', directive: 'Shiny strong teeth routine', category: 'good', active: true },
    { id: '2', title: '💧 Clean Water & Fresh Milk', directive: 'Healthy hydration all day', category: 'good', active: true },
    { id: '3', title: '🥬 Eating Veggies & Spinach', directive: 'Superhero stamina fuel', category: 'good', active: true },
    { id: '4', title: '📖 20 Mins Spoken English Practice', directive: 'Interactive questions in simple English', category: 'skill', active: true },
    { id: '5', title: '⚠️ Limit Screen Time Before Sleep', directive: 'Rest eyes and gentle wind-down', category: 'avoid', active: true }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newDirective, setNewDirective] = useState('');
  const [newCategory, setNewCategory] = useState('good');

  // Dynamic Chat State
  const [chatMessages, setChatMessages] = useState([
    { role: 'user', text: "KOTL, how do stars shine at night, and can we fly a rocket to the moon?" },
    { role: 'assistant', text: "Stars shine because they are giant balls of glowing gas, and yes! Astronauts travel on powerful rockets into space!" },
    { role: 'assistant', text: "Parth, remember to drink a fresh glass of water after your playground games!" },
    { role: 'user', text: "Stars are glowing suns with no rest, and space is full of big rockets!" },
    { role: 'assistant', text: "Did you finish eating your delicious greens today?" }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const toggleMission = (id) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  const deleteMission = (id) => {
    setMissions(prev => prev.filter(m => m.id !== id));
  };

  const handleAddMission = (e) => {
    e.preventDefault();
    if (!newTitle) return;
    const item = {
      id: Date.now().toString(),
      title: newTitle,
      directive: newDirective || 'Active companion mission',
      category: newCategory,
      active: true
    };
    setMissions(prev => [...prev, item]);
    setNewTitle('');
    setNewDirective('');
  };

  const applyPreset = (title, directive, category) => {
    setNewTitle(title);
    setNewDirective(directive);
    setNewCategory(category);
  };

  const playVoice = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-IN';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const userTurn = { role: 'user', text: inputMessage.trim() };
    setChatMessages(prev => [...prev, userTurn]);
    setInputMessage('');

    // Simulate smart pediatric response
    setTimeout(() => {
      const botTurn = { role: 'assistant', text: "That is wonderfully curious, Parth! Let's explore more about space and keep practicing our shiny habits!" };
      setChatMessages(prev => [...prev, botTurn]);
      playVoice(botTurn.text);
    }, 600);
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setDeviceOnline(data.online !== false);
        }
      } catch (_) {}
    };
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col antialiased bg-[#FFFDF9] relative font-nunito selection:bg-amber-200">
      
      {/* Kindergarten Doodles Background */}
      <KindergartenDoodles />

      {/* Top Header / Navigation Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-4 pb-2">
        <div className="bg-white/95 backdrop-blur-md border-2 border-amber-200 rounded-3xl px-3.5 sm:px-5 py-2.5 sm:py-3.5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 flex items-center justify-center text-white text-lg sm:text-xl shadow-md shadow-sky-500/20 flex-shrink-0">
              🧸
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-fredoka text-lg sm:text-xl font-bold tracking-tight text-slate-800">KOTL KIDS</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-amber-300">
                  Kindergarten
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Intelligent Pediatric Companion & Smart Behavioral Habit Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span id="deviceStatusPill" className="bg-emerald-50 text-emerald-700 text-xs px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full font-bold border border-emerald-300 flex items-center gap-1.5 sm:gap-2 shadow-sm whitespace-nowrap">
              <span className={`w-2.5 h-2.5 rounded-full ${deviceOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>• ESP32 Live</span>
            </span>

            <button onClick={() => setIsQuotaModalOpen(true)} title="Free API Limits & Engine" className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-700 flex items-center justify-center text-sm sm:text-base transition-colors shadow-sm">
              📊
            </button>

            <button onClick={() => setIsProfileModalOpen(true)} title="Child Profile & Settings" className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 flex items-center justify-center text-sm sm:text-base transition-colors shadow-sm">
              ⚙️
            </button>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-sky-100 border border-sky-300 text-sky-800 flex items-center justify-center text-sm sm:text-base font-bold shadow-sm">
              👦
            </div>
          </div>
        </div>
      </header>

      {/* SECTION-WISE PLAYFUL NAVIGATION MENU (No All tab) */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-1 pb-2">
        <div className="bg-amber-50/80 backdrop-blur-sm border-2 border-amber-200 rounded-2xl p-1.5 flex items-center gap-2 overflow-x-auto shadow-xs">
          
          <button onClick={() => setCurrentSection('report')} className={`px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'report' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>📜</span>
            <span>Report & Marks</span>
          </button>

          <button onClick={() => setCurrentSection('habits')} className={`px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'habits' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>🎯</span>
            <span>Habits & Skills</span>
          </button>

          <button onClick={() => setCurrentSection('dialogue')} className={`px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'dialogue' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>💬</span>
            <span>Dialogue & Voice</span>
          </button>

          <button onClick={() => setCurrentSection('care')} className={`px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'care' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>🦁</span>
            <span>Curiosity & Care</span>
          </button>

        </div>
      </div>

      {/* Main Dynamic View Content */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 pb-24">
        
        {/* VIEW 1: REPORT & MARKS */}
        {currentSection === 'report' && (
          <div className="flex flex-col gap-5 max-w-4xl mx-auto">
            {/* Parth Hero Profile Card */}
            <div className="p-5 sm:p-6 relative overflow-hidden bg-[#FFFDF0] border-[3px] border-[#F6D365] rounded-[38px] shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[22px] bg-blue-600 flex items-center justify-center text-2xl sm:text-3xl shadow-md text-white flex-shrink-0">👦</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold font-fredoka text-slate-800">{profile.name}</h1>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-300">• ESP32 Live</span>
                    </div>
                    <p className="text-slate-700 font-bold text-sm mt-0.5">{profile.age} Years</p>
                    <p className="text-slate-500 text-xs font-semibold">Class: Sr. KG • KID: KOTL Buddy</p>
                  </div>
                </div>

                <div className="relative w-18 h-18 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                    <circle cx="50" cy="50" r="46" fill="#F59E0B" />
                    <path d="M 50 2 C 55 2 60 7 64 10 C 69 7 75 10 77 15 C 82 14 87 19 87 25 C 92 27 94 33 93 39 C 97 43 97 49 95 55 C 97 61 94 67 90 71 C 91 77 86 82 81 84 C 78 89 72 91 67 89 C 63 93 57 95 51 94 C 45 95 39 93 35 89 C 30 91 24 89 21 84 C 16 82 11 77 12 71 C 8 67 5 61 7 55 C 5 49 5 43 9 39 C 8 33 10 27 15 25 C 15 19 20 14 25 15 C 27 10 33 7 38 10 C 42 7 47 2 50 2 Z" fill="#D97706" />
                    <circle cx="50" cy="50" r="41" fill="#F59E0B" />
                    <circle cx="50" cy="50" r="36" fill="none" stroke="#FEF3C7" strokeWidth="2" strokeDasharray="3 3" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white select-none">
                    <span className="text-[9px] font-bold tracking-wider uppercase opacity-90 leading-tight">Grade</span>
                    <span className="font-fredoka text-xl sm:text-2xl font-black leading-none my-0.5">A+</span>
                    <span className="text-[9px] font-semibold opacity-90 leading-tight">(89/100)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Chunky Metric Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-sky-50 border-2 border-sky-300 rounded-3xl p-3.5 shadow-sm text-center">
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Overall Star</span>
                <div className="text-2xl sm:text-3xl font-extrabold font-fredoka text-sky-900 mt-0.5">89<span className="text-xs font-normal text-sky-600">/100</span></div>
                <div className="w-full bg-sky-200 h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: '89%' }}></div>
                </div>
              </div>

              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-3.5 shadow-sm text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">English</span>
                <div className="text-2xl sm:text-3xl font-extrabold font-fredoka text-amber-900 mt-0.5">88%</div>
                <div className="w-full bg-amber-200 h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-3.5 shadow-sm text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Space</span>
                <div className="text-2xl sm:text-3xl font-extrabold font-fredoka text-emerald-900 mt-0.5">94%</div>
                <div className="w-full bg-emerald-200 h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>

              <div className="bg-teal-50 border-2 border-teal-300 rounded-3xl p-3.5 shadow-sm text-center">
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Good Habits</span>
                <div className="text-2xl sm:text-3xl font-extrabold font-fredoka text-teal-900 mt-0.5">78%</div>
                <div className="w-full bg-teal-200 h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>

            {/* 5 Wavy Marksheet Cards */}
            <div className="flex flex-col gap-3.5">
              <div className="bg-[#EBF7FF] border-[2.5px] border-[#7DD3FC] rounded-[32px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="text-center flex-shrink-0"><span className="text-2xl">⭐</span><div className="text-xs font-bold font-fredoka text-sky-800">88/100</div></div>
                  <div><h4 className="font-fredoka text-sm sm:text-base font-bold text-slate-800">Spoken English & Words</h4><p className="text-xs text-slate-600 line-clamp-2">Parental remarks: a companion willingly stars & fluent with 2-3 syllable expressions.</p></div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold border border-emerald-300 whitespace-nowrap">Grade A (Fluent)</span>
              </div>

              <div className="bg-[#FFF4E8] border-[2.5px] border-[#FDBA74] rounded-[32px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="text-center flex-shrink-0"><span className="text-2xl">⭐</span><div className="text-xs font-bold font-fredoka text-amber-800">94/100</div></div>
                  <div><h4 className="font-fredoka text-sm sm:text-base font-bold text-slate-800">Science, Space & Curiosity</h4><p className="text-xs text-slate-600 line-clamp-2">Curious remarks: eager engaging to feed your mindset about rockets and cosmic orbits.</p></div>
                </div>
                <span className="bg-cyan-100 text-cyan-800 text-xs px-2.5 py-1 rounded-full font-bold border border-cyan-300 whitespace-nowrap">Grade A+ (Curious)</span>
              </div>

              <div className="bg-[#E8FBF0] border-[2.5px] border-[#86EFAC] rounded-[32px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="text-center flex-shrink-0"><span className="text-2xl">⭐</span><div className="text-xs font-bold font-fredoka text-emerald-800">90/100</div></div>
                  <div><h4 className="font-fredoka text-sm sm:text-base font-bold text-slate-800">Good Habits & Politeness</h4><p className="text-xs text-slate-600 line-clamp-2">Companion remarks: nice and courtesy engaged sensitivity, respectful turn-taking in play.</p></div>
                </div>
                <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold border border-amber-300 whitespace-nowrap">Grade A</span>
              </div>

              <div className="bg-[#FFF0F2] border-[2.5px] border-[#FCA5A5] rounded-[32px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="text-center flex-shrink-0"><span className="text-2xl">⭐</span><div className="text-xs font-bold font-fredoka text-rose-800">82/100</div></div>
                  <div><h4 className="font-fredoka text-sm sm:text-base font-bold text-slate-800">Creativity & Studies</h4><p className="text-xs text-slate-600 line-clamp-2">Story habits: loves curious storytelling and executing imaginative spaceship designs.</p></div>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold border border-blue-300 whitespace-nowrap">Grade A+ (Creative)</span>
              </div>

              <div className="bg-[#EEF4FF] border-[2.5px] border-[#93C5FD] rounded-[32px] p-4 sm:p-5 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="text-center flex-shrink-0"><span className="text-2xl">⭐</span><div className="text-xs font-bold font-fredoka text-indigo-800">78/100</div></div>
                  <div><h4 className="font-fredoka text-sm sm:text-base font-bold text-slate-800">Listening & Bedtime Routines</h4><p className="text-xs text-slate-600 line-clamp-2">Pleasing habits: swift connection playful and bedtime-routine gentle wind-down.</p></div>
                </div>
                <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-full font-bold border border-rose-300 whitespace-nowrap">Grade B+</span>
              </div>
            </div>

            {/* Lined Memo Pad Summary with Paperclip */}
            <div className="p-5 sm:p-6 pt-7 sm:pt-8 relative bg-[#FEFCE8] border-[2.5px] border-[#FACC15] rounded-[24px] shadow-sm mt-2">
              <div className="absolute -top-3.5 right-7 w-5 h-12 border-[3px] border-slate-400 rounded-t-xl pointer-events-none"></div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📋</span>
                <h3 className="font-fredoka text-lg font-bold text-amber-950">Companion Qualitative Summary</h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-700 font-medium pr-4 mb-4">
                Parth demonstrates exceptional inquisitiveness, bright verbal enthusiasm, and a joyful, imaginative spirit during conversations with KOTL. He shows strong memory retention when engaged in storytelling about Space & Stars Exploration and Drawing, Colors & Creative Art.
              </p>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-amber-300/40">
                <span className="bg-amber-200/80 text-amber-900 text-xs px-3 py-1 rounded-full font-bold border border-amber-300">✔ Space Explorer</span>
                <span className="bg-amber-200/80 text-amber-900 text-xs px-3 py-1 rounded-full font-bold border border-amber-300">✔ Creative Mind</span>
                <span className="bg-amber-200/80 text-amber-900 text-xs px-3 py-1 rounded-full font-bold border border-amber-300">✔ Well Mannered</span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: HABITS & SKILLS DIRECTIVES */}
        {currentSection === 'habits' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            {/* Form */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <h2 className="font-fredoka text-lg sm:text-xl font-bold text-slate-800">Parent Directives & Habit Missions</h2>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Configure good habits, skill training, or gentle boundaries for KOTL to lovingly reinforce with Parth.
                  </p>
                </div>
                <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-bold border border-amber-300 whitespace-nowrap">
                  {missions.filter(m => m.active).length} Active
                </span>
              </div>

              {/* Presets */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs font-fredoka">
                <span className="text-slate-500 font-bold self-center mr-1">Quick Presets:</span>
                <button onClick={() => applyPreset('Brush Teeth Twice Daily', 'Cheerfully remind Parth about shiny white teeth every morning and before sleep.', 'good')} className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 font-bold">🪥 Brush Teeth</button>
                <button onClick={() => applyPreset('Eat Healthy Green Veggies', 'Highlight how carrots and spinach give champions superhero stamina.', 'good')} className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold">🥦 Green Veggies</button>
                <button onClick={() => applyPreset('Tidy Up Toys After Play', 'Encourage placing toys and drawing colors back in the organizer box.', 'good')} className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold">🧸 Tidy Toys</button>
                <button onClick={() => applyPreset('20 Mins Spoken English Practice', 'Narrate engaging story questions about space and animals in clean simple English.', 'skill')} className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-800 font-bold">📖 English Skill</button>
                <button onClick={() => applyPreset('Limit Screen Time & Rest Eyes', 'Gently recommend pausing games to rest eyes and stretch like a cheetah.', 'avoid')} className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-bold">⚠️ Screen Limits</button>
              </div>

              {/* Form Input */}
              <form onSubmit={handleAddMission} className="pt-3 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-fredoka">Habit / Mission Title</label>
                    <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Clean Water Hydration" className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-400" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-fredoka">Category</label>
                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-400">
                      <option value="good">🟢 Good Habit</option>
                      <option value="skill">🌟 Skill Growth</option>
                      <option value="avoid">⚠️ Habit to Avoid / Boundary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-fredoka">KOTL Companion Directive</label>
                    <input type="text" value={newDirective} onChange={e => setNewDirective(e.target.value)} placeholder="e.g. Lovingly encourage drinking water" className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-400" required />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold font-fredoka shadow-md shadow-amber-500/20">
                    + Add Habit Directive
                  </button>
                </div>
              </form>
            </div>

            {/* Categorized Habit Lists */}
            <div className="space-y-4">
              {/* Good Habits */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-lg">🟢</span>
                  <h3 className="font-fredoka text-base font-bold text-slate-800">Good Habits & Healthcare Routines</h3>
                </div>
                {missions.filter(m => m.category === 'good').map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-2 border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🟢</span>
                      <div>
                        <div className="text-xs font-bold text-slate-800 font-fredoka">{m.title}</div>
                        <div className="text-[11px] text-slate-500">{m.directive}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={m.active} onChange={() => toggleMission(m.id)} className="w-5 h-5 accent-emerald-500 cursor-pointer" />
                      <button onClick={() => deleteMission(m.id)} className="text-slate-400 hover:text-rose-500 text-sm">✕</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Skill Growth */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-lg">🌟</span>
                  <h3 className="font-fredoka text-base font-bold text-slate-800">Skill Growth & Linguistic Development</h3>
                </div>
                {missions.filter(m => m.category === 'skill').map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-2 border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🌟</span>
                      <div>
                        <div className="text-xs font-bold text-slate-800 font-fredoka">{m.title}</div>
                        <div className="text-[11px] text-slate-500">{m.directive}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={m.active} onChange={() => toggleMission(m.id)} className="w-5 h-5 accent-sky-500 cursor-pointer" />
                      <button onClick={() => deleteMission(m.id)} className="text-slate-400 hover:text-rose-500 text-sm">✕</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Habits to Avoid */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-lg">⚠️</span>
                  <h3 className="font-fredoka text-base font-bold text-slate-800">Gentle Guidance & Boundaries to Avoid</h3>
                </div>
                {missions.filter(m => m.category === 'avoid').map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white border-2 border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <div className="text-xs font-bold text-slate-800 font-fredoka">{m.title}</div>
                        <div className="text-[11px] text-slate-500">{m.directive}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={m.active} onChange={() => toggleMission(m.id)} className="w-5 h-5 accent-amber-500 cursor-pointer" />
                      <button onClick={() => deleteMission(m.id)} className="text-slate-400 hover:text-rose-500 text-sm">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: DIALOGUE & VOICE */}
        {currentSection === 'dialogue' && (
          <div className="flex flex-col gap-4 max-w-4xl mx-auto h-[calc(100vh-210px)] min-h-[500px]">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-3.5 px-5 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-fredoka font-bold text-slate-800 text-sm sm:text-base">Conversation Archive</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                  Live Synced (Parth & KOTL)
                </span>
              </div>
              <button onClick={() => setChatMessages([])} className="text-xs text-slate-500 hover:text-rose-600 font-bold font-fredoka">
                🗑️ Clear History
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FFFDF9] border-2 border-slate-200 rounded-3xl">
              <div className="flex flex-col gap-4 max-w-2xl mx-auto">
                {chatMessages.map((msg, i) => (
                  msg.role === 'user' ? (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-sm flex-shrink-0 mt-1">👦</div>
                      <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl rounded-tl-none p-3 shadow-sm max-w-[85%]">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-sky-700">Parth</span>
                          <button onClick={() => playVoice(msg.text)} className="w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] shadow-sm">▶</button>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed font-medium">"{msg.text}"</p>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex items-start justify-end gap-2.5">
                      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl rounded-tr-none p-3 shadow-sm max-w-[85%]">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-emerald-700">KOTL Robot</span>
                          <button onClick={() => playVoice(msg.text)} className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-300 flex items-center gap-1">
                            🔊 Audio Play
                          </button>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed font-medium">"{msg.text}"</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-sm flex-shrink-0 mt-1">🤖</div>
                    </div>
                  )
                ))}
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-3xl p-2.5 shadow-sm">
              <div className="flex items-center bg-slate-50 border-2 border-slate-200 rounded-2xl px-3 py-1.5 focus-within:bg-white focus-within:border-sky-400 transition-all">
                <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message to talk to KOTL..." className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-900 outline-none px-2" />
                <button onClick={handleSendMessage} className="w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center font-bold shadow-md">
                  ➤
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: CURIOSITY & CARE */}
        {currentSection === 'care' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#FFEFE8] border-[2.5px] border-[#F97316] rounded-[32px] p-5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 border border-orange-300 flex items-center justify-center text-3xl mb-2 shadow-sm">🦁</div>
                  <h4 className="font-fredoka text-base font-bold text-slate-800 leading-tight">Prehistoric & Animal Science</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">Displays lively fascination for wildlife habitats, lion prides, animal species, and natural wonders with deep observation.</p>
                </div>
                <div className="mt-4 flex justify-end text-orange-500 opacity-75 text-2xl">⚛️</div>
              </div>

              <div className="bg-[#E7F9EE] border-[2.5px] border-[#10B981] rounded-[32px] p-5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-3xl mb-2 shadow-sm">🚀</div>
                  <h4 className="font-fredoka text-base font-bold text-slate-800 leading-tight">Space Exploration & Rocketry</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">Fascinated by planetary orbits, astronauts floating in zero gravity, rocket propulsion, and cosmic star constellations.</p>
                </div>
                <div className="mt-4 flex justify-end text-emerald-600 opacity-75 text-2xl">🪐</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#DCFCE7] border-[2.5px] border-[#22C55E] rounded-[34px] p-4 relative">
                <div className="flex items-center gap-2 mb-1.5 text-emerald-800 font-bold text-sm"><span className="text-lg">🥬</span><span>Bitter Vegetables</span></div>
                <p className="text-xs text-emerald-950 font-medium leading-relaxed">Prefers spinach pureed or mild in cream sauce; sensitive to raw bitter textures.</p>
              </div>

              <div className="bg-[#E0E7FF] border-[2.5px] border-[#6366F1] rounded-[34px] p-4 relative">
                <div className="flex items-center gap-2 mb-1.5 text-indigo-900 font-bold text-sm"><span className="text-lg">🌙</span><span>Dark Rooms</span></div>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed">Prefers soft warm 2700K ambient night light; calmed by gentle bedtime story melodies.</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Cloud Wave Footer */}
      <div className="relative w-full overflow-hidden leading-none z-0 mt-8">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-12 text-[#FFF7E6] fill-current">
          <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z"></path>
        </svg>
        <div className="bg-[#FFF7E6] py-3 text-center text-xs text-amber-900/60 font-semibold">
          KOTL Kids Pediatric Behavioral & Intelligence Companion • Pure Kindergarten Edition
        </div>
      </div>

      {/* Fixed Mobile Bottom Nav */}
      <nav id="mobileBottomNav" className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-2 border-amber-200 py-2 px-4 flex justify-around items-center z-50 lg:hidden shadow-lg">
        <button onClick={() => setCurrentSection('report')} className={`flex flex-col items-center font-bold text-[11px] ${currentSection === 'report' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">📜</span>
          <span>Report</span>
        </button>
        <button onClick={() => setCurrentSection('habits')} className={`flex flex-col items-center font-bold text-[11px] ${currentSection === 'habits' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">🎯</span>
          <span>Habits</span>
        </button>
        <button onClick={() => setCurrentSection('dialogue')} className={`flex flex-col items-center font-bold text-[11px] ${currentSection === 'dialogue' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">💬</span>
          <span>Dialogue</span>
        </button>
        <button onClick={() => setCurrentSection('care')} className={`flex flex-col items-center font-bold text-[11px] ${currentSection === 'care' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">🦁</span>
          <span>Care</span>
        </button>
      </nav>

      {/* Free API Quota Modal */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 space-y-4 bg-white border-2 border-amber-300 rounded-[32px] shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <h3 className="font-bold text-base text-slate-800 font-fredoka">Free API Limits & Engine</h3>
              </div>
              <button onClick={() => setIsQuotaModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm">✕</button>
            </div>
            <div className="space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex justify-between items-center p-3 rounded-2xl bg-sky-50 border border-sky-200">
                <span>Groq Whisper STT</span>
                <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Free Tier</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span>Groq LLaMA 3.3 70B</span>
                <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">100K Tokens/Day</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span>Microsoft Edge TTS</span>
                <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Unlimited / Free</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Child Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-300 rounded-[32px] p-6 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
            <h2 className="font-fredoka text-xl font-bold text-slate-800 mb-2">Child Profile & Safety Settings</h2>
            <div className="flex flex-col gap-3 text-xs font-semibold text-slate-700">
              <div><label className="block mb-1">Child Name</label><input type="text" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
              <div><label className="block mb-1">Age</label><input type="number" value={profile.age} onChange={(e) => setProfile(p => ({ ...p, age: parseInt(e.target.value, 10) }))} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold font-fredoka">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
