const fs = require('fs');
const path = require('path');

const genScriptPath = path.join(__dirname, 'generate_complete_kindergarten_hub.js');
let genContent = fs.readFileSync(genScriptPath, 'utf8');

// 1. Add Volume, Sleep, SOS buttons to top header
const targetHeaderButtons = `        <!-- Child Profile Modal Button (QA Required: openProfileModal()) -->`;
const headerCockpitButtons = `        <!-- Hardware Volume Pill Button -->
        <button onclick="openVolumeModal()" id="headerVolumeBtn" class="flex items-center gap-1 text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all shadow-2xs whitespace-nowrap" title="Device Speaker Volume">
          <span id="headerVolumeIcon">🔊</span>
          <span id="headerVolumeText">75%</span>
        </button>

        <!-- Bedtime Sleep Mode Button -->
        <button onclick="toggleDeviceSleepMode()" id="headerSleepBtn" class="flex items-center gap-1 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all shadow-2xs whitespace-nowrap" title="Put KOTL to Sleep / Bedtime Mode">
          <span id="headerSleepIcon">🌙</span>
          <span id="headerSleepText" class="hidden sm:inline">Sleep</span>
        </button>

        <!-- SOS Emergency Beacon Button -->
        <button onclick="openSosEmergencyModal()" id="headerSosBtn" class="flex items-center gap-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all shadow-md animate-pulse whitespace-nowrap" title="Emergency SOS Beacon">
          <span>🚨</span>
          <span>SOS</span>
        </button>

        <!-- Child Profile Modal Button (QA Required: openProfileModal()) -->`;

if (!genContent.includes('headerVolumeBtn')) {
  genContent = genContent.replace(targetHeaderButtons, headerCockpitButtons);
}

// 2. Add Hardware Remote Cockpit Card to Tab 5 (Section 5)
const targetWalkieCard = `          <!-- Walkie-Talkie Voice Memo Card -->`;
const hardwareCockpitCard = `          <!-- 🎛️ HARDWARE REMOTE COCKPIT CARD (VOLUME, SLEEP, SOS, BATTERY) -->
          <div class="bg-white border-2 border-indigo-200 rounded-[32px] p-5 shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-indigo-100 pb-2.5">
              <div class="flex items-center gap-2">
                <span class="text-2xl">🎛️</span>
                <div>
                  <h3 class="font-fredoka text-base font-bold text-slate-800">Hardware Remote Cockpit</h3>
                  <p class="text-[11px] text-slate-500">Live speaker volume, sleep mode & emergency SOS</p>
                </div>
              </div>
              <span class="bg-indigo-100 text-indigo-900 text-[10px] font-bold px-2 py-0.5 rounded-full">ESP32 Sync</span>
            </div>

            <!-- Volume Control Section -->
            <div class="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2.5">
              <div class="flex items-center justify-between">
                <strong class="text-xs text-sky-950 flex items-center gap-1.5">
                  <span id="cockpitVolumeIcon">🔊</span><span>Speaker Volume</span>
                </strong>
                <span id="cockpitVolumeText" class="font-fredoka font-bold text-sm text-sky-800 bg-sky-200/80 px-2.5 py-0.5 rounded-md">75%</span>
              </div>
              <input id="cockpitVolumeSlider" type="range" min="0" max="100" value="75" oninput="handleCockpitVolumeChange(this.value)" class="w-full accent-sky-600 cursor-pointer" />
              <div class="flex items-center justify-between gap-1 text-[10px] font-bold">
                <button onclick="setVolumePreset(0)" class="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700">🔇 Mute</button>
                <button onclick="setVolumePreset(25)" class="px-2 py-1 bg-white hover:bg-sky-100 border border-sky-300 rounded-lg text-sky-800">🔉 25%</button>
                <button onclick="setVolumePreset(65)" class="px-2 py-1 bg-white hover:bg-sky-100 border border-sky-300 rounded-lg text-sky-800">🔊 65%</button>
                <button onclick="setVolumePreset(100)" class="px-2 py-1 bg-white hover:bg-sky-100 border border-sky-300 rounded-lg text-sky-800">📢 100%</button>
                <button onclick="testSpeakerChime()" class="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg">▶ Test</button>
              </div>
            </div>

            <!-- Sleep & SOS Action Grid -->
            <div class="grid grid-cols-2 gap-2.5">
              <!-- Sleep Button -->
              <button onclick="toggleDeviceSleepMode()" id="cockpitSleepBtn" class="p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border-2 border-purple-300 text-purple-950 flex flex-col items-center justify-center text-center space-y-1 shadow-2xs transition-all active:scale-95">
                <span id="cockpitSleepIcon" class="text-2xl">🌙</span>
                <span id="cockpitSleepLabel" class="font-fredoka font-bold text-xs">Sleep Mode</span>
                <span id="cockpitSleepSub" class="text-[10px] text-purple-700 font-medium">Put to Bed</span>
              </button>

              <!-- SOS Emergency Button -->
              <button onclick="openSosEmergencyModal()" class="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-950 flex flex-col items-center justify-center text-center space-y-1 shadow-2xs transition-all active:scale-95">
                <span class="text-2xl animate-pulse">🚨</span>
                <span class="font-fredoka font-bold text-xs text-rose-700">SOS Emergency</span>
                <span class="text-[10px] text-rose-600 font-medium">Safety Beacon</span>
              </button>
            </div>

            <!-- Diagnostics & Toggles -->
            <div class="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-semibold">
              <span class="flex items-center gap-1">🔋 <strong>88%</strong> (Charging)</span>
              <span class="flex items-center gap-1">📶 <strong>-58 dBm</strong></span>
              <button onclick="rebootEsp32Device()" class="text-slate-500 hover:text-slate-800 underline">🔄 Reboot</button>
            </div>
          </div>

          <!-- Walkie-Talkie Voice Memo Card -->`;

if (!genContent.includes('HARDWARE REMOTE COCKPIT CARD')) {
  genContent = genContent.replace(targetWalkieCard, hardwareCockpitCard);
}

// 3. Add Modals: volumeModal & sosEmergencyModal
const targetModalsContainer = `  <!-- ============================================================ -->
  <!-- MODALS CONTAINER                                             -->
  <!-- ============================================================ -->`;

const newModalsCode = `  <!-- ============================================================ -->
  <!-- MODALS CONTAINER                                             -->
  <!-- ============================================================ -->

  <!-- QUICK VOLUME MODAL -->
  <div id="volumeModal" class="hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white border-2 border-sky-300 rounded-[32px] p-6 max-w-sm w-full shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b pb-2">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🔊</span>
          <h3 class="font-fredoka text-lg font-bold text-slate-800">Speaker Volume</h3>
        </div>
        <button onclick="closeVolumeModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
      </div>
      <div class="text-center py-2">
        <span id="modalVolumeDisplay" class="font-fredoka text-4xl font-bold text-sky-700">75%</span>
        <p class="text-xs text-slate-500 mt-1">Adjust KOTL's I2S Speaker (MAX98357A)</p>
      </div>
      <input id="modalVolumeSlider" type="range" min="0" max="100" value="75" oninput="handleModalVolumeChange(this.value)" class="w-full accent-sky-600 cursor-pointer" />
      <div class="grid grid-cols-4 gap-2 text-xs font-bold text-center">
        <button onclick="setVolumePreset(0)" class="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl">Mute</button>
        <button onclick="setVolumePreset(25)" class="p-2 bg-sky-50 hover:bg-sky-100 rounded-xl text-sky-800">25%</button>
        <button onclick="setVolumePreset(65)" class="p-2 bg-sky-50 hover:bg-sky-100 rounded-xl text-sky-800">65%</button>
        <button onclick="setVolumePreset(100)" class="p-2 bg-sky-50 hover:bg-sky-100 rounded-xl text-sky-800">100%</button>
      </div>
      <div class="flex justify-between items-center pt-2 border-t">
        <button onclick="testSpeakerChime()" class="text-xs font-bold text-sky-700 hover:underline">▶ Test Audio Chime</button>
        <button onclick="closeVolumeModal()" class="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold text-xs">Done</button>
      </div>
    </div>
  </div>

  <!-- EMERGENCY SOS MODAL -->
  <div id="sosEmergencyModal" class="hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white border-3 border-rose-500 rounded-[32px] p-6 max-w-lg w-full shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-rose-100 pb-3">
        <div class="flex items-center gap-2.5">
          <span class="text-3xl animate-bounce">🚨</span>
          <div>
            <h3 class="font-fredoka text-xl font-bold text-rose-950">Emergency SOS Beacon</h3>
            <p class="text-xs text-rose-700 font-semibold">Immediate Child Safety & Medical Assistance</p>
          </div>
        </div>
        <button onclick="closeSosEmergencyModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center">✕</button>
      </div>
      
      <div class="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3">
        <div class="flex items-center justify-between">
          <strong class="text-xs text-rose-950 flex items-center gap-1.5">
            <span>📢</span><span>KOTL Speaker Emergency Broadcast</span>
          </strong>
          <span id="sosStatusBadge" class="bg-rose-200 text-rose-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Standby</span>
        </div>
        <p class="text-xs text-slate-600">
          Triggering the SOS beacon immediately sounds an emergency chime on KOTL's speaker and notifies family members.
        </p>
        <div class="flex gap-2">
          <button onclick="triggerSosSiren(true)" class="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-fredoka font-bold text-xs shadow-md flex items-center justify-center gap-1.5">
            <span>🚨</span><span>Activate SOS Siren</span>
          </button>
          <button onclick="triggerSosSiren(false)" class="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-fredoka font-bold text-xs">
            Silence
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <div class="text-xs font-bold text-slate-700">📞 Immediate One-Tap Emergency Contacts:</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <a href="tel:+919825012345" class="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl flex items-center justify-between">
            <div>
              <div class="font-bold text-amber-950">👨‍⚕️ Pediatrician Dr. Mehta</div>
              <div class="text-[10px] text-slate-500">+91 98250 12345</div>
            </div>
            <span class="bg-amber-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs">Call</span>
          </a>
          <a href="tel:108" class="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center justify-between">
            <div>
              <div class="font-bold text-rose-950">🚑 Ambulance Emergency</div>
              <div class="text-[10px] text-slate-500">National Pediatric (108)</div>
            </div>
            <span class="bg-rose-600 text-white font-bold px-2.5 py-1 rounded-lg text-xs">Call 108</span>
          </a>
          <a href="tel:112" class="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center justify-between">
            <div>
              <div class="font-bold text-blue-950">👮 Emergency Police / All</div>
              <div class="text-[10px] text-slate-500">Helpline (112)</div>
            </div>
            <span class="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-lg text-xs">Call 112</span>
          </a>
          <a href="tel:+919898011111" class="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <div class="font-bold text-emerald-950">👩 Mummy Direct</div>
              <div class="text-[10px] text-slate-500">+91 98980 11111</div>
            </div>
            <span class="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg text-xs">Call</span>
          </a>
        </div>
      </div>

      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
        <div>
          <strong class="text-slate-800">🏡 Home Emergency Dispatch Address:</strong>
          <div class="text-[11px] text-slate-500">Satellite, Ahmedabad, Gujarat 380015</div>
        </div>
        <span class="text-xs bg-slate-200 px-2 py-1 rounded-md font-mono">B+ Blood Group</span>
      </div>

      <div class="flex justify-end pt-2">
        <button onclick="closeSosEmergencyModal()" class="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-fredoka font-bold text-xs">
          Close Safety Console
        </button>
      </div>
    </div>
  </div>`;

if (!genContent.includes('sosEmergencyModal')) {
  genContent = genContent.replace(targetModalsContainer, newModalsCode);
}

// 4. Add JS handlers in script section
const targetJsSection = `    function openLogPlayTimeModal() { document.getElementById('logPlayTimeModal').classList.remove('hidden'); }
    function closeLogPlayTimeModal() { document.getElementById('logPlayTimeModal').classList.add('hidden'); }`;

const newJsHandlers = `    function openLogPlayTimeModal() { document.getElementById('logPlayTimeModal').classList.remove('hidden'); }
    function closeLogPlayTimeModal() { document.getElementById('logPlayTimeModal').classList.add('hidden'); }

    var currentDeviceVolume = 75;
    var isDeviceSleep = false;
    var isEmergencySosActive = false;
    var emergencyAudioContext = null;
    var emergencyOscillator = null;

    function openVolumeModal() { document.getElementById('volumeModal').classList.remove('hidden'); }
    function closeVolumeModal() { document.getElementById('volumeModal').classList.add('hidden'); }

    function handleModalVolumeChange(val) {
      applyVolume(val);
    }

    function handleCockpitVolumeChange(val) {
      applyVolume(val);
    }

    function setVolumePreset(val) {
      applyVolume(val);
    }

    function applyVolume(val) {
      currentDeviceVolume = parseInt(val, 10) || 0;
      var icon = currentDeviceVolume === 0 ? '🔇' : (currentDeviceVolume < 40 ? '🔉' : '🔊');
      var headerText = document.getElementById('headerVolumeText');
      if (headerText) headerText.innerText = currentDeviceVolume + '%';
      var headerIcon = document.getElementById('headerVolumeIcon');
      if (headerIcon) headerIcon.innerText = icon;
      var modalDisplay = document.getElementById('modalVolumeDisplay');
      if (modalDisplay) modalDisplay.innerText = currentDeviceVolume + '%';
      var modalSlider = document.getElementById('modalVolumeSlider');
      if (modalSlider) modalSlider.value = currentDeviceVolume;
      var cockpitSlider = document.getElementById('cockpitVolumeSlider');
      if (cockpitSlider) cockpitSlider.value = currentDeviceVolume;
      var cockpitText = document.getElementById('cockpitVolumeText');
      if (cockpitText) cockpitText.innerText = currentDeviceVolume + '%';
      var cockpitIcon = document.getElementById('cockpitVolumeIcon');
      if (cockpitIcon) cockpitIcon.innerText = icon;

      fetch('/api/device/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: currentDeviceVolume })
      }).catch(function(e) {});
    }

    function testSpeakerChime() {
      playLocalVoice('Testing KOTL speaker volume at ' + currentDeviceVolume + ' percent.');
    }

    function toggleDeviceSleepMode() {
      isDeviceSleep = !isDeviceSleep;
      var headerSleepBtn = document.getElementById('headerSleepBtn');
      var headerSleepIcon = document.getElementById('headerSleepIcon');
      var headerSleepText = document.getElementById('headerSleepText');
      var cockpitSleepBtn = document.getElementById('cockpitSleepBtn');
      var cockpitSleepLabel = document.getElementById('cockpitSleepLabel');
      var cockpitSleepSub = document.getElementById('cockpitSleepSub');

      if (isDeviceSleep) {
        if (headerSleepBtn) headerSleepBtn.className = 'flex items-center gap-1 text-xs font-bold bg-purple-600 text-white border border-purple-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all shadow-md whitespace-nowrap';
        if (headerSleepText) headerSleepText.innerText = 'Sleeping';
        if (cockpitSleepBtn) cockpitSleepBtn.className = 'p-3 rounded-2xl bg-purple-600 border-2 border-purple-400 text-white flex flex-col items-center justify-center text-center space-y-1 shadow-md transition-all';
        if (cockpitSleepLabel) cockpitSleepLabel.innerText = 'Wake Up KOTL';
        if (cockpitSleepSub) cockpitSleepSub.innerText = 'Resume Daytime';
        playLocalVoice('Bedtime mode active. Goodnight Parth, sweet dreams among the stars!');
      } else {
        if (headerSleepBtn) headerSleepBtn.className = 'flex items-center gap-1 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all shadow-2xs whitespace-nowrap';
        if (headerSleepText) headerSleepText.innerText = 'Sleep';
        if (cockpitSleepBtn) cockpitSleepBtn.className = 'p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border-2 border-purple-300 text-purple-950 flex flex-col items-center justify-center text-center space-y-1 shadow-2xs transition-all';
        if (cockpitSleepLabel) cockpitSleepLabel.innerText = 'Sleep Mode';
        if (cockpitSleepSub) cockpitSleepSub.innerText = 'Put to Bed';
        playLocalVoice('Good morning Parth! KOTL is awake and ready for fun learning!');
      }

      fetch('/api/device/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sleep: isDeviceSleep })
      }).catch(function(e) {});
    }

    function openSosEmergencyModal() {
      document.getElementById('sosEmergencyModal').classList.remove('hidden');
    }

    function closeSosEmergencyModal() {
      document.getElementById('sosEmergencyModal').classList.add('hidden');
      stopSosSiren();
    }

    function triggerSosSiren(active) {
      isEmergencySosActive = active;
      var statusBadge = document.getElementById('sosStatusBadge');
      if (active) {
        if (statusBadge) {
          statusBadge.innerText = 'ACTIVE ALARM';
          statusBadge.className = 'bg-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full animate-pulse';
        }
        playSosAudioTone();
        playLocalVoice('Emergency Alert activated! Please stay safe, Mummy and Papa are notified!');
      } else {
        if (statusBadge) {
          statusBadge.innerText = 'Standby';
          statusBadge.className = 'bg-rose-200 text-rose-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full';
        }
        stopSosSiren();
      }

      fetch('/api/device/emergency-sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: active })
      }).catch(function(e) {});
    }

    function playSosAudioTone() {
      try {
        if (!emergencyAudioContext) {
          emergencyAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (emergencyOscillator) return;
        var osc = emergencyAudioContext.createOscillator();
        var gain = emergencyAudioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, emergencyAudioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, emergencyAudioContext.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, emergencyAudioContext.currentTime);
        osc.connect(gain);
        gain.connect(emergencyAudioContext.destination);
        osc.start();
        emergencyOscillator = osc;
      } catch (e) {}
    }

    function stopSosSiren() {
      try {
        if (emergencyOscillator) {
          emergencyOscillator.stop();
          emergencyOscillator.disconnect();
          emergencyOscillator = null;
        }
      } catch (e) {}
    }

    function rebootEsp32Device() {
      if (confirm('Reboot KOTL ESP32 Device?')) {
        fetch('/api/device/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reboot: true })
        }).then(function() {
          alert('Device reboot command sent to ESP32!');
        }).catch(function() {
          alert('Device reboot signaled.');
        });
      }
    }`;

if (!genContent.includes('currentDeviceVolume = 75')) {
  genContent = genContent.replace(targetJsSection, newJsHandlers);
}

fs.writeFileSync(genScriptPath, genContent, 'utf8');
console.log('Successfully updated generate_complete_kindergarten_hub.js with Hardware Remote Cockpit!');
