'use client';

import React, { useState, useEffect, useRef } from 'react';
import KindergartenDoodles from '../components/KindergartenDoodles';
import {
  Sparkles,
  BookOpen,
  Trophy,
  Smile,
  Mic,
  Send,
  RefreshCw,
  Printer,
  Settings,
  Wifi,
  Activity,
  Award,
  Volume2,
  Trash2,
  CheckCircle2,
  Star,
  Heart,
  Lightbulb,
  Compass,
  Plus
} from 'lucide-react';

export default function KindergartenDashboard() {
  const [currentTab, setCurrentTab] = useState('report');
  const [profile, setProfile] = useState({
    name: 'Parth',
    age: '6 Years',
    gender: 'Boy',
    bedtime: '21:00',
    parent_permissions: { medicines: true, sharp_tools: true, outside_play: true, purchases: true }
  });
  const [report, setReport] = useState(null);
  const [missions, setMissions] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isUpdatingReport, setIsUpdatingReport] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('Live');

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Daily Habits Interactive Checklist State (Bouncy rounded pill toggles)
  const [habits, setHabits] = useState([
    { id: 1, title: '🪥 Morning & Night Brushing', subtitle: 'Shiny strong teeth routine', done: true, color: 'border-sky-300 bg-sky-50 text-sky-900' },
    { id: 2, title: '🥛 Clean Water & Fresh Milk', subtitle: 'Healthy hydration all day', done: true, color: 'border-emerald-300 bg-emerald-50 text-emerald-900' },
    { id: 3, title: '🥗 Eating Veggies & Spinach', subtitle: 'Superhero stamina fuel', done: false, color: 'border-amber-300 bg-amber-50 text-amber-900' },
    { id: 4, title: '🧸 Tidy Up Toys & School Bag', subtitle: 'Neat toy organizer box', done: true, color: 'border-purple-300 bg-purple-50 text-purple-900' },
    { id: 5, title: '📖 20 Mins English Stories', subtitle: 'Bedtime story with KOTL', done: false, color: 'border-indigo-300 bg-indigo-50 text-indigo-900' },
    { id: 6, title: '🌙 Sleep by 9:00 PM', subtitle: 'No screen before bedtime', done: false, color: 'border-rose-300 bg-rose-50 text-rose-900' },
  ]);

  const toggleHabit = (id) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/child/report');
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (e) {
      console.warn('Error fetching report:', e);
    }
  };

  const fetchMissions = async () => {
    try {
      const res = await fetch('/api/child/missions');
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions || []);
      }
    } catch (e) {
      console.warn('Error fetching missions:', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/chat/history?sessionId=default-session');
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data.history || []);
      }
    } catch (e) {
      console.warn('Error fetching history:', e);
    }
  };

  const pollStatus = async () => {
    try {
      const res = await fetch('/api/device/status');
      if (res.ok) {
        const data = await res.json();
        setDeviceStatus(data.online !== false ? 'Live' : 'Standby');
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchReport();
    fetchMissions();
    fetchHistory();
    pollStatus();
    const timer = setInterval(pollStatus, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatInput('');
    const newTurn = { role: 'user', content: userText, timestamp: new Date().toISOString() };
    setChatHistory(prev => [...prev, newTurn]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, sessionId: 'default-session' })
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply || '', timestamp: new Date().toISOString() }]);
        fetchReport();
      }
    } catch (err) {
      console.error('Chat error:', err);
    }
  };

  const playVoice = (text) => {
    const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}`);
    audio.play().catch(e => console.warn('Audio playback error:', e));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#1E293B] relative font-['Nunito'] overflow-x-hidden">
      <KindergartenDoodles />

      {/* Header Navigation */}
      <header className="h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b-2 border-slate-100 px-4 sm:px-8 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-1.5 font-bold text-xl sm:text-2xl font-['Fredoka']">
            <span className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">K</span>
            <span className="w-8 h-8 rounded-xl bg-amber-400 text-white flex items-center justify-center shadow-xs">O</span>
            <span className="w-8 h-8 rounded-xl bg-sky-400 text-white flex items-center justify-center shadow-xs">T</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-400 text-white flex items-center justify-center shadow-xs">L</span>
            <span className="ml-1 text-slate-800 tracking-tight">KIDS</span>
          </div>
          <div className="hidden sm:block border-l-2 border-slate-200 pl-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Preschool Companion</span>
            <span className="text-xs text-slate-600 font-bold">Growth & Learning Hub</span>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="hidden md:flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 space-x-1.5 text-xs sm:text-sm font-bold font-['Fredoka']">
          <button
            onClick={() => setCurrentTab('report')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              currentTab === 'report' ? 'bg-sky-400 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📜 Report Card</span>
          </button>
          <button
            onClick={() => setCurrentTab('missions')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              currentTab === 'missions' ? 'bg-sky-400 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>🎯 Habits & Goals</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-mono font-bold">
              {missions.filter(m => m.active).length || 4}
            </span>
          </button>
          <button
            onClick={() => setCurrentTab('chat')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              currentTab === 'chat' ? 'bg-sky-400 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Smile className="w-4 h-4 text-sky-500" />
            <span>💬 Dialogue & Voice</span>
          </button>
        </nav>

        {/* Right Status */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-xs select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="text-[11px] sm:text-xs font-mono font-bold whitespace-nowrap">ESP32 Live</span>
          </div>

          <button onClick={() => setIsProfileModalOpen(true)} className="w-9 h-9 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-sky-500 transition-all shadow-xs flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 z-10">
        
        {currentTab === 'report' && (
          <div className="space-y-6">
            
            {/* TOP PROFILE HEADER (Organic Scalloped Card rounded-[32px]) */}
            <div className="relative bg-white border-2 border-amber-300 rounded-[32px] p-6 shadow-[0_12px_30px_rgba(251,191,36,0.12)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-inner shrink-0">
                  👦
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold font-['Fredoka'] text-slate-800">{profile.name}</h1>
                    <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-semibold border border-emerald-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ESP32 Live
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-0.5">{profile.age} • Sr. KG • Companion: <span className="font-bold text-sky-600">KOTL Buddy</span></p>
                </div>
              </div>
              
              {/**/}
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white px-5 py-3 rounded-2xl shadow-lg shadow-orange-500/20 text-center self-end sm:self-center shrink-0">
                <div className="text-xs uppercase tracking-wider font-semibold">Star Grade</div>
                <div className="text-2xl font-black font-['Fredoka']">A+ <span className="text-xs font-normal">(87/100)</span></div>
              </div>
            </div>

            {/* 4 TOP METRIC TILES (Colorful Chunky Cards rounded-3xl) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-sky-50 border-2 border-sky-300 rounded-3xl p-5 shadow-sm">
                <span className="text-xs font-bold text-sky-600 uppercase font-['Fredoka']">Overall Star</span>
                <div className="text-3xl font-extrabold font-['Fredoka'] text-sky-800 mt-1">87<span className="text-sm text-sky-500">/100</span></div>
                <div className="w-full bg-sky-200 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-sky-500 h-full rounded-full" style={{ width: '87%' }}></div>
                </div>
                <p className="text-xs text-sky-900 font-bold mt-2">Outstanding All-Round Growth 🌟</p>
              </div>

              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm">
                <span className="text-xs font-bold text-amber-600 uppercase font-['Fredoka']">English & Words</span>
                <div className="text-3xl font-extrabold font-['Fredoka'] text-amber-800 mt-1">84%</div>
                <div className="w-full bg-amber-200 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '84%' }}></div>
                </div>
                <p className="text-xs text-amber-900 font-bold mt-2">Learns New English Words Daily 📚</p>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 shadow-sm">
                <span className="text-xs font-bold text-emerald-600 uppercase font-['Fredoka']">Space & Science</span>
                <div className="text-3xl font-extrabold font-['Fredoka'] text-emerald-800 mt-1">92%</div>
                <div className="w-full bg-emerald-200 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }}></div>
                </div>
                <p className="text-xs text-emerald-900 font-bold mt-2">High Curiosity in Space & Stars 🚀</p>
              </div>

              <div className="bg-purple-50 border-2 border-purple-300 rounded-3xl p-5 shadow-sm">
                <span className="text-xs font-bold text-purple-600 uppercase font-['Fredoka']">Good Habits</span>
                <div className="text-3xl font-extrabold font-['Fredoka'] text-purple-800 mt-1">3<span className="text-sm text-purple-500">/6 Active</span></div>
                <div className="w-full bg-purple-200 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: '50%' }}></div>
                </div>
                <p className="text-xs text-purple-900 font-bold mt-2">Brushing, Veggies & Bedtime ⭐</p>
              </div>
            </div>

            {/* SUBJECT PROGRESS & MARKSHEET (Colorful Pastel Cards with rounded-[28px]) */}
            <div className="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h2 className="text-xl font-bold font-['Fredoka'] text-slate-800 flex items-center gap-2">
                    <span>🎨</span>
                    <span>Parth's Kindergarten Marksheet & Subject Progress</span>
                  </h2>
                  <p className="text-xs text-slate-500">Playful cards with subject scores, stars, and companion remarks</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold font-['Fredoka']">
                  🏆 6-Year Milestones: PASSED WITH STARS
                </span>
              </div>

              <div className="space-y-3.5">
                <div className="bg-sky-50/70 border-2 border-sky-300 rounded-[28px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-sky-300 flex items-center justify-center text-2xl shrink-0 shadow-xs">🗣️</div>
                    <div>
                      <h4 className="font-bold text-base text-sky-900 font-['Fredoka']">Spoken English & Words</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">Expresses thoughts clearly and naturally. Assimilates 2-3 syllable vocabulary seamlessly into stories.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="text-amber-400 text-base">★★★★★</div>
                    <span className="text-xs font-mono font-bold text-sky-800 bg-white px-3 py-1 rounded-xl border border-sky-200">84 / 100</span>
                    <span className="px-3 py-1 rounded-xl bg-sky-600 text-white font-bold text-xs font-['Fredoka']">Grade A • Fluent</span>
                  </div>
                </div>

                <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-[28px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-emerald-300 flex items-center justify-center text-2xl shrink-0 shadow-xs">🚀</div>
                    <div>
                      <h4 className="font-bold text-base text-emerald-900 font-['Fredoka']">Science, Space & Curiosity</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">Deeply curious about stars, planets, and rocket propulsion. Asks bright exploratory questions.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="text-amber-400 text-base">★★★★★</div>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-3 py-1 rounded-xl border border-emerald-200">92 / 100</span>
                    <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-xs font-['Fredoka']">Grade A+ • Curious</span>
                  </div>
                </div>

                <div className="bg-amber-50/70 border-2 border-amber-300 rounded-[28px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-amber-300 flex items-center justify-center text-2xl shrink-0 shadow-xs">🪥</div>
                    <div>
                      <h4 className="font-bold text-base text-amber-900 font-['Fredoka']">Good Habits & Manners</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">Brushes teeth twice daily and tidies up school bag and toys cheerfully when encouraged.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="text-amber-400 text-base">★★★★★</div>
                    <span className="text-xs font-mono font-bold text-amber-800 bg-white px-3 py-1 rounded-xl border border-amber-200">86 / 100</span>
                    <span className="px-3 py-1 rounded-xl bg-amber-600 text-white font-bold text-xs font-['Fredoka']">Grade A • Polite</span>
                  </div>
                </div>

                <div className="bg-purple-50/70 border-2 border-purple-300 rounded-[28px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-purple-300 flex items-center justify-center text-2xl shrink-0 shadow-xs">🎨</div>
                    <div>
                      <h4 className="font-bold text-base text-purple-900 font-['Fredoka']">Creativity & Stories</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">Loves drawing spacecraft and vibrant colors. Listens attentively to bedtime moral tales.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="text-amber-400 text-base">★★★★★</div>
                    <span className="text-xs font-mono font-bold text-purple-800 bg-white px-3 py-1 rounded-xl border border-purple-200">90 / 100</span>
                    <span className="px-3 py-1 rounded-xl bg-purple-600 text-white font-bold text-xs font-['Fredoka']">Grade A+ • Creative</span>
                  </div>
                </div>

                <div className="bg-rose-50/70 border-2 border-rose-300 rounded-[28px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-rose-300 flex items-center justify-center text-2xl shrink-0 shadow-xs">🤝</div>
                    <div>
                      <h4 className="font-bold text-base text-rose-900 font-['Fredoka']">Politeness & Cheerfulness</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">Speaks politely with parents and companions. Radiates upbeat, cheerful, and loving energy.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="text-amber-400 text-base">★★★★★</div>
                    <span className="text-xs font-mono font-bold text-rose-800 bg-white px-3 py-1 rounded-xl border border-rose-200">95 / 100</span>
                    <span className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold text-xs font-['Fredoka']">Grade A+ • Kind</span>
                  </div>
                </div>
              </div>
            </div>

            {/* HABITS TRACKER & CHAT (Split Module) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left: Habits Tracker with Bouncy Rounded Pill Toggles */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <h3 className="font-bold text-base text-slate-800 font-['Fredoka']">Daily Habit Checklist & Routine Tracker</h3>
                        <p className="text-xs text-slate-500">Tap to toggle what Parth achieved today</p>
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold font-['Fredoka'] border border-emerald-300">
                      {habits.filter(h => h.done).length}/{habits.length} Done
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {habits.map(habit => (
                      <label
                        key={habit.id}
                        onClick={() => toggleHabit(habit.id)}
                        className={`flex items-start gap-3 p-4 rounded-[24px] border-2 ${habit.color} cursor-pointer hover:shadow-xs transition-all`}
                      >
                        <input
                          type="checkbox"
                          checked={habit.done}
                          onChange={() => {}}
                          className="mt-1 w-4 h-4 rounded-md"
                        />
                        <div>
                          <div className="text-xs sm:text-sm font-bold font-['Fredoka']">{habit.title}</div>
                          <div className="text-[11px] opacity-75 font-medium">{habit.subtitle}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* SPEECH BUBBLE CHAT (With Bubble Tails & Kid Avatars) */}
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold font-['Fredoka'] text-slate-800 mb-4">💬 Live Companion Dialogue</h3>
                  
                  {/**/}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-lg shrink-0">👦</div>
                    <div className="bg-sky-50 border border-sky-200 text-slate-800 rounded-2xl rounded-tl-sm p-4 max-w-lg shadow-sm">
                      <p className="text-xs font-bold text-sky-600 mb-1 font-['Fredoka']">Parth asked:</p>
                      <p className="text-sm leading-relaxed font-medium">"KOTL, how do stars shine at night, and can we fly a rocket to the moon?"</p>
                    </div>
                  </div>

                  {/**/}
                  <div className="flex items-start justify-end gap-3 mb-4">
                    <div className="bg-amber-50 border border-amber-200 text-slate-800 rounded-2xl rounded-tr-sm p-4 max-w-lg shadow-sm text-left">
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-amber-200/60 gap-3">
                        <p className="text-xs font-bold text-amber-700 font-['Fredoka']">KOTL Companion answered:</p>
                        <button
                          onClick={() => playVoice('Stars are giant glowing suns far away in space, Parth! They twinkle because their light travels across the sky to say hello to you!')}
                          className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1 font-bold font-['Fredoka']"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Play Voice</span>
                        </button>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">"Stars are giant glowing suns far away in space, Parth! They twinkle because their light travels across the sky to say hello to you!"</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center text-lg shrink-0">🤖</div>
                  </div>
                </div>

                {/* Parent Action Tips */}
                <div className="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
                  <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                    <span className="text-2xl">💡</span>
                    <div>
                      <h3 className="font-bold text-base text-slate-800 font-['Fredoka']">Parent Action Tips & Everyday Home Activities</h3>
                      <p className="text-xs text-slate-500">Fun 5-minute activities to do with Parth at home</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-amber-50/70 border-2 border-amber-300 rounded-[24px] space-y-1.5 shadow-xs">
                      <h4 className="font-bold text-xs sm:text-sm text-amber-950 flex items-center space-x-1.5 font-['Fredoka']">
                        <span>✨</span>
                        <span>Superhero Fuel Game</span>
                      </h4>
                      <p className="text-xs text-slate-600">Serve crunchy carrots & fruit snacks as superhero power-ups during lunch.</p>
                    </div>

                    <div className="p-4 bg-sky-50/70 border-2 border-sky-300 rounded-[24px] space-y-1.5 shadow-xs">
                      <h4 className="font-bold text-xs sm:text-sm text-sky-950 flex items-center space-x-1.5 font-['Fredoka']">
                        <span>✨</span>
                        <span>5-Min Night Sky Routine</span>
                      </h4>
                      <p className="text-xs text-slate-600">Spend 5 quiet minutes at the window observing the moon and stars before bed.</p>
                    </div>

                    <div className="p-4 bg-emerald-50/70 border-2 border-emerald-300 rounded-[24px] space-y-1.5 shadow-xs">
                      <h4 className="font-bold text-xs sm:text-sm text-emerald-950 flex items-center space-x-1.5 font-['Fredoka']">
                        <span>✨</span>
                        <span>Two-Word Discovery</span>
                      </h4>
                      <p className="text-xs text-slate-600">Ask Parth to teach you one cool word he learned from KOTL today.</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right: Floating Sticky Note Companion Observation */}
              <div className="lg:col-span-5 space-y-6">

                {/* Sticky Note Card */}
                <div className="bg-amber-50/80 border-2 border-amber-300 rounded-[32px] p-6 shadow-sm relative space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">📌</span>
                      <h3 className="font-bold text-base text-amber-950 font-['Fredoka']">Teacher & KOTL Companion Observation</h3>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-white text-amber-800 font-bold border border-amber-300 shadow-2xs">Verified</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                    Parth demonstrates exceptional inquisitiveness, bright verbal enthusiasm, and a joyful, polite spirit during conversations with KOTL. He shows strong memory retention when talking about Space, Stars, and Creative Art. He grasps English vocabulary quickly, asks thoughtful questions, and is eagerly developing good daily habits like tidying up his toys and brushing his teeth.
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2 text-xs font-['Fredoka']">
                    <span className="px-3.5 py-1.5 rounded-2xl bg-white border border-sky-300 text-sky-800 font-bold shadow-xs">🚀 Space Explorer</span>
                    <span className="px-3.5 py-1.5 rounded-2xl bg-white border border-amber-300 text-amber-800 font-bold shadow-xs">🎨 Creative</span>
                    <span className="px-3.5 py-1.5 rounded-2xl bg-white border border-emerald-300 text-emerald-800 font-bold shadow-xs">🤝 Well Mannered</span>
                  </div>
                </div>

                {/* Child Affinity & Curiosity Tags */}
                <div className="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-['Fredoka']">
                        <span>💖</span>
                        <span>Parth's Favorite Passions & Topics</span>
                      </h3>
                      <p className="text-xs text-slate-500">Everyday topics Parth loves exploring</p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">Affinities</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3.5 bg-emerald-50/70 border-2 border-emerald-300 rounded-[24px] space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-emerald-950 font-['Fredoka']">Space Exploration & Rocketry</span>
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300">95%</span>
                      </div>
                      <p className="text-xs text-slate-600">Displays immense excitement when talking about stars, the moon, and rocket missions.</p>
                    </div>

                    <div className="p-3.5 bg-sky-50/70 border-2 border-sky-300 rounded-[24px] space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-sky-950 font-['Fredoka']">Creative Drawing & Visual Imagination</span>
                        <span className="text-xs font-mono font-bold text-sky-800 bg-white px-2.5 py-0.5 rounded-full border border-sky-300">90%</span>
                      </div>
                      <p className="text-xs text-slate-600">Enjoys visualizing colors, describing spacecraft designs, and creating artwork.</p>
                    </div>

                    <div className="p-3.5 bg-purple-50/70 border-2 border-purple-300 rounded-[24px] space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-purple-950 font-['Fredoka']">Bedtime Quests & Heroic Stories</span>
                        <span className="text-xs font-mono font-bold text-purple-800 bg-white px-2.5 py-0.5 rounded-full border border-purple-300">88%</span>
                      </div>
                      <p className="text-xs text-slate-600">Thrives when participating as an active hero in short story chapters before bed.</p>
                    </div>
                  </div>
                </div>

                {/* Sensitivities & Gentle Care */}
                <div className="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-['Fredoka']">
                        <span>🛡️</span>
                        <span>Care Areas & Positive Guidance</span>
                      </h3>
                      <p className="text-xs text-slate-500">Handled with gentle positive guidance</p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-300">Gentle</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3.5 bg-rose-50/70 border-2 border-rose-300 rounded-[24px] space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-rose-950 font-['Fredoka']">Bitter & Green Vegetables</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-rose-800 border border-rose-300 font-mono font-bold">Gentle Care</span>
                      </div>
                      <p className="text-xs text-slate-600"><strong className="text-slate-800">KOTL Care:</strong> Enthusiastically relates vegetable nutrients to superhero stamina, avoiding lecturing.</p>
                    </div>

                    <div className="p-3.5 bg-rose-50/70 border-2 border-rose-300 rounded-[24px] space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-rose-950 font-['Fredoka']">Dark Rooms & Night Shadows</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-rose-800 border border-rose-300 font-mono font-bold">Gentle Care</span>
                      </div>
                      <p className="text-xs text-slate-600"><strong className="text-slate-800">KOTL Care:</strong> Provides soothing ambient audio, calm reassuring bedtime tales of guardian stars.</p>
                    </div>
                  </div>
                </div>

                {/* Milestones Achieved Card */}
                <div className="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-['Fredoka']">
                      <span>🏆</span>
                      <span>Learning Milestones Achieved</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3.5 bg-sky-50/70 border-2 border-sky-300 rounded-[24px] space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-white text-sky-800 border border-sky-300">Milestone</span>
                        <span className="text-xs font-mono font-bold text-emerald-600">Achieved</span>
                      </div>
                      <h5 className="font-bold text-xs text-sky-950 mt-1 font-['Fredoka']">Grasped 50+ Lexical Terms</h5>
                    </div>

                    <div className="p-3.5 bg-sky-50/70 border-2 border-sky-300 rounded-[24px] space-y-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-white text-sky-800 border border-sky-300">Milestone</span>
                        <span className="text-xs font-mono font-bold text-emerald-600">Achieved</span>
                      </div>
                      <h5 className="font-bold text-xs text-sky-950 mt-1 font-['Fredoka']">20+ Inquiries Initiated</h5>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Parent Directives & Habits */}
        {currentTab === 'missions' && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-slate-200 rounded-[32px] p-6 sm:p-7 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-3xl">🎯</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 font-['Fredoka']">Parent Directives & Habit Missions</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                    Configure any habit or manner you want KOTL to gently encourage during daily conversations with Parth.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                {missions.map(m => (
                  <div key={m.id} className="p-4 rounded-[24px] border-2 border-emerald-300 bg-white flex items-center justify-between gap-3 shadow-xs">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 font-['Fredoka']">{m.title}</h4>
                      <p className="text-xs text-slate-600">{m.directive}</p>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-['Fredoka']">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Dialogue History */}
        {currentTab === 'chat' && (
          <div className="bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800 font-['Fredoka']">Real-Time Spoken Dialogue Stream</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 font-['Fredoka']">Live Synced</span>
            </div>

            <div className="h-96 overflow-y-auto space-y-4 pr-2">
              {chatHistory.map((turn, i) => (
                <div key={i} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-4 rounded-3xl ${turn.role === 'user' ? 'bg-sky-50 text-slate-800 rounded-tr-xs border-2 border-sky-200' : 'bg-amber-50 text-slate-800 rounded-tl-xs border-2 border-amber-200'}`}>
                    <div className="text-[10px] font-mono opacity-60 mb-1 font-['Fredoka']">{turn.role === 'user' ? '🧒 Parth' : '🤖 KOTL Buddy'}</div>
                    <p className="text-xs sm:text-sm leading-relaxed">{turn.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex items-center space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message to KOTL..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-400"
              />
              <button type="submit" className="p-2.5 rounded-2xl bg-sky-500 text-white hover:bg-sky-600 shadow-md">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </main>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-xl p-6 sm:p-7 rounded-[32px] bg-white border-2 border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base sm:text-lg text-slate-800 font-['Fredoka']">Child Profile & Safety Guardrails</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-slate-600">Child: <strong>Parth</strong> (6 Years, Boy). Bedtime routine set to 21:00 IST.</p>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 font-['Fredoka']">
                <div>✓ Always ask parents before touching medicines</div>
                <div>✓ Strict warning against sharp tools & fire</div>
                <div>✓ Never confirm purchases without parents</div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setIsProfileModalOpen(false)} className="px-5 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs shadow-md font-['Fredoka']">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
