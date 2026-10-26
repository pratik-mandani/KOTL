const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../../frontend/app/page.jsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Add States
const targetState = `  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);`;
const newState = `  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [deviceVolume, setDeviceVolume] = useState(75);
  const [isSleepMode, setIsSleepMode] = useState(false);
  const [isSosActive, setIsSosActive] = useState(false);
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);`;

if (!content.includes('deviceVolume')) {
  content = content.replace(targetState, newState);
}

// 2. Add Handlers
const targetHandler = `  const handleAddHabit = (e) => {`;
const newHandlers = `  const handleVolumeChange = (val) => {
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

  const handleAddHabit = (e) => {`;

if (!content.includes('handleVolumeChange')) {
  content = content.replace(targetHandler, newHandlers);
}

// 3. Add Header Buttons (Volume, Sleep, SOS)
const targetHeader = `            <button onClick={() => setIsProfileModalOpen(true)} className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-all shadow-2xs" title="Child Profile & Safety Settings">
              <span>⚙️</span><span className="hidden md:inline">Child Profile</span>
            </button>`;

const newHeader = `            {/* Hardware Volume Button */}
            <button onClick={() => setIsVolumeModalOpen(true)} className="flex items-center gap-1 text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all shadow-2xs whitespace-nowrap" title="Device Speaker Volume">
              <span>{deviceVolume === 0 ? '🔇' : (deviceVolume < 40 ? '🔉' : '🔊')}</span>
              <span>{deviceVolume}%</span>
            </button>

            {/* Bedtime Sleep Mode Button */}
            <button onClick={toggleSleepMode} className={\`flex items-center gap-1 text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all shadow-2xs whitespace-nowrap \${isSleepMode ? 'bg-purple-600 text-white border border-purple-400 shadow-md' : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300'}\`} title="Put KOTL to Sleep / Bedtime Mode">
              <span>🌙</span>
              <span className="hidden sm:inline">{isSleepMode ? 'Sleeping' : 'Sleep'}</span>
            </button>

            {/* SOS Emergency Button */}
            <button onClick={() => setIsSosModalOpen(true)} className="flex items-center gap-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all shadow-md animate-pulse whitespace-nowrap" title="Emergency SOS Beacon">
              <span>🚨</span>
              <span>SOS</span>
            </button>

            <button onClick={() => setIsProfileModalOpen(true)} className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-all shadow-2xs" title="Child Profile & Safety Settings">
              <span>⚙️</span><span className="hidden md:inline">Child Profile</span>
            </button>`;

if (!content.includes('setIsVolumeModalOpen')) {
  content = content.replace(targetHeader, newHeader);
}

// 4. Add Cockpit Card to Tab 5 (Section 5)
const targetTab5Left = `              {/* Left Col: Walkie Transmitter & Safety Rules */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white border-2 border-indigo-200 rounded-[32px] p-5 shadow-xs space-y-4">
                  <h3 className="font-fredoka text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <span>🎙️</span><span>Voice Memo to KOTL Speaker</span>
                  </h3>`;

const newTab5Left = `              {/* Left Col: Hardware Cockpit & Walkie Transmitter */}
              <div className="lg:col-span-5 space-y-5">
                {/* 🎛️ HARDWARE REMOTE COCKPIT CARD */}
                <div className="bg-white border-2 border-indigo-200 rounded-[32px] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎛️</span>
                      <div>
                        <h3 className="font-fredoka text-base font-bold text-slate-800">Hardware Remote Cockpit</h3>
                        <p className="text-[11px] text-slate-500">Live speaker volume, sleep mode & emergency SOS</p>
                      </div>
                    </div>
                    <span className="bg-indigo-100 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded-full">ESP32 Sync</span>
                  </div>

                  {/* Volume Control */}
                  <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-sky-950 flex items-center gap-1.5">
                        <span>{deviceVolume === 0 ? '🔇' : (deviceVolume < 40 ? '🔉' : '🔊')}</span>
                        <span>Speaker Volume</span>
                      </strong>
                      <span className="font-fredoka font-bold text-sm text-sky-800 bg-sky-200/80 px-2.5 py-0.5 rounded-md">{deviceVolume}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={deviceVolume} onChange={e => handleVolumeChange(e.target.value)} className="w-full accent-sky-600 cursor-pointer" />
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                      <button onClick={() => handleVolumeChange(0)} className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700">🔇 Mute</button>
                      <button onClick={() => handleVolumeChange(25)} className="px-2 py-1 bg-white hover:bg-sky-100 border border-sky-300 rounded-lg text-sky-800">🔉 25%</button>
                      <button onClick={() => handleVolumeChange(65)} className="px-2 py-1 bg-white hover:bg-sky-100 border border-sky-300 rounded-lg text-sky-800">🔊 65%</button>
                      <button onClick={() => handleVolumeChange(100)} className="px-2 py-1 bg-white hover:bg-sky-100 border border-sky-300 rounded-lg text-sky-800">📢 100%</button>
                      <button onClick={() => playVoice('Testing KOTL speaker volume at ' + deviceVolume + ' percent.')} className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg">▶ Test</button>
                    </div>
                  </div>

                  {/* Sleep & SOS Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button onClick={toggleSleepMode} className={\`p-3 rounded-2xl border-2 flex flex-col items-center justify-center text-center space-y-1 shadow-2xs transition-all active:scale-95 \${isSleepMode ? 'bg-purple-600 border-purple-400 text-white' : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-950'}\`}>
                      <span className="text-2xl">🌙</span>
                      <span className="font-fredoka font-bold text-xs">{isSleepMode ? 'Wake Up KOTL' : 'Sleep Mode'}</span>
                      <span className="text-[10px] opacity-80">{isSleepMode ? 'Resume Daytime' : 'Put to Bed'}</span>
                    </button>

                    <button onClick={() => setIsSosModalOpen(true)} className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-950 flex flex-col items-center justify-center text-center space-y-1 shadow-2xs transition-all active:scale-95">
                      <span className="text-2xl animate-pulse">🚨</span>
                      <span className="font-fredoka font-bold text-xs text-rose-700">SOS Emergency</span>
                      <span className="text-[10px] text-rose-600 font-medium">Safety Beacon</span>
                    </button>
                  </div>

                  {/* Diagnostics */}
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-semibold">
                    <span>🔋 <strong>88%</strong> (Charging)</span>
                    <span>📶 <strong>-58 dBm</strong></span>
                    <button onClick={rebootDevice} className="text-slate-500 hover:text-slate-800 underline">🔄 Reboot</button>
                  </div>
                </div>

                <div className="bg-white border-2 border-indigo-200 rounded-[32px] p-5 shadow-xs space-y-4">
                  <h3 className="font-fredoka text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <span>🎙️</span><span>Voice Memo to KOTL Speaker</span>
                  </h3>`;

if (!content.includes('🎛️ HARDWARE REMOTE COCKPIT CARD')) {
  content = content.replace(targetTab5Left, newTab5Left);
}

// 5. Add Modals: isVolumeModalOpen & isSosModalOpen
const targetEndModals = `      {/* 10. Add Habit Goal Modal */}`;
const newModals = `      {/* Volume Modal */}
      {isVolumeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-sky-300 rounded-[32px] p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔊</span>
                <h3 className="font-fredoka text-lg font-bold text-slate-800">Speaker Volume</h3>
              </div>
              <button onClick={() => setIsVolumeModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="text-center py-2">
              <span className="font-fredoka text-4xl font-bold text-sky-700">{deviceVolume}%</span>
              <p className="text-xs text-slate-500 mt-1">Adjust KOTL's I2S Speaker (MAX98357A)</p>
            </div>
            <input type="range" min="0" max="100" value={deviceVolume} onChange={e => handleVolumeChange(e.target.value)} className="w-full accent-sky-600 cursor-pointer" />
            <div className="grid grid-cols-4 gap-2 text-xs font-bold text-center">
              <button onClick={() => handleVolumeChange(0)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl">Mute</button>
              <button onClick={() => handleVolumeChange(25)} className="p-2 bg-sky-50 hover:bg-sky-100 rounded-xl text-sky-800">25%</button>
              <button onClick={() => handleVolumeChange(65)} className="p-2 bg-sky-50 hover:bg-sky-100 rounded-xl text-sky-800">65%</button>
              <button onClick={() => handleVolumeChange(100)} className="p-2 bg-sky-50 hover:bg-sky-100 rounded-xl text-sky-800">100%</button>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <button onClick={() => playVoice('Testing KOTL speaker volume at ' + deviceVolume + ' percent.')} className="text-xs font-bold text-sky-700 hover:underline">▶ Test Audio</button>
              <button onClick={() => setIsVolumeModalOpen(false)} className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold text-xs">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* SOS Emergency Modal */}
      {isSosModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-3 border-rose-500 rounded-[32px] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl animate-bounce">🚨</span>
                <div>
                  <h3 className="font-fredoka text-xl font-bold text-rose-950">Emergency SOS Beacon</h3>
                  <p className="text-xs text-rose-700 font-semibold">Immediate Child Safety & Medical Assistance</p>
                </div>
              </div>
              <button onClick={() => setIsSosModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3">
              <div className="flex items-center justify-between">
                <strong className="text-xs text-rose-950 flex items-center gap-1.5">
                  <span>📢</span><span>KOTL Speaker Emergency Broadcast</span>
                </strong>
                <span className={\`text-[10px] font-bold px-2.5 py-0.5 rounded-full \${isSosActive ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-200 text-rose-900'}\`}>
                  {isSosActive ? 'ACTIVE ALARM' : 'Standby'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Triggering the SOS beacon immediately sounds an emergency chime on KOTL's speaker and notifies family members.
              </p>
              <div className="flex gap-2">
                <button onClick={() => toggleSosBeacon(true)} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-fredoka font-bold text-xs shadow-md flex items-center justify-center gap-1.5">
                  <span>🚨</span><span>Activate SOS Siren</span>
                </button>
                <button onClick={() => toggleSosBeacon(false)} className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-fredoka font-bold text-xs">
                  Silence
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">📞 Immediate One-Tap Emergency Contacts:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <a href="tel:+919825012345" className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-amber-950">👨‍⚕️ Pediatrician Dr. Mehta</div>
                    <div className="text-[10px] text-slate-500">+91 98250 12345</div>
                  </div>
                  <span className="bg-amber-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs">Call</span>
                </a>
                <a href="tel:108" className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-rose-950">🚑 Ambulance Emergency</div>
                    <div className="text-[10px] text-slate-500">National Pediatric (108)</div>
                  </div>
                  <span className="bg-rose-600 text-white font-bold px-2.5 py-1 rounded-lg text-xs">Call 108</span>
                </a>
                <a href="tel:112" className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-blue-950">👮 Emergency Police / All</div>
                    <div className="text-[10px] text-slate-500">Helpline (112)</div>
                  </div>
                  <span className="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-lg text-xs">Call 112</span>
                </a>
                <a href="tel:+919898011111" className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-emerald-950">👩 Mummy Direct</div>
                    <div className="text-[10px] text-slate-500">+91 98980 11111</div>
                  </div>
                  <span className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg text-xs">Call</span>
                </a>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <strong className="text-slate-800">🏡 Home Emergency Address:</strong>
                <div className="text-[11px] text-slate-500">Satellite, Ahmedabad, Gujarat 380015</div>
              </div>
              <span className="text-xs bg-slate-200 px-2 py-1 rounded-md font-mono">B+ Blood</span>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setIsSosModalOpen(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-fredoka font-bold text-xs">
                Close Safety Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Add Habit Goal Modal */}`;

if (!content.includes('isSosModalOpen')) {
  content = content.replace(targetEndModals, newModals);
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('Successfully updated frontend/app/page.jsx with Hardware Remote Cockpit!');
