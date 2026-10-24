'use client';

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
  const [isLogSicknessOpen, setIsLogSicknessOpen] = useState(false);
  const [isUpdateVitalsOpen, setIsUpdateVitalsOpen] = useState(false);
  const [isAddVaccineOpen, setIsAddVaccineOpen] = useState(false);
  const [isAssignQuestOpen, setIsAssignQuestOpen] = useState(false);
  const [deviceOnline, setDeviceOnline] = useState(true);

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
      category: "Family & Kindness",
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
  const [vitals, setVitals] = useState({ height: 116, weight: 21.5, bmi: 15.9 });
  const [sicknessLogs, setSicknessLogs] = useState([
    {
      id: "sick-1",
      date: "Oct 18, 2026",
      symptom: "Mild Cold & Runny Nose",
      doctor: "Dr. A. Mehta, MD (Pediatrics)",
      medicines: "Warm turmeric milk & soothing honey ginger tea",
      dosage: "Twice daily after meals",
      status: "recovered",
      remedy: "Warm fluids, steam inhalation and ample bedtime rest"
    }
  ]);
  const [vaccinations, setVaccinations] = useState([
    { id: "vac-1", name: "MMR Booster Vaccine", age_due: "5-6 Years", status: "completed", date: "April 2026" },
    { id: "vac-2", name: "DPT Booster 2", age_due: "5-6 Years", status: "completed", date: "July 2026" },
    { id: "vac-3", name: "Typhoid Conjugate Booster", age_due: "6 Years", status: "upcoming", due_date: "November 2026" },
    { id: "vac-4", name: "Annual Flu Shot (Influenza)", age_due: "Annual", status: "upcoming", due_date: "December 2026" }
  ]);

  // Walkie-Talkie & Dialogue
  const [isRecording, setIsRecording] = useState(false);
  const [walkieStatus, setWalkieStatus] = useState('Tap to record a voice memo from Mummy or Papa');
  const [customMemoText, setCustomMemoText] = useState('');
  const [voiceMemos, setVoiceMemos] = useState([
    { id: 'vm-1', timestamp: 'Today, 10:30 AM', sender: 'Mummy', text: 'Parth beta, drink your fresh glass of water and stay energized!', preset: 'Drink Water', status: 'Delivered to KOTL' },
    { id: 'vm-2', timestamp: 'Yesterday, 08:45 PM', sender: 'Papa', text: 'Bedtime soon champ! Let us listen to KOTL star story and sleep on time.', preset: 'Bedtime Hug', status: 'Played by Parth' }
  ]);

  // Modals form states
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestCategory, setNewQuestCategory] = useState('School Project');
  const [newQuestGoal, setNewQuestGoal] = useState('');
  const [newQuestHint, setNewQuestHint] = useState('');

  const [sickDate, setSickDate] = useState('2026-10-24');
  const [sickSymptom, setSickSymptom] = useState('');
  const [sickDoctor, setSickDoctor] = useState('Dr. A. Mehta, MD (Pediatrics)');
  const [sickMedicines, setSickMedicines] = useState('');
  const [sickStatus, setSickStatus] = useState('recovered');
  const [sickRemedy, setSickRemedy] = useState('');

  const [inputHeight, setInputHeight] = useState(116);
  const [inputWeight, setInputWeight] = useState(21.5);

  const [newVacName, setNewVacName] = useState('');
  const [newVacDate, setNewVacDate] = useState('Nov 2026');

  const playVoice = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-IN';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  const toggleQuest = (id) => {
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
      mentor_hints: newQuestHint ? [newQuestHint.trim()] : ["Think step by step with KOTL!"],
      status: "in_progress",
      reward_badge: "⭐ Star Explorer"
    };
    setQuests(prev => [item, ...prev]);
    setNewQuestTitle('');
    setNewQuestGoal('');
    setNewQuestHint('');
    setIsAssignQuestOpen(false);
  };

  const handleAddSickness = (e) => {
    e.preventDefault();
    if (!sickSymptom.trim()) return;
    const log = {
      id: 'sick-' + Date.now(),
      date: sickDate || 'Today',
      symptom: sickSymptom.trim(),
      doctor: sickDoctor.trim(),
      medicines: sickMedicines.trim(),
      dosage: 'As prescribed',
      status: sickStatus,
      remedy: sickRemedy.trim()
    };
    setSicknessLogs(prev => [log, ...prev]);
    setSickSymptom('');
    setSickMedicines('');
    setSickRemedy('');
    setIsLogSicknessOpen(false);
  };

  const handleUpdateVitals = (e) => {
    e.preventDefault();
    const h = Number(inputHeight) || 116;
    const w = Number(inputWeight) || 21.5;
    const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);
    setVitals({ height: h, weight: w, bmi: Number(bmi) });
    setIsUpdateVitalsOpen(false);
  };

  const toggleVaccine = (id) => {
    setVaccinations(prev => prev.map(v => v.id === id ? { ...v, status: v.status === 'completed' ? 'upcoming' : 'completed', date: 'This Month' } : v));
  };

  const handleAddVaccine = (e) => {
    e.preventDefault();
    if (!newVacName.trim()) return;
    const vac = {
      id: 'vac-' + Date.now(),
      name: newVacName.trim(),
      age_due: '6 Years',
      status: 'upcoming',
      due_date: newVacDate.trim()
    };
    setVaccinations(prev => [...prev, vac]);
    setNewVacName('');
    setIsAddVaccineOpen(false);
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

      {/* TOP HEADER */}
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
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Holistic Pediatric Growth, Health & AI Socratic Mentor</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
              <span className="text-emerald-500 text-sm">🔋</span>
              <span>88%</span>
            </div>

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

      {/* 5 PURPOSE-DRIVEN SUPER-HUBS */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-1 pb-2">
        <div className="bg-amber-50/80 backdrop-blur-sm border-2 border-amber-200 rounded-2xl p-1.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto shadow-xs">
          
          <button onClick={() => setCurrentSection('report')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'report' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>📜</span>
            <span>Report & Marks</span>
          </button>

          <button onClick={() => setCurrentSection('quests')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'quests' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>🧭</span>
            <span>Mentor Quests</span>
          </button>

          <button onClick={() => setCurrentSection('growth')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'growth' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>🌟</span>
            <span>360° Life Growth</span>
          </button>

          <button onClick={() => setCurrentSection('health')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'health' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>🏥</span>
            <span>Health & Medical</span>
          </button>

          <button onClick={() => setCurrentSection('parent')} className={`px-3.5 sm:px-4 py-2 rounded-xl font-fredoka font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${currentSection === 'parent' ? 'bg-[#38BDF8] text-white shadow-md shadow-sky-500/25' : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'}`}>
            <span>🎙️</span>
            <span>Parent Hub</span>
          </button>

        </div>
      </div>

      {/* MAIN VIEW CONTENT */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-2 pb-24">
        
        {/* VIEW 1: REPORT & MARKS */}
        {currentSection === 'report' && (
          <div className="flex flex-col gap-5 max-w-4xl mx-auto">
            <div className="p-5 sm:p-6 relative overflow-hidden bg-[#FFFDF0] border-[3px] border-[#F6D365] rounded-[38px] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-[22px] bg-blue-600 flex items-center justify-center text-3xl shadow-md text-white">👦</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold font-fredoka text-slate-800">{profile.name}</h1>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">• ESP32 Live</span>
                  </div>
                  <p className="text-slate-700 font-bold text-xs sm:text-sm mt-0.5">{profile.age} Years • Sr. KG</p>
                  <p className="text-slate-500 text-xs">Companion: KOTL Buddy • Kindergarten Edition</p>
                </div>
              </div>
              <div className="bg-amber-500 text-white p-3 px-4 rounded-2xl text-center shadow-md">
                <div className="text-[10px] font-bold uppercase">Grade</div>
                <div className="text-2xl font-black font-fredoka">A+</div>
                <div className="text-[9px]">(89/100)</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-sky-50 border-2 border-sky-300 rounded-3xl p-3 shadow-xs">
                <span className="text-[10px] font-bold text-sky-700 uppercase">Overall Star</span>
                <div className="text-2xl font-extrabold font-fredoka text-sky-900">89/100</div>
              </div>
              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-3 shadow-xs">
                <span className="text-[10px] font-bold text-amber-700 uppercase">English</span>
                <div className="text-2xl font-extrabold font-fredoka text-amber-900">88%</div>
              </div>
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-3 shadow-xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Space</span>
                <div className="text-2xl font-extrabold font-fredoka text-emerald-900">94%</div>
              </div>
              <div className="bg-teal-50 border-2 border-teal-300 rounded-3xl p-3 shadow-xs">
                <span className="text-[10px] font-bold text-teal-700 uppercase">Habits</span>
                <div className="text-2xl font-extrabold font-fredoka text-teal-900">78%</div>
              </div>
            </div>

            {/* Child Skills Directory */}
            <div className="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-sm space-y-3">
              <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                <span>🧠</span><span>Child Skills & Superpowers Directory</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200">
                  <div className="font-bold text-sky-900">📚 Vocabulary Mastery: 88% (140+ Words)</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">Rapid word learning embedded in bedtime story adventures.</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="font-bold text-emerald-900">🔭 Scientific Inquiry: 94% (Exceptional)</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">Drives dialogues with deep why and how curiosity.</p>
                </div>
              </div>
            </div>

            {/* 1-Minute Executive Memo */}
            <div className="bg-[#FFFDF2] border-2 border-[#F6D365] rounded-[32px] p-5 shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-fredoka text-base font-bold text-amber-950">📋 1-Minute Parent Executive Briefing</h3>
                <span className="text-[10px] font-bold bg-amber-200 px-2 py-0.5 rounded-full">Auto-Synthesized</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Parth demonstrates exceptional inquisitiveness, bright verbal enthusiasm, and a joyful spirit during conversations with KOTL. He shows strong memory retention when engaged in storytelling about space exploration, stars, and creative art. While his vocabulary and cognitive curiosity exceed standard developmental benchmarks for 6-year-olds, KOTL is actively providing supportive storytelling to help build enthusiastic habits around healthy nutrition and bedtime wind-down routines.
              </p>
            </div>
          </div>
        )}

        {/* VIEW 2: MENTOR QUESTS (BRAND NEW!) */}
        {currentSection === 'quests' && (
          <div className="flex flex-col gap-5 max-w-4xl mx-auto">
            <div className="bg-white border-2 border-amber-300 rounded-[32px] p-5 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="font-fredoka text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>🧭</span><span>AI Socratic Mentor Quests & Challenges</span>
                </h2>
                <p className="text-xs text-slate-500">KOTL asks curious questions so Parth thinks, explores, and completes projects!</p>
              </div>
              <button onClick={() => setIsAssignQuestOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white font-fredoka font-bold text-xs px-4 py-2 rounded-xl shadow-xs">
                ➕ Assign Quest
              </button>
            </div>

            <div className="space-y-4">
              {quests.map(q => {
                const isDone = q.status === 'completed';
                return (
                  <div key={q.id} className={`p-5 rounded-[32px] border-2 transition-all ${isDone ? 'bg-[#F0FDF4] border-emerald-300' : 'bg-white border-amber-200 shadow-sm'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{isDone ? '🏆' : '🧭'}</span>
                          <h3 className="font-fredoka text-base font-bold text-slate-800">{q.title}</h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{q.category}</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{q.goal}</p>
                      </div>
                      <button onClick={() => toggleQuest(q.id)} className={`text-xs font-fredoka font-bold px-3 py-1.5 rounded-xl border ${isDone ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700'}`}>
                        {isDone ? '✓ Completed' : 'Mark Done'}
                      </button>
                    </div>

                    {q.mentor_hints && (
                      <div className="mt-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs">
                        <span className="font-bold text-amber-900 block mb-1">🤖 KOTL Socratic Prompts for Parth:</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                          {q.mentor_hints.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: 360° LIFE GROWTH */}
        {currentSection === 'growth' && (
          <div className="flex flex-col gap-5 max-w-4xl mx-auto">
            {/* Education */}
            <div className="bg-white border-2 border-sky-200 rounded-[32px] p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>🎓</span><span>Education & Academic Learning Hub</span>
                </h3>
                <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">Sr. KG</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200">
                  <strong>🔤 This Week's Sight Words:</strong>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {['Planet', 'Orbit', 'Stamina', 'Polite', 'Gentle'].map((w, i) => (
                      <span key={i} className="bg-white px-2 py-0.5 rounded-md border text-sky-800 font-bold">{w}</span>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <strong>🔢 Math Concepts:</strong>
                  <div className="mt-1 text-slate-600">Counting 1-100, Shapes (Circle, Star, Triangle), Simple addition.</div>
                </div>
              </div>
            </div>

            {/* Sports */}
            <div className="bg-white border-2 border-emerald-200 rounded-[32px] p-5 shadow-sm space-y-3">
              <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                <span>⚽</span><span>Sports & Physical Fitness</span>
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="font-bold text-emerald-800">Daily Active Play</div>
                  <div className="text-xl font-bold font-fredoka mt-1">45 / 60 mins</div>
                </div>
                <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200">
                  <div className="font-bold text-sky-800">Favorite Sports</div>
                  <div className="font-bold mt-1">Cricket • Cycling</div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="font-bold text-amber-800">Motor Skills</div>
                  <div className="font-bold mt-1">Ball Catching: Good</div>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="bg-white border-2 border-purple-200 rounded-[32px] p-5 shadow-sm space-y-3">
              <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                <span>🤝</span><span>Social Skills & Family Manners</span>
              </h3>
              <div className="grid grid-cols-3 gap-3 text-xs text-center">
                <div className="p-3 rounded-2xl bg-slate-50 border"><strong>🧸 Peer Sharing</strong><div className="text-emerald-700 font-bold mt-1">Excellent</div></div>
                <div className="p-3 rounded-2xl bg-slate-50 border"><strong>🙏 Family Respect</strong><div className="text-emerald-700 font-bold mt-1">Very Polite</div></div>
                <div className="p-3 rounded-2xl bg-slate-50 border"><strong>😌 Emotional EQ</strong><div className="text-sky-700 font-bold mt-1">Steady Progress</div></div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: HEALTH & MEDICAL HUB */}
        {currentSection === 'health' && (
          <div className="flex flex-col gap-5 max-w-4xl mx-auto">
            {/* Header controls */}
            <div className="bg-white border-2 border-emerald-300 rounded-[32px] p-5 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="font-fredoka text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>🏥</span><span>Child Health & Pediatric Medical Hub</span>
                </h2>
                <p className="text-xs text-slate-500">Track illness episodes, medicines, vaccinations, and growth vitals</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsLogSicknessOpen(true)} className="bg-rose-500 hover:bg-rose-600 text-white font-fredoka font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs">
                  ➕ Log Sickness
                </button>
                <button onClick={() => window.print()} className="bg-emerald-500 hover:bg-emerald-600 text-white font-fredoka font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs">
                  🩺 Export Doctor
                </button>
              </div>
            </div>

            {/* Medical ID */}
            <div className="p-5 rounded-[32px] bg-[#E8FBF0] border-2 border-[#86EFAC] space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-fredoka text-base font-bold text-emerald-950 flex items-center gap-2">
                  <span>🩺</span><span>Emergency Medical Identity</span>
                </h3>
                <span className="text-xs font-bold bg-emerald-200 px-3 py-1 rounded-full text-emerald-900">Blood Group: B+</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white border"><strong>Allergies:</strong> Dust / Pollen (Mild)</div>
                <div className="p-3 rounded-2xl bg-white border"><strong>Pediatrician:</strong> Dr. A. Mehta, MD</div>
                <div className="p-3 rounded-2xl bg-white border flex justify-between items-center">
                  <span>+91 98765 43210</span>
                  <a href="tel:+919876543210" className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-bold">Call</a>
                </div>
              </div>
            </div>

            {/* Vitals */}
            <div className="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>📏</span><span>Growth Vitals</span>
                </h3>
                <button onClick={() => setIsUpdateVitalsOpen(true)} className="text-xs font-bold bg-amber-100 px-3 py-1 rounded-xl text-amber-900">
                  ✏️ Update Vitals
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-2xl bg-amber-50">Height: <strong className="text-base font-fredoka block">{vitals.height} cm</strong></div>
                <div className="p-3 rounded-2xl bg-sky-50">Weight: <strong className="text-base font-fredoka block">{vitals.weight} kg</strong></div>
                <div className="p-3 rounded-2xl bg-emerald-50">BMI: <strong className="text-base font-fredoka block">{vitals.bmi}</strong></div>
              </div>
            </div>

            {/* Sickness History Logs */}
            <div className="bg-white border-2 border-rose-200 rounded-[32px] p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>💊</span><span>Sickness Episodes & Medicine Logs</span>
                </h3>
                <button onClick={() => setIsLogSicknessOpen(true)} className="text-xs font-bold bg-rose-100 text-rose-900 px-3 py-1 rounded-xl">
                  ➕ New Episode
                </button>
              </div>
              <div className="space-y-3">
                {sicknessLogs.map(s => (
                  <div key={s.id} className="p-4 rounded-2xl bg-slate-50 border border-rose-200 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-800 text-sm">{s.symptom}</strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">{s.status}</span>
                    </div>
                    <div className="text-slate-600">Date: {s.date} • Doctor: {s.doctor}</div>
                    <div className="text-rose-900 font-semibold">Medicines: {s.medicines} ({s.dosage})</div>
                    {s.remedy && <div className="text-slate-500 italic">Notes: {s.remedy}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Vaccinations */}
            <div className="bg-white border-2 border-sky-200 rounded-[32px] p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                  <span>💉</span><span>Vaccination Schedule</span>
                </h3>
                <button onClick={() => setIsAddVaccineOpen(true)} className="text-xs font-bold bg-sky-100 text-sky-900 px-3 py-1 rounded-xl">
                  ➕ Add Vaccine
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {vaccinations.map(v => (
                  <div key={v.id} className="p-3 rounded-2xl border flex justify-between items-center bg-slate-50">
                    <div>
                      <strong>{v.name}</strong>
                      <div className="text-[10px] text-slate-500">{v.status === 'completed' ? ('Done: ' + v.date) : ('Due: ' + (v.due_date || 'Upcoming'))}</div>
                    </div>
                    <button onClick={() => toggleVaccine(v.id)} className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${v.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                      {v.status === 'completed' ? 'Done ✓' : 'Mark Done'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: PARENT HUB & CONTROLS */}
        {currentSection === 'parent' && (
          <div className="flex flex-col gap-5 max-w-4xl mx-auto">
            {/* Walkie-Talkie */}
            <div className="bg-white border-2 border-sky-300 rounded-[32px] p-5 shadow-sm space-y-3">
              <h2 className="font-fredoka text-base font-bold text-slate-800 flex items-center gap-2">
                <span>🎙️</span><span>Parent Walkie-Talkie Transmitter</span>
              </h2>
              <div className="p-4 rounded-2xl bg-sky-50 text-center space-y-3">
                <button onClick={handleToggleWalkie} className={`w-18 h-18 rounded-full text-3xl mx-auto flex items-center justify-center text-white transition-all ${isRecording ? 'bg-rose-500 scale-110 animate-pulse' : 'bg-sky-500'}`}>
                  🎙️
                </button>
                <div className="text-xs font-bold text-slate-700">{walkieStatus}</div>
                <div className="flex gap-2">
                  <input type="text" value={customMemoText} onChange={e => setCustomMemoText(e.target.value)} placeholder="Type voice memo..." className="flex-1 text-xs px-3 py-2 rounded-xl border bg-white" />
                  <button onClick={sendCustomVoice} className="bg-sky-500 text-white font-bold text-xs px-4 py-2 rounded-xl">Send</button>
                </div>
              </div>
            </div>

            {/* Limits */}
            <div className="bg-white border-2 border-amber-200 rounded-[32px] p-5 shadow-sm space-y-3">
              <h3 className="font-fredoka text-base font-bold text-slate-800">🛡️ Parental Controls & Bedtime</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <strong>Daily Talk Limit: 30 Mins / Day</strong>
                  <p className="text-slate-500 mt-1">KOTL suggests homework when limit is reached.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <strong>Bedtime Curfew: 09:00 PM</strong>
                  <p className="text-slate-500 mt-1">Automatic transition to bedtime sleep lullabies.</p>
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

      {/* Fixed Mobile Bottom Nav */}
      <nav id="mobileBottomNav" className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t-2 border-amber-200 py-2 px-2 flex justify-around items-center z-50 lg:hidden shadow-lg">
        <button onClick={() => setCurrentSection('report')} className={`flex flex-col items-center font-bold text-[10px] ${currentSection === 'report' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">📜</span><span>Report</span>
        </button>
        <button onClick={() => setCurrentSection('quests')} className={`flex flex-col items-center font-bold text-[10px] ${currentSection === 'quests' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">🧭</span><span>Quests</span>
        </button>
        <button onClick={() => setCurrentSection('growth')} className={`flex flex-col items-center font-bold text-[10px] ${currentSection === 'growth' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">🌟</span><span>Growth</span>
        </button>
        <button onClick={() => setCurrentSection('health')} className={`flex flex-col items-center font-bold text-[10px] ${currentSection === 'health' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">🏥</span><span>Health</span>
        </button>
        <button onClick={() => setCurrentSection('parent')} className={`flex flex-col items-center font-bold text-[10px] ${currentSection === 'parent' ? 'text-sky-600' : 'text-slate-500'}`}>
          <span className="text-lg">🎙️</span><span>Parent</span>
        </button>
      </nav>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div id="childProfileModal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-300 rounded-[32px] p-6 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setIsProfileModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold">✕</button>
            <h2 className="font-fredoka text-xl font-bold text-slate-800 mb-2">Child Profile & Safety Settings</h2>
            <div className="space-y-3 text-xs font-semibold">
              <div><label>Child Name</label><input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl border" /></div>
              <div><label>Age</label><input type="number" value={profile.age} onChange={e => setProfile(p => ({ ...p, age: parseInt(e.target.value, 10) }))} className="w-full px-3 py-2 rounded-xl border" /></div>
              <button onClick={() => setIsProfileModalOpen(false)} className="w-full py-2 bg-amber-500 text-white font-bold rounded-xl font-fredoka">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Quota Modal */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 space-y-4 bg-white border-2 border-amber-300 rounded-[32px] shadow-2xl relative">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 font-fredoka">Free API Limits & Engine</h3>
              <button onClick={() => setIsQuotaModalOpen(false)}>✕</button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-sky-50 rounded-xl flex justify-between"><span>Groq Whisper STT</span><span className="font-bold text-emerald-800">Free Tier</span></div>
              <div className="p-3 bg-amber-50 rounded-xl flex justify-between"><span>Groq LLaMA 3.3 70B</span><span className="font-bold text-emerald-800">100K Tokens/Day</span></div>
              <div className="p-3 bg-emerald-50 rounded-xl flex justify-between"><span>Microsoft Edge TTS</span><span className="font-bold text-emerald-800">Unlimited Free</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Sickness Modal */}
      {isLogSicknessOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsLogSicknessOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold">✕</button>
            <h2 className="font-fredoka text-lg font-bold text-slate-800 mb-3">Log Sickness Episode & Medicine</h2>
            <form onSubmit={handleAddSickness} className="space-y-3 text-xs font-semibold">
              <div><label>Symptoms / Illness</label><input type="text" value={sickSymptom} onChange={e => setSickSymptom(e.target.value)} placeholder="e.g. Mild Fever & Cold" className="w-full px-3 py-2 rounded-xl border" required /></div>
              <div><label>Prescribed Medicines & Dosage</label><input type="text" value={sickMedicines} onChange={e => setSickMedicines(e.target.value)} placeholder="e.g. Paracetamol 5ml twice daily" className="w-full px-3 py-2 rounded-xl border" required /></div>
              <div><label>Diet / Remedy Notes</label><input type="text" value={sickRemedy} onChange={e => setSickRemedy(e.target.value)} placeholder="e.g. Warm milk & rest" className="w-full px-3 py-2 rounded-xl border" /></div>
              <button type="submit" className="w-full py-2 bg-rose-500 text-white font-bold rounded-xl font-fredoka">Save Record</button>
            </form>
          </div>
        </div>
      )}

      {/* Vitals Modal */}
      {isUpdateVitalsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-300 rounded-[32px] p-6 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setIsUpdateVitalsOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold">✕</button>
            <h2 className="font-fredoka text-lg font-bold text-slate-800 mb-3">Update Vitals (Height & Weight)</h2>
            <form onSubmit={handleUpdateVitals} className="space-y-3 text-xs font-semibold">
              <div><label>Height (cm)</label><input type="number" step="0.5" value={inputHeight} onChange={e => setInputHeight(e.target.value)} className="w-full px-3 py-2 rounded-xl border" required /></div>
              <div><label>Weight (kg)</label><input type="number" step="0.1" value={inputWeight} onChange={e => setInputWeight(e.target.value)} className="w-full px-3 py-2 rounded-xl border" required /></div>
              <button type="submit" className="w-full py-2 bg-amber-500 text-white font-bold rounded-xl font-fredoka">Save & Calculate BMI</button>
            </form>
          </div>
        </div>
      )}

      {/* Vaccine Modal */}
      {isAddVaccineOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-sky-300 rounded-[32px] p-6 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setIsAddVaccineOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold">✕</button>
            <h2 className="font-fredoka text-lg font-bold text-slate-800 mb-3">Add Vaccine Record</h2>
            <form onSubmit={handleAddVaccine} className="space-y-3 text-xs font-semibold">
              <div><label>Vaccine Name</label><input type="text" value={newVacName} onChange={e => setNewVacName(e.target.value)} placeholder="e.g. Hepatitis A Booster" className="w-full px-3 py-2 rounded-xl border" required /></div>
              <div><label>Due Date</label><input type="text" value={newVacDate} onChange={e => setNewVacDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border" /></div>
              <button type="submit" className="w-full py-2 bg-sky-500 text-white font-bold rounded-xl font-fredoka">Save</button>
            </form>
          </div>
        </div>
      )}

      {/* Quest Modal */}
      {isAssignQuestOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-300 rounded-[32px] p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setIsAssignQuestOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold">✕</button>
            <h2 className="font-fredoka text-lg font-bold text-slate-800 mb-3">Assign Socratic Learning Quest</h2>
            <form onSubmit={handleAddQuest} className="space-y-3 text-xs font-semibold">
              <div><label>Quest Title</label><input type="text" value={newQuestTitle} onChange={e => setNewQuestTitle(e.target.value)} placeholder="e.g. 🎨 Build Cardboard Space Rocket" className="w-full px-3 py-2 rounded-xl border" required /></div>
              <div>
                <label>Category</label>
                <select value={newQuestCategory} onChange={e => setNewQuestCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl border">
                  <option value="School Project">School Project</option>
                  <option value="Life Skill">Life Skill</option>
                  <option value="Science Curiosity">Science Curiosity</option>
                  <option value="Family & Kindness">Family & Kindness</option>
                </select>
              </div>
              <div><label>Target Goal Description</label><input type="text" value={newQuestGoal} onChange={e => setNewQuestGoal(e.target.value)} placeholder="e.g. Cut boxes, paint wings, and explain why rockets have fins" className="w-full px-3 py-2 rounded-xl border" required /></div>
              <div><label>KOTL Socratic Question / Prompt for Parth</label><textarea rows="2" value={newQuestHint} onChange={e => setNewQuestHint(e.target.value)} placeholder="e.g. Parth, why do rockets have pointy cones?" className="w-full px-3 py-2 rounded-xl border"></textarea></div>
              <button type="submit" className="w-full py-2 bg-amber-500 text-white font-bold rounded-xl font-fredoka">Launch Quest</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
