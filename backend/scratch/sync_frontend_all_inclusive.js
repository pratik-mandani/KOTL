const fs = require('fs');

const pageContent = `'use client';

import React, { useState, useEffect } from 'react';
import KindergartenDoodles from '../components/KindergartenDoodles';

export default function KindergartenDashboard() {
  const [profile, setProfile] = useState({
    name: 'Parth',
    age: 6,
    gender: 'Boy',
    bedtime: '21:00',
    talkLimit: 30,
    volume: 80
  });

  const [currentSection, setCurrentSection] = useState('report');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [deviceOnline, setDeviceOnline] = useState(true);

  // Dynamic Habits & Missions State
  const [missions, setMissions] = useState([
    { id: '1', title: '🪥 Morning & Night Teeth Brushing', directive: 'Shiny strong teeth routine with circular strokes', category: 'good', active: true },
    { id: '2', title: '💧 Clean Water & Fresh Milk', directive: 'Healthy hydration all day after games', category: 'good', active: true },
    { id: '3', title: '🧸 Pack Toys in Organizer Box', directive: 'Tidy play area after playing games', category: 'good', active: true },
    { id: '4', title: '🤝 Say Please & Thank You', directive: 'Polite words with family and friends', category: 'good', active: true }
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newDirective, setNewDirective] = useState('');

  // Walkie-Talkie & Voice Memos State
  const [isRecording, setIsRecording] = useState(false);
  const [walkieStatus, setWalkieStatus] = useState('Tap to record a voice memo from Mummy or Papa');
  const [customMemoText, setCustomMemoText] = useState('');
  const [voiceMemos, setVoiceMemos] = useState([
    { id: 'vm-1', timestamp: 'Today, 10:30 AM', sender: 'Mummy', text: 'Parth beta, drink your fresh glass of water and stay energized!', preset: 'Drink Water', status: 'Delivered to KOTL' },
    { id: 'vm-2', timestamp: 'Yesterday, 08:45 PM', sender: 'Papa', text: 'Bedtime soon champ! Let us listen to KOTL star story and sleep on time.', preset: 'Bedtime Hug', status: 'Played by Parth' }
  ]);

  // Dialogue & Chat State
  const [chatMessages, setChatMessages] = useState([
    { role: 'user', text: "KOTL, how do stars shine at night, and can we fly a rocket to the moon?" },
    { role: 'assistant', text: "Stars are giant glowing suns far away in space, Parth! They twinkle because their light travels across the sky to say hello to you!" },
    { role: 'assistant', text: "Parth, remember to drink a fresh glass of water after your playground games!" },
    { role: 'user', text: "Stars are glowing suns with no rest, and space is full of big rockets!" },
    { role: 'assistant', text: "Did you finish eating your delicious greens today?" }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Limits State
  const [talkLimitMins, setTalkLimitMins] = useState(30);
  const [bedtimeVal, setBedtimeVal] = useState('21:00');
  const [robotVolume, setRobotVolume] = useState(80);
  const [safetyPerms, setSafetyPerms] = useState({
    medicines: true,
    sharp_tools: true,
    outside_play: true,
    purchases: true
  });

  const toggleMission = (id) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  const handleAddMission = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const item = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      directive: newDirective.trim() || 'Active companion mission',
      category: 'good',
      active: true
    };
    setMissions(prev => [item, ...prev]);
    setNewTitle('');
    setNewDirective('');
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

  const handleToggleWalkie = () => {
    if (!isRecording) {
      setIsRecording(true);
      setWalkieStatus('● Recording Voice Memo... Tap again to transmit to KOTL');
    } else {
      setIsRecording(false);
      setWalkieStatus('✓ Audio Memo Transmitted to KOTL Speaker!');
      const newMemo = {
        id: 'vm-' + Date.now(),
        timestamp: 'Just now',
        sender: 'Mummy',
        text: 'Live audio recording memo from mobile',
        preset: 'Live Audio',
        status: 'Delivered to KOTL'
      };
      setVoiceMemos(prev => [newMemo, ...prev]);
      setTimeout(() => {
        setWalkieStatus('Tap to record a voice memo from Mummy or Papa');
      }, 4000);
    }
  };

  const sendQuickVoice = (preset, text) => {
    const newMemo = {
      id: 'vm-' + Date.now(),
      timestamp: 'Just now',
      sender: 'Parent',
      text: text,
      preset: preset,
      status: 'Delivered to KOTL'
    };
    setVoiceMemos(prev => [newMemo, ...prev]);
    playVoice(text);
  };

  const sendCustomVoice = () => {
    if (!customMemoText.trim()) return;
    const newMemo = {
      id: 'vm-' + Date.now(),
      timestamp: 'Just now',
      sender: 'Parent',
      text: customMemoText.trim(),
      preset: 'Custom Note',
      status: 'Delivered to KOTL'
    };
    setVoiceMemos(prev => [newMemo, ...prev]);
    playVoice(customMemoText.trim());
    setCustomMemoText('');
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const userTurn = { role: 'user', text: inputMessage.trim() };
    setChatMessages(prev => [...prev, userTurn]);
    setInputMessage('');

    setTimeout(() => {
      const botTurn = { role: 'assistant', text: "That is super curious, Parth! Let us explore more about the universe and keep our shiny habits!" };
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

      <!-- TOP HEADER -->
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
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Smart Pediatric Growth, Health & Habit Companion</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
              <span className="text-emerald-500 text-sm">🔋</span>
              <span>88%</span>
            </div>

            <span id="deviceStatusPill" className="bg-emerald-50 text-emerald-700 text-xs px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full font-bold border border-emerald-300 flex items-center gap-1.5 sm:gap-2 shadow-sm whitespace-nowrap">
              <span className={\`w-2.5 h-2.5 rounded-full \${deviceOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}\`}></span>
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

      {/* 5 PURPOSE-DRIVEN SECTION TABS */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-1 pb-2">
        <div className="bg-amber-50/80 backdrop-blur-sm border-2 border-amber-200 rounded-2xl p-1.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shadow-xs">
          
          <button onClick={() => setCurrentSection('report')} className={\`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap \${currentSection === 'report' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}\`}>
            <span>📜</span>
            <span>Report & Skills</span>
          </button>

          <button onClick={() => setCurrentSection('habits')} className={\`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap \${currentSection === 'habits' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}\`}>
            <span>⚖️</span>
            <span>Habits & Growth</span>
          </button>

          <button onClick={() => setCurrentSection('walkie')} className={\`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap \${currentSection === 'walkie' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}\`}>
            <span>🎙️</span>
            <span>Walkie & Dialogue</span>
          </button>

          <button onClick={() => setCurrentSection('limits')} className={\`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap \${currentSection === 'limits' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}\`}>
            <span>🛡️</span>
            <span>Limits & Routine</span>
          </button>

          <button onClick={() => setCurrentSection('health')} className={\`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap \${currentSection === 'health' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}\`}>
            <span>🏥</span>
            <span>Health & Medical</span>
          </button>

        </div>
      </div>

      {/* MAIN VIEW CONTENT */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-2 pb-24">
        
        {/* VIEW 1: REPORT & SKILLS */}
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
                    <p className="text-slate-700 font-bold text-sm mt-0.5">{profile.age} Years • Class: Sr. KG</p>
                    <p className="text-slate-500 text-xs font-semibold">Companion: KOTL Buddy • Kindergarten Edition</p>
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

            {/* Child Skills & Superpowers Directory */}
            <div className="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🧠</span>
                  <h3 className="font-fredoka text-base sm:text-lg font-bold text-slate-800">Child Skills & Superpowers Directory</h3>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                  Active Competencies
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-sky-900">
                    <span>📚 Vocabulary Mastery</span>
                    <span className="font-mono text-sky-700">88% (140+ Words)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">Consistently grasps new scientific and descriptive terms in narrative story adventures.</p>
                  <div className="w-full bg-sky-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-900">
                    <span>🔭 Critical Scientific Inquiry</span>
                    <span className="font-mono text-emerald-700">94% (Exceptional)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">Drives dialogues with deep why and how mechanisms about astronomy, stars, and gravity.</p>
                  <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-purple-900">
                    <span>💖 Social & Emotional EQ</span>
                    <span className="font-mono text-purple-700">90% (High Empathy)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">Displays polite turn-taking during dialogue, cheerful emotional tone and empathy.</p>
                  <div className="w-full bg-purple-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                    <span>🧩 Narrative Memory & Recall</span>
                    <span className="font-mono text-amber-700">86% (Strong Retention)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">Recalls plot details and moral lessons taught in prior story chapters without prompting.</p>
                  <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '86%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 1-Minute Parent Executive Briefing */}
            <div className="bg-[#FFFDF2] border-2 border-[#F6D365] rounded-[32px] p-5 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <h3 className="font-fredoka text-base font-bold text-amber-950">Daily 1-Minute Parent Executive Briefing</h3>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-full">
                  Auto-Synthesized by KOTL
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Parth demonstrates exceptional inquisitiveness, bright verbal enthusiasm, and a joyful, imaginative spirit during conversations with KOTL. He shows strong memory retention when engaged in storytelling about space exploration, stars, and creative art. While his vocabulary and cognitive curiosity exceed standard developmental benchmarks for 6-year-olds, KOTL is actively providing supportive storytelling to help build enthusiastic habits around healthy nutrition and bedtime wind-down routines.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-amber-200/80 text-xs">
                <span className="text-slate-500 font-semibold">Mood: <strong className="text-emerald-700">Cheerful & Inquisitive</strong></span>
                <button onClick={() => window.print()} className="bg-amber-500 hover:bg-amber-600 text-white font-fredoka font-bold px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5">
                  <span>🖨️</span>
                  <span>Print School Report</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: HABITS & GROWTH */}
        {currentSection === 'habits' && (
          <div className="flex flex-col gap-5 max-w-4xl mx-auto">
            <div className="bg-white border-2 border-emerald-200 rounded-[32px] p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🟢</span>
                  <div>
                    <h3 className="font-fredoka text-base font-bold text-slate-800">Active Good Habits & Manners</h3>
                    <p className="text-[11px] text-slate-500">Established positive behaviors practiced daily by Parth</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">Active Sync</span>
              </div>

              <div className="space-y-2.5">
                {missions.map(m => (
                  <div key={m.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🟢</span>
                      <div>
                        <div className="text-xs font-bold text-slate-800 font-fredoka">{m.title}</div>
                        <div className="text-[11px] text-slate-500">{m.directive}</div>
                      </div>
                    </div>
                    <input type="checkbox" checked={m.active} onChange={() => toggleMission(m.id)} className="w-5 h-5 accent-sky-500 cursor-pointer" />
                  </div>
                ))}
              </div>
            </div>

            {/* Target Areas & Robot Action Plan */}
            <div className="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔴</span>
                  <div>
                    <h3 className="font-fredoka text-base font-bold text-slate-800">Habits to Improve & Robot Action Plan</h3>
                    <p className="text-[11px] text-slate-500">Nutritional reluctance, screen demands & KOTL intervention strategy</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">Superhero Strategy</span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🥬</span>
                    <span className="font-fredoka font-bold text-slate-800 text-xs sm:text-sm">Reluctance Toward Green Vegetables (Spinach & Broccoli)</span>
                    <span className="text-[9px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">Nutrition</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong>KOTL Superhero Action Plan:</strong> KOTL playfully shares stories of astronauts and superheroes gaining stamina and jump power from spinach, carrots, and clean greens.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <span className="font-fredoka font-bold text-slate-800 text-xs sm:text-sm">Demanding Screen Time & Cartoons Before Sleep</span>
                    <span className="text-[9px] bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full font-bold">Sleep Routine</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong>KOTL Superhero Action Plan:</strong> At 8:30 PM wind-down, KOTL initiates soothing ambient starlight audio, narrates gentle cosmic journeys, and relaxes eye tension.
                  </p>
                </div>
              </div>
            </div>

            {/* Add Custom Habit Form */}
            <form onSubmit={handleAddMission} className="bg-white border-2 border-amber-300 rounded-[32px] p-5 shadow-xs space-y-3">
              <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                <span>➕</span>
                <span>Add Custom Habit Directive</span>
              </h3>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Habit Title</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Wash hands thoroughly before eating" className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Companion Directive for KOTL</label>
                <input type="text" value={newDirective} onChange={e => setNewDirective(e.target.value)} placeholder="e.g. Cheerfully remind Parth to soap hands like a superhero washing shields" className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200" />
              </div>
              <div className="flex justify-end pt-1">
                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-fredoka font-bold text-xs px-5 py-2.5 rounded-xl shadow-md">
                  Save & Sync to KOTL
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 3: WALKIE-TALKIE & DIALOGUE */}
        {currentSection === 'walkie' && (
          <div className="flex flex-col gap-5 max-w-4xl mx-auto">
            {/* Walkie Transmitter */}
            <div className="bg-white border-2 border-sky-300 rounded-[32px] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎙️</span>
                  <div>
                    <h2 className="font-fredoka text-base sm:text-lg font-bold text-slate-800">Parent Walkie-Talkie & Voice Memo</h2>
                    <p className="text-xs text-slate-500">Transmit real voice audio directly to KOTL's speaker for Parth to hear</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  I2S DAC Active
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/40 border border-sky-200 flex flex-col items-center justify-center text-center space-y-3">
                <button onClick={handleToggleWalkie} className={\`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all \${isRecording ? 'bg-rose-500 text-white scale-110 animate-pulse' : 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white hover:scale-105'}\`}>
                  🎙️
                </button>
                <div className="text-xs font-bold text-slate-700">{walkieStatus}</div>

                <div className="w-full pt-2 border-t border-sky-200/60">
                  <span className="block text-[11px] font-bold text-slate-500 mb-2">Or Send Quick 1-Click Voice Memo:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                    <button onClick={() => sendQuickVoice('Drink Water', 'Parth beta, drink your fresh glass of water and stay energized!')} className="p-2.5 rounded-xl bg-white hover:bg-sky-100 border border-sky-200 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5">
                      <span>💧</span><span className="truncate">Drink Water</span>
                    </button>
                    <button onClick={() => sendQuickVoice('Eat Greens', 'Parth, remember your superhero green veggies for stamina!')} className="p-2.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-200 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5">
                      <span>🥦</span><span className="truncate">Lunch Greens</span>
                    </button>
                    <button onClick={() => sendQuickVoice('Pack Toys', 'Time to place toys neatly back into the organizer box, champion!')} className="p-2.5 rounded-xl bg-white hover:bg-emerald-100 border border-emerald-200 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5">
                      <span>🧸</span><span className="truncate">Pack Toys</span>
                    </button>
                    <button onClick={() => sendQuickVoice('Bedtime Hug', 'Bedtime soon Parth! Sweet dreams and warm hugs from Mummy and Papa!')} className="p-2.5 rounded-xl bg-white hover:bg-purple-100 border border-purple-200 text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-1.5">
                      <span>🌙</span><span className="truncate">Bedtime Hug</span>
                    </button>
                  </div>
                </div>

                <div className="w-full pt-1 flex items-center gap-2">
                  <input type="text" value={customMemoText} onChange={e => setCustomMemoText(e.target.value)} placeholder="Type a custom voice memo for KOTL to speak..." className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white" />
                  <button onClick={sendCustomVoice} className="bg-sky-500 hover:bg-sky-600 text-white font-fredoka font-bold text-xs px-4 py-2 rounded-xl shadow-xs">
                    Send to KOTL
                  </button>
                </div>
              </div>

              {/* Sent Logs */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Recent Voice Memos Delivered to KOTL</span>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {voiceMemos.map(m => (
                    <div key={m.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{m.sender} <span className="text-[10px] text-slate-400 font-normal">• {m.timestamp}</span></div>
                        <div className="text-[11px] text-slate-600 italic">"{m.text}"</div>
                      </div>
                      <button onClick={() => playVoice(m.text)} className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px]">▶</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversation Archive */}
            <div className="bg-white border-2 border-slate-200 rounded-[32px] p-5 shadow-sm space-y-4">
              <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                <span>💬</span><span>Live Companion Dialogue Feed</span>
              </h3>
              <div className="p-4 bg-[#FFFDF9] border border-slate-200 rounded-2xl space-y-4 max-h-[300px] overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={\`flex items-start gap-3 \${msg.role === 'assistant' ? 'justify-end' : ''}\`}>
                    {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-sm">👦</div>}
                    <div className={\`p-3.5 rounded-2xl max-w-[85%] text-xs \${msg.role === 'user' ? 'bg-[#EBF7FF] border border-sky-300' : 'bg-[#E8FBF0] border border-emerald-300'}\`}>
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <span className="font-bold">{msg.role === 'user' ? 'Parth asked:' : 'KOTL replied:'}</span>
                        <button onClick={() => playVoice(msg.text)} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200">▶</button>
                      </div>
                      <p className="font-medium">"{msg.text}"</p>
                    </div>
                    {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-sm">🤖</div>}
                  </div>
                ))}
              </div>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5">
                <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Type to converse with KOTL..." className="flex-1 bg-transparent text-xs outline-none px-2" />
                <button onClick={handleSendMessage} className="w-8 h-8 rounded-xl bg-sky-500 text-white font-bold">➤</button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: LIMITS & ROUTINE */}
        {currentSection === 'limits' && (
          <div className="flex flex-col gap-5 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border-2 border-sky-200 rounded-[32px] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-fredoka text-base font-bold text-slate-800">⏱️ Daily Talk Limit</h3>
                  <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">{talkLimitMins} Mins / Day</span>
                </div>
                <p className="text-xs text-slate-500">When limit is reached, KOTL gently suggests reading or homework.</p>
                <input type="range" min="15" max="90" step="15" value={talkLimitMins} onChange={e => setTalkLimitMins(Number(e.target.value))} className="w-full accent-sky-500" />
              </div>

              <div className="bg-white border-2 border-purple-200 rounded-[32px] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-fredoka text-base font-bold text-slate-800">🌙 Bedtime Curfew</h3>
                  <span className="font-mono text-xs font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full">{bedtimeVal} PM</span>
                </div>
                <p className="text-xs text-slate-500">At curfew, KOTL stops energetic chat and starts sleep lullabies.</p>
                <select value={bedtimeVal} onChange={e => setBedtimeVal(e.target.value)} className="w-full text-xs font-bold text-slate-700 p-2.5 rounded-xl border border-purple-200">
                  <option value="20:30">08:30 PM</option>
                  <option value="21:00">09:00 PM (Recommended)</option>
                  <option value="21:30">09:30 PM</option>
                </select>
              </div>
            </div>

            {/* Adult Safety Locks */}
            <div className="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-sm space-y-3.5">
              <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                <span>🔒</span><span>Mandatory Adult Permission Safety Locks</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div><strong>💊 Health & Medicines</strong><div className="text-[10px] text-slate-500">Never give self-medication advice</div></div>
                  <input type="checkbox" checked={safetyPerms.medicines} onChange={e => setSafetyPerms(p => ({ ...p, medicines: e.target.checked }))} className="w-5 h-5 accent-sky-500" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div><strong>✂️ Sharp Tools & Fire</strong><div className="text-[10px] text-slate-500">Warn child hot/sharp, ask parent</div></div>
                  <input type="checkbox" checked={safetyPerms.sharp_tools} onChange={e => setSafetyPerms(p => ({ ...p, sharp_tools: e.target.checked }))} className="w-5 h-5 accent-sky-500" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div><strong>🚪 Outside & Strangers</strong><div className="text-[10px] text-slate-500">Must hold parent hand</div></div>
                  <input type="checkbox" checked={safetyPerms.outside_play} onChange={e => setSafetyPerms(p => ({ ...p, outside_play: e.target.checked }))} className="w-5 h-5 accent-sky-500" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div><strong>💳 Purchases & Money</strong><div className="text-[10px] text-slate-500">Zero in-app or item buying</div></div>
                  <input type="checkbox" checked={safetyPerms.purchases} onChange={e => setSafetyPerms(p => ({ ...p, purchases: e.target.checked }))} className="w-5 h-5 accent-sky-500" />
                </div>
              </div>
            </div>

            {/* Scheduled Routine */}
            <div className="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-sm space-y-3">
              <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                <span>☀️</span><span>Daily Routine Timetable</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5"><span className="font-mono font-bold text-amber-800">07:30 AM</span><span>Morning Rise & Teeth Brushing Greeting</span></div>
                  <span className="text-emerald-600 font-bold">Active</span>
                </div>
                <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5"><span className="font-mono font-bold text-sky-800">01:30 PM</span><span>Healthy Lunch & Fresh Milk Reminder</span></div>
                  <span className="text-emerald-600 font-bold">Active</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5"><span className="font-mono font-bold text-purple-800">08:30 PM</span><span>Pajama Wind-Down & Sleep Star Story</span></div>
                  <span className="text-emerald-600 font-bold">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: HEALTH & MEDICAL HUB */}
        {currentSection === 'health' && (
          <div className="flex flex-col gap-5 max-w-4xl mx-auto">
            {/* Medical ID Card */}
            <div className="p-5 rounded-[32px] bg-[#E8FBF0] border-2 border-[#86EFAC] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🩺</span>
                  <div>
                    <h3 className="font-fredoka text-base font-bold text-emerald-950">Child Emergency Medical Identity</h3>
                    <p className="text-[11px] text-slate-600">Accessible for school or pediatric care providers</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-200/80 px-3 py-1 rounded-full">Blood Group: B+</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div className="p-3 rounded-2xl bg-white border border-emerald-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Allergies</span>
                  <div className="font-bold text-slate-800">Dust / Pollen (Mild)</div>
                  <p className="text-[10px] text-slate-500">Sensitive to bitter vegetable textures</p>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-emerald-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Pediatrician</span>
                  <div className="font-bold text-slate-800">Dr. A. Mehta, MD</div>
                  <p className="text-[10px] text-slate-500">Rainbow Kids Clinic</p>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Emergency</span>
                    <div className="font-bold text-slate-800">+91 98765 43210</div>
                  </div>
                  <a href="tel:+919876543210" className="bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl">📞 Call</a>
                </div>
              </div>
            </div>

            {/* Growth Vitals */}
            <div className="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-sm space-y-3">
              <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                <span>📏</span><span>Physical Growth & Vitals (6-Year Milestone)</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Height</span>
                  <div className="text-2xl font-black font-fredoka text-slate-800">116 cm</div>
                  <span className="text-[10px] text-emerald-600 font-bold">70th Percentile</span>
                </div>
                <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200">
                  <span className="text-[10px] font-bold text-sky-700 uppercase">Weight</span>
                  <div className="text-2xl font-black font-fredoka text-slate-800">21.5 kg</div>
                  <span className="text-[10px] text-emerald-600 font-bold">75th Percentile</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">BMI</span>
                  <div className="text-2xl font-black font-fredoka text-slate-800">15.9</div>
                  <span className="text-[10px] text-emerald-600 font-bold">Healthy Range</span>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                  <span className="text-[10px] font-bold text-purple-700 uppercase">Last Checkup</span>
                  <div className="text-lg font-bold font-fredoka text-slate-800 mt-1">Oct 2026</div>
                  <span className="text-[10px] text-slate-400">Dr. A. Mehta</span>
                </div>
              </div>
            </div>

            {/* Vaccination Schedule */}
            <div className="bg-white border-2 border-sky-200 rounded-[32px] p-5 shadow-sm space-y-3">
              <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                <span>💉</span><span>Vaccination & Immunization Tracker (IAP Chart)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex justify-between items-center">
                  <div><strong>MMR Booster</strong><div className="text-[10px] text-slate-500">April 2026</div></div>
                  <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">Completed</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex justify-between items-center">
                  <div><strong>DPT Booster 2</strong><div className="text-[10px] text-slate-500">July 2026</div></div>
                  <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">Completed</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200 flex justify-between items-center">
                  <div><strong>Typhoid Booster</strong><div className="text-[10px] text-slate-500">Due Nov 2026</div></div>
                  <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-bold">Upcoming</span>
                </div>
                <div className="p-3 rounded-2xl bg-sky-50/50 border border-sky-200 flex justify-between items-center">
                  <div><strong>Annual Flu Shot</strong><div className="text-[10px] text-slate-500">Due Dec 2026</div></div>
                  <span className="text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md font-bold">Upcoming</span>
                </div>
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

      {/* Fixed Mobile Bottom Nav (5 Intuitive Tabs) */}
      <nav id="mobileBottomNav" className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-2 border-amber-200 py-2 px-2 flex justify-around items-center z-50 lg:hidden shadow-lg">
        <button onClick={() => setCurrentSection('report')} className={\`flex flex-col items-center font-bold text-[10px] \${currentSection === 'report' ? 'text-sky-600' : 'text-slate-500'}\`}>
          <span className="text-lg">📜</span>
          <span>Report</span>
        </button>
        <button onClick={() => setCurrentSection('habits')} className={\`flex flex-col items-center font-bold text-[10px] \${currentSection === 'habits' ? 'text-sky-600' : 'text-slate-500'}\`}>
          <span className="text-lg">⚖️</span>
          <span>Habits</span>
        </button>
        <button onClick={() => setCurrentSection('walkie')} className={\`flex flex-col items-center font-bold text-[10px] \${currentSection === 'walkie' ? 'text-sky-600' : 'text-slate-500'}\`}>
          <span className="text-lg">🎙️</span>
          <span>Walkie</span>
        </button>
        <button onClick={() => setCurrentSection('limits')} className={\`flex flex-col items-center font-bold text-[10px] \${currentSection === 'limits' ? 'text-sky-600' : 'text-slate-500'}\`}>
          <span className="text-lg">🛡️</span>
          <span>Limits</span>
        </button>
        <button onClick={() => setCurrentSection('health')} className={\`flex flex-col items-center font-bold text-[10px] \${currentSection === 'health' ? 'text-sky-600' : 'text-slate-500'}\`}>
          <span className="text-lg">🏥</span>
          <span>Health</span>
        </button>
      </nav>

      {/* Child Profile Modal */}
      {isProfileModalOpen && (
        <div id="childProfileModal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-300 rounded-[32px] p-6 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
            <h2 className="font-fredoka text-xl font-bold text-slate-800 mb-2">Child Profile & Safety Settings</h2>
            <div className="flex flex-col gap-3 text-xs font-semibold text-slate-700">
              <div><label className="block mb-1">Child Name</label><input type="text" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
              <div><label className="block mb-1">Age</label><input type="number" value={profile.age} onChange={(e) => setProfile(p => ({ ...p, age: parseInt(e.target.value, 10) }))} className="w-full px-3 py-2 rounded-xl border border-slate-200" /></div>
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold font-fredoka">Save & Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Free Tier Active</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span>Groq LLaMA 3.3 70B</span>
                <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">100K Tokens/Day</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span>Microsoft Edge TTS</span>
                <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Unlimited Free</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
`;

fs.writeFileSync('frontend/app/page.jsx', pageContent, 'utf8');
console.log('Successfully synchronized all-inclusive architecture to frontend/app/page.jsx');
