#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <LittleFS.h>
#include <FluxGarage_RoboEyes.h>
#include <driver/adc.h>
#include <driver/i2s.h>
#include <esp_err.h>
#include "../hello_sample.h"
#include "kotl_provisioning.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C
#define I2C_SDA_PIN 21
#define I2C_SCL_PIN 22

#define I2S_PORT I2S_NUM_0
#define I2S_BCLK_PIN 26
#define I2S_LRC_PIN 25
#define I2S_DIN_PIN 27
#define MIC_ADC_PIN 34
#define MIC_ADC_CHANNEL ADC1_CHANNEL_6

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
RoboEyes<Adafruit_SSD1306> roboEyes(display);

static const uint32_t kI2SSampleRate = kHelloSampleRate;
static const size_t kI2SChunkFrames = 256;
static const uint16_t kMicSpikeThreshold = 100;
static const uint16_t kMicReleaseThreshold = 80;
static const uint8_t kMicHighDebounceCount = 3;
static const uint32_t kMicMinSilenceMs = 120;
static const uint32_t kMicPrintIntervalMs = 30;
static const uint32_t kSoundReactionDurationMs = 700;
static const bool kPrintMicDebug = false;
static const uint16_t kStartupMicSignalThreshold = 40;
static const uint32_t kStartupMicTestTimeoutMs = 3000;
static const uint32_t kStartupBeepDurationMs = 300;
static const uint32_t kStartupBeepFrequencyHz = 880;

#if __has_include("kotl_config.h")
#include "kotl_config.h"
#endif

#ifndef KOTL_WIFI_SSID
#define KOTL_WIFI_SSID ""
#endif

#ifndef KOTL_WIFI_PASSWORD
#define KOTL_WIFI_PASSWORD ""
#endif

#ifndef KOTL_BACKEND_BASE_URL
#define KOTL_BACKEND_BASE_URL "http://192.168.1.13:3000"
#endif

static const char *kWiFiSsid = KOTL_WIFI_SSID;
static const char *kWiFiPassword = KOTL_WIFI_PASSWORD;
static const char *kBackendBaseUrl = KOTL_BACKEND_BASE_URL;
static const char *kBackendChatUrl = KOTL_BACKEND_BASE_URL "/chat";
static const char *kBackendChatPayload = "{\"text\":\"hello\"}";
static const char *kBackendAudioUrl = KOTL_BACKEND_BASE_URL "/audio";
static const bool kEnableBootChatDebug = false;
static const uint32_t kWiFiRetryIntervalMs = 5000;
static const uint32_t kHttpRetryIntervalMs = 15000;
static const uint32_t kHttpTimeoutMs = 120000;
static const uint32_t kAudioCaptureSampleRate = 8000;
static const uint32_t kAudioCaptureDurationMs = 4000;
static const size_t kAudioCaptureSampleCount = (kAudioCaptureSampleRate * kAudioCaptureDurationMs) / 1000;
static const uint32_t kAudioCaptureSampleIntervalUs = 1000000UL / kAudioCaptureSampleRate;
static const uint16_t kAudioCaptureBaselineSamples = 128;
static const uint8_t kAudioCaptureMaxSamplesPerService = 64;
static const uint8_t kAudioCapturePcmScaleShift = 4;
static const bool kEnableAudioDiagnostic = false;
static const size_t kAudioDiagnosticSampleCount = 200;
static const char *kTtsFilePath = "/tts_reply.wav";
static const uint32_t kExpectedTtsSampleRate = 16000;
static const uint16_t kExpectedTtsBitsPerSample = 16;
static const uint16_t kExpectedTtsChannels = 1;
static const size_t kExpectedWavHeaderSize = 44;

enum PlaybackSource
{
  PLAYBACK_NONE,
  PLAYBACK_LOCAL_SAMPLE,
  PLAYBACK_TTS_AUDIO
};

enum VoiceTurnState
{
  VOICE_IDLE,
  VOICE_RECORDING,
  VOICE_UPLOADING,
  VOICE_THINKING,
  VOICE_DOWNLOADING_TTS,
  VOICE_SPEAKING,
  VOICE_ERROR
};

struct AudioPlaybackState
{
  PlaybackSource activeSource;
  PlaybackSource pendingSource;
  bool isPlaying;
  bool isDownloading;
  size_t localSampleIndex;
  size_t ttsBytesRemaining;
  size_t pendingOffsetBytes;
  size_t pendingBytes;
  uint32_t currentSampleRate;
  File ttsFile;
  int16_t dmaBuffer[kI2SChunkFrames * 2];
};

struct MicrophoneState
{
  uint16_t rawValue;
  uint16_t baseline;
  uint16_t amplitude;
  bool soundHigh;
  bool soundActive;
  uint8_t consecutiveHighReadings;
  uint32_t silenceStartMs;
  uint32_t lastPrintMs;
};

struct EyeReactionState
{
  bool soundReactionActive;
  uint32_t reactionUntilMs;
};

struct NetworkState
{
  bool wifiConnectInProgress;
  bool requestInProgress;
  bool requestCompleted;
  uint32_t lastWiFiAttemptMs;
  uint32_t lastHttpAttemptMs;
};

struct AudioCaptureState
{
  bool isRecording;
  bool isUploading;
  bool uploadPending;
  size_t writeIndex;
  uint32_t nextSampleDueUs;
  uint32_t recordingStartUs;
  uint16_t adcBaseline;
  uint16_t rawMin;
  uint16_t rawMax;
  int16_t pcmMin;
  int16_t pcmMax;
  uint64_t absSum;
  uint32_t clippedSampleCount;
};

struct VoiceTurnManager
{
  VoiceTurnState state;
  unsigned long stateStartedAtMs;
  String lastTranscript;
  String lastAssistantReply;
  String lastError;
};

AudioPlaybackState audioState = {PLAYBACK_NONE, PLAYBACK_NONE, false, false, 0, 0, 0, 0, kI2SSampleRate, File(), {0}};
MicrophoneState micState = {0, 2048, 0, false, false, 0, 0, 0};
EyeReactionState eyeReactionState = {false, 0};
NetworkState networkState = {false, false, false, 0, 0};
AudioCaptureState captureState = {false, false, false, 0, 0, 0, 2048, 4095, 0, 32767, -32768, 0, 0};
VoiceTurnManager voiceTurn = {VOICE_IDLE, 0, "", "", ""};
static int16_t audioCaptureBuffer[kAudioCaptureSampleCount] = {0};
bool startupSelfTestPassed = false;
bool audioOutputInitialized = false;
bool ttsStorageAvailable = false;
static const uint32_t kVoiceRecordingTimeoutMs = 5000;
static const uint32_t kVoiceUploadingTimeoutMs = 20000;
static const uint32_t kVoiceThinkingTimeoutMs = 30000;
static const uint32_t kVoiceDownloadingTtsTimeoutMs = 20000;
static const uint32_t kVoiceSpeakingTimeoutMs = 30000;

void initDisplay();
void initEyes();
void initAudioOutput();
void initMicrophoneInput();
void initNetworking();
void initFileStorage();
void runStartupSelfTest();
void drawStartupSelfTestScreen(const char *line1, const char *line2, uint8_t progressStep = 0);
void playStartupBeep();
void serviceAudioOutput();
void serviceAudioCapture();
void serviceMicrophoneInput();
void serviceEyeReaction();
void serviceNetworking();
void setVoiceTurnState(VoiceTurnState newState, const String &errorText = "");
void resetVoiceTurnToIdle();
void clearVoiceTurnRuntimeState();
void failVoiceTurn(const String &errorText);
void handleVoiceTurnTimeouts();
bool canStartVoiceTurn();
void beginWiFiConnection(uint32_t nowMs);
void performBackendPostRequest(uint32_t nowMs);
void performAudioUpload();
void beginAudioCapture();
void triggerSoundReaction(uint32_t nowMs);
void triggerVoicePlayback();
void fillAudioChunk();
int16_t nextMonoSample();
int16_t nextLocalSample();
int16_t nextTtsSample();
uint16_t calibrateCaptureBaseline();
int16_t adcToPcm16(uint16_t rawValue, uint16_t baseline);
bool configureAudioSampleRate(uint32_t sampleRate);
void finishPlayback();
bool startPlayback(PlaybackSource source);
bool startLocalSamplePlayback();
bool startTtsPlayback();
void queueOrStartTtsPlayback();
bool parseAudioUploadResponse(const String &payload, bool *ttsReady, String *ttsUrl, String *transcript, String *assistantReply, String *turnStatus, String *sttError, String *assistantError, String *ttsError);
bool extractJsonBool(const String &payload, const char *key, bool *value);
bool extractJsonString(const String &payload, const char *key, String *value);
String resolveBackendUrl(const String &relativePath);
bool downloadTtsAudio(const String &ttsUrl);
uint16_t readLe16(const uint8_t *buffer);
uint32_t readLe32(const uint8_t *buffer);

void setup()
{
  Serial.begin(115200);
  initPersistentConfig();

  Serial.print("Configured Wi-Fi SSID: ");
  Serial.println(g_wifi_ssid.length() > 0 ? g_wifi_ssid : String(kWiFiSsid));
  Serial.print("Configured Backend Base URL: ");
  Serial.println(g_backend_url.length() > 0 ? g_backend_url : String(kBackendBaseUrl));

  initDisplay();
  initEyes();
  initAudioOutput();
  initMicrophoneInput();
  initFileStorage();
  initNetworking();
  runStartupSelfTest();
}

void loop()
{
  // If in AP Captive Portal setup mode, handle web server requests
  if (g_in_ap_mode)
  {
    serviceCaptivePortal();
    static uint32_t lastApOledMs = 0;
    if (millis() - lastApOledMs > 1500)
    {
      drawStartupSelfTestScreen("SETUP MODE", "Join KOTL-SETUP", 2);
      lastApOledMs = millis();
    }
    delay(5);
    return;
  }

  if (!startupSelfTestPassed)
  {
    serviceAudioOutput();
    delay(20);
    return;
  }

  roboEyes.update();
  serviceAudioOutput();

  // Periodic check for Wi-Fi or Remote Admin configuration updates
  checkRemoteAdminUpdates();

  // Periodic heartbeat log to show VAD loop is running and listening
  static uint32_t lastListeningLogMs = 0;
  const uint32_t nowMs = millis();
  if (voiceTurn.state == VOICE_IDLE && !audioState.isPlaying && (nowMs - lastListeningLogMs >= 8000))
  {
    Serial.println("Listening for wake word...");
    lastListeningLogMs = nowMs;
  }

  if (captureState.isRecording)
  {
    serviceAudioCapture();
    serviceEyeReaction();
    handleVoiceTurnTimeouts();
    return;
  }

  serviceMicrophoneInput();
  serviceAudioCapture();
  serviceEyeReaction();
  serviceNetworking();
  handleVoiceTurnTimeouts();
}

void initDisplay()
{
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS))
  {
    for (;;)
    {
      delay(1000);
    }
  }
}

void initEyes()
{
  roboEyes.begin(SCREEN_WIDTH, SCREEN_HEIGHT, 100);
  roboEyes.close();
  roboEyes.setPosition(DEFAULT);
  roboEyes.setMood(DEFAULT);
  roboEyes.setAutoblinker(ON, 3, 2);
  roboEyes.setIdleMode(ON, 3, 1);
  roboEyes.setWidth(36, 36);
  roboEyes.setHeight(36, 36);
  roboEyes.setBorderradius(8, 8);
  roboEyes.setSpacebetween(10);
}

void setVoiceTurnState(VoiceTurnState newState, const String &errorText)
{
  voiceTurn.state = newState;
  voiceTurn.stateStartedAtMs = millis();
  if (errorText.length() > 0)
  {
    voiceTurn.lastError = errorText;
  }

  switch (newState)
  {
  case VOICE_IDLE:
    roboEyes.setMood(DEFAULT);
    roboEyes.setPosition(DEFAULT);
    break;
  case VOICE_RECORDING:
  case VOICE_UPLOADING:
  case VOICE_THINKING:
  case VOICE_DOWNLOADING_TTS:
    roboEyes.setMood(TIRED);
    roboEyes.setPosition(DEFAULT);
    break;
  case VOICE_SPEAKING:
    roboEyes.setMood(HAPPY);
    roboEyes.setPosition(DEFAULT);
    break;
  case VOICE_ERROR:
    roboEyes.setMood(ANGRY);
    roboEyes.setPosition(DEFAULT);
    break;
  }
}

void resetVoiceTurnToIdle()
{
  clearVoiceTurnRuntimeState();
  
  // Recalibrate mic baseline to clear any analog rail sag shift from speaker playback
  uint32_t baselineTotal = 0;
  for (int i = 0; i < 32; ++i)
  {
    baselineTotal += adc1_get_raw(MIC_ADC_CHANNEL);
    delayMicroseconds(200);
  }
  micState.baseline = baselineTotal / 32;
  micState.rawValue = micState.baseline;
  micState.amplitude = 0;
  micState.soundHigh = false;
  micState.consecutiveHighReadings = 0;
  micState.silenceStartMs = 0;

  setVoiceTurnState(VOICE_IDLE);
  Serial.println("TURN IDLE");
}

void clearVoiceTurnRuntimeState()
{
  captureState.isRecording = false;
  captureState.isUploading = false;
  captureState.uploadPending = false;
  captureState.writeIndex = 0;
  audioState.isDownloading = false;
  micState.soundActive = false;
}

void failVoiceTurn(const String &errorText)
{
  Serial.println(errorText);
  if (audioState.ttsFile)
  {
    audioState.ttsFile.close();
  }
  audioState.activeSource = PLAYBACK_NONE;
  audioState.pendingSource = PLAYBACK_NONE;
  audioState.isPlaying = false;
  audioState.ttsBytesRemaining = 0;
  audioState.localSampleIndex = 0;
  configureAudioSampleRate(kI2SSampleRate);
  setVoiceTurnState(VOICE_ERROR, errorText);
  resetVoiceTurnToIdle();
}

bool canStartVoiceTurn()
{
  return voiceTurn.state == VOICE_IDLE &&
         !captureState.isRecording &&
         !captureState.isUploading &&
         !captureState.uploadPending &&
         !audioState.isDownloading &&
         !audioState.isPlaying;
}

void handleVoiceTurnTimeouts()
{
  uint32_t timeoutMs = 0;

  switch (voiceTurn.state)
  {
  case VOICE_RECORDING:
    timeoutMs = kVoiceRecordingTimeoutMs;
    break;
  case VOICE_UPLOADING:
    timeoutMs = kVoiceUploadingTimeoutMs;
    break;
  case VOICE_THINKING:
    timeoutMs = kVoiceThinkingTimeoutMs;
    break;
  case VOICE_DOWNLOADING_TTS:
    timeoutMs = kVoiceDownloadingTtsTimeoutMs;
    break;
  case VOICE_SPEAKING:
    timeoutMs = kVoiceSpeakingTimeoutMs;
    break;
  case VOICE_IDLE:
  case VOICE_ERROR:
  default:
    return;
  }

  if ((uint32_t)(millis() - voiceTurn.stateStartedAtMs) < timeoutMs)
  {
    return;
  }

  String errorText = "Voice turn timeout";
  switch (voiceTurn.state)
  {
  case VOICE_RECORDING:
    errorText = "Voice turn timeout: recording";
    captureState.isRecording = false;
    captureState.uploadPending = false;
    captureState.writeIndex = 0;
    break;
  case VOICE_UPLOADING:
    errorText = "Voice turn timeout: uploading";
    captureState.isUploading = false;
    captureState.uploadPending = false;
    break;
  case VOICE_THINKING:
    errorText = "Voice turn timeout: thinking";
    break;
  case VOICE_DOWNLOADING_TTS:
    errorText = "Voice turn timeout: downloading tts";
    audioState.isDownloading = false;
    break;
  case VOICE_SPEAKING:
    errorText = "Voice turn timeout: speaking";
    if (audioState.ttsFile)
    {
      audioState.ttsFile.close();
    }
    audioState.activeSource = PLAYBACK_NONE;
    audioState.pendingSource = PLAYBACK_NONE;
    audioState.isPlaying = false;
    audioState.ttsBytesRemaining = 0;
    audioState.localSampleIndex = 0;
    configureAudioSampleRate(kI2SSampleRate);
    break;
  case VOICE_IDLE:
  case VOICE_ERROR:
  default:
    break;
  }

  failVoiceTurn(errorText);
}

void initAudioOutput()
{
  i2s_config_t i2sConfig = {};
  i2sConfig.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX);
  i2sConfig.sample_rate = (int)kI2SSampleRate;
  i2sConfig.bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT;
  i2sConfig.channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT;
  i2sConfig.communication_format = I2S_COMM_FORMAT_STAND_I2S;
  i2sConfig.intr_alloc_flags = 0;
  i2sConfig.dma_buf_count = 16;
  i2sConfig.dma_buf_len = (int)kI2SChunkFrames;
  i2sConfig.use_apll = false;
  i2sConfig.tx_desc_auto_clear = true;
  i2sConfig.fixed_mclk = 0;

  i2s_pin_config_t pinConfig = {};
  pinConfig.bck_io_num = I2S_BCLK_PIN;
  pinConfig.ws_io_num = I2S_LRC_PIN;
  pinConfig.data_out_num = I2S_DIN_PIN;
  pinConfig.data_in_num = I2S_PIN_NO_CHANGE;

  const esp_err_t installResult = i2s_driver_install(I2S_PORT, &i2sConfig, 0, nullptr);
  const esp_err_t pinResult = (installResult == ESP_OK) ? i2s_set_pin(I2S_PORT, &pinConfig) : installResult;
  audioOutputInitialized = (installResult == ESP_OK && pinResult == ESP_OK);

  if (audioOutputInitialized)
  {
    i2s_zero_dma_buffer(I2S_PORT);
    Serial.println("audio output initialized");
    Serial.print("I2S TX port: ");
    Serial.println((int)I2S_PORT);
    Serial.print("I2S pins BCLK/WS/DIN: ");
    Serial.print(I2S_BCLK_PIN);
    Serial.print(" / ");
    Serial.print(I2S_LRC_PIN);
    Serial.print(" / ");
    Serial.println(I2S_DIN_PIN);
    Serial.print("I2S sample rate: ");
    Serial.println(kI2SSampleRate);
  }
  else
  {
    Serial.print("audio output init failed, driver install: ");
    Serial.print(esp_err_to_name(installResult));
    Serial.print(", set pin: ");
    Serial.println(esp_err_to_name(pinResult));
  }
}

void initMicrophoneInput()
{
  adc1_config_width(ADC_WIDTH_BIT_12);
  adc1_config_channel_atten(MIC_ADC_CHANNEL, ADC_ATTEN_DB_11);

  const uint16_t initialSample = (uint16_t)adc1_get_raw(MIC_ADC_CHANNEL);
  micState.rawValue = initialSample;
  micState.baseline = initialSample;
}

void initNetworking()
{
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
}

void initFileStorage()
{
  if (!LittleFS.begin(true))
  {
    Serial.println("LittleFS init failed; TTS playback disabled");
    ttsStorageAvailable = false;
    return;
  }

  ttsStorageAvailable = true;
  Serial.println("LittleFS ready for TTS storage");
}

void runStartupSelfTest()
{
  Serial.println("===== STARTUP SELF TEST =====");
  drawStartupSelfTestScreen("KOTL", "Hardware Test", 0);
  delay(250);

  Serial.println("speaker test started");
  drawStartupSelfTestScreen("KOTL", "Speaker Test", 1);
  playStartupBeep();

  uint32_t baselineTotal = 0;
  static const uint8_t kBaselineSampleCount = 64;
  for (uint8_t sampleIndex = 0; sampleIndex < kBaselineSampleCount; ++sampleIndex)
  {
    baselineTotal += (uint16_t)adc1_get_raw(MIC_ADC_CHANNEL);
    delay(2);
  }

  const uint16_t micBaseline = (uint16_t)(baselineTotal / kBaselineSampleCount);
  uint16_t rawMin = 4095;
  uint16_t rawMax = 0;
  uint64_t movementSum = 0;
  uint32_t sampleCount = 0;
  uint32_t lastAnimationMs = 0;
  uint8_t animationStep = 0;
  const uint32_t startedAtMs = millis();

  while ((uint32_t)(millis() - startedAtMs) < kStartupMicTestTimeoutMs)
  {
    const uint16_t rawValue = (uint16_t)adc1_get_raw(MIC_ADC_CHANNEL);
    if (rawValue < rawMin)
    {
      rawMin = rawValue;
    }
    if (rawValue > rawMax)
    {
      rawMax = rawValue;
    }

    movementSum += (rawValue > micBaseline) ? (rawValue - micBaseline) : (micBaseline - rawValue);
    ++sampleCount;

    const uint32_t nowMs = millis();
    if (nowMs - lastAnimationMs >= 250)
    {
      drawStartupSelfTestScreen("KOTL", "Mic Test", animationStep++);
      lastAnimationMs = nowMs;
    }

    delay(1);
  }

  const uint16_t peakToPeak = rawMax - rawMin;
  const uint32_t avgMovement = sampleCount > 0 ? (uint32_t)(movementSum / sampleCount) : 0;
  startupSelfTestPassed = (peakToPeak >= kStartupMicSignalThreshold || avgMovement >= kStartupMicSignalThreshold);

  Serial.print("mic baseline: ");
  Serial.println(micBaseline);
  Serial.print("mic raw min/max: ");
  Serial.print(rawMin);
  Serial.print(" / ");
  Serial.println(rawMax);
  Serial.print("mic peak-to-peak: ");
  Serial.println(peakToPeak);
  Serial.print("mic avg movement: ");
  Serial.println(avgMovement);
  Serial.print("result: ");
  Serial.println(startupSelfTestPassed ? "PASS" : "FAIL");

  if (startupSelfTestPassed)
  {
    drawStartupSelfTestScreen("MIC OK", "KOTL Ready", 5);
    delay(800);
    roboEyes.open();
  }
  else
  {
    Serial.println("MIC ERROR: no startup mic signal detected; normal voice flow blocked until reset/retry");
    drawStartupSelfTestScreen("MIC ERROR", "Check MAX9814 / GPIO34", 0);
    captureState.isRecording = false;
    captureState.isUploading = false;
    captureState.uploadPending = false;
    micState.soundActive = false;
  }

  Serial.println("=============================");
}

void drawStartupSelfTestScreen(const char *line1, const char *line2, uint8_t progressStep)
{
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(0, 8);
  display.println(line1);
  display.setTextSize(1);
  display.setCursor(0, 32);
  display.println(line2);

  const int16_t barX = 0;
  const int16_t barY = 54;
  const int16_t barW = SCREEN_WIDTH;
  const int16_t barH = 6;
  display.drawRect(barX, barY, barW, barH, SSD1306_WHITE);
  const int16_t fillW = (int16_t)(((progressStep % 6) + 1) * (barW - 2) / 6);
  display.fillRect(barX + 1, barY + 1, fillW, barH - 2, SSD1306_WHITE);
  display.display();
}

void playStartupBeep()
{
  Serial.print("speaker test I2S initialized: ");
  Serial.println(audioOutputInitialized ? "YES" : "NO");
  if (!audioOutputInitialized)
  {
    Serial.println("speaker test failed: audio output not initialized");
    return;
  }

  if (!configureAudioSampleRate(kI2SSampleRate))
  {
    Serial.println("speaker test failed: sample rate config");
    return;
  }

  audioState.activeSource = PLAYBACK_NONE;
  audioState.pendingSource = PLAYBACK_NONE;
  audioState.isPlaying = false;
  audioState.localSampleIndex = 0;
  audioState.pendingOffsetBytes = 0;
  audioState.pendingBytes = 0;

  const uint32_t totalFrames = (kI2SSampleRate * kStartupBeepDurationMs) / 1000UL;
  const uint32_t periodFrames = kI2SSampleRate / kStartupBeepFrequencyHz;
  const uint32_t halfPeriodFrames = periodFrames / 2;
  const size_t expectedBytes = (size_t)totalFrames * 2U * sizeof(int16_t);
  size_t totalBytesWritten = 0;
  esp_err_t lastWriteResult = ESP_OK;
  uint32_t frameNumber = 0;

  Serial.print("speaker test tone Hz: ");
  Serial.println(kStartupBeepFrequencyHz);
  Serial.print("speaker test duration ms: ");
  Serial.println(kStartupBeepDurationMs);
  Serial.print("speaker test expected bytes: ");
  Serial.println(expectedBytes);

  while (frameNumber < totalFrames)
  {
    const size_t framesThisChunk = min((size_t)kI2SChunkFrames, (size_t)(totalFrames - frameNumber));
    for (size_t frameIndex = 0; frameIndex < framesThisChunk; ++frameIndex)
    {
      const bool highPhase = ((frameNumber + frameIndex) % periodFrames) < halfPeriodFrames;
      const int16_t sample = highPhase ? 12000 : -12000;
      audioState.dmaBuffer[frameIndex * 2] = sample;
      audioState.dmaBuffer[(frameIndex * 2) + 1] = sample;
    }

    size_t bytesWritten = 0;
    const size_t bytesToWrite = framesThisChunk * 2U * sizeof(int16_t);
    lastWriteResult = i2s_write(I2S_PORT, audioState.dmaBuffer, bytesToWrite, &bytesWritten, portMAX_DELAY);
    totalBytesWritten += bytesWritten;
    if (lastWriteResult != ESP_OK)
    {
      break;
    }

    frameNumber += framesThisChunk;
  }

  i2s_zero_dma_buffer(I2S_PORT);
  Serial.print("speaker test i2s_write bytes written: ");
  Serial.println(totalBytesWritten);
  Serial.print("speaker test i2s_write expected bytes: ");
  Serial.println(expectedBytes);
  Serial.print("speaker test i2s_write result: ");
  Serial.println(esp_err_to_name(lastWriteResult));
  if (lastWriteResult == ESP_OK && totalBytesWritten != expectedBytes)
  {
    Serial.println("speaker test warning: i2s_write short write");
  }
}

void serviceAudioOutput()
{
  if (!audioState.isPlaying && audioState.pendingSource == PLAYBACK_NONE && audioState.pendingBytes == 0)
  {
    return;
  }

  if (audioState.pendingBytes == 0)
  {
    fillAudioChunk();
  }

  size_t bytesWritten = 0;
  const uint8_t *writePtr = reinterpret_cast<const uint8_t *>(audioState.dmaBuffer) + audioState.pendingOffsetBytes;
  i2s_write(I2S_PORT, writePtr, audioState.pendingBytes, &bytesWritten, 100 / portTICK_PERIOD_MS);

  audioState.pendingOffsetBytes += bytesWritten;
  audioState.pendingBytes -= bytesWritten;

  if (audioState.pendingBytes == 0)
  {
    audioState.pendingOffsetBytes = 0;
  }
}

void fillAudioChunk()
{
  if (!audioState.isPlaying && audioState.pendingSource != PLAYBACK_NONE)
  {
    startPlayback(audioState.pendingSource);
    audioState.pendingSource = PLAYBACK_NONE;
  }

  for (size_t frameIndex = 0; frameIndex < kI2SChunkFrames; ++frameIndex)
  {
    const int16_t monoSample = nextMonoSample();
    audioState.dmaBuffer[frameIndex * 2] = monoSample;
    audioState.dmaBuffer[(frameIndex * 2) + 1] = monoSample;
  }

  audioState.pendingOffsetBytes = 0;
  audioState.pendingBytes = sizeof(audioState.dmaBuffer);
}

int16_t nextMonoSample()
{
  if (!audioState.isPlaying)
  {
    return 0;
  }

  if (audioState.activeSource == PLAYBACK_LOCAL_SAMPLE)
  {
    return nextLocalSample();
  }

  if (audioState.activeSource == PLAYBACK_TTS_AUDIO)
  {
    return nextTtsSample();
  }

  return 0;
}

int16_t nextLocalSample()
{
  if (audioState.localSampleIndex >= kHelloSampleCount)
  {
    finishPlayback();
    return 0;
  }

  return kHelloSample[audioState.localSampleIndex++];
}

int16_t nextTtsSample()
{
  if (!audioState.ttsFile || audioState.ttsBytesRemaining < 2)
  {
    finishPlayback();
    return 0;
  }

  uint8_t sampleBytes[2] = {0, 0};
  const size_t bytesRead = audioState.ttsFile.read(sampleBytes, sizeof(sampleBytes));
  if (bytesRead != sizeof(sampleBytes))
  {
    finishPlayback();
    return 0;
  }

  audioState.ttsBytesRemaining -= sizeof(sampleBytes);
  return (int16_t)((sampleBytes[1] << 8) | sampleBytes[0]);
}

bool configureAudioSampleRate(uint32_t sampleRate)
{
  if (audioState.currentSampleRate == sampleRate)
  {
    return true;
  }

  if (i2s_set_clk(I2S_PORT, sampleRate, I2S_BITS_PER_SAMPLE_16BIT, I2S_CHANNEL_STEREO) != ESP_OK)
  {
    Serial.print("I2S sample rate update failed: ");
    Serial.println(sampleRate);
    return false;
  }

  audioState.currentSampleRate = sampleRate;
  return true;
}

bool startPlayback(PlaybackSource source)
{
  if (source == PLAYBACK_LOCAL_SAMPLE)
  {
    return startLocalSamplePlayback();
  }

  if (source == PLAYBACK_TTS_AUDIO)
  {
    return startTtsPlayback();
  }

  return false;
}

bool startLocalSamplePlayback()
{
  if (!configureAudioSampleRate(kI2SSampleRate))
  {
    return false;
  }

  audioState.activeSource = PLAYBACK_LOCAL_SAMPLE;
  audioState.isPlaying = true;
  audioState.localSampleIndex = 0;
  Serial.println("Playback started: local_sample");
  return true;
}

bool startTtsPlayback()
{
  if (!ttsStorageAvailable)
  {
    Serial.println("TTS playback skipped: LittleFS unavailable");
    return false;
  }

  File file = LittleFS.open(kTtsFilePath, FILE_READ);
  if (!file)
  {
    Serial.println("TTS playback skipped: file missing");
    return false;
  }

  uint8_t header[kExpectedWavHeaderSize] = {0};
  const size_t headerBytesRead = file.read(header, sizeof(header));
  if (headerBytesRead != sizeof(header))
  {
    Serial.println("Unsupported WAV: short header");
    file.close();
    return false;
  }

  const uint16_t audioFormat = readLe16(&header[20]);
  const uint16_t channelCount = readLe16(&header[22]);
  const uint32_t sampleRate = readLe32(&header[24]);
  const uint16_t bitsPerSample = readLe16(&header[34]);
  const uint32_t dataBytes = readLe32(&header[40]);

  if (memcmp(&header[0], "RIFF", 4) != 0 ||
      memcmp(&header[8], "WAVE", 4) != 0 ||
      memcmp(&header[12], "fmt ", 4) != 0 ||
      memcmp(&header[36], "data", 4) != 0 ||
      audioFormat != 1 ||
      channelCount != kExpectedTtsChannels ||
      sampleRate != kExpectedTtsSampleRate ||
      bitsPerSample != kExpectedTtsBitsPerSample)
  {
    Serial.println("Unsupported WAV: expected PCM mono 16-bit 16000 Hz");
    file.close();
    return false;
  }

  if (!configureAudioSampleRate(kExpectedTtsSampleRate))
  {
    file.close();
    return false;
  }

  audioState.ttsFile = file;
  audioState.ttsBytesRemaining = dataBytes;
  audioState.activeSource = PLAYBACK_TTS_AUDIO;
  audioState.isPlaying = true;
  Serial.println("PLAYBACK START");
  return true;
}

void finishPlayback()
{
  const PlaybackSource finishedSource = audioState.activeSource;
  if (audioState.ttsFile)
  {
    audioState.ttsFile.close();
  }

  audioState.activeSource = PLAYBACK_NONE;
  audioState.isPlaying = false;
  audioState.localSampleIndex = 0;
  audioState.ttsBytesRemaining = 0;

  if (finishedSource == PLAYBACK_LOCAL_SAMPLE)
  {
    Serial.println("Playback finished: local_sample");
  }
  else if (finishedSource == PLAYBACK_TTS_AUDIO)
  {
    Serial.println("PLAYBACK DONE");
    configureAudioSampleRate(kI2SSampleRate);
  }

  if (audioState.pendingSource != PLAYBACK_NONE)
  {
    const PlaybackSource nextSource = audioState.pendingSource;
    audioState.pendingSource = PLAYBACK_NONE;
    if (!startPlayback(nextSource))
    {
      setVoiceTurnState(VOICE_ERROR, "Playback start failed");
      resetVoiceTurnToIdle();
    }
    return;
  }

  if (!audioState.isPlaying &&
      audioState.pendingSource == PLAYBACK_NONE &&
      voiceTurn.state == VOICE_SPEAKING)
  {
    resetVoiceTurnToIdle();
  }
}

void serviceAudioCapture()
{
  if (captureState.isRecording)
  {
    const uint32_t nowUs = micros();
    uint8_t samplesThisService = 0;

    while (captureState.writeIndex < kAudioCaptureSampleCount &&
           (int32_t)(nowUs - captureState.nextSampleDueUs) >= 0 &&
           samplesThisService < kAudioCaptureMaxSamplesPerService)
    {
      const uint16_t rawValue = (uint16_t)adc1_get_raw(MIC_ADC_CHANNEL);
      const int16_t pcmSample = adcToPcm16(rawValue, captureState.adcBaseline);
      audioCaptureBuffer[captureState.writeIndex++] = pcmSample;
      if (pcmSample == 32767 || pcmSample == -32768)
      {
        ++captureState.clippedSampleCount;
      }
      if (rawValue < captureState.rawMin)
      {
        captureState.rawMin = rawValue;
      }
      if (rawValue > captureState.rawMax)
      {
        captureState.rawMax = rawValue;
      }
      if (pcmSample < captureState.pcmMin)
      {
        captureState.pcmMin = pcmSample;
      }
      if (pcmSample > captureState.pcmMax)
      {
        captureState.pcmMax = pcmSample;
      }
      captureState.absSum += (uint64_t)abs((int)pcmSample);
      captureState.nextSampleDueUs += kAudioCaptureSampleIntervalUs;
      ++samplesThisService;
    }

    if (captureState.writeIndex >= kAudioCaptureSampleCount)
    {
      const uint32_t elapsedMs = (micros() - captureState.recordingStartUs) / 1000UL;
      captureState.isRecording = false;
      captureState.uploadPending = true;
      Serial.println("RECORDING COMPLETE");
      Serial.print("recording bytes: ");
      Serial.println(sizeof(audioCaptureBuffer));
      Serial.print("recording elapsed ms: ");
      Serial.println(elapsedMs);
      Serial.print("baseline: ");
      Serial.println(captureState.adcBaseline);
      Serial.print("raw min/max: ");
      Serial.print(captureState.rawMin);
      Serial.print(" / ");
      Serial.println(captureState.rawMax);
      Serial.print("peak-to-peak: ");
      Serial.println(captureState.rawMax - captureState.rawMin);
      Serial.print("pcm min/max: ");
      Serial.print(captureState.pcmMin);
      Serial.print(" / ");
      Serial.println(captureState.pcmMax);
      Serial.print("avg abs amplitude: ");
      Serial.println((unsigned long)(captureState.absSum / kAudioCaptureSampleCount));
      Serial.print("clipped sample count: ");
      Serial.println(captureState.clippedSampleCount);
      if (kEnableAudioDiagnostic)
      {
        const size_t diagnosticSampleCount = min(kAudioDiagnosticSampleCount, kAudioCaptureSampleCount);
        for (size_t sampleIndex = 0; sampleIndex < diagnosticSampleCount; ++sampleIndex)
        {
          Serial.print("sample[");
          Serial.print(sampleIndex);
          Serial.print("]: ");
          Serial.println(audioCaptureBuffer[sampleIndex]);
        }
      }
    }
  }

  if (captureState.uploadPending && !captureState.isUploading)
  {
    performAudioUpload();
  }
}

void beginAudioCapture()
{
  if (captureState.isRecording || captureState.isUploading || captureState.uploadPending)
  {
    Serial.println("Audio capture trigger ignored: capture/upload already active");
    return;
  }

  captureState.adcBaseline = calibrateCaptureBaseline();
  captureState.writeIndex = 0;
  captureState.recordingStartUs = micros();
  captureState.nextSampleDueUs = captureState.recordingStartUs;
  captureState.isRecording = true;
  captureState.uploadPending = false;
  captureState.rawMin = 4095;
  captureState.rawMax = 0;
  captureState.pcmMin = 32767;
  captureState.pcmMax = -32768;
  captureState.absSum = 0;
  captureState.clippedSampleCount = 0;
  voiceTurn.lastTranscript = "";
  voiceTurn.lastAssistantReply = "";
  voiceTurn.lastError = "";
  setVoiceTurnState(VOICE_RECORDING);

  Serial.println("TURN START");
  Serial.println("RECORDING START");
  Serial.print("recording sample rate: ");
  Serial.println(kAudioCaptureSampleRate);
  Serial.print("recording duration ms: ");
  Serial.println(kAudioCaptureDurationMs);
  Serial.print("baseline: ");
  Serial.println(captureState.adcBaseline);
}

uint16_t calibrateCaptureBaseline()
{
  uint32_t total = 0;
  uint16_t rawMin = 4095;
  uint16_t rawMax = 0;
  for (uint16_t sampleIndex = 0; sampleIndex < kAudioCaptureBaselineSamples; ++sampleIndex)
  {
    const uint16_t rawValue = (uint16_t)adc1_get_raw(MIC_ADC_CHANNEL);
    total += rawValue;
    if (rawValue < rawMin)
    {
      rawMin = rawValue;
    }
    if (rawValue > rawMax)
    {
      rawMax = rawValue;
    }
    delayMicroseconds(kAudioCaptureSampleIntervalUs);
  }

  if (kAudioCaptureBaselineSamples > 2)
  {
    total -= rawMin;
    total -= rawMax;
  }

  const uint16_t divisor = kAudioCaptureBaselineSamples > 2 ? (kAudioCaptureBaselineSamples - 2) : kAudioCaptureBaselineSamples;
  const uint16_t baseline = (uint16_t)(total / divisor);
  micState.baseline = baseline;
  return baseline;
}

int16_t adcToPcm16(uint16_t rawValue, uint16_t baseline)
{
  int32_t centered = (int32_t)rawValue - (int32_t)baseline;
  int32_t scaled = centered << kAudioCapturePcmScaleShift;

  if (scaled > 32767)
  {
    return 32767;
  }

  if (scaled < -32768)
  {
    return -32768;
  }

  return (int16_t)scaled;
}

void serviceMicrophoneInput()
{
  const uint32_t nowMs = millis();
  const bool wasSoundHigh = micState.soundHigh;
  const uint16_t rawValue = (uint16_t)adc1_get_raw(MIC_ADC_CHANNEL);

  micState.rawValue = rawValue;
  micState.baseline = (uint16_t)(((uint32_t)micState.baseline * 15U + rawValue) / 16U);
  micState.amplitude = (rawValue > micState.baseline) ? (rawValue - micState.baseline) : (micState.baseline - rawValue);

  if (kPrintMicDebug && nowMs - micState.lastPrintMs >= kMicPrintIntervalMs)
  {
    Serial.print("Mic raw: ");
    Serial.print(micState.rawValue);
    Serial.print(" | amplitude: ");
    Serial.println(micState.amplitude);
    micState.lastPrintMs = nowMs;
  }

  if (micState.amplitude > kMicSpikeThreshold)
  {
    if (micState.consecutiveHighReadings < kMicHighDebounceCount)
    {
      ++micState.consecutiveHighReadings;
    }
    micState.silenceStartMs = 0;
  }
  else
  {
    micState.consecutiveHighReadings = 0;
  }

  if (!micState.soundHigh && micState.consecutiveHighReadings >= kMicHighDebounceCount)
  {
    micState.soundHigh = true;
  }

  if (micState.soundHigh)
  {
    if (micState.amplitude < kMicReleaseThreshold)
    {
      if (micState.silenceStartMs == 0)
      {
        micState.silenceStartMs = nowMs;
      }
      else if (nowMs - micState.silenceStartMs >= kMicMinSilenceMs)
      {
        micState.soundHigh = false;
        micState.soundActive = false;
        micState.consecutiveHighReadings = 0;
        micState.silenceStartMs = 0;
      }
    }
    else
    {
      micState.silenceStartMs = 0;
    }
  }

  const bool risingEdge = !wasSoundHigh && micState.soundHigh;
  if (risingEdge && !canStartVoiceTurn())
  {
    Serial.println("Voice turn trigger ignored; turn active");
  }
  else if (risingEdge && !micState.soundActive && !audioState.isPlaying && !audioState.isDownloading)
  {
    micState.soundActive = true;
    Serial.println("Sound detected");
    beginAudioCapture();
    triggerSoundReaction(nowMs);
  }
  else if (risingEdge && (captureState.isRecording || captureState.isUploading || captureState.uploadPending || audioState.isPlaying || audioState.isDownloading))
  {
    Serial.println("Sound trigger ignored: audio busy");
  }
}

void triggerVoicePlayback()
{
  if (audioState.isPlaying)
  {
    return;
  }

  startLocalSamplePlayback();
}

void triggerSoundReaction(uint32_t nowMs)
{
  if (eyeReactionState.soundReactionActive)
  {
    eyeReactionState.reactionUntilMs = nowMs + kSoundReactionDurationMs;
    return;
  }

  roboEyes.setIdleMode(OFF);
  roboEyes.setPosition(DEFAULT);
  roboEyes.blink();

  eyeReactionState.soundReactionActive = true;
  eyeReactionState.reactionUntilMs = nowMs + kSoundReactionDurationMs;
}

void serviceEyeReaction()
{
  if (!eyeReactionState.soundReactionActive)
  {
    return;
  }

  if ((int32_t)(millis() - eyeReactionState.reactionUntilMs) < 0)
  {
    return;
  }

  roboEyes.setIdleMode(ON, 3, 1);
  eyeReactionState.soundReactionActive = false;
}

void serviceNetworking()
{
  const uint32_t nowMs = millis();
  const wl_status_t wifiStatus = WiFi.status();

  if (wifiStatus != WL_CONNECTED)
  {
    networkState.requestInProgress = false;
    networkState.requestCompleted = false;

    if (!networkState.wifiConnectInProgress || (nowMs - networkState.lastWiFiAttemptMs >= kWiFiRetryIntervalMs))
    {
      beginWiFiConnection(nowMs);
    }
    return;
  }

  if (networkState.wifiConnectInProgress)
  {
    Serial.print("WiFi connected, IP: ");
    Serial.println(WiFi.localIP());
    networkState.wifiConnectInProgress = false;
  }

  if (!kEnableBootChatDebug)
  {
    return;
  }

  if (networkState.requestCompleted)
  {
    return;
  }

  if (!networkState.requestInProgress &&
      (networkState.lastHttpAttemptMs == 0 || (nowMs - networkState.lastHttpAttemptMs >= kHttpRetryIntervalMs)))
  {
    performBackendPostRequest(nowMs);
  }
}

void beginWiFiConnection(uint32_t nowMs)
{
  static uint8_t wifiFailCount = 0;
  const char *targetSsid = (g_wifi_ssid.length() > 0) ? g_wifi_ssid.c_str() : kWiFiSsid;
  const char *targetPass = (g_wifi_pass.length() > 0) ? g_wifi_pass.c_str() : kWiFiPassword;

  if (strlen(targetSsid) == 0)
  {
    Serial.println("No Wi-Fi credentials found! Starting 'KOTL-SETUP' Hotspot...");
    startCaptivePortal();
    return;
  }

  if (wifiFailCount >= 3)
  {
    Serial.println("Wi-Fi connection failed 3 times. Launching 'KOTL-SETUP' Captive Portal...");
    wifiFailCount = 0;
    startCaptivePortal();
    return;
  }

  Serial.print("WiFi connecting to: ");
  Serial.println(targetSsid);
  WiFi.disconnect(false, true);
  WiFi.begin(targetSsid, targetPass);
  networkState.wifiConnectInProgress = true;
  networkState.lastWiFiAttemptMs = nowMs;
  ++wifiFailCount;
}

void performBackendPostRequest(uint32_t nowMs)
{
  HTTPClient http;
  WiFiClientSecure sslClient;
  const String chatUrl = resolveBackendUrl("/chat");

  http.setConnectTimeout(kHttpTimeoutMs);
  http.setTimeout(kHttpTimeoutMs);

  networkState.requestInProgress = true;
  networkState.lastHttpAttemptMs = nowMs;

  if (!beginHttpWithOptionalSsl(http, sslClient, chatUrl))
  {
    Serial.println("Backend POST begin failed");
    networkState.requestInProgress = false;
    return;
  }

  Serial.print("Backend URL: ");
  Serial.println(chatUrl);
  http.addHeader("Content-Type", "application/json");

  const String payload = kBackendChatPayload;
  const int httpCode = http.POST(payload);
  if (httpCode > 0)
  {
    String responsePayload = http.getString();
    responsePayload.replace('\n', ' ');
    responsePayload.replace('\r', ' ');

    if (responsePayload.length() > 160)
    {
      responsePayload.remove(160);
    }

    Serial.print("Backend POST status: ");
    Serial.println(httpCode);
    Serial.print("Backend response: ");
    Serial.println(responsePayload);
    networkState.requestCompleted = true;
  }
  else
  {
    Serial.print("Backend POST failed: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
  networkState.requestInProgress = false;
}

void performAudioUpload()
{
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("Audio upload skipped: WiFi not connected");
    captureState.uploadPending = false;
    failVoiceTurn("Audio upload skipped: WiFi not connected");
    return;
  }

  HTTPClient http;
  WiFiClientSecure sslClient;
  const String audioUrl = resolveBackendUrl("/audio");
  http.setConnectTimeout(kHttpTimeoutMs);
  http.setTimeout(kHttpTimeoutMs);

  captureState.isUploading = true;
  setVoiceTurnState(VOICE_UPLOADING);
  Serial.println("UPLOAD START");
  Serial.print("upload url: ");
  Serial.println(audioUrl);

  if (!beginHttpWithOptionalSsl(http, sslClient, audioUrl))
  {
    captureState.isUploading = false;
    captureState.uploadPending = false;
    failVoiceTurn("Audio upload begin failed");
    return;
  }

  http.addHeader("Content-Type", "application/octet-stream");
  http.addHeader("X-Sample-Rate", String(kAudioCaptureSampleRate));
  http.addHeader("X-Duration-Ms", String(kAudioCaptureDurationMs));
  http.addHeader("X-Audio-Format", "raw_pcm_16le");

  uint8_t *payload = reinterpret_cast<uint8_t *>(audioCaptureBuffer);
  const int httpCode = http.POST(payload, sizeof(audioCaptureBuffer));
  if (httpCode > 0)
  {
    setVoiceTurnState(VOICE_THINKING);
    String responsePayload = http.getString();
    bool ttsReady = false;
    String ttsUrl;
    String transcript;
    String assistantReply;
    String turnStatus;
    String sttError;
    String assistantError;
    String ttsError;
    parseAudioUploadResponse(responsePayload, &ttsReady, &ttsUrl, &transcript, &assistantReply, &turnStatus, &sttError, &assistantError, &ttsError);
    voiceTurn.lastTranscript = transcript;
    voiceTurn.lastAssistantReply = assistantReply;

    String logPayload = responsePayload;
    logPayload.replace('\n', ' ');
    logPayload.replace('\r', ' ');
    if (logPayload.length() > 240)
    {
      logPayload.remove(240);
    }

    Serial.println("UPLOAD COMPLETE");
    Serial.print("upload status: ");
    Serial.println(httpCode);
    Serial.print("upload response: ");
    Serial.println(logPayload);
    Serial.print("TRANSCRIPT: ");
    if (transcript.length() > 0)
    {
      Serial.println(transcript);
    }
    else
    {
      Serial.println("(empty)");
    }
    if (sttError.length() > 0)
    {
      Serial.print("STT ERROR: ");
      Serial.println(sttError);
    }
    Serial.print("ASSISTANT REPLY: ");
    if (assistantReply.length() > 0)
    {
      Serial.println(assistantReply);
    }
    else
    {
      Serial.println("(empty)");
    }
    if (assistantError.length() > 0)
    {
      Serial.print("ASSISTANT ERROR: ");
      Serial.println(assistantError);
    }
    Serial.print("TTS READY: ");
    Serial.println(ttsReady ? "true" : "false");
    if (ttsError.length() > 0)
    {
      Serial.print("TTS ERROR: ");
      Serial.println(ttsError);
    }

    http.end(); // Cleanly close upload SSL connection before starting TTS download

    if (ttsReady)
    {
      if (ttsStorageAvailable)
      {
        setVoiceTurnState(VOICE_DOWNLOADING_TTS);
        if (!downloadTtsAudio(ttsUrl))
        {
          failVoiceTurn("TTS download failed");
        }
      }
      else
      {
        failVoiceTurn("TTS skipped: LittleFS unavailable");
      }
    }
    else
    {
      if (turnStatus == "complete" || turnStatus == "no_transcript" || turnStatus == "no_wake_word" || turnStatus == "assistant_failed" || turnStatus == "tts_failed")
      {
        resetVoiceTurnToIdle();
      }
      else
      {
        failVoiceTurn("Audio response missing TTS");
      }
    }
  }
  else
  {
    Serial.print("Audio upload failed: ");
    Serial.println(http.errorToString(httpCode));
    http.end();
    failVoiceTurn("Audio upload failed");
  }

  captureState.uploadPending = false;
  captureState.isUploading = false;
}

bool parseAudioUploadResponse(const String &payload, bool *ttsReady, String *ttsUrl, String *transcript, String *assistantReply, String *turnStatus, String *sttError, String *assistantError, String *ttsError)
{
  bool ready = false;
  String url;
  String parsedTranscript;
  String parsedAssistantReply;
  String parsedTurnStatus;
  String parsedSttError;
  String parsedAssistantError;
  String parsedTtsError;
  const bool hasReady = extractJsonBool(payload, "tts_ready", &ready);
  const bool hasUrl = extractJsonString(payload, "tts_url", &url);
  const bool hasTranscript = extractJsonString(payload, "transcript", &parsedTranscript);
  const bool hasAssistantReply = extractJsonString(payload, "assistant_reply", &parsedAssistantReply);
  const bool hasTurnStatus = extractJsonString(payload, "turn_status", &parsedTurnStatus);
  const bool hasSttError = extractJsonString(payload, "stt_error", &parsedSttError);
  const bool hasAssistantError = extractJsonString(payload, "assistant_error", &parsedAssistantError);
  const bool hasTtsError = extractJsonString(payload, "tts_error", &parsedTtsError);

  if (ttsReady != nullptr)
  {
    *ttsReady = hasReady ? ready : false;
  }

  if (ttsUrl != nullptr)
  {
    *ttsUrl = hasUrl ? url : "";
  }

  if (transcript != nullptr)
  {
    *transcript = hasTranscript ? parsedTranscript : "";
  }

  if (assistantReply != nullptr)
  {
    *assistantReply = hasAssistantReply ? parsedAssistantReply : "";
  }

  if (turnStatus != nullptr)
  {
    *turnStatus = hasTurnStatus ? parsedTurnStatus : "";
  }

  if (sttError != nullptr)
  {
    *sttError = hasSttError ? parsedSttError : "";
  }

  if (assistantError != nullptr)
  {
    *assistantError = hasAssistantError ? parsedAssistantError : "";
  }

  if (ttsError != nullptr)
  {
    *ttsError = hasTtsError ? parsedTtsError : "";
  }

  return hasReady;
}

bool extractJsonBool(const String &payload, const char *key, bool *value)
{
  const String pattern = String("\"") + key + "\":";
  const int keyIndex = payload.indexOf(pattern);
  if (keyIndex < 0)
  {
    return false;
  }

  int valueIndex = keyIndex + pattern.length();
  while (valueIndex < payload.length() && payload.charAt(valueIndex) == ' ')
  {
    ++valueIndex;
  }

  if (payload.startsWith("true", valueIndex))
  {
    *value = true;
    return true;
  }

  if (payload.startsWith("false", valueIndex))
  {
    *value = false;
    return true;
  }

  return false;
}

bool extractJsonString(const String &payload, const char *key, String *value)
{
  const String pattern = String("\"") + key + "\":";
  const int keyIndex = payload.indexOf(pattern);
  if (keyIndex < 0)
  {
    return false;
  }

  int valueIndex = keyIndex + pattern.length();
  while (valueIndex < payload.length() && payload.charAt(valueIndex) == ' ')
  {
    ++valueIndex;
  }

  if (payload.startsWith("null", valueIndex))
  {
    return false;
  }

  if (valueIndex >= payload.length() || payload.charAt(valueIndex) != '"')
  {
    return false;
  }

  const int startIndex = valueIndex + 1;
  const int endIndex = payload.indexOf('"', startIndex);
  if (endIndex < 0)
  {
    return false;
  }

  *value = payload.substring(startIndex, endIndex);
  return true;
}

String resolveBackendUrl(const String &relativePath)
{
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://"))
  {
    return relativePath;
  }

  if (relativePath.length() == 0)
  {
    return "";
  }

  String base = (g_backend_url.length() > 0) ? g_backend_url : String(kBackendBaseUrl);
  if (base.endsWith("/"))
  {
    base.remove(base.length() - 1);
  }
  return base + relativePath;
}

bool downloadTtsAudio(const String &ttsUrl)
{
  if (!ttsStorageAvailable)
  {
    Serial.println("TTS download skipped: LittleFS unavailable");
    return false;
  }

  const String resolvedUrl = resolveBackendUrl(ttsUrl);
  if (resolvedUrl.length() == 0)
  {
    Serial.println("TTS download skipped: missing URL");
    return false;
  }

  if (LittleFS.exists(kTtsFilePath))
  {
    LittleFS.remove(kTtsFilePath);
  }

  delay(50);
  HTTPClient http;
  WiFiClientSecure sslClient;
  http.setConnectTimeout(kHttpTimeoutMs);
  http.setTimeout(kHttpTimeoutMs);

  Serial.println("TTS DOWNLOAD START");
  Serial.print("tts url: ");
  Serial.println(resolvedUrl);
  audioState.isDownloading = true;

  if (!beginHttpWithOptionalSsl(http, sslClient, resolvedUrl))
  {
    Serial.println("TTS download begin failed");
    audioState.isDownloading = false;
    return false;
  }

  const int httpCode = http.GET();
  if (httpCode != HTTP_CODE_OK)
  {
    Serial.print("TTS download failed: ");
    Serial.println(http.errorToString(httpCode));
    http.end();
    audioState.isDownloading = false;
    return false;
  }

  const int contentLength = http.getSize();
  if (contentLength > 0)
  {
    const size_t freeSpace = LittleFS.totalBytes() - LittleFS.usedBytes();
    if ((size_t)contentLength > freeSpace)
    {
      Serial.println("TTS download failed: insufficient LittleFS space");
      http.end();
      audioState.isDownloading = false;
      return false;
    }
  }

  File file = LittleFS.open(kTtsFilePath, FILE_WRITE);
  if (!file)
  {
    Serial.println("TTS download failed: cannot open file");
    http.end();
    audioState.isDownloading = false;
    return false;
  }

  const int bytesWritten = http.writeToStream(&file);
  file.close();
  http.end();
  audioState.isDownloading = false;

  if (bytesWritten <= 0)
  {
    Serial.println("TTS download failed: no bytes written");
    return false;
  }

  Serial.println("TTS DOWNLOAD COMPLETE");
  Serial.print("tts bytes: ");
  Serial.println(bytesWritten);
  queueOrStartTtsPlayback();
  return true;
}

void queueOrStartTtsPlayback()
{
  if (audioState.isPlaying)
  {
    audioState.pendingSource = PLAYBACK_TTS_AUDIO;
    setVoiceTurnState(VOICE_SPEAKING);
    Serial.println("TTS queued behind current playback");
    return;
  }

  if (startTtsPlayback())
  {
    setVoiceTurnState(VOICE_SPEAKING);
  }
  else
  {
    setVoiceTurnState(VOICE_ERROR, "TTS playback start failed");
    resetVoiceTurnToIdle();
  }
}

uint16_t readLe16(const uint8_t *buffer)
{
  return (uint16_t)(buffer[0] | (buffer[1] << 8));
}

uint32_t readLe32(const uint8_t *buffer)
{
  return (uint32_t)buffer[0] |
         ((uint32_t)buffer[1] << 8) |
         ((uint32_t)buffer[2] << 16) |
         ((uint32_t)buffer[3] << 24);
}
