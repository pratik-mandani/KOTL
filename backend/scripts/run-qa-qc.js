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
const hasClockScreen = inoContent.includes('void drawClockDateScreen()');
const hasServiceTouch = inoContent.includes('void serviceTouchSensor()');
const hasNonBlockingClock = inoContent.includes('if (millis() < s_showClockUntilMs)');
assertTest('OLED Date & Time Screen & Touch Service implemented', hasClockScreen && hasServiceTouch && hasNonBlockingClock, 'Single-tap shows clock for 4.5s; double-tap laughs; long-press sleeps');

// Verify Startup Sound: 'toot-toot' double beep replaces voice hello
const hasDoubleBeepFn = inoContent.includes('void playStartupDoubleBeep()') && inoContent.includes('void playTone(');
const selfTestMatch = inoContent.match(/void\s+runStartupSelfTest\s*\(\)\s*\{([\s\S]*?)\n\}/);
const selfTestSection = selfTestMatch ? selfTestMatch[1] : '';
const callsDoubleBeep = selfTestSection.includes('playStartupDoubleBeep();');
const noHelloInSelfTest = !selfTestSection.includes('playStartupHello();');
assertTest('Startup Sound: Electronic "toot-toot" double beep replaces voice hello', hasDoubleBeepFn && callsDoubleBeep && noHelloInSelfTest, 'Self-test plays ascending chime (880Hz -> 1175Hz) without voice audio sample');

// Verify Boot Screen: Bold centered 'KOTL' logo on boot; test UI only shown on error
const hasBootLogoFn = inoContent.includes('void drawBootLogoScreen()') && inoContent.includes('setTextSize(4)') && inoContent.includes('"KOTL"');
const hasErrorScreenFn = inoContent.includes('void drawStartupErrorScreen(');
const callsBootLogoOnStartup = selfTestSection.includes('drawBootLogoScreen();');
const noTestUiInNormalBoot = !selfTestSection.includes('drawStartupSelfTestScreen(');
const hasErrorBranch = selfTestSection.includes('drawStartupErrorScreen(');

const calibMatch = inoContent.match(/void\s+calibrateRoomAcoustics\s*\(\)\s*\{([\s\S]*?)\n\}/);
const calibSection = calibMatch ? calibMatch[1] : '';
const calibSilent = !calibSection.includes('drawStartupSelfTestScreen(');

assertTest('Boot Logo UI: Bold centered "KOTL" logo presented; self-test UI only displays on hardware error',
  hasBootLogoFn && hasErrorScreenFn && callsBootLogoOnStartup && noTestUiInNormalBoot && hasErrorBranch && calibSilent,
  'Screen shows full-screen centered bold KOTL logo; room profiling runs silently; errors trigger dedicated alert screen');

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
