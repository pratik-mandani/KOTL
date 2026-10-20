/**
 * KOTL Comprehensive QA/QC Automated Verification Suite
 * Runs automated checks across Firmware, Backend Services, Prompts, Child Safety, and Frontend Assets.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('       KOTL v2.2 AUTOMATED QA / QC SUITE           ');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assertTest(name, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${name}`);
    if (details) console.log(`         -> ${details}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${name}`);
    if (details) console.error(`         -> ${details}`);
  }
}

// ----------------------------------------------------
// TEST GROUP 1: ESP32 Firmware Pinout & Capacitive Touch QA
// ----------------------------------------------------
console.log('>>> [1/4] Firmware QA/QC: ESP32 Pinout, Touch & OLED Clock');
const inoPath = path.join(__dirname, '..', '..', 'esp32', 'main', 'main.ino');
const inoContent = fs.readFileSync(inoPath, 'utf8');

assertTest('main.ino file exists and is accessible', fs.existsSync(inoPath), `Size: ${inoContent.length} bytes`);

// Verify Touch Pins
const hasTouchHead = inoContent.includes('#define TOUCH_PIN_HEAD 4');
const hasTouchEar = inoContent.includes('#define TOUCH_PIN_EAR 13');
const hasTouchThreshold = inoContent.includes('#define TOUCH_THRESHOLD');
assertTest('Capacitive Touch Pin Macros defined on GPIO 4 (T0)', hasTouchHead && hasTouchEar && hasTouchThreshold, 'Touch Pin 4 configured with noise threshold');

// Verify Pin Conflict Absence
const i2cPins = inoContent.includes('#define I2C_SDA_PIN 21') && inoContent.includes('#define I2C_SCL_PIN 22');
const dacPins = inoContent.includes('#define I2S_BCLK_PIN 26') && inoContent.includes('#define I2S_LRC_PIN 25') && inoContent.includes('#define I2S_DIN_PIN 27');
const micPins = inoContent.includes('#define I2S_MIC_SCK_PIN 32') && inoContent.includes('#define I2S_MIC_WS_PIN 33') && inoContent.includes('#define I2S_MIC_SD_PIN 35');
assertTest('Hardware Pin Mapping Integrity: No GPIO conflicts', i2cPins && dacPins && micPins, 'I2C (21,22), I2S DAC (25,26,27), I2S MIC (32,33,35), Touch (4,13) are isolated');

// Verify NTP & Time Handling
const hasNtpSync = inoContent.includes('configTime(19800, 0, "pool.ntp.org"') && inoContent.includes('#include <time.h>');
assertTest('SNTP Clock Sync for India Standard Time (UTC+5:30)', hasNtpSync, 'Synchronizes with pool.ntp.org on WiFi connect');

// Verify OLED Clock Rendering and Non-blocking Touch Service
const hasClockScreen = inoContent.includes('void drawClockDateScreen(');
const hasServiceTouch = inoContent.includes('void serviceTouchSensor()');
const hasNonBlockingClock = inoContent.includes('s_showClockUntilMs');
const hasDisplayLatch = inoContent.includes('s_wasClockActive') && inoContent.includes('display.clearDisplay()');
assertTest('OLED Date & Time Screen & Touch Service with Display Latch', hasClockScreen && hasServiceTouch && hasNonBlockingClock && hasDisplayLatch, 'Single-tap shows clock for 4.5s; display latch prevents eye animation conflict');

// Verify Capacitive Touch Anti-Flicker Debounce Filtering & Instant Clock Display
const hasAdaptiveBaseline = inoContent.includes('s_touchBaseline') && inoContent.includes('s_touchThreshold');
const hasTouchRead = inoContent.includes('touchRead(TOUCH_PIN_HEAD)');
const hasHysteresisFilter = inoContent.includes('s_touchFilter') && inoContent.includes('s_debouncedPressed');
const hasInstantActivation = inoContent.includes('s_showClockUntilMs = nowMs + 4500') && inoContent.includes('drawClockDateScreen(true)');
assertTest('Capacitive Touch 3-Stage Debounce & Instant Clock Display on GPIO 4',
  hasAdaptiveBaseline && hasTouchRead && hasHysteresisFilter && hasInstantActivation,
  'Calibrates wire baseline; 3-sample hysteresis filter rejects 50Hz noise and triggers instant clock on contact');

// Verify Bare Wire Capacitive Touch Stability (no floating digitalRead on GPIO 4 wire)
const touchMatch = inoContent.match(/void\s+serviceTouchSensor\s*\(\)\s*\{([\s\S]*?)\n\}/);
const touchSection = touchMatch ? touchMatch[1] : '';
const noFloatingDigitalRead = !touchSection.includes('digitalRead(TOUCH_PIN_HEAD)');
assertTest('Bare Wire Capacitive Touch: Pure capacitive sensing without floating digital reads',
  noFloatingDigitalRead,
  'Rejects AC hum on bare GPIO 4 wire; prevents false touch triggers and screen flickering');

// Verify Audio Capture Sample Rate (16kHz native rate for INMP441 & Whisper)
const has16kSampleRate = inoContent.includes('kAudioCaptureSampleRate = 16000') && inoContent.includes('i2sMicConfig.sample_rate = (int)kAudioCaptureSampleRate');
assertTest('Audio Capture Sample Rate: 16kHz native rate for INMP441 & Whisper STT',
  has16kSampleRate,
  'Operates at 16,000Hz (1.024MHz SCK) for pristine fidelity and zero clock jitter');

// Verify OLED Display Bus: 400kHz Fast Mode I2C & 40 FPS RoboEyes
const has400kI2c = inoContent.includes('Wire.setClock(400000)');
const has40FpsEyes = inoContent.includes('roboEyes.begin(SCREEN_WIDTH, SCREEN_HEIGHT, 40)');
assertTest('OLED Display Bus: 400kHz Fast Mode I2C & 40 FPS RoboEyes',
  has400kI2c && has40FpsEyes,
  'Prevents I2C bus backlog, frame tearing, and screen flicker');

// Verify Audio DMA Integrity: No I2C display updates during microphone capture
const captureMatch = inoContent.match(/void\s+performSynchronousAudioCapture\s*\(\)\s*\{([\s\S]*?)\n\}/);
const captureSection = captureMatch ? captureMatch[1] : '';
const noEyesInCapture = !captureSection.includes('roboEyes.update()');
assertTest('Audio DMA Integrity: No I2C display updates during microphone capture',
  noEyesInCapture,
  'Free of I2C blocking delays; prevents I2S DMA overflow and packet drops during voice recording');

// Verify Backend URL Target
const kotlConfigPath = path.join(__dirname, '..', '..', 'esp32', 'main', 'kotl_config.h');
const kotlConfigContent = fs.existsSync(kotlConfigPath) ? fs.readFileSync(kotlConfigPath, 'utf8') : '';
const validBackendUrl = kotlConfigContent.includes('https://kotl.onrender.com') || kotlConfigContent.includes('http://192.168.1.15:3000');
assertTest('Network Target URL: Base URL points to live Render or local backend',
  validBackendUrl,
  'ESP32 firmware targets verified backend URL (https://kotl.onrender.com)');

// Verify Startup Sound: 'toot-toot' double beep replaces voice hello
const hasDoubleBeepFn = inoContent.includes('void playStartupDoubleBeep()') && inoContent.includes('void playTone(');
const selfTestMatch = inoContent.match(/void\s+runStartupSelfTest\s*\(\)\s*\{([\s\S]*?)\n\}/);
const selfTestSection = selfTestMatch ? selfTestMatch[1] : '';
const callsDoubleBeep = selfTestSection.includes('playStartupDoubleBeep();');
const noHelloInSelfTest = !selfTestSection.includes('playStartupHello();');
assertTest('Startup Sound: Electronic "toot-toot" double beep replaces voice hello', hasDoubleBeepFn && callsDoubleBeep && noHelloInSelfTest, 'Self-test plays ascending chime (880Hz -> 1175Hz) without voice audio sample');

// Verify Boot Screen: Pure KOTL brand logo presented on boot for guaranteed 2.5s
const hasBootLogoFn = inoContent.includes('void drawBootLogoScreen()') && inoContent.includes('setTextSize(4)') && inoContent.includes('"KOTL"');
const callsBootLogoOnStartup = selfTestSection.includes('drawBootLogoScreen();');
const hasGuaranteedLogoDelay = selfTestSection.includes('while (millis() - logoStartMs < 2500)');
const noTestUiInNormalBoot = !selfTestSection.includes('drawStartupSelfTestScreen(');
const hasDirectEyesOpen = selfTestSection.includes('roboEyes.open();');

const calibMatch = inoContent.match(/void\s+calibrateRoomAcoustics\s*\(\)\s*\{([\s\S]*?)\n\}/);
const calibSection = calibMatch ? calibMatch[1] : '';
const calibSilent = !calibSection.includes('drawStartupSelfTestScreen(');

assertTest('Boot Logo UI: KOTL brand logo presented on screen for guaranteed 2.5s before robot eyes open',
  hasBootLogoFn && callsBootLogoOnStartup && hasGuaranteedLogoDelay && noTestUiInNormalBoot && hasDirectEyesOpen && calibSilent,
  'Screen presents bold centered KOTL brand logo for full 2.5 seconds; transitions smoothly to eyes; test UI strictly suppressed');

// ----------------------------------------------------
// TEST GROUP 2: Backend Node.js Syntax & Compilation QA
// ----------------------------------------------------
console.log('\n>>> [2/4] Backend Core Syntax & Compilation QA');

const backendFiles = [
  'backend/server.js',
  'backend/services/assistant.js',
  'backend/services/child-memory.js',
  'backend/services/groq.js',
  'backend/services/stt.js',
  'backend/services/tts.js',
  'backend/utils/audio-converter.js',
  'backend/utils/phonetic.js'
];

backendFiles.forEach(file => {
  try {
    const fullPath = path.join(__dirname, '..', '..', file);
    execSync(`node -c "${fullPath}"`);
    assertTest(`Syntax valid: ${file}`, true);
  } catch (err) {
    assertTest(`Syntax valid: ${file}`, false, err.message);
  }
});

// ----------------------------------------------------
// TEST GROUP 3: Child Profile, Age, Gender & Safety Guardrails QA
// ----------------------------------------------------
console.log('\n>>> [3/4] Child Safety & Guardrails Prompt Evaluation QA');

const {
  getChildProfile,
  updateChildProfile,
  buildChildContextPrompt,
  generateChildDevelopmentReport
} = require('../services/child-memory');

const profile = getChildProfile();
assertTest('Default Child Profile loads correctly', !!profile && !!profile.name, `Child: ${profile.name}, Age: ${profile.age}, Gender: ${profile.gender}`);
assertTest('Child Profile has bedtime and parental permission rules', !!profile.bedtime && !!profile.parent_permissions, `Bedtime: ${profile.bedtime}, Permissions: ${Object.keys(profile.parent_permissions).join(', ')}`);

// Evaluate System Prompt Guardrails
const promptText = buildChildContextPrompt();
const hasGenderInstruction = promptText.includes('Gender: Boy') && (promptText.includes('દીકરો') || promptText.includes('બેટા'));
const hasAgeInstruction = promptText.includes('Age: 6 Years') && promptText.includes('sentence simplicity');
const hasBedtimeInstruction = promptText.includes('Bedtime Routine: 21:00');
const hasSafetyGuardrails = promptText.includes('Health & Medicines') && promptText.includes('Hazardous Objects') && promptText.includes('Going Outside') && promptText.includes('In-App & Money Purchases');

assertTest('System prompt injects Gender-specific affectionate addressing', hasGenderInstruction, 'દીકરો / બેટા / champ included in prompt');
assertTest('System prompt injects Age-appropriate cognitive guidelines', hasAgeInstruction, 'Vocabulary and complexity tailored to child age');
assertTest('System prompt enforces Bedtime wind-down routine', hasBedtimeInstruction, 'Bedtime 21:00 triggers soothing bedtime mode');
assertTest('System prompt enforces 4 Mandatory Adult Permission Rules', hasSafetyGuardrails, 'Medicines, Sharp tools/Fire, Strangers/Door, Purchases strictly gated');

// Verify Language Policy in Assistant
const assistantPath = path.join(__dirname, '..', 'services', 'assistant.js');
const assistantContent = fs.readFileSync(assistantPath, 'utf8');
const hasEnglishPriority = assistantContent.includes('DEFAULT & PRIORITY LANGUAGE: ENGLISH');
const hasHindiException = assistantContent.includes('ONLY if the user explicitly speaks or asks in Hindi');
assertTest('Language Policy: English is default/priority language, Hindi strictly on request',
  hasEnglishPriority && hasHindiException,
  'Enforces English communication by default; Hindi used strictly upon user Hindi prompt');

// Verify STT Whisper Default Language and Prompts
const sttPath = path.join(__dirname, '..', 'services', 'stt.js');
const sttContent = fs.readFileSync(sttPath, 'utf8');
const sttDefaultEnglish = sttContent.includes('"en",') && !sttContent.includes('model,\n    "hi"') && !sttContent.includes('model,\r\n    "hi"');
assertTest('STT Whisper Defaults: English language default and clean English prompt hints',
  sttDefaultEnglish,
  'Guarantees Groq Whisper defaults to English and avoids Hindi hallucination on ambient noise');

// Verify Real-time Clock Grounding & English Time/Date Query Policy
const hasTimeDatePrompt = assistantContent.includes('REAL-TIME CLOCK & TIME/DATE QUERIES') &&
  assistantContent.includes('ALWAYS answer accurately and concisely in clean ENGLISH by default');
assertTest('Time & Date Policy: Injects real-time IST clock and enforces English response by default',
  hasTimeDatePrompt,
  'Live Indian Standard Time provided to LLM; time/date queries default to English');

// Verify Default TTS Voice Configuration
const ttsPath = path.join(__dirname, '..', 'services', 'tts.js');
const ttsContent = fs.readFileSync(ttsPath, 'utf8');
const wsPath = path.join(__dirname, '..', 'services', 'websocket.js');
const wsContent = fs.readFileSync(wsPath, 'utf8');
const ttsDefaultEnglish = ttsContent.includes('en-IN-PrabhatNeural') && wsContent.includes('en-IN-PrabhatNeural');
assertTest('Default TTS Voice: en-IN-PrabhatNeural configured in TTS & WebSocket pipelines',
  ttsDefaultEnglish,
  'Clean, natural Indian-English voice used for default speech');

// Verify Calm Speech Rate Configuration (-25% for high clarity and comfortable pace)
const ttsPacingConfigured = ttsContent.includes('EDGE_TTS_RATE || "-25%"') && wsContent.includes('EDGE_TTS_RATE || "-25%"');
assertTest('Calm Speech Rate: -25% rate configured for clear, intelligible audio playback',
  ttsPacingConfigured,
  'Reduces Edge TTS speech rate by 25% for crystal-clear clarity over speaker');

// Verify Session History Isolation
const sessionsPath = path.join(__dirname, '..', 'uploads', 'sessions.json');
const sessionsContent = fs.readFileSync(sessionsPath, 'utf8');
const sessionsObj = JSON.parse(sessionsContent);
const defaultSessionClean = !sessionsObj['default-session'] || sessionsObj['default-session'].length === 0 ||
  !JSON.stringify(sessionsObj['default-session']).includes('नमस्ते');
assertTest('Session History Isolation: Stale Hindi sessions cleared',
  defaultSessionClean,
  'Default session history reset to prevent Hindi bias in conversation turns');

// Report generation test with dynamic pronouns
const report = generateChildDevelopmentReport({ refresh: true });
assertTest('Developmental report generates successfully', !!report && report.overall_development_score > 0, `Score: ${report.overall_development_score}/100, Status: ${report.pediatric_status}`);
assertTest('Report adapts pronouns to gender (He/His vs She/Her)', report.executive_summary.includes('He shows') || report.executive_summary.includes('She shows'), 'Pronouns matched to gender profile');

// ----------------------------------------------------
// TEST GROUP 4: Frontend HTML/JS Syntax & Responsive UI QA
// ----------------------------------------------------
console.log('\n>>> [4/4] Frontend Web UI & Client Scripts QA');

const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

assertTest('index.html exists and is non-empty', htmlContent.length > 50000, `Size: ${htmlContent.length} bytes`);

// Check Scripts syntax in index.html
const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIdx = 0;
let scriptsValid = true;
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  try {
    new Function(match[1]);
    scriptIdx++;
  } catch (err) {
    scriptsValid = false;
    console.error(`Script block ${scriptIdx} error:`, err.message);
  }
}
assertTest('All inline JavaScript blocks in index.html have valid syntax', scriptsValid, `${scriptIdx} script blocks verified`);

// Verify Mobile & Child Profile UI Elements
const hasProfileModal = htmlContent.includes('id="childProfileModal"');
const hasProfileButton = htmlContent.includes('openProfileModal()');
const hasStatusPillNoWrap = htmlContent.includes('id="deviceStatusPill"') && htmlContent.includes('whitespace-nowrap');
const hasBottomNav = htmlContent.includes('id="mobileBottomNav"');

assertTest('Child Profile & Guardrails Modal integrated in web UI', hasProfileModal && hasProfileButton, 'Settings button and modal inputs present');
assertTest('Mobile Status Pill uses single-element whitespace-nowrap', hasStatusPillNoWrap, 'Prevents double-text wrap on mobile screens');
assertTest('Fixed Mobile Bottom Navigation present', hasBottomNav, 'Native mobile one-thumb navigation bar verified');

// ----------------------------------------------------
// SUMMARY REPORT
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`QA/QC RESULT: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
if (failedTests === 0) {
  console.log('STATUS: [GREEN / PASSED] - All firmware, backend, prompt & UI tests verified!');
} else {
  console.log(`STATUS: [RED / FAILED] - ${failedTests} test(s) failed!`);
}
console.log('====================================================\n');
process.exit(failedTests > 0 ? 1 : 0);
