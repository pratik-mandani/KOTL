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
  const [isRecording, setIsRecording] = useState(false);
  const [isUpdatingReport, setIsUpdatingReport] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('Live');

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWifiModalOpen, setIsWifiModalOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

  // Form inputs for modals
  const [newLike, setNewLike] = useState('');
  const [newDislike, setNewDislike] = useState('');
  const [missionTitle, setMissionTitle] = useState('');
  const [missionDirective, setMissionDirective] = useState('');

  // Daily Habits Interactive Checklist State
  const [habits, setHabits] = useState([
    { id: 1, title: '🪥 સવાર-સાંજ દાંત બ્રશ કરવા', subtitle: 'Morning & Night Brushing', done: true },
    { id: 2, title: '🥛 સ્વચ્છ પાણી અને દૂધ પીવું', subtitle: 'Clean Water & Fresh Milk', done: true },
    { id: 3, title: '🥦 લીલા શાકભાજી & ફળો ખાવા', subtitle: 'Spinach, Carrots & Fruits', done: true },
    { id: 4, title: '🎒 સ્કૂલ બેગ અને રમકડાં વ્યવસ્થિત મૂકવા', subtitle: 'Tidying Up Toys & School Bag', done: true },
    { id: 5, title: '📖 ૨૦ મિનિટ પુસ્તક વાંચન / વાર્તા', subtitle: '20 Mins Story Reading', done: true },
    { id: 6, title: '😴 રાત્રે ૯:૦૦ વાગ્યે ઊંઘવું (મોબાઈલ વગર)', subtitle: '9 PM Bedtime (No Mobile)', done: true },
  ]);

  const chatScrollRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fetch live child report
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

  // Fetch parent missions
  const fetchMissions = async () => {
    try {
      const res = await fetch('/api/parent/missions');
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions || []);
      }
    } catch (e) {
      console.warn('Error fetching missions:', e);
    }
  };

  // Fetch chat history from default-session
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history?sessionId=default-session');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.history)) {
          setChatHistory(data.history);
        }
      }
    } catch (e) {
      console.warn('Error fetching history:', e);
    }
  };

  // Poll device status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        setDeviceStatus('Live');
      }
    } catch (_) {
      setDeviceStatus('Offline');
    }
  };

  useEffect(() => {
    fetchReport();
    fetchMissions();
    fetchHistory();
    fetchStatus();

    const historyInterval = setInterval(fetchHistory, 2500);
    const statusInterval = setInterval(fetchStatus, 5000);
    return () => {
      clearInterval(historyInterval);
      clearInterval(statusInterval);
    };
  }, []);

  useEffect(() => {
    if (currentTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, currentTab]);

  const handleToggleHabit = (id) => {
    setHabits(habits.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');

    const optimisticMsg = {
      role: 'user',
      content: text,
      source: 'web',
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sessionId: 'default-session' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          const kotlMsg = {
            role: 'assistant',
            content: data.reply,
            source: 'kotl',
            timestamp: new Date().toISOString()
          };
          setChatHistory(prev => [...prev, kotlMsg]);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
    }
  };

  const handlePlayVoice = async (text, ttsUrl) => {
    if (ttsUrl && ttsUrl !== 'null' && ttsUrl !== 'undefined') {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = ttsUrl;
        audioPlayerRef.current.play().catch(e => console.warn(e));
      }
      return;
    }
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sessionId: 'default-session' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url && audioPlayerRef.current) {
          audioPlayerRef.current.src = data.url;
          audioPlayerRef.current.play().catch(e => console.warn(e));
        }
      }
    } catch (e) {
      console.error('TTS error:', e);
    }
  };

  const handleRegenerateReport = async () => {
    setIsUpdatingReport(true);
    try {
      const res = await fetch('/api/child/report/generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (e) {
      alert('Error updating report: ' + e.message);
    } finally {
      setIsUpdatingReport(false);
    }
  };

  const handleAddInterest = async (type) => {
    const val = type === 'likes' ? newLike.trim() : newDislike.trim();
    if (!val) return;
    try {
      const profRes = await fetch('/api/child/profile');
      const profData = await profRes.json();
      const p = profData.profile || {};
      if (!p[type]) p[type] = [];
      if (!p[type].includes(val)) {
        p[type].push(val);
        await fetch('/api/child/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        });
        if (type === 'likes') setNewLike('');
        else setNewDislike('');
        await handleRegenerateReport();
      }
    } catch (e) {
      console.error('Error adding interest:', e);
    }
  };

  const handleCreateMission = async (e) => {
    e.preventDefault();
    if (!missionTitle.trim()) return;
    try {
      const res = await fetch('/api/parent/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: missionTitle, directive: missionDirective })
      });
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions || []);
        setMissionTitle('');
        setMissionDirective('');
      }
    } catch (e) {
      alert('Error creating mission: ' + e.message);
    }
  };

  const handleToggleMission = async (id, activeState) => {
    try {
      const res = await fetch('/api/parent/missions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: activeState })
      });
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMission = async (id) => {
    if (!confirm('Remove this habit directive?')) return;
    try {
      const res = await fetch('/api/parent/missions/' + id, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear all conversation turns?')) return;
    try {
      await fetch('/api/reset-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'default-session' })
      });
      setChatHistory([]);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF9] text-slate-800 relative selection:bg-kid-yellow selection:text-kid-deepblue">
      {/* Top Colorful Kindergarten Rainbow Border */}
      <div className="h-2 w-full bg-gradient-to-r from-kid-blue via-kid-yellow to-kid-coral z-30 shrink-0" />

      {/* Floating Animated Cartoon Doodles */}
      <KindergartenDoodles />

      {/* Kindergarten School Header */}
      <header className="h-16 sm:h-20 bg-white/95 backdrop-blur-md border-b-2 border-kid-border px-3 sm:px-8 flex items-center justify-between shadow-soft-cloud shrink-0 z-30">
        
        {/* Brand Crest */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-kid-blue to-kid-deepblue flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-bubbly border-2 border-kid-yellow">
            🧸
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl text-kid-deepblue tracking-tight font-serif">KOTL KIDS</span>
              <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-kid-lightyellow border border-kid-yellow text-kid-gold font-bold">
                KINDERGARTEN
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block">
              પાર્થનું બાળપણ પ્રગતિ પત્રક • Playful Growth & Habits Hub
            </p>
          </div>
        </div>

        {/* Center Tabs Navigation (Desktop) */}
        <nav className="hidden md:flex items-center bg-kid-paper p-1.5 rounded-2xl border-2 border-kid-border space-x-2 text-sm font-bold">
          <button
            id="tabBtnReport"
            onClick={() => setCurrentTab('report')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              currentTab === 'report' ? 'bg-kid-blue text-white shadow-blue-bubbly' : 'text-slate-700 hover:text-kid-deepblue hover:bg-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📜 School Report Card</span>
          </button>

          <button
            id="tabBtnMissions"
            onClick={() => setCurrentTab('missions')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              currentTab === 'missions' ? 'bg-kid-yellow text-kid-deepblue shadow-yellow-bubbly' : 'text-slate-700 hover:text-kid-deepblue hover:bg-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-kid-gold" />
            <span>🎯 Daily Habits & Goals</span>
            <span id="activeMissionsCountBadge" className="ml-1 px-2 py-0.2 rounded-full bg-white text-kid-deepblue text-xs font-mono font-bold">
              {missions.filter(m => m.active).length}
            </span>
          </button>

          <button
            id="tabBtnChat"
            onClick={() => setCurrentTab('chat')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              currentTab === 'chat' ? 'bg-kid-coral text-white shadow-bubbly' : 'text-slate-700 hover:text-kid-deepblue hover:bg-white'
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>💬 Dialogue & Audio</span>
          </button>
        </nav>

        {/* Right Status & Diagnostics Tools */}
        <div className="flex items-center space-x-2">
          {/* Live Device Status Pill (QA verified) */}
          <div id="deviceStatusPill" className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-kid-lightgreen border-2 border-green-300 text-green-900 shadow-2xs select-none">
            <span id="deviceStatusDot" className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span id="deviceStatusText" className="text-xs font-mono font-bold whitespace-nowrap">
              <span className="hidden sm:inline">ESP32 </span>{deviceStatus}
            </span>
          </div>

          <button
            id="openWifiModalBtn"
            onClick={() => setIsWifiModalOpen(true)}
            className="w-9 h-9 rounded-xl bg-white hover:bg-kid-paper border-2 border-kid-border text-slate-700 hover:text-kid-blue flex items-center justify-center transition-all shadow-2xs"
            title="Wi-Fi Settings"
          >
            <Wifi className="w-4 h-4" />
          </button>

          <button
            id="openHardwareModalBtn"
            onClick={() => setIsHardwareModalOpen(true)}
            className="w-9 h-9 rounded-xl bg-white hover:bg-kid-paper border-2 border-kid-border text-slate-700 hover:text-kid-blue flex items-center justify-center transition-all shadow-2xs"
            title="Hardware Diagnostics"
          >
            <Activity className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col">

        {/* ======================================================== */}
        {/* TAB 1: KINDERGARTEN SCHOOL REPORT CARD                    */}
        {/* ======================================================== */}
        {currentTab === 'report' && (
          <section id="viewReport" className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6 custom-scrollbar max-w-6xl mx-auto w-full">
            
            {/* Student Cloud Certificate Card */}
            <div className="kid-card p-5 sm:p-7 bg-white relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                
                {/* Child Identity */}
                <div className="flex items-center space-x-4">
                  <div id="reportChildAvatar" className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-kid-blue to-kid-deepblue flex items-center justify-center text-white text-3xl sm:text-4xl shadow-blue-bubbly border-4 border-kid-yellow shrink-0">
                    {profile.gender === 'Girl' ? '👧' : '🧒'}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-kid-lightblue text-kid-deepblue font-bold border border-blue-200">
                        KINDERGARTEN STAR
                      </span>
                      <h1 id="reportChildName" className="text-2xl sm:text-4xl font-extrabold text-kid-deepblue tracking-tight font-serif">
                        {report?.child_name || profile.name || 'Parth'}
                      </h1>
                      <span id="reportChildAgeBadge" className="text-xs px-2.5 py-0.5 rounded-full bg-kid-lightyellow border border-kid-yellow text-kid-gold font-bold">
                        {report?.age || profile.age || '6 Years Old'}
                      </span>
                      <span id="reportChildGenderBadge" className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-kid-blue font-bold">
                        {profile.gender === 'Girl' ? '👧 Girl' : '👦 Boy'}
                      </span>
                      <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="text-xs px-3 py-1 rounded-xl bg-kid-paper hover:bg-slate-200 border border-kid-border text-slate-700 font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                        title="Edit Child Profile & Guardrails"
                      >
                        <Settings className="w-3.5 h-3.5 text-kid-deepblue" />
                        <span>⚙️ Profile & Rules</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                      Class: <strong>Sr. KG / Junior Minds</strong> • Companion: <span className="text-kid-blue font-bold">KOTL Robot Buddy</span> • Roll: <strong className="font-mono text-kid-deepblue">KOTL-2026-P04</strong>
                    </p>
                  </div>
                </div>

                {/* Star Grade Stamp / Seal */}
                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-amber-100">
                  <div className="school-seal px-5 py-2.5 bg-kid-lightblue flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-kid-deepblue font-black flex items-center gap-1">
                      <Star className="w-3 h-3 text-kid-yellow fill-kid-yellow" />
                      STAR GRADE
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-kid-blue font-serif">GRADE A+</span>
                    <span className="text-[11px] text-kid-deepblue font-bold">DISTINCTION (૯૧%)</span>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-mono bg-kid-paper px-3 py-1.5 rounded-xl border border-kid-border">
                      <span>📅</span>
                      <span id="reportDateBadge">{report?.assessment_date || 'October 24, 2026'}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        id="regenerateReportBtn"
                        onClick={handleRegenerateReport}
                        disabled={isUpdatingReport}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-kid-paper border-2 border-kid-border text-xs font-bold text-kid-deepblue transition-all flex items-center space-x-1.5 shadow-2xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-kid-blue ${isUpdatingReport ? 'animate-spin' : ''}`} />
                        <span>Update</span>
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-kid-paper border-2 border-kid-border text-xs font-bold text-slate-700 transition-all flex items-center space-x-1.5 shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-600" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 4 Playful Pillar Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              <div className="kid-card p-4 sm:p-5 bg-white flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold">Overall Star</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold font-mono">A+ Top 5%</span>
                </div>
                <div>
                  <div className="flex items-baseline space-x-1">
                    <span id="reportOverallScore" className="text-3xl sm:text-4xl font-extrabold text-kid-deepblue font-mono">
                      {report?.overall_development_score || 91}
                    </span>
                    <span className="text-slate-400 text-sm font-mono font-medium">/100</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mt-2 border border-slate-200">
                    <div id="reportOverallBar" className="bg-gradient-to-r from-kid-blue to-kid-yellow h-2.5 rounded-full transition-all duration-500" style={{ width: `${report?.overall_development_score || 91}%` }} />
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-bold">ઉત્કૃષ્ટ સર્વાંગી વિકાસ 🌟</p>
              </div>

              <div className="blue-card p-4 sm:p-5 bg-white flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold">English & Words</span>
                  <span id="reportVocabStatusBadge" className="px-2 py-0.5 rounded-full bg-blue-50 text-kid-blue border border-blue-200 text-xs font-bold font-mono">
                    Grade A
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline space-x-1">
                    <span id="reportVocabScore" className="text-3xl sm:text-4xl font-extrabold text-kid-blue font-mono">88%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mt-2 border border-slate-200">
                    <div id="reportVocabBar" className="bg-gradient-to-r from-blue-400 to-kid-blue h-2.5 rounded-full transition-all duration-500" style={{ width: '88%' }} />
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-bold">વાર્તામાંથી નવા શબ્દો શીખે છે 📚</p>
              </div>

              <div className="kid-card p-4 sm:p-5 bg-white flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold">Space & Science</span>
                  <span id="reportCuriosityStatusBadge" className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold font-mono">
                    Grade A+
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline space-x-1">
                    <span id="reportCuriosityScore" className="text-3xl sm:text-4xl font-extrabold text-amber-600 font-mono">94%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mt-2 border border-slate-200">
                    <div id="reportCuriosityBar" className="bg-gradient-to-r from-amber-400 to-amber-600 h-2.5 rounded-full transition-all duration-500" style={{ width: '94%' }} />
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-bold">અવકાશ અને તારાઓમાં ઉત્સુકતા 🚀</p>
              </div>

              <div className="kid-card p-4 sm:p-5 bg-white flex flex-col justify-between space-y-2 border-kid-coral">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold">Good Habits</span>
                  <span className="px-2 py-0.5 rounded-full bg-kid-lightyellow text-kid-deepblue border border-kid-yellow text-xs font-bold font-mono">
                    5/6 Done
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline space-x-1">
                    <span id="reportMissionsKpi" className="text-3xl sm:text-4xl font-extrabold text-kid-coral font-mono flex items-baseline gap-1.5">
                      <span>4</span> <span className="text-xs font-sans font-bold text-slate-600">Active</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mt-2 border border-slate-200">
                    <div className="bg-gradient-to-r from-red-400 to-kid-coral h-2.5 rounded-full w-full" />
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-bold">બ્રશ, શાકભાજી, રમકડાં & ઊંઘ ⭐</p>
              </div>

            </div>

            {/* Kindergarten Interactive Marksheet Table */}
            <div className="kid-card p-5 sm:p-7 bg-white shadow-soft-cloud">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b-2 border-kid-border gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-kid-deepblue font-serif flex items-center gap-2">
                    <span>🎨</span>
                    <span>પાર્થનું બાળ-મૈત્રીપૂર્ણ પ્રગતિ પત્રક (Kindergarten Marksheet)</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">Subject-wise playful stars and teacher observations</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-kid-lightyellow text-kid-deepblue border-2 border-kid-yellow font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-kid-gold" />
                  6-Year Milestones: PASSED WITH STARS
                </span>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-kid-blue text-white text-xs font-bold uppercase tracking-wider">
                      <th className="p-3.5 rounded-l-2xl">Subject / Activity (વિષય)</th>
                      <th className="p-3.5">Stars & Score</th>
                      <th className="p-3.5">Grade</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 rounded-r-2xl">Companion Remark (અભિપ્રાય)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100 text-xs sm:text-sm">
                    <tr className="hover:bg-amber-50/50">
                      <td className="p-3.5 font-bold text-kid-deepblue">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xl">🗣️</span>
                          <div>
                            <div>Spoken English & Words</div>
                            <div className="text-[11px] font-normal text-slate-500">અંગ્રેજી બોલચાલ & શબ્દભંડોળ</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex text-amber-400 text-base">★★★★★</div>
                        <span className="text-xs font-mono font-bold text-kid-blue">88/100</span>
                      </td>
                      <td className="p-3.5"><span className="px-2.5 py-1 rounded-lg bg-blue-100 text-kid-deepblue font-bold text-xs">Grade A</span></td>
                      <td className="p-3.5 text-emerald-700 font-bold">ઉત્કૃષ્ટ (Fluent)</td>
                      <td className="p-3.5 text-slate-700">બોલવામાં સ્પષ્ટતા છે, વાર્તામાંથી નવા શબ્દો તરત યાદ રાખી લે છે.</td>
                    </tr>

                    <tr className="hover:bg-amber-50/50">
                      <td className="p-3.5 font-bold text-kid-deepblue">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xl">🚀</span>
                          <div>
                            <div>Science, Space & Curiosity</div>
                            <div className="text-[11px] font-normal text-slate-500">સામાન્ય જ્ઞાન & સ્પેસ</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex text-amber-400 text-base">★★★★★</div>
                        <span className="text-xs font-mono font-bold text-amber-600">94/100</span>
                      </td>
                      <td className="p-3.5"><span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs">Grade A+</span></td>
                      <td className="p-3.5 text-emerald-700 font-bold">અસાધારણ (Curious)</td>
                      <td className="p-3.5 text-slate-700">તારાઓ અને રોકેટ કેવી રીતે ઉડે છે તે જાણવાની ઊંડી જિજ્ઞાસા ધરાવે છે.</td>
                    </tr>

                    <tr className="hover:bg-amber-50/50">
                      <td className="p-3.5 font-bold text-kid-deepblue">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xl">🪥</span>
                          <div>
                            <div>Good Habits & Manners</div>
                            <div className="text-[11px] font-normal text-slate-500">સારી ટેવો & સંસ્કાર</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex text-amber-400 text-base">★★★★★</div>
                        <span className="text-xs font-mono font-bold text-emerald-600">86/100</span>
                      </td>
                      <td className="p-3.5"><span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs">Grade A</span></td>
                      <td className="p-3.5 text-emerald-700 font-bold">સરસ શિસ્ત (Polite)</td>
                      <td className="p-3.5 text-slate-700">સવાર-સાંજ બ્રશ કરે છે, રમ્યા પછી રમકડાં યોગ્ય જગ્યાએ મૂકે છે.</td>
                    </tr>

                    <tr className="hover:bg-amber-50/50">
                      <td className="p-3.5 font-bold text-kid-deepblue">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xl">🎨</span>
                          <div>
                            <div>Creativity & Stories</div>
                            <div className="text-[11px] font-normal text-slate-500">ચિત્રકામ & વાર્તા રસ</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex text-amber-400 text-base">★★★★★</div>
                        <span className="text-xs font-mono font-bold text-purple-600">90/100</span>
                      </td>
                      <td className="p-3.5"><span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 font-bold text-xs">Grade A</span></td>
                      <td className="p-3.5 text-emerald-700 font-bold">સર્જનાત્મક (Creative)</td>
                      <td className="p-3.5 text-slate-700">રંગો અને ચિત્રો ખૂબ ગમે છે, સૂતી વખતે બોધકથાઓ રસપૂર્વક સાંભળે છે.</td>
                    </tr>

                    <tr className="hover:bg-amber-50/50">
                      <td className="p-3.5 font-bold text-kid-deepblue">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-xl">🤝</span>
                          <div>
                            <div>Politeness & Cheerfulness</div>
                            <div className="text-[11px] font-normal text-slate-500">હસમુખો પ્રેમાળ સ્વભાવ</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex text-amber-400 text-base">★★★★★</div>
                        <span className="text-xs font-mono font-bold text-kid-coral">95/100</span>
                      </td>
                      <td className="p-3.5"><span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-900 font-bold text-xs">Grade A+</span></td>
                      <td className="p-3.5 text-emerald-700 font-bold">ખૂબ પ્રેમાળ (Kind)</td>
                      <td className="p-3.5 text-slate-700">સૌની સાથે આદરથી વાત કરે છે અને હંમેશા પોઝિટિવ ઉત્સાહથી રહે છે.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Two-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: Interactive Habits Tracker & Conversations */}
              <div className="lg:col-span-7 space-y-6">

                {/* Daily Habits Checklist (Interactive Sticker Checkboxes) */}
                <div className="kid-card p-5 sm:p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-kid-border">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <h3 className="font-extrabold text-base text-kid-deepblue">પાલકો માટે દૈનિક આદતોનું ચેકલિસ્ટ (Habits Tracker)</h3>
                        <p className="text-xs text-slate-500">Tap to mark what Parth achieved today</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-kid-lightyellow text-kid-deepblue font-bold border border-kid-yellow">
                      {habits.filter(h => h.done).length}/{habits.length} Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {habits.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => handleToggleHabit(h.id)}
                        className={`flex items-start space-x-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          h.done ? 'bg-kid-lightyellow/60 border-kid-yellow shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={h.done}
                          onChange={() => {}}
                          className="mt-1 w-4 h-4 text-kid-blue rounded-md focus:ring-kid-blue cursor-pointer"
                        />
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-kid-deepblue">{h.title}</div>
                          <div className="text-[11px] text-slate-500 font-medium">{h.subtitle}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real Conversation Highlights with Parth */}
                <div className="blue-card p-5 sm:p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-blue-200">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">💬</span>
                      <div>
                        <h3 className="font-extrabold text-base text-kid-deepblue">પાર્થ અને KOTL વચ્ચે થયેલી તાજેતરની વાતો</h3>
                        <p className="text-xs text-slate-500">Real spoken dialogue from ESP32 live microphone</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-kid-lightblue text-kid-blue font-bold border border-blue-200">
                      Live Mic
                    </span>
                  </div>

                  <div id="conversationEvidenceContainer" className="space-y-4">
                    {(report?.dialogue_evidence || report?.conversation_evidence || []).map((item, idx) => (
                      <div key={idx} className="p-4 bg-kid-paper border-2 border-kid-border rounded-2xl space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-kid-blue" />
                            <h4 className="font-bold text-xs sm:text-sm text-kid-deepblue">{item.context || item.topic || 'Dialogue'}</h4>
                          </div>
                          <button
                            onClick={() => handlePlayVoice(item.kotl_response || item.kotl_answer)}
                            className="text-xs text-kid-blue hover:text-kid-deepblue flex items-center gap-1 font-bold"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Play Voice</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="p-3 rounded-2xl bg-white border-2 border-blue-200 flex items-start space-x-2.5">
                            <span className="text-base shrink-0">🧒</span>
                            <div>
                              <div className="text-[10px] font-mono font-bold text-kid-blue uppercase">Parth Asked:</div>
                              <p className="text-xs sm:text-sm font-medium text-slate-800 italic">“{item.child_quote || item.child_question}”</p>
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-white border-2 border-amber-200 flex items-start space-x-2.5">
                            <span className="text-base shrink-0">🤖</span>
                            <div>
                              <div className="text-[10px] font-mono font-bold text-kid-gold uppercase">KOTL Companion Answer:</div>
                              <p className="text-xs sm:text-sm text-slate-700">“{item.kotl_response || item.kotl_answer}”</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parent Action Tips */}
                <div className="kid-card p-5 sm:p-6 bg-white space-y-4">
                  <div className="flex items-center space-x-2.5 pb-3 border-b-2 border-kid-border">
                    <span className="text-2xl">💡</span>
                    <div>
                      <h3 className="font-extrabold text-base text-kid-deepblue">માતા-પિતા માટે સરળ સૂચનો (Parent Action Tips)</h3>
                      <p className="text-xs text-slate-500">Everyday fun activities to do with Parth at home</p>
                    </div>
                  </div>

                  <div id="parentRecommendationsContainer" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(report?.parent_recommendations || []).map((item, idx) => (
                      <div key={idx} className="p-3.5 bg-kid-paper border-2 border-kid-border rounded-2xl space-y-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-kid-deepblue flex items-center space-x-1.5">
                          <span>✨</span>
                          <span>{item.area || item.title || 'Tip'}</span>
                        </h4>
                        <p className="text-xs text-slate-600">{item.suggestion || item.action}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Teacher Observation & Passions */}
              <div className="lg:col-span-5 space-y-6">

                {/* Teacher / KOTL Companion Remark */}
                <div className="kid-card p-5 sm:p-6 bg-kid-lightyellow/60 border-2 border-kid-yellow space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">📝</span>
                      <h3 className="font-extrabold text-sm sm:text-base text-kid-deepblue">શિક્ષક / KOTL નો અભિપ્રાય (Companion Remark)</h3>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-kid-gold font-bold border border-kid-yellow">Verified</span>
                  </div>

                  <p id="reportExecutiveSummary" className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                    {report?.executive_summary || 'Parth demonstrates exceptional inquisitiveness, bright verbal enthusiasm, and a joyful, polite spirit during conversations with KOTL.'}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-1.5 text-xs">
                    <span className="px-3 py-1 rounded-xl bg-white border border-kid-yellow text-kid-deepblue font-bold">🚀 Space Explorer</span>
                    <span className="px-3 py-1 rounded-xl bg-white border border-kid-yellow text-kid-deepblue font-bold">🎨 Creative Artist</span>
                    <span className="px-3 py-1 rounded-xl bg-white border border-kid-yellow text-kid-deepblue font-bold">🤝 Well Mannered</span>
                  </div>
                </div>

                {/* What Parth Loves (Relatable Interests) */}
                <div className="kid-card p-5 sm:p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-kid-border">
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-kid-deepblue flex items-center space-x-2">
                        <span>💖</span>
                        <span>પાર્થની મનપસંદ પ્રવૃત્તિઓ (What Parth Loves)</span>
                      </h3>
                      <p className="text-xs text-slate-500">Everyday topics Parth enjoys talking about</p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-300">Affinities</span>
                  </div>

                  <div id="passionsContainer" className="space-y-2.5">
                    {(report?.passions_analysis || []).map((item, idx) => (
                      <div key={idx} className="p-3 bg-kid-paper border-2 border-kid-border rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs sm:text-sm text-kid-deepblue">{item.topic}</span>
                          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">{item.affinity}</span>
                        </div>
                        <p className="text-xs text-slate-600">{item.observation}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Hobby input */}
                  <div className="pt-3 border-t-2 border-kid-border flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Add hobby (e.g. Painting, Football)..."
                      value={newLike}
                      onChange={(e) => setNewLike(e.target.value)}
                      className="flex-1 bg-kid-paper border-2 border-kid-border rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-kid-blue"
                    />
                    <button
                      onClick={() => handleAddInterest('likes')}
                      className="px-3.5 py-2 rounded-xl bg-kid-lightblue hover:bg-blue-100 text-kid-deepblue border border-blue-200 text-xs font-bold transition-all shadow-2xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Sensitivities & Gentle Care */}
                <div className="kid-card p-5 sm:p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-kid-border">
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-kid-deepblue flex items-center space-x-2">
                        <span>🛡️</span>
                        <span>ધ્યાન રાખવા જેવી બાબતો (Sensitivities & Care)</span>
                      </h3>
                      <p className="text-xs text-slate-500">Handled with gentle positive guidance</p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-kid-coral font-bold border border-red-200">Gentle</span>
                  </div>

                  <div id="sensitivitiesContainer" className="space-y-2.5">
                    {(report?.sensitivities_and_coping || []).map((item, idx) => (
                      <div key={idx} className="p-3 bg-kid-paper border-2 border-kid-border rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs sm:text-sm text-kid-deepblue">{item.sensitivity}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-kid-coral border border-red-200 font-bold">Gentle Care</span>
                        </div>
                        <p className="text-xs text-slate-600"><strong className="text-slate-800">KOTL Care:</strong> {item.coping_strategy}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t-2 border-kid-border flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Add care area (e.g. Dark rooms)..."
                      value={newDislike}
                      onChange={(e) => setNewDislike(e.target.value)}
                      className="flex-1 bg-kid-paper border-2 border-kid-border rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-kid-blue"
                    />
                    <button
                      onClick={() => handleAddInterest('dislikes')}
                      className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-kid-coral border border-red-200 text-xs font-bold transition-all shadow-2xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Milestones Achieved */}
                <div className="kid-card p-5 sm:p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-kid-border">
                    <h3 className="font-extrabold text-sm sm:text-base text-kid-deepblue flex items-center space-x-2">
                      <span>🏆</span>
                      <span>પ્રગતિના લક્ષ્યો (Milestones Achieved)</span>
                    </h3>
                  </div>

                  <div id="milestonesContainer" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(report?.developmental_milestones || []).map((item, idx) => (
                      <div key={idx} className="p-3 bg-kid-paper border-2 border-kid-border rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-blue-50 text-kid-blue border border-blue-200">{item.badge}</span>
                          <span className="text-xs font-mono font-bold text-emerald-700">Achieved</span>
                        </div>
                        <h5 className="font-bold text-xs text-kid-deepblue">{item.title}</h5>
                        <p className="text-[11px] text-slate-500">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PARENT DIRECTIVES & HABITS                        */}
        {/* ======================================================== */}
        {currentTab === 'missions' && (
          <section id="viewMissions" className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-6 custom-scrollbar max-w-5xl mx-auto w-full">
            
            <div className="kid-card p-6 bg-white space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-3xl">🎯</span>
                    <h2 className="text-lg sm:text-2xl font-extrabold text-kid-deepblue font-serif">
                      માતા-પિતાના લક્ષ્યાંકો (Parent Directives & Habits)
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                    તમે KOTL ને જે પણ આદતો શીખવવા કહેશો, KOTL વાતો કરતી વખતે પાર્થને રમત-રમતમાં તે શીખવશે.
                  </p>
                </div>
              </div>

              {/* Preset Goal Chips */}
              <div className="pt-4 border-t-2 border-kid-border flex flex-wrap gap-2 text-xs">
                <span className="text-slate-500 font-bold self-center mr-1">Quick Presets:</span>
                <button
                  onClick={() => {
                    setMissionTitle('Brush Teeth Twice Daily');
                    setMissionDirective('Cheerfully remind Parth about shiny white teeth every morning and before sleep.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-kid-paper hover:bg-amber-100 border-2 border-kid-border text-kid-deepblue font-bold transition-all"
                >
                  🪥 Brush Teeth
                </button>
                <button
                  onClick={() => {
                    setMissionTitle('Eat Healthy Green Veggies');
                    setMissionDirective('Highlight how carrots and spinach give champions superhero stamina.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-kid-paper hover:bg-amber-100 border-2 border-kid-border text-kid-deepblue font-bold transition-all"
                >
                  🥦 Green Veggies
                </button>
                <button
                  onClick={() => {
                    setMissionTitle('Tidy Up Toys After Play');
                    setMissionDirective('Encourage placing toys and drawing colors back in the organizer box.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-kid-paper hover:bg-amber-100 border-2 border-kid-border text-kid-deepblue font-bold transition-all"
                >
                  🎒 Tidy Up Toys
                </button>
                <button
                  onClick={() => {
                    setMissionTitle('20 Mins English Story Time');
                    setMissionDirective('Narrate engaging story questions about space and animals in clean simple English.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-kid-paper hover:bg-amber-100 border-2 border-kid-border text-kid-deepblue font-bold transition-all"
                >
                  📖 English Story
                </button>
              </div>

              {/* Add Directive Form */}
              <form onSubmit={handleCreateMission} className="pt-4 border-t-2 border-kid-border space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-kid-deepblue mb-1">Goal Title (લક્ષ્ય)</label>
                    <input
                      type="text"
                      placeholder="e.g. Brush Teeth Twice Daily"
                      value={missionTitle}
                      onChange={(e) => setMissionTitle(e.target.value)}
                      className="w-full bg-kid-paper border-2 border-kid-border rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-kid-blue"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-kid-deepblue mb-1">KOTL Companion Directive (KOTL ને સૂચના)</label>
                    <input
                      type="text"
                      placeholder="e.g. Lovingly encourage Parth to brush his teeth before bed"
                      value={missionDirective}
                      onChange={(e) => setMissionDirective(e.target.value)}
                      className="w-full bg-kid-paper border-2 border-kid-border rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-kid-blue"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="px-5 py-2.5 rounded-2xl bg-kid-blue hover:bg-kid-deepblue text-white text-xs font-bold transition-all shadow-blue-bubbly flex items-center space-x-1.5">
                    <Plus className="w-4 h-4" />
                    <span>+ Add Directive</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Active Directives List */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs text-slate-600 uppercase tracking-wider font-mono px-1">
                Active Directives for Parth
              </h3>
              <div id="missionsListContainer" className="space-y-3">
                {missions.map((m) => (
                  <div key={m.id} className={`kid-card p-4 sm:p-5 space-y-2 bg-white ${m.active ? 'border-kid-blue' : 'opacity-70'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base">{m.active ? '🎯' : '⏸️'}</span>
                          <h4 className="font-bold text-sm sm:text-base text-kid-deepblue">{m.title}</h4>
                          {m.active ? (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-kid-blue border border-blue-200 font-mono font-bold">
                              Active in Prompt
                            </span>
                          ) : (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 font-mono">
                              Paused
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 pl-6">
                          <strong className="text-kid-deepblue">KOTL Instruction:</strong> {m.directive}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleToggleMission(m.id, !m.active)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            m.active ? 'bg-kid-lightblue text-kid-deepblue hover:bg-blue-100 border border-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {m.active ? 'Active' : 'Paused'}
                        </button>
                        <button
                          onClick={() => handleDeleteMission(m.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-kid-coral transition-colors"
                          title="Delete Directive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </section>
        )}

        {/* ======================================================== */}
        {/* TAB 3: DIALOGUE & LIVE AUDIO (CHAT)                      */}
        {/* ======================================================== */}
        {currentTab === 'chat' && (
          <section id="viewChat" className="flex-1 flex flex-col justify-between overflow-hidden relative bg-kid-paper">
            
            {/* Sub-header Bar */}
            <div className="h-11 border-b-2 border-kid-border px-4 sm:px-6 flex items-center justify-between text-xs font-mono text-slate-600 bg-white shrink-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-kid-deepblue">Conversation Archive</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                  Live Synced (Parth & KOTL)
                </span>
              </div>
              <button onClick={handleClearHistory} className="text-xs text-slate-500 hover:text-kid-coral transition-colors font-sans font-bold">
                🗑️ Clear History
              </button>
            </div>

            {/* Chat Messages Scroll Area */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 custom-scrollbar flex flex-col items-center w-full">
              <div id="chatContainer" className="w-full max-w-3xl space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-3">
                    <div className="w-14 h-14 rounded-3xl bg-kid-lightblue text-kid-deepblue flex items-center justify-center text-2xl font-bold border-2 border-blue-200">
                      🧸
                    </div>
                    <h3 className="text-base font-bold text-kid-deepblue">No Conversation History Yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Speak through the ESP32 physical microphone or type your question below.
                    </p>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div key={idx} className={`w-full flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'user' ? (
                        <div className="max-w-[88%] sm:max-w-[78%] bg-kid-blue text-white rounded-3xl px-5 py-3 text-sm sm:text-base leading-relaxed shadow-blue-bubbly space-y-1 break-words">
                          <div className="flex items-center justify-end space-x-2 text-xs text-blue-100 font-mono">
                            <span className="font-bold text-white">Parth</span>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px]">
                              {msg.source === 'esp32' ? '🎙️ ESP32 Device' : '💻 Web'}
                            </span>
                          </div>
                          <div className="break-words font-sans text-white">{msg.content || msg.text}</div>
                        </div>
                      ) : (
                        <div className="flex items-start space-x-3.5 max-w-[95%] sm:max-w-[85%]">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-kid-yellow to-kid-gold text-kid-deepblue flex items-center justify-center font-bold text-lg shrink-0 mt-0.5 shadow-yellow-bubbly border-2 border-kid-yellow">
                            🤖
                          </div>
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                              <span className="text-kid-deepblue font-bold font-serif">KOTL (Companion)</span>
                            </div>
                            <div className="text-sm sm:text-base text-slate-800 leading-relaxed font-sans break-words bg-white p-4 rounded-3xl border-2 border-kid-border shadow-soft-cloud">
                              {msg.content || msg.text}
                            </div>
                            <button
                              onClick={() => handlePlayVoice(msg.content || msg.text, msg.tts_url)}
                              className="mt-2 inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-kid-deepblue hover:text-kid-blue px-3 py-1.5 rounded-xl bg-kid-lightblue hover:bg-blue-100 border border-blue-200 transition-all shadow-2xs"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-kid-blue" />
                              <span>Play Spoken Voice</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Chat Input Bar */}
            <div className="w-full p-4 shrink-0 flex flex-col items-center justify-center bg-white border-t-2 border-kid-border">
              <form onSubmit={handleSendMessage} className="w-full max-w-3xl relative flex items-center bg-kid-paper border-2 border-kid-border rounded-2xl shadow-2xs focus-within:border-kid-blue focus-within:bg-white transition-all px-3 py-2">
                <input
                  id="chatInput"
                  type="text"
                  placeholder="Type a message or speak to KOTL..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none px-3 py-1 font-sans"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="w-9 h-9 rounded-full bg-kid-blue hover:bg-kid-deepblue text-white flex items-center justify-center transition-all disabled:opacity-30 shadow-blue-bubbly shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <p className="text-[11px] text-slate-500 mt-2 text-center font-mono">
                KOTL Kindergarten • Parth's AI Buddy • Next.js App Router • Groq Neural LLM
              </p>
            </div>

          </section>
        )}

      </main>

      {/* Fixed Mobile Bottom Navigation Bar (QA verified) */}
      <nav id="mobileBottomNav" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-kid-border px-4 py-2 flex items-center justify-around shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          onClick={() => setCurrentTab('report')}
          className={`flex flex-col items-center justify-center space-y-1 px-4 py-1.5 rounded-xl font-bold transition-all ${
            currentTab === 'report' ? 'text-kid-deepblue bg-kid-lightblue' : 'text-slate-500'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-xs">Report</span>
        </button>
        <button
          onClick={() => setCurrentTab('missions')}
          className={`flex flex-col items-center justify-center space-y-1 px-4 py-1.5 rounded-xl font-bold transition-all relative ${
            currentTab === 'missions' ? 'text-kid-deepblue bg-kid-lightyellow' : 'text-slate-500'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-xs">Habits</span>
        </button>
        <button
          onClick={() => setCurrentTab('chat')}
          className={`flex flex-col items-center justify-center space-y-1 px-4 py-1.5 rounded-xl font-bold transition-all ${
            currentTab === 'chat' ? 'text-kid-coral bg-red-50' : 'text-slate-500'
          }`}
        >
          <Smile className="w-5 h-5" />
          <span className="text-xs">Dialogue</span>
        </button>
      </nav>

      {/* Child Profile Modal (QA verified) */}
      {isProfileModalOpen && (
        <div id="childProfileModal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="kid-card w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 space-y-5 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-kid-border pb-3">
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl">⚙️</span>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-kid-deepblue font-serif">Child Profile & Safety Guardrails</h3>
                  <p className="text-xs text-slate-500">Configure child age, name, bedtime routine & safety permissions</p>
                </div>
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg p-1">✕</button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch('/api/child/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profile)
                  });
                  if (res.ok) {
                    setIsProfileModalOpen(false);
                    await handleRegenerateReport();
                  }
                } catch (err) {
                  alert(err.message);
                }
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-kid-deepblue mb-1">Child Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-kid-paper border-2 border-kid-border rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-kid-blue"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-kid-deepblue mb-1">Age</label>
                  <input
                    type="text"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    className="w-full bg-kid-paper border-2 border-kid-border rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-kid-blue"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-kid-deepblue mb-1">Gender</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    className="w-full bg-kid-paper border-2 border-kid-border rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-kid-blue"
                  >
                    <option value="Boy">👦 Boy (દીકરો / બેટા)</option>
                    <option value="Girl">👧 Girl (દીકરી / બેટી)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-kid-deepblue mb-1">Bedtime Routine</label>
                  <input
                    type="text"
                    value={profile.bedtime}
                    onChange={(e) => setProfile({ ...profile, bedtime: e.target.value })}
                    className="w-full bg-kid-paper border-2 border-kid-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-kid-blue"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t-2 border-kid-border">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-kid-blue hover:bg-kid-deepblue text-white text-xs font-bold transition-all shadow-blue-bubbly"
                >
                  Save Profile & Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Audio Player for Web Voice Playback */}
      <audio ref={audioPlayerRef} className="hidden" />

    </div>
  );
}
