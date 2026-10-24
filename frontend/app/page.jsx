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
    age: '6 Years Old',
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
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

  // Form inputs
  const [newLike, setNewLike] = useState('');
  const [newDislike, setNewDislike] = useState('');
  const [missionTitle, setMissionTitle] = useState('');
  const [missionDirective, setMissionDirective] = useState('');

  // Daily Habits Interactive Checklist State (Bouncy rounded pill toggles)
  const [habits, setHabits] = useState([
    { id: 1, title: '🪥 Morning & Night Brushing', subtitle: 'Shiny strong teeth routine', done: true, color: 'border-[#BAE6FD] bg-[#F0F8FF]' },
    { id: 2, title: '🥛 Clean Water & Fresh Milk', subtitle: 'Healthy hydration all day', done: true, color: 'border-[#BBF7D0] bg-[#F0FDF4]' },
    { id: 3, title: '🥗 Eating Veggies & Spinach', subtitle: 'Superhero stamina fuel', done: false, color: 'border-[#FED7AA] bg-[#FFF7ED]' },
    { id: 4, title: '🧸 Tidy Up Toys & School Bag', subtitle: 'Neat toy organizer box', done: true, color: 'border-[#F0ABFC] bg-[#FDF4FF]' },
    { id: 5, title: '📖 20 Mins English Stories', subtitle: 'Bedtime story with KOTL', done: false, color: 'border-[#FDE68A] bg-[#FEF3C7]' },
    { id: 6, title: '🌙 Sleep by 9:00 PM', subtitle: 'No screen before bedtime', done: false, color: 'border-slate-300 bg-[#F1F5F9]' },
  ]);

  const toggleHabit = (id) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  const chatScrollRef = useRef(null);

  // Fetch report
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

  // Fetch missions
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

  // Fetch history
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

  // Poll device status
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#1E293B] relative font-sans overflow-x-hidden">
      {/* Micro-Decorations */}
      <KindergartenDoodles />

      {/* Header Navigation */}
      <header className="h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b-2 border-slate-100 px-4 sm:px-8 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-1.5 font-extrabold text-xl sm:text-2xl font-kid">
            <span className="w-8 h-8 rounded-xl bg-[#FB8500] text-white flex items-center justify-center shadow-xs">K</span>
            <span className="w-8 h-8 rounded-xl bg-[#FFB703] text-white flex items-center justify-center shadow-xs">O</span>
            <span className="w-8 h-8 rounded-xl bg-[#70B6F6] text-white flex items-center justify-center shadow-xs">T</span>
            <span className="w-8 h-8 rounded-xl bg-[#66D29A] text-white flex items-center justify-center shadow-xs">L</span>
            <span className="ml-1 text-slate-800 tracking-tight">KIDS</span>
          </div>
          <div className="hidden sm:block border-l-2 border-slate-200 pl-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Pediatric Companion</span>
            <span className="text-xs text-slate-600 font-bold">Growth & Learning Hub</span>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="hidden md:flex items-center bg-[#F1F5F9] p-1.5 rounded-2xl border border-slate-200/80 space-x-1.5 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setCurrentTab('report')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              currentTab === 'report' ? 'bg-[#70B6F6] text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📜 Report Card</span>
          </button>
          <button
            onClick={() => setCurrentTab('missions')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              currentTab === 'missions' ? 'bg-[#70B6F6] text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-[#FB8500]" />
            <span>🎯 Habits & Goals</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-[#FB8500] text-xs font-mono font-bold">
              {missions.filter(m => m.active).length || 4}
            </span>
          </button>
          <button
            onClick={() => setCurrentTab('chat')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              currentTab === 'chat' ? 'bg-[#70B6F6] text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Smile className="w-4 h-4 text-[#70B6F6]" />
            <span>💬 Dialogue & Voice</span>
          </button>
        </nav>

        {/* Right Status */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#66D29A]/40 text-[#065F46] shadow-xs select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shrink-0"></span>
            <span className="text-[11px] sm:text-xs font-mono font-bold whitespace-nowrap">ESP32 Live</span>
          </div>

          <button onClick={() => setIsProfileModalOpen(true)} className="w-9 h-9 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#70B6F6] transition-all shadow-xs flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 z-10">
        
        {currentTab === 'report' && (
          <div className="space-y-6">
            
            {/* 1. Top Child Profile Hero Card (Floating Organic Cloud Style) */}
            <div className="p-6 sm:p-8 rounded-[2.25rem] bg-gradient-to-br from-white via-white to-[#F8FAFC] border-2 border-[#E0F2FE] shadow-[0_12px_36px_rgba(112,182,246,0.08)] relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                
                {/* Child Avatar & Bio */}
                <div className="flex items-center space-x-5">
                  <div className="relative">
                    <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-[#70B6F6] to-[#38BDF8] flex items-center justify-center text-white text-3xl sm:text-4xl shadow-md font-extrabold shrink-0 border-3 border-white">
                      🧒
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#FFB703] text-white text-[10px] font-bold shadow-xs">★</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] font-bold border border-sky-200">
                        KINDERGARTEN STAR
                      </span>
                      <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-800 tracking-tight font-kid">{profile.name}</h1>
                      <span className="text-xs px-3 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] font-bold border border-amber-200">{profile.age}</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-[#F1F5F9] text-slate-700 font-bold border border-slate-200">👦 {profile.gender}</span>
                      <button onClick={() => setIsProfileModalOpen(true)} className="text-xs px-3 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold flex items-center gap-1.5 shadow-xs">
                        <span>⚙️ Profile & Rules</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium flex items-center gap-2">
                      <span>Class: <strong>Sr. KG / Junior Minds</strong></span>
                      <span>•</span>
                      <span>Companion: <span className="text-[#70B6F6] font-bold">KOTL Buddy</span></span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">Roll: KOTL-2026-P04</span>
                    </p>
                  </div>
                </div>

                {/* Academic Stamp Badge: Grade A+ (87/100) */}
                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-200">
                  <div className="px-6 py-3 rounded-3xl border-2 border-dashed border-[#FFB703] bg-[#FFFBEB] flex flex-col items-center justify-center text-center shadow-xs">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#B45309] font-black flex items-center gap-1">
                      ⭐ STAR GRADE
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-[#FB8500] font-kid">GRADE A+</span>
                    <span className="text-xs text-slate-700 font-bold">DISTINCTION (87/100)</span>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-mono bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                      <span>📅</span>
                      <span>October 24, 2026</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={fetchReport} className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-1.5 shadow-xs">
                        <RefreshCw className="w-3.5 h-3.5 text-[#70B6F6]" />
                        <span>Update</span>
                      </button>
                      <button onClick={() => window.print()} className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center space-x-1.5 shadow-xs">
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. KPI Metric Cards (Floating Pill Tiles with Pastel Inner Fills & Rounded Progress Meters) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Tile 1: Overall Star (Sky Blue fill) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#F0F8FF] border-2 border-[#BAE6FD] flex flex-col justify-between space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-600 font-bold">Overall Star</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[#0369A1] border border-[#BAE6FD] text-[11px] font-bold font-mono">A+ Top 5%</span>
                </div>
                <div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#0369A1] font-mono">87</span>
                    <span className="text-slate-400 text-sm font-mono font-medium">/100</span>
                  </div>
                  <div className="w-full bg-white/80 rounded-full h-2.5 overflow-hidden mt-2 border border-[#BAE6FD]/60">
                    <div className="bg-[#70B6F6] h-2.5 rounded-full transition-all duration-500" style={{ width: '87%' }}></div>
                  </div>
                </div>
                <p className="text-xs text-slate-700 font-bold">Outstanding All-Round Growth 🌟</p>
              </div>

              {/* Tile 2: English & Words (Warm Orange fill) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#FFF7ED] border-2 border-[#FED7AA] flex flex-col justify-between space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-600 font-bold">English & Words</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[#C2410C] border border-[#FED7AA] text-[11px] font-bold font-mono">Grade A</span>
                </div>
                <div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#EA580C] font-mono">84%</span>
                  </div>
                  <div className="w-full bg-white/80 rounded-full h-2.5 overflow-hidden mt-2 border border-[#FED7AA]/60">
                    <div className="bg-[#FB8500] h-2.5 rounded-full transition-all duration-500" style={{ width: '84%' }}></div>
                  </div>
                </div>
                <p className="text-xs text-slate-700 font-bold">Learns New English Words Daily 📚</p>
              </div>

              {/* Tile 3: Space & Science (Mint Green fill) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#F0FDF4] border-2 border-[#BBF7D0] flex flex-col justify-between space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-600 font-bold">Space & Science</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[#15803D] border border-[#BBF7D0] text-[11px] font-bold font-mono">Grade A+</span>
                </div>
                <div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#16A34A] font-mono">92%</span>
                  </div>
                  <div className="w-full bg-white/80 rounded-full h-2.5 overflow-hidden mt-2 border border-[#BBF7D0]/60">
                    <div className="bg-[#66D29A] h-2.5 rounded-full transition-all duration-500" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <p className="text-xs text-slate-700 font-bold">High Curiosity in Space & Stars 🚀</p>
              </div>

              {/* Tile 4: Good Habits (Soft Teal fill) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#F0FDFA] border-2 border-[#99F6E4] flex flex-col justify-between space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-600 font-bold">Good Habits</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[#0F766E] border border-[#99F6E4] text-[11px] font-bold font-mono">3/6 Active</span>
                </div>
                <div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#0D9488] font-mono flex items-baseline gap-1.5">
                      <span>3</span> <span className="text-xs font-sans font-bold text-slate-500">Completed</span>
                    </span>
                  </div>
                  <div className="w-full bg-white/80 rounded-full h-2.5 overflow-hidden mt-2 border border-[#99F6E4]/60">
                    <div className="bg-[#14B8A6] h-2.5 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
                <p className="text-xs text-slate-700 font-bold">Brushing, Veggies & Bedtime ⭐</p>
              </div>

            </div>

            {/* 3. Subject Progress & Kindergarten Marksheet (Playful Stacked Horizontal Banner Cards) */}
            <div className="p-6 sm:p-7 rounded-[1.75rem] bg-white border-2 border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 font-kid flex items-center gap-2">
                    <span>🎨</span>
                    <span>Parth's Kindergarten Marksheet & Subject Progress</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">Subject-wise playful stars, grades and companion observations</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] font-bold">
                  🏆 6-Year Milestones: PASSED WITH STARS
                </span>
              </div>

              {/* Stacked Cards */}
              <div className="space-y-3">
                
                {/* 1. Spoken English */}
                <div className="p-4 rounded-2xl bg-[#F0F8FF] border border-[#BAE6FD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#70B6F6] transition-all">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-[#BAE6FD] flex items-center justify-center text-xl shrink-0 shadow-xs">
                      🗣️
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 font-kid">Spoken English & Words</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Expresses thoughts clearly and naturally. Assimilates 2-3 syllable vocabulary seamlessly into stories.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                    <div className="text-amber-400 text-sm">★★★★★</div>
                    <span className="text-xs font-mono font-bold text-[#0369A1] bg-white px-2.5 py-1 rounded-xl border border-[#BAE6FD]">84 / 100</span>
                    <span className="px-2.5 py-1 rounded-xl bg-[#0369A1] text-white font-bold text-xs">Grade A • Fluent</span>
                  </div>
                </div>

                {/* 2. Space & Science */}
                <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#66D29A] transition-all">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-[#BBF7D0] flex items-center justify-center text-xl shrink-0 shadow-xs">
                      🚀
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 font-kid">Science, Space & Curiosity</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Deeply curious about stars, planets, and rocket propulsion. Asks bright exploratory questions.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                    <div className="text-amber-400 text-sm">★★★★★</div>
                    <span className="text-xs font-mono font-bold text-[#15803D] bg-white px-2.5 py-1 rounded-xl border border-[#BBF7D0]">92 / 100</span>
                    <span className="px-2.5 py-1 rounded-xl bg-[#15803D] text-white font-bold text-xs">Grade A+ • Curious</span>
                  </div>
                </div>

                {/* 3. Good Habits */}
                <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#F59E0B] transition-all">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-[#FDE68A] flex items-center justify-center text-xl shrink-0 shadow-xs">
                      🪥
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 font-kid">Good Habits & Manners</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Brushes teeth twice daily and tidies up school bag and toys cheerfully when encouraged.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                    <div className="text-amber-400 text-sm">★★★★★</div>
                    <span className="text-xs font-mono font-bold text-[#B45309] bg-white px-2.5 py-1 rounded-xl border border-[#FDE68A]">86 / 100</span>
                    <span className="px-2.5 py-1 rounded-xl bg-[#B45309] text-white font-bold text-xs">Grade A • Polite</span>
                  </div>
                </div>

                {/* 4. Creativity */}
                <div className="p-4 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#A855F7] transition-all">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-[#E9D5FF] flex items-center justify-center text-xl shrink-0 shadow-xs">
                      🎨
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 font-kid">Creativity & Stories</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Loves drawing spacecraft and vibrant colors. Listens attentively to bedtime moral tales.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                    <div className="text-amber-400 text-sm">★★★★★</div>
                    <span className="text-xs font-mono font-bold text-[#7E22CE] bg-white px-2.5 py-1 rounded-xl border border-[#E9D5FF]">90 / 100</span>
                    <span className="px-2.5 py-1 rounded-xl bg-[#7E22CE] text-white font-bold text-xs">Grade A+ • Creative</span>
                  </div>
                </div>

                {/* 5. Politeness */}
                <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#FB7185] transition-all">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-[#FECDD3] flex items-center justify-center text-xl shrink-0 shadow-xs">
                      🤝
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 font-kid">Politeness & Cheerfulness</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Speaks politely with parents and companions. Radiates upbeat, cheerful, and loving energy.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                    <div className="text-amber-400 text-sm">★★★★★</div>
                    <span className="text-xs font-mono font-bold text-[#BE123C] bg-white px-2.5 py-1 rounded-xl border border-[#FECDD3]">95 / 100</span>
                    <span className="px-2.5 py-1 rounded-xl bg-[#BE123C] text-white font-bold text-xs">Grade A+ • Kind</span>
                  </div>
                </div>

              </div>
            </div>

            {/* 4. Habits Tracker & Companion Assessment (Split Module) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left: Habits Tracker with Bouncy Rounded Pill Toggles */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-6 rounded-[1.75rem] bg-white border-2 border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-800 font-kid">Daily Habit Checklist & Routine Tracker</h3>
                        <p className="text-xs text-slate-500">Tap to toggle what Parth completed today</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] font-bold border border-[#66D29A]">
                      {habits.filter(h => h.done).length}/{habits.length} Done
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {habits.map(habit => (
                      <label
                        key={habit.id}
                        onClick={() => toggleHabit(habit.id)}
                        className={`flex items-start space-x-3 p-3.5 rounded-2xl border-2 ${habit.color} cursor-pointer hover:shadow-xs transition-all`}
                      >
                        <input
                          type="checkbox"
                          checked={habit.done}
                          onChange={() => {}}
                          className="mt-1 w-4 h-4 text-[#70B6F6] rounded-md focus:ring-[#70B6F6]"
                        />
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-slate-800">{habit.title}</div>
                          <div className="text-[11px] text-slate-500">{habit.subtitle}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 5. Recent Dialogue (Spoken Audio Feed) */}
                <div className="p-6 rounded-[1.75rem] bg-white border-2 border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">💬</span>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-800 font-kid">Recent Dialogue (Spoken Audio Feed)</h3>
                        <p className="text-xs text-slate-500">Real spoken speech turns from ESP32 live microphone</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] font-bold border border-sky-200">
                      Audio Live
                    </span>
                  </div>

                  {/* Speech Bubbles */}
                  <div className="space-y-4">
                    {/* Turn 1 */}
                    <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#70B6F6]"></span>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-800">Space & Night Sky Exploration</h4>
                        </div>
                        <button
                          onClick={() => playVoice('Stars are giant glowing suns far away in space, Parth! They twinkle because their light travels across the sky to say hello to you!')}
                          className="text-xs text-[#0369A1] hover:text-[#0284C7] flex items-center gap-1 font-bold"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Play Spoken Voice</span>
                        </button>
                      </div>
                      
                      <div className="space-y-2.5">
                        <div className="flex items-start space-x-2.5 max-w-[90%]">
                          <div className="w-8 h-8 rounded-full bg-[#E0F2FE] border border-sky-200 flex items-center justify-center text-sm shrink-0">🧒</div>
                          <div className="p-3.5 rounded-2xl rounded-tl-xs bg-[#F0F8FF] border border-[#BAE6FD] shadow-xs">
                            <div className="text-[10px] font-mono font-bold text-[#0369A1] uppercase mb-0.5">Parth Asked:</div>
                            <p className="text-xs sm:text-sm font-medium text-slate-800 italic">“KOTL, how do stars shine at night, and can we fly a rocket to the moon?”</p>
                          </div>
                        </div>

                        <div className="flex items-start justify-end space-x-2.5 w-full">
                          <div className="flex items-start space-x-2.5 max-w-[90%] flex-row-reverse space-x-reverse">
                            <div className="w-8 h-8 rounded-full bg-[#ECFDF5] border border-emerald-200 flex items-center justify-center text-sm shrink-0">🤖</div>
                            <div className="p-3.5 rounded-2xl rounded-tr-xs bg-[#F0FDF4] border border-[#BBF7D0] shadow-xs text-left">
                              <div className="text-[10px] font-mono font-bold text-[#15803D] uppercase mb-0.5">KOTL Companion:</div>
                              <p className="text-xs sm:text-sm text-slate-700">“Stars are giant glowing suns far away in space, Parth! They twinkle because their light travels across the sky to say hello to you!”</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Turn 2 */}
                    <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FB8500]"></span>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-800">Healthy Nutrition & Superpower Fuel</h4>
                        </div>
                        <button
                          onClick={() => playVoice('Spinach has iron superpower fuel that gives astronauts and champions immense stamina to run and leap! Just one big bite gives superhero energy!')}
                          className="text-xs text-[#0369A1] hover:text-[#0284C7] flex items-center gap-1 font-bold"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Play Spoken Voice</span>
                        </button>
                      </div>
                      
                      <div className="space-y-2.5">
                        <div className="flex items-start space-x-2.5 max-w-[90%]">
                          <div className="w-8 h-8 rounded-full bg-[#E0F2FE] border border-sky-200 flex items-center justify-center text-sm shrink-0">🧒</div>
                          <div className="p-3.5 rounded-2xl rounded-tl-xs bg-[#F0F8FF] border border-[#BAE6FD] shadow-xs">
                            <div className="text-[10px] font-mono font-bold text-[#0369A1] uppercase mb-0.5">Parth Asked:</div>
                            <p className="text-xs sm:text-sm font-medium text-slate-800 italic">“I really don't want to eat green spinach on my plate today!”</p>
                          </div>
                        </div>

                        <div className="flex items-start justify-end space-x-2.5 w-full">
                          <div className="flex items-start space-x-2.5 max-w-[90%] flex-row-reverse space-x-reverse">
                            <div className="w-8 h-8 rounded-full bg-[#FFF7ED] border border-orange-200 flex items-center justify-center text-sm shrink-0">🤖</div>
                            <div className="p-3.5 rounded-2xl rounded-tr-xs bg-[#FFF7ED] border border-[#FED7AA] shadow-xs text-left">
                              <div className="text-[10px] font-mono font-bold text-[#C2410C] uppercase mb-0.5">KOTL Companion:</div>
                              <p className="text-xs sm:text-sm text-slate-700">“Spinach has iron superpower fuel that gives astronauts and champions immense stamina to run and leap! Just one big bite gives superhero energy!”</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Parent Action Tips */}
                <div className="p-6 rounded-[1.75rem] bg-white border-2 border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] space-y-4">
                  <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
                    <span className="text-2xl">💡</span>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-800 font-kid">Parent Action Tips & Everyday Home Activities</h3>
                      <p className="text-xs text-slate-500">Fun 5-minute activities to do with Parth at home</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center space-x-1.5">
                        <span>✨</span>
                        <span>Superhero Fuel Game</span>
                      </h4>
                      <p className="text-xs text-slate-600">Serve crunchy carrots & fruit snacks as superhero power-ups during lunch.</p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center space-x-1.5">
                        <span>✨</span>
                        <span>5-Min Night Sky Routine</span>
                      </h4>
                      <p className="text-xs text-slate-600">Spend 5 quiet minutes at the window observing the moon and stars before bed.</p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 flex items-center space-x-1.5">
                        <span>✨</span>
                        <span>Two-Word Daily Discovery</span>
                      </h4>
                      <p className="text-xs text-slate-600">Ask Parth to teach you one cool word he learned from KOTL today.</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right: Floating Sticky Note / Clipboard Card */}
              <div className="lg:col-span-5 space-y-6">

                {/* Floating Sticky Note */}
                <div className="p-6 rounded-[2rem] bg-[#FFFDF5] border-2 border-[#FEF08A] relative space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">📌</span>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 font-kid">Teacher & KOTL Companion Observation</h3>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white text-[#B45309] font-bold border border-amber-200">Verified</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Parth demonstrates exceptional inquisitiveness, bright verbal enthusiasm, and a joyful, polite spirit during conversations with KOTL. He shows strong memory retention when talking about Space, Stars, and Creative Art. He grasps English vocabulary quickly, asks thoughtful questions, and is eagerly developing good daily habits like tidying up his toys and brushing his teeth.
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2 text-xs">
                    <span className="px-3 py-1 rounded-xl bg-white border border-[#BAE6FD] text-[#0369A1] font-bold shadow-xs">🚀 Space Explorer</span>
                    <span className="px-3 py-1 rounded-xl bg-white border border-[#FED7AA] text-[#C2410C] font-bold shadow-xs">🎨 Creative</span>
                    <span className="px-3 py-1 rounded-xl bg-white border border-[#BBF7D0] text-[#15803D] font-bold shadow-xs">🤝 Well Mannered</span>
                  </div>
                </div>

                {/* 6. Child Affinity & Curiosity Tags (Wavy Scallop-Bordered Cards) */}
                <div className="p-6 rounded-[1.75rem] bg-white border-2 border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center space-x-2 font-kid">
                        <span>💖</span>
                        <span>Parth's Favorite Passions & Topics</span>
                      </h3>
                      <p className="text-xs text-slate-500">Everyday topics Parth loves exploring</p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] font-bold border border-[#66D29A]">Affinities</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 hover:border-[#70B6F6] transition-all">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-slate-800">Space Exploration & Rocketry</span>
                        <span className="text-xs font-mono font-bold text-[#065F46] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#66D29A]">95%</span>
                      </div>
                      <p className="text-xs text-slate-600">Displays immense excitement when talking about stars, the moon, and rocket missions.</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 hover:border-[#70B6F6] transition-all">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-slate-800">Creative Drawing & Visual Imagination</span>
                        <span className="text-xs font-mono font-bold text-[#065F46] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#66D29A]">90%</span>
                      </div>
                      <p className="text-xs text-slate-600">Enjoys visualizing colors, describing spacecraft designs, and creating artwork.</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 hover:border-[#70B6F6] transition-all">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-slate-800">Bedtime Quests & Heroic Stories</span>
                        <span className="text-xs font-mono font-bold text-[#065F46] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#66D29A]">88%</span>
                      </div>
                      <p className="text-xs text-slate-600">Thrives when participating as an active hero in short story chapters before bed.</p>
                    </div>
                  </div>
                </div>

                {/* 7. Sensitivities & Gentle Care */}
                <div className="p-6 rounded-[1.75rem] bg-white border-2 border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center space-x-2 font-kid">
                        <span>🛡️</span>
                        <span>Care Areas & Positive Guidance</span>
                      </h3>
                      <p className="text-xs text-slate-500">Handled with gentle positive guidance</p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFF1F2] text-[#BE123C] font-bold border border-[#FECDD3]">Gentle</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3.5 bg-[#FFF1F2]/50 border border-[#FECDD3] rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-slate-800">Bitter & Green Vegetables</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white text-[#BE123C] border border-[#FECDD3] font-mono font-bold">Gentle Guidance</span>
                      </div>
                      <p className="text-xs text-slate-600"><strong className="text-slate-800">KOTL Care:</strong> Enthusiastically relates vegetable nutrients to superhero stamina, avoiding lecturing.</p>
                    </div>

                    <div className="p-3.5 bg-[#FFF1F2]/50 border border-[#FECDD3] rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-slate-800">Dark Rooms & Night Shadow Uncertainty</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white text-[#BE123C] border border-[#FECDD3] font-mono font-bold">Gentle Guidance</span>
                      </div>
                      <p className="text-xs text-slate-600"><strong className="text-slate-800">KOTL Care:</strong> Provides soothing ambient audio, calm reassuring bedtime tales of guardian stars.</p>
                    </div>
                  </div>
                </div>

                {/* Milestones Achieved Card */}
                <div className="p-6 rounded-[1.75rem] bg-white border-2 border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center space-x-2 font-kid">
                      <span>🏆</span>
                      <span>Learning Milestones Achieved</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#E0F2FE] text-[#0369A1] border border-sky-200">Milestone</span>
                        <span className="text-xs font-mono font-bold text-[#16A34A]">Achieved</span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-800 mt-1">Grasped 50+ Lexical Terms</h5>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-[#E0F2FE] text-[#0369A1] border border-sky-200">Milestone</span>
                        <span className="text-xs font-mono font-bold text-[#16A34A]">Achieved</span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-800 mt-1">20+ Inquiries Initiated</h5>
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
            <div className="p-6 sm:p-7 rounded-[1.75rem] bg-white border-2 border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center space-x-2.5">
                <span className="text-3xl">🎯</span>
                <div>
                  <h2 className="text-lg sm:text-2xl font-extrabold text-slate-800 font-kid">Parent Directives & Habit Missions</h2>
                  <p className="text-xs sm:text-sm text-slate-600">Configure any habit or manner you want KOTL to gently encourage during daily conversations.</p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                {missions.map(m => (
                  <div key={m.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-xs">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{m.title}</h4>
                      <p className="text-xs text-slate-600">{m.directive}</p>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Dialogue History */}
        {currentTab === 'chat' && (
          <div className="p-6 rounded-[1.75rem] bg-white border-2 border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-800 font-kid">Real-Time Spoken Dialogue Stream</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] font-bold border border-[#66D29A]">Live Synced</span>
            </div>

            <div className="h-96 overflow-y-auto space-y-3 pr-2">
              {chatHistory.map((turn, i) => (
                <div key={i} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-4 rounded-3xl ${turn.role === 'user' ? 'bg-[#E0F2FE] text-slate-800 rounded-tr-xs border border-sky-200' : 'bg-[#F8FAFC] text-slate-800 rounded-tl-xs border border-slate-200'}`}>
                    <div className="text-[10px] font-mono opacity-50 mb-1">{turn.role === 'user' ? '🧒 Parth' : '🤖 KOTL Buddy'}</div>
                    <p className="text-xs sm:text-sm">{turn.content}</p>
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
                className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#70B6F6]"
              />
              <button type="submit" className="p-2.5 rounded-2xl bg-[#70B6F6] text-white hover:bg-[#38BDF8] shadow-md">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </main>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-xl p-6 sm:p-7 rounded-[2rem] bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-800 font-kid">Child Profile & Safety Guardrails</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <p className="text-slate-600">Child: <strong>Parth</strong> (6 Years Old, Boy). Bedtime routine set to 21:00 IST.</p>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div>✓ Always ask parents before touching medicines</div>
                <div>✓ Strict warning against sharp tools & fire</div>
                <div>✓ Never confirm purchases without parents</div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setIsProfileModalOpen(false)} className="px-5 py-2 rounded-xl bg-[#70B6F6] text-white font-bold text-xs shadow-md">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
