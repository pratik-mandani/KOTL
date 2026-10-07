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
#define BUTTON_BOOT_PIN 0

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

enum NetEventType
{
  NET_EVENT_NONE = 0,
  NET_EVENT_UPLOAD_AUDIO,
  NET_EVENT_CHECK_ADMIN,
  NET_EVENT_CHAT_TEXT
};

enum AudioCmdType
{
  AUDIO_CMD_NONE = 0,
  AUDIO_CMD_PLAY_TTS,
  AUDIO_CMD_PLAY_LOCAL,
  AUDIO_CMD_STOP
};

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
RoboEyes<Adafruit_SSD1306> roboEyes(display);

static const uint32_t kI2SSampleRate = kHelloSampleRate;
static const size_t kI2SChunkFrames = 256;
static const uint16_t kMicSpikeThreshold = 240;
static const uint16_t kMicReleaseThreshold = 150;
static const uint8_t kMicHighDebounceCount = 12;
static const uint32_t kMicMinSilenceMs = 120;
static const uint32_t kMicPrintIntervalMs = 30;
static const uint32_t kSoundReactionDurationMs = 700;
static const bool kPrintMicDebug = false;
static const bool kEnableFpsDiag = false;
static const uint16_t kStartupMicSignalThreshold = 40;
static const uint32_t kStartupMicTestTimeoutMs = 3000;
static const uint32_t kStartupBeepDurationMs = 400;
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
static const uint8_t kSpeakerVolumePercent = 55; // 55% volume eliminates MAX98357A clipping and cone distortion

static QueueHandle_t s_netQueue = NULL;
static QueueHandle_t s_audioQueue = NULL;
static SemaphoreHandle_t s_littleFsMutex = NULL;
static TaskHandle_t s_hNetworkTask = NULL;
static TaskHandle_t s_hAudioTask = NULL;

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
static uint32_t s_playbackCooldownUntilMs = 0;
static const uint32_t kPlaybackCooldownMs = 1500;

void initDisplay();
void initEyes();
void initAudioOutput();
void initMicrophoneInput();
void initBootButton();
void initNetworking();
void initFileStorage();
void runStartupSelfTest();
void drawStartupSelfTestScreen(const char *line1, const char *line2, uint8_t progressStep = 0);
void playStartupBeep();
void playStartupHello();
void serviceAudioOutput();
void serviceAudioCapture();
void serviceMicrophoneInput();
void serviceBootButton();
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
void performSynchronousAudioCapture();
void applySoftwareAudioGain();
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
int streamHttpToFileWithYield(HTTPClient &http, File &file);
bool parseAudioUploadResponse(const String &payload, bool *ttsReady, String *ttsUrl, String *transcript, String *assistantReply, String *turnStatus, String *sttError, String *assistantError, String *ttsError);
bool extractJsonBool(const String &payload, const char *key, bool *value);
bool extractJsonString(const String &payload, const char *key, String *value);
String resolveBackendUrl(const String &relativePath);
String urlDecode(const String &input);
bool downloadTtsAudio(const String &ttsUrl);
bool triggerLocalSamplePlayback();
void triggerMicCapture();
static volatile bool s_triggerMicCapturePending = false;
void performTextChatRequest();
void serviceSerialInput();
static String s_serialPromptText = "";
uint16_t readLe16(const uint8_t *buffer);
uint32_t readLe32(const uint8_t *buffer);
bool takeFsMutex(uint32_t timeoutMs = 2000)
{
  if (!s_littleFsMutex)
  {
    return true;
  }
  return (xSemaphoreTakeRecursive(s_littleFsMutex, pdMS_TO_TICKS(timeoutMs)) == pdTRUE);
}

void giveFsMutex()
{
  if (s_littleFsMutex)
  {
    xSemaphoreGiveRecursive(s_littleFsMutex);
  }
}

void networkWorkerTask(void *param)
{
  Serial.println("[FreeRTOS] Network Worker Task started on Core 0");
  uint32_t lastHeartbeatCheckMs = 0;

  for (;;)
  {
    serviceNetworking();

    NetEventType event = NET_EVENT_NONE;
    if (s_netQueue && xQueueReceive(s_netQueue, &event, pdMS_TO_TICKS(500)) == pdTRUE)
    {
      if (event == NET_EVENT_UPLOAD_AUDIO)
      {
        Serial.println("[NetWorker] Audio upload requested -> Starting upload to backend...");
        performAudioUpload();
      }
      else if (event == NET_EVENT_CHECK_ADMIN)
      {
        Serial.println("[NetWorker] Admin check requested -> Polling backend...");
        checkRemoteAdminUpdates();
      }
      else if (event == NET_EVENT_CHAT_TEXT)
      {
        Serial.println("[NetWorker] Serial text query requested -> Starting request to backend...");
        performTextChatRequest();
      }

      const UBaseType_t stackWords = uxTaskGetStackHighWaterMark(NULL);
      Serial.printf("[FreeRTOS-Stack] NetWorker min stack remaining: %u bytes\n", (unsigned int)(stackWords * sizeof(StackType_t)));
    }

    const uint32_t nowMs = millis();
    if (nowMs - lastHeartbeatCheckMs >= 5000)
    {
      lastHeartbeatCheckMs = nowMs;
      if (canStartVoiceTurn())
      {
        checkRemoteAdminUpdates();
      }
    }

    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

void audioPlaybackTask(void *param)
{
  Serial.println("[FreeRTOS] Audio Playback Task started on Core 1");

  for (;;)
  {
    AudioCmdType cmd = AUDIO_CMD_NONE;
    const TickType_t waitTicks = (audioState.isPlaying || audioState.pendingBytes > 0) ? pdMS_TO_TICKS(2) : pdMS_TO_TICKS(20);
    if (s_audioQueue && xQueueReceive(s_audioQueue, &cmd, waitTicks) == pdTRUE)
    {
      if (cmd == AUDIO_CMD_PLAY_TTS)
      {
        if (!startTtsPlayback())
        {
          failVoiceTurn("TTS playback failed to start");
        }
      }
      else if (cmd == AUDIO_CMD_PLAY_LOCAL)
      {
        startLocalSamplePlayback();
      }
      else if (cmd == AUDIO_CMD_STOP)
      {
        finishPlayback();
      }
    }

    if (audioState.isPlaying || audioState.pendingBytes > 0)
    {
      serviceAudioOutput();
    }

    vTaskDelay(pdMS_TO_TICKS(1));
  }
}

void initFreeRtosTasks()
{
  s_littleFsMutex = xSemaphoreCreateRecursiveMutex();
  s_netQueue = xQueueCreate(4, sizeof(NetEventType));
  s_audioQueue = xQueueCreate(4, sizeof(AudioCmdType));

  xTaskCreatePinnedToCore(
    networkWorkerTask,
    "NetWorker",
    12288,
    NULL,
    2,
    &s_hNetworkTask,
    0
  );

  xTaskCreatePinnedToCore(
    audioPlaybackTask,
    "AudioPump",
    4096,
    NULL,
    4,
    &s_hAudioTask,
    1
  );

  Serial.println("[FreeRTOS] Dual-Core tasks successfully initialized!");
}

void setup()
{
  Serial.begin(115200);
  Serial.setTimeout(50);
  initPersistentConfig();

  Serial.print("Configured Wi-Fi SSID: ");
  Serial.println(g_wifi_ssid.length() > 0 ? g_wifi_ssid : String(kWiFiSsid));
  Serial.print("Configured Backend Base URL: ");
  Serial.println(g_backend_url.length() > 0 ? g_backend_url : String(kBackendBaseUrl));

  initDisplay();
  initEyes();
  initAudioOutput();
  initMicrophoneInput();
  initBootButton();
  initFileStorage();
  initNetworking();
  runStartupSelfTest();
  initFreeRtosTasks();

  s_playbackCooldownUntilMs = millis() + 4000;
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
    delay(20);
    return;
  }

  // Butter-smooth 50 FPS OLED animations on Core 1 - immune to network delays!
  roboEyes.update();

  if (s_triggerMicCapturePending)
  {
    s_triggerMicCapturePending = false;
    if (canStartVoiceTurn())
    {
      Serial.println("[Hardware Test] Triggering 4s physical mic test capture from loop()");
      beginAudioCapture();
    }
    else
    {
      Serial.println("[Hardware Test] Mic recording skipped: device busy");
    }
  }

  serviceBootButton();
  serviceSerialInput();
  serviceMicrophoneInput();
  serviceEyeReaction();
  handleVoiceTurnTimeouts();

  static bool s_printedInitialListening = false;
  if (!s_printedInitialListening && WiFi.status() == WL_CONNECTED && (int32_t)(millis() - s_playbackCooldownUntilMs) >= 0)
  {
    s_printedInitialListening = true;
    Serial.println("Listening for sound/voice (mic active)...");
  }

  if (kEnableFpsDiag)
  {
    static uint32_t s_diagFrameCount = 0;
    static uint32_t s_diagLastReportMs = 0;
    ++s_diagFrameCount;
    const uint32_t nowMs = millis();
    if (nowMs - s_diagLastReportMs >= 5000)
    {
      const float fps = (float)s_diagFrameCount * 1000.0f / (float)(nowMs - s_diagLastReportMs);
      Serial.print("[DIAG-FPS] roboEyes loop rate: ");
      Serial.print(fps, 1);
      Serial.print(" Hz | State: ");
      Serial.print(voiceTurn.state);
      Serial.print(" | Free heap: ");
      Serial.println(ESP.getFreeHeap());
      s_diagFrameCount = 0;
      s_diagLastReportMs = nowMs;
    }
  }

  taskYIELD();
}

void initDisplay()
{
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  Wire.setClock(400000);

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
  if (WiFi.status() != WL_CONNECTED)
  {
    return false;
  }
  return voiceTurn.state == VOICE_IDLE &&
         !captureState.isRecording &&
         !captureState.isUploading &&
         !captureState.uploadPending &&
         !audioState.isDownloading &&
         !audioState.isPlaying &&
         ((int32_t)(millis() - s_playbackCooldownUntilMs) >= 0);
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

  Serial.println("speaker test started: beep");
  drawStartupSelfTestScreen("KOTL", "Speaker Beep", 1);
  playStartupBeep();
  delay(150);

  Serial.println("speaker test: voice sample");
  drawStartupSelfTestScreen("KOTL", "Speaker Voice", 2);
  playStartupHello();

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
    Serial.println("===============================================================");
    Serial.println("MIC BYPASS: No microphone detected on GPIO 34.");
    Serial.println("KOTL is running in SERIAL MONITOR MODE!");
    Serial.println(">>> TYPE YOUR QUESTION IN SERIAL MONITOR AND PRESS ENTER <<<");
    Serial.println("===============================================================");
    drawStartupSelfTestScreen("SERIAL MODE", "Type in Serial", 2);
    delay(800);
    roboEyes.open();
    startupSelfTestPassed = true; // Allow loop and Serial input to run
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
      const int16_t sample = highPhase ? 14000 : -14000;
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
    taskYIELD();
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

void playStartupHello()
{
  Serial.print("speaker test (voice) I2S initialized: ");
  Serial.println(audioOutputInitialized ? "YES" : "NO");
  if (!audioOutputInitialized)
  {
    Serial.println("speaker test skipped: audio output not initialized");
    return;
  }

  if (!configureAudioSampleRate(kHelloSampleRate))
  {
    Serial.println("speaker test failed: sample rate config");
    return;
  }

  Serial.println("speaker test: playing 'Hello' voice sample via I2S...");
  size_t sampleIdx = 0;
  while (sampleIdx < kHelloSampleCount)
  {
    const size_t framesThisChunk = min((size_t)kI2SChunkFrames, (size_t)(kHelloSampleCount - sampleIdx));
    for (size_t frameIndex = 0; frameIndex < framesThisChunk; ++frameIndex)
    {
      int32_t amplified = (int32_t)kHelloSample[sampleIdx + frameIndex] * 4;
      if (amplified > 32000) amplified = 32000;
      if (amplified < -32000) amplified = -32000;
      const int16_t sample = applySpeakerVolume((int16_t)amplified);
      audioState.dmaBuffer[frameIndex * 2] = sample;
      audioState.dmaBuffer[(frameIndex * 2) + 1] = sample;
    }

    size_t bytesWritten = 0;
    const size_t bytesToWrite = framesThisChunk * 2U * sizeof(int16_t);
    i2s_write(I2S_PORT, audioState.dmaBuffer, bytesToWrite, &bytesWritten, portMAX_DELAY);
    sampleIdx += framesThisChunk;
    taskYIELD();
  }
  i2s_zero_dma_buffer(I2S_PORT);
  Serial.println("speaker test: 'Hello' playback complete");
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

static inline int16_t applySpeakerVolume(int16_t sample)
{
  return (int16_t)(((int32_t)sample * kSpeakerVolumePercent) / 100);
}

void fillAudioChunk()
{
  if (!audioState.isPlaying && audioState.pendingSource != PLAYBACK_NONE)
  {
    startPlayback(audioState.pendingSource);
    audioState.pendingSource = PLAYBACK_NONE;
  }

  if (audioState.isPlaying && audioState.activeSource == PLAYBACK_TTS_AUDIO)
  {
    if (!audioState.ttsFile || audioState.ttsBytesRemaining < 2)
    {
      finishPlayback();
      audioState.pendingOffsetBytes = 0;
      audioState.pendingBytes = 0;
      return;
    }

    int16_t monoBlock[kI2SChunkFrames];
    size_t toReadBytes = min((size_t)(kI2SChunkFrames * sizeof(int16_t)), (size_t)audioState.ttsBytesRemaining);
    toReadBytes = (toReadBytes / sizeof(int16_t)) * sizeof(int16_t);

    size_t readBytes = 0;
    if (toReadBytes > 0)
    {
      if (takeFsMutex(100))
      {
        readBytes = audioState.ttsFile.read(reinterpret_cast<uint8_t *>(monoBlock), toReadBytes);
        giveFsMutex();
      }
    }
    const size_t framesRead = readBytes / sizeof(int16_t);
    audioState.ttsBytesRemaining = (audioState.ttsBytesRemaining > readBytes) ? (audioState.ttsBytesRemaining - readBytes) : 0;

    if (framesRead == 0)
    {
      finishPlayback();
      audioState.pendingOffsetBytes = 0;
      audioState.pendingBytes = 0;
      return;
    }

    for (size_t frameIndex = 0; frameIndex < framesRead; ++frameIndex)
    {
      const int16_t sample = applySpeakerVolume(monoBlock[frameIndex]);
      audioState.dmaBuffer[frameIndex * 2] = sample;
      audioState.dmaBuffer[(frameIndex * 2) + 1] = sample;
    }

    for (size_t frameIndex = framesRead; frameIndex < kI2SChunkFrames; ++frameIndex)
    {
      audioState.dmaBuffer[frameIndex * 2] = 0;
      audioState.dmaBuffer[(frameIndex * 2) + 1] = 0;
    }

    audioState.pendingOffsetBytes = 0;
    audioState.pendingBytes = sizeof(audioState.dmaBuffer);
    return;
  }

  for (size_t frameIndex = 0; frameIndex < kI2SChunkFrames; ++frameIndex)
  {
    const int16_t monoSample = applySpeakerVolume(nextMonoSample());
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

  int32_t amplified = (int32_t)kHelloSample[audioState.localSampleIndex++] * 4;
  if (amplified > 32000) amplified = 32000;
  if (amplified < -32000) amplified = -32000;
  return (int16_t)amplified;
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

bool triggerLocalSamplePlayback()
{
  AudioCmdType cmd = AUDIO_CMD_PLAY_LOCAL;
  if (s_audioQueue)
  {
    return (xQueueSend(s_audioQueue, &cmd, 0) == pdTRUE);
  }
  return startLocalSamplePlayback();
}

void triggerMicCapture()
{
  s_triggerMicCapturePending = true;
}

bool startTtsPlayback()
{
  if (!ttsStorageAvailable)
  {
    Serial.println("TTS playback skipped: LittleFS unavailable");
    return false;
  }

  if (!takeFsMutex(2000))
  {
    Serial.println("TTS playback skipped: LittleFS mutex timeout");
    return false;
  }

  File file = LittleFS.open(kTtsFilePath, FILE_READ);
  if (!file)
  {
    giveFsMutex();
    Serial.println("TTS playback skipped: file missing");
    return false;
  }

  // Read 12-byte RIFF header
  uint8_t riffHeader[12];
  if (file.read(riffHeader, sizeof(riffHeader)) != sizeof(riffHeader) ||
      memcmp(&riffHeader[0], "RIFF", 4) != 0 ||
      memcmp(&riffHeader[8], "WAVE", 4) != 0)
  {
    Serial.println("Unsupported WAV: missing RIFF/WAVE header");
    file.close();
    giveFsMutex();
    return false;
  }

  uint16_t audioFormat = 0;
  uint16_t channelCount = 0;
  uint32_t sampleRate = 0;
  uint16_t bitsPerSample = 0;
  uint32_t dataBytes = 0;
  size_t dataOffset = 0;
  bool foundFmt = false;
  bool foundData = false;

  // Scan WAV subchunks dynamically (handles standard 16-byte fmt, 18-byte fmt with cbSize, metadata chunks, etc.)
  while (file.available() >= 8 && (!foundFmt || !foundData))
  {
    uint8_t chunkHeader[8];
    if (file.read(chunkHeader, 8) != 8)
    {
      break;
    }

    const uint32_t chunkSize = readLe32(&chunkHeader[4]);

    if (memcmp(&chunkHeader[0], "fmt ", 4) == 0 && chunkSize >= 16)
    {
      uint8_t fmtBuf[16];
      if (file.read(fmtBuf, 16) != 16)
      {
        break;
      }
      audioFormat = readLe16(&fmtBuf[0]);
      channelCount = readLe16(&fmtBuf[2]);
      sampleRate = readLe32(&fmtBuf[4]);
      bitsPerSample = readLe16(&fmtBuf[14]);
      foundFmt = true;

      // Skip remaining bytes in fmt chunk if chunkSize > 16
      if (chunkSize > 16)
      {
        file.seek(file.position() + (chunkSize - 16));
      }
    }
    else if (memcmp(&chunkHeader[0], "data", 4) == 0)
    {
      dataBytes = chunkSize;
      dataOffset = file.position();
      foundData = true;
      break;
    }
    else
    {
      // Unknown or metadata chunk (e.g. LIST, INFO, fact) - skip it
      file.seek(file.position() + chunkSize);
    }
  }

  if (!foundFmt || !foundData || dataBytes == 0)
  {
    Serial.printf("Unsupported WAV: parse failed (fmt=%d, data=%d, bytes=%u)\n", foundFmt, foundData, (unsigned int)dataBytes);
    file.close();
    giveFsMutex();
    return false;
  }

  if (audioFormat != 1 || channelCount != 1 || bitsPerSample != 16)
  {
    Serial.printf("Unsupported WAV: format=%u (must be 1/PCM), channels=%u (must be 1), bits=%u (must be 16)\n",
                  audioFormat, channelCount, bitsPerSample);
    file.close();
    giveFsMutex();
    return false;
  }

  file.seek(dataOffset);

  const uint32_t targetSampleRate = (sampleRate > 0) ? sampleRate : kExpectedTtsSampleRate;
  if (!configureAudioSampleRate(targetSampleRate))
  {
    Serial.printf("Unsupported WAV: failed to configure I2S sample rate to %u\n", (unsigned int)targetSampleRate);
    file.close();
    giveFsMutex();
    return false;
  }

  audioState.ttsFile = file;
  audioState.ttsBytesRemaining = dataBytes;
  audioState.activeSource = PLAYBACK_TTS_AUDIO;
  audioState.isPlaying = true;
  giveFsMutex();

  setVoiceTurnState(VOICE_SPEAKING);
  Serial.printf("PLAYBACK START: %u Hz, %u bytes\n", (unsigned int)targetSampleRate, (unsigned int)dataBytes);
  return true;
}

void finishPlayback()
{
  const PlaybackSource finishedSource = audioState.activeSource;
  takeFsMutex(500);
  if (audioState.ttsFile)
  {
    audioState.ttsFile.close();
  }
  giveFsMutex();

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

  s_playbackCooldownUntilMs = millis() + kPlaybackCooldownMs;

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

void applySoftwareAudioGain()
{
  // 1. Remove DC offset so waveform is perfectly centered at zero
  int64_t sampleSum = 0;
  for (size_t i = 0; i < kAudioCaptureSampleCount; ++i)
  {
    sampleSum += audioCaptureBuffer[i];
  }
  const int16_t dcBias = (int16_t)(sampleSum / (int64_t)kAudioCaptureSampleCount);
  for (size_t i = 0; i < kAudioCaptureSampleCount; ++i)
  {
    audioCaptureBuffer[i] -= dcBias;
  }

  // 2. High-pass filter at ~250 Hz (cuts low-frequency fan wind and rumble noise)
  const float alpha = 0.82f;
  float prevX = 0.0f;
  float prevY = 0.0f;
  int16_t maxAbs = 0;
  for (size_t i = 0; i < kAudioCaptureSampleCount; ++i)
  {
    const float x = (float)audioCaptureBuffer[i];
    const float y = alpha * (prevY + x - prevX);
    prevX = x;
    prevY = y;
    int32_t val = (int32_t)y;
    if (val > 32767) val = 32767;
    else if (val < -32768) val = -32768;
    audioCaptureBuffer[i] = (int16_t)val;

    const int16_t absVal = abs((int)val);
    if (absVal > maxAbs)
    {
      maxAbs = absVal;
    }
  }

  // 3. Gentle gain: only scale if actual voice is present and quiet, never boost fan noise!
  if (maxAbs > 400 && maxAbs < 12000)
  {
    float gain = 16000.0f / (float)maxAbs;
    if (gain > 2.2f)
    {
      gain = 2.2f; // Cap at 2.2x so room fan noise isn't blown up
    }

    Serial.printf("[Audio-AGC] Filtered peak was %d, applying %.2fx gentle gain\n", maxAbs, gain);

    uint64_t newAbsSum = 0;
    int16_t newMin = 32767;
    int16_t newMax = -32768;

    for (size_t i = 0; i < kAudioCaptureSampleCount; ++i)
    {
      int32_t amplified = (int32_t)((float)audioCaptureBuffer[i] * gain);
      if (amplified > 32767) amplified = 32767;
      else if (amplified < -32768) amplified = -32768;

      audioCaptureBuffer[i] = (int16_t)amplified;

      if (audioCaptureBuffer[i] < newMin) newMin = audioCaptureBuffer[i];
      if (audioCaptureBuffer[i] > newMax) newMax = audioCaptureBuffer[i];
      newAbsSum += (uint64_t)abs((int)audioCaptureBuffer[i]);
    }

    captureState.pcmMin = newMin;
    captureState.pcmMax = newMax;
    captureState.absSum = newAbsSum;
  }
}

void performSynchronousAudioCapture()
{
  Serial.println("TURN START");
  Serial.println("RECORDING START");
  Serial.print("recording sample rate: ");
  Serial.println(kAudioCaptureSampleRate);
  Serial.print("recording duration ms: ");
  Serial.println(kAudioCaptureDurationMs);
  Serial.print("baseline: ");
  Serial.println(captureState.adcBaseline);

  captureState.rawMin = 4095;
  captureState.rawMax = 0;
  captureState.pcmMin = 32767;
  captureState.pcmMax = -32768;
  captureState.absSum = 0;
  captureState.clippedSampleCount = 0;

  const uint32_t startUs = micros();
  uint32_t nextSampleDueUs = startUs;

  for (size_t sampleIndex = 0; sampleIndex < kAudioCaptureSampleCount; ++sampleIndex)
  {
    while ((int32_t)(micros() - nextSampleDueUs) < 0)
    {
      // microsecond precision spinwait for exactly 125us tick
    }

    const uint16_t rawValue = (uint16_t)adc1_get_raw(MIC_ADC_CHANNEL);
    const int16_t pcmSample = adcToPcm16(rawValue, captureState.adcBaseline);
    audioCaptureBuffer[sampleIndex] = pcmSample;

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

    nextSampleDueUs += kAudioCaptureSampleIntervalUs;

    if ((sampleIndex & 0xFF) == 0)
    {
      taskYIELD();
    }
  }

  const uint32_t elapsedMs = (micros() - startUs) / 1000UL;
  captureState.isRecording = false;

  // Apply Software Auto-Gain / Normalization to ensure loud, clear voice for Whisper STT
  applySoftwareAudioGain();

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

  // Queue upload to Network Worker on Core 0
  captureState.uploadPending = false;
  captureState.isUploading = true;
  setVoiceTurnState(VOICE_UPLOADING);
  NetEventType event = NET_EVENT_UPLOAD_AUDIO;
  if (s_netQueue)
  {
    xQueueSend(s_netQueue, &event, 0);
  }
  else
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

  // Draw attentive eyes once before entering precision microsecond sampling
  roboEyes.setMood(DEFAULT);
  roboEyes.open();
  roboEyes.update();

  captureState.adcBaseline = calibrateCaptureBaseline();
  captureState.isRecording = true;
  captureState.uploadPending = false;
  voiceTurn.lastTranscript = "";
  voiceTurn.lastAssistantReply = "";
  voiceTurn.lastError = "";
  setVoiceTurnState(VOICE_RECORDING);

  performSynchronousAudioCapture();
}

void serviceAudioCapture()
{
  // Audio capture is handled synchronously with microsecond precision in performSynchronousAudioCapture()
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

void initBootButton()
{
  pinMode(BUTTON_BOOT_PIN, INPUT_PULLUP);
}

void serviceBootButton()
{
  static bool s_lastBootPressed = false;
  const bool isPressed = (digitalRead(BUTTON_BOOT_PIN) == LOW);

  if (isPressed && !s_lastBootPressed)
  {
    Serial.println("BOOT button pressed!");
    if (canStartVoiceTurn())
    {
      Serial.println("Starting voice capture via BOOT button");
      micState.soundActive = true;
      beginAudioCapture();
      triggerSoundReaction(millis());
    }
    else
    {
      Serial.println("BOOT button ignored: voice turn busy or in cooldown");
    }
  }

  s_lastBootPressed = isPressed;
}

void serviceMicrophoneInput()
{
  const uint32_t nowMs = millis();
  const bool wasSoundHigh = micState.soundHigh;
  const uint16_t rawValue = (uint16_t)adc1_get_raw(MIC_ADC_CHANNEL);

  micState.rawValue = rawValue;

  if ((int32_t)(nowMs - s_playbackCooldownUntilMs) < 0)
  {
    // During post-playback cooldown, dynamically adapt baseline and suppress triggers
    micState.baseline = (uint16_t)(((uint32_t)micState.baseline * 15U + rawValue) / 16U);
    micState.amplitude = 0;
    micState.soundHigh = false;
    micState.soundActive = false;
    micState.consecutiveHighReadings = 0;
    micState.silenceStartMs = 0;
    return;
  }

  // Slow moving average (256x filter) so it only tracks DC bias drift, not voice audio waveforms
  micState.baseline = (uint16_t)(((uint32_t)micState.baseline * 255U + rawValue) / 256U);
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
    s_playbackCooldownUntilMs = millis() + 1500; // 1.5s cooldown ignores RF transient spike on connect
    Serial.println("Listening for sound/voice...");
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

int streamHttpToFileWithYield(HTTPClient &http, File &file)
{
  WiFiClient *stream = http.getStreamPtr();
  if (!stream)
  {
    Serial.println("[Stream] Failed to get HTTP stream pointer");
    return -1;
  }

  uint8_t buff[512];
  int totalBytesWritten = 0;
  int remainingBytes = http.getSize();
  uint32_t lastDataMs = millis();
  const uint32_t streamTimeoutMs = 15000;

  Serial.printf("[Stream] Streaming HTTP audio to file (content length: %d)...\n", remainingBytes);

  while (http.connected() && (remainingBytes > 0 || remainingBytes == -1))
  {
    const size_t availableBytes = stream->available();
    if (availableBytes > 0)
    {
      const size_t toRead = min(availableBytes, sizeof(buff));
      const int bytesRead = stream->readBytes(buff, toRead);
      if (bytesRead > 0)
      {
        file.write(buff, bytesRead);
        totalBytesWritten += bytesRead;
        if (remainingBytes > 0)
        {
          remainingBytes -= bytesRead;
        }
        lastDataMs = millis();
      }
      // CRITICAL: Yield every chunk so IDLE0 gets CPU time and watchdog never trips
      vTaskDelay(pdMS_TO_TICKS(1));
    }
    else
    {
      if (remainingBytes == 0)
      {
        break;
      }
      if (millis() - lastDataMs > streamTimeoutMs)
      {
        Serial.println("[Stream] Timeout waiting for stream data");
        break;
      }
      vTaskDelay(pdMS_TO_TICKS(5));
    }
  }

  Serial.printf("[Stream] Stream completed, total bytes written: %d\n", totalBytesWritten);
  return totalBytesWritten;
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
  http.addHeader("X-Stream-Audio", "true");

  const char *headerKeys[] = {"Content-Type", "X-Transcript", "X-Assistant-Reply", "X-TTS-Ready", "X-Turn-Status"};
  http.collectHeaders(headerKeys, 5);

  uint8_t *payload = reinterpret_cast<uint8_t *>(audioCaptureBuffer);
  const int httpCode = http.POST(payload, sizeof(audioCaptureBuffer));
  if (httpCode == HTTP_CODE_OK || httpCode == 200)
  {
    setVoiceTurnState(VOICE_THINKING);
    String contentType = http.header("Content-Type");
    String transcript = urlDecode(http.header("X-Transcript"));
    String assistantReply = urlDecode(http.header("X-Assistant-Reply"));

    voiceTurn.lastTranscript = transcript;
    voiceTurn.lastAssistantReply = assistantReply;

    Serial.println("UPLOAD COMPLETE");
    Serial.print("upload status: ");
    Serial.println(httpCode);
    Serial.print("Content-Type: ");
    Serial.println(contentType);
    if (transcript.length() > 0)
    {
      Serial.print("TRANSCRIPT: ");
      Serial.println(transcript);
    }
    if (assistantReply.length() > 0)
    {
      Serial.print("ASSISTANT REPLY: ");
      Serial.println(assistantReply);
    }

    if (contentType.indexOf("audio/wav") != -1 || contentType.indexOf("octet-stream") != -1)
    {
      if (ttsStorageAvailable)
      {
        setVoiceTurnState(VOICE_DOWNLOADING_TTS);
        if (!takeFsMutex(2000))
        {
          http.end();
          failVoiceTurn("LittleFS mutex timeout");
          return;
        }

        if (audioState.ttsFile)
        {
          audioState.ttsFile.close();
        }
        if (LittleFS.exists(kTtsFilePath))
        {
          LittleFS.remove(kTtsFilePath);
        }

        File file = LittleFS.open(kTtsFilePath, FILE_WRITE);
        if (file)
        {
          const int bytesWritten = streamHttpToFileWithYield(http, file);
          file.close();
          giveFsMutex();
          http.end();
          Serial.print("DIRECT TTS STREAM WRITTEN: ");
          Serial.println(bytesWritten);

          if (bytesWritten > 100)
          {
            queueOrStartTtsPlayback();
          }
          else
          {
            failVoiceTurn("TTS stream too short");
          }
        }
        else
        {
          giveFsMutex();
          http.end();
          failVoiceTurn("LittleFS open failed");
        }
      }
      else
      {
        http.end();
        failVoiceTurn("TTS skipped: LittleFS unavailable");
      }
    }
    else
    {
      String responsePayload = http.getString();
      http.end();
      bool ttsReady = false;
      String ttsUrl;
      String turnStatus;
      String sttError;
      String assistantError;
      String ttsError;
      parseAudioUploadResponse(responsePayload, &ttsReady, &ttsUrl, &transcript, &assistantReply, &turnStatus, &sttError, &assistantError, &ttsError);

      if (ttsReady && ttsStorageAvailable)
      {
        setVoiceTurnState(VOICE_DOWNLOADING_TTS);
        if (!downloadTtsAudio(ttsUrl))
        {
          failVoiceTurn("TTS download failed");
        }
      }
      else
      {
        resetVoiceTurnToIdle();
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

void serviceSerialInput()
{
  if (Serial.available())
  {
    delay(25); // allow all characters in current message to arrive
    String input = Serial.readString();
    input.trim();
    if (input.length() > 0)
    {
      Serial.println();
      Serial.println("=================================================");
      Serial.printf("[SERIAL INPUT] Received Question: \"%s\"\n", input.c_str());
      Serial.println("=================================================");

      if (WiFi.status() != WL_CONNECTED)
      {
        Serial.println("[SERIAL] WiFi not connected! Please wait for WiFi.");
        return;
      }

      if (captureState.isRecording || captureState.isUploading || audioState.isPlaying || audioState.isDownloading)
      {
        Serial.println("[SERIAL] Device busy. Please wait for current turn to complete.");
        return;
      }

      s_serialPromptText = input;
      setVoiceTurnState(VOICE_THINKING);
      roboEyes.setMood(TIRED);
      roboEyes.update();

      NetEventType event = NET_EVENT_CHAT_TEXT;
      if (s_netQueue)
      {
        xQueueSend(s_netQueue, &event, 0);
      }
      else
      {
        performTextChatRequest();
      }
    }
  }
}

void performTextChatRequest()
{
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("[SERIAL CHAT] Request skipped: WiFi not connected");
    failVoiceTurn("WiFi not connected");
    return;
  }

  if (s_serialPromptText.length() == 0)
  {
    Serial.println("[SERIAL CHAT] Request skipped: empty prompt");
    resetVoiceTurnToIdle();
    return;
  }

  HTTPClient http;
  WiFiClientSecure sslClient;
  const String chatUrl = resolveBackendUrl("/api/chat-speak");
  http.setConnectTimeout(kHttpTimeoutMs);
  http.setTimeout(kHttpTimeoutMs);

  setVoiceTurnState(VOICE_THINKING);
  Serial.println("[SERIAL CHAT] Request started");
  Serial.print("URL: ");
  Serial.println(chatUrl);
  Serial.print("Prompt: ");
  Serial.println(s_serialPromptText);

  if (!beginHttpWithOptionalSsl(http, sslClient, chatUrl))
  {
    failVoiceTurn("HTTP begin failed");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  const char *headerKeys[] = {"Content-Type", "X-Transcript", "X-Assistant-Reply", "X-TTS-Ready"};
  http.collectHeaders(headerKeys, 4);

  String escapedPrompt = s_serialPromptText;
  escapedPrompt.replace("\"", "\\\"");
  String payload = "{\"text\":\"" + escapedPrompt + "\"}";

  const int httpCode = http.POST(payload);
  if (httpCode == HTTP_CODE_OK || httpCode == 200)
  {
    String contentType = http.header("Content-Type");
    String assistantReply = urlDecode(http.header("X-Assistant-Reply"));
    voiceTurn.lastTranscript = s_serialPromptText;
    voiceTurn.lastAssistantReply = assistantReply;

    Serial.println("[SERIAL CHAT] HTTP 200 OK");
    Serial.print("ASSISTANT REPLY: ");
    Serial.println(assistantReply);

    if (contentType.indexOf("audio/wav") != -1 || contentType.indexOf("octet-stream") != -1)
    {
      if (ttsStorageAvailable)
      {
        setVoiceTurnState(VOICE_DOWNLOADING_TTS);
        if (!takeFsMutex(2000))
        {
          http.end();
          failVoiceTurn("LittleFS mutex timeout");
          return;
        }

        if (audioState.ttsFile)
        {
          audioState.ttsFile.close();
        }
        if (LittleFS.exists(kTtsFilePath))
        {
          LittleFS.remove(kTtsFilePath);
        }

        File file = LittleFS.open(kTtsFilePath, FILE_WRITE);
        if (file)
        {
          const int bytesWritten = streamHttpToFileWithYield(http, file);
          file.close();
          giveFsMutex();
          http.end();
          Serial.printf("[SERIAL CHAT] TTS WAV written: %d bytes. Playing on speaker...\n", bytesWritten);

          if (bytesWritten > 100)
          {
            queueOrStartTtsPlayback();
          }
          else
          {
            failVoiceTurn("TTS stream too short");
          }
        }
        else
        {
          giveFsMutex();
          http.end();
          failVoiceTurn("LittleFS open failed");
        }
      }
      else
      {
        http.end();
        failVoiceTurn("LittleFS unavailable");
      }
    }
    else
    {
      http.end();
      resetVoiceTurnToIdle();
    }
  }
  else
  {
    Serial.printf("[SERIAL CHAT] Request failed: %s (%d)\n", http.errorToString(httpCode).c_str(), httpCode);
    http.end();
    failVoiceTurn("HTTP request failed");
  }
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

String urlDecode(const String &input)
{
  String decoded = "";
  char temp[] = "0x00";
  const int len = input.length();
  for (int i = 0; i < len; ++i)
  {
    const char c = input.charAt(i);
    if (c == '+')
    {
      decoded += ' ';
    }
    else if (c == '%' && i + 2 < len)
    {
      temp[2] = input.charAt(i + 1);
      temp[3] = input.charAt(i + 2);
      decoded += (char)strtol(temp, NULL, 16);
      i += 2;
    }
    else
    {
      decoded += c;
    }
  }
  return decoded;
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

  HTTPClient http;
  WiFiClientSecure sslClient;
  http.setConnectTimeout(kHttpTimeoutMs);
  http.setTimeout(kHttpTimeoutMs);

  Serial.println("TTS DOWNLOAD START");
  Serial.print("tts url: ");
  Serial.println(resolvedUrl);
  Serial.print("free heap: ");
  Serial.println(ESP.getFreeHeap());
  audioState.isDownloading = true;

  if (!beginHttpWithOptionalSsl(http, sslClient, resolvedUrl))
  {
    Serial.println("TTS download begin failed");
    audioState.isDownloading = false;
    return false;
  }

  int httpCode = http.GET();
  if (httpCode != HTTP_CODE_OK)
  {
    Serial.printf("TTS download attempt 1 failed: %d (%s), retrying in 300ms...\n", httpCode, http.errorToString(httpCode).c_str());
    http.end();
    delay(300);
    if (beginHttpWithOptionalSsl(http, sslClient, resolvedUrl))
    {
      httpCode = http.GET();
    }
  }

  if (httpCode != HTTP_CODE_OK)
  {
    Serial.print("TTS download failed: ");
    Serial.println(http.errorToString(httpCode));
    http.end();
    audioState.isDownloading = false;
    return false;
  }

  if (!takeFsMutex(2000))
  {
    Serial.println("TTS download failed: LittleFS mutex timeout");
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
      giveFsMutex();
      Serial.println("TTS download failed: insufficient LittleFS space");
      http.end();
      audioState.isDownloading = false;
      return false;
    }
  }

  if (audioState.ttsFile)
  {
    audioState.ttsFile.close();
  }
  if (LittleFS.exists(kTtsFilePath))
  {
    LittleFS.remove(kTtsFilePath);
  }

  File file = LittleFS.open(kTtsFilePath, FILE_WRITE);
  if (!file)
  {
    giveFsMutex();
    Serial.println("TTS download failed: cannot open file");
    http.end();
    audioState.isDownloading = false;
    return false;
  }

  const int bytesWritten = streamHttpToFileWithYield(http, file);
  file.close();
  giveFsMutex();
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
  setVoiceTurnState(VOICE_SPEAKING);
  if (audioState.isPlaying)
  {
    audioState.pendingSource = PLAYBACK_TTS_AUDIO;
    Serial.println("TTS queued behind current playback");
    return;
  }

  AudioCmdType cmd = AUDIO_CMD_PLAY_TTS;
  if (s_audioQueue)
  {
    Serial.println("[NetWorker] Dispatching AUDIO_CMD_PLAY_TTS to Audio Task on Core 1");
    if (xQueueSend(s_audioQueue, &cmd, pdMS_TO_TICKS(200)) != pdTRUE)
    {
      Serial.println("[NetWorker] Audio queue full, starting direct TTS");
      startTtsPlayback();
    }
  }
  else
  {
    if (!startTtsPlayback())
    {
      setVoiceTurnState(VOICE_ERROR, "TTS playback start failed");
      resetVoiceTurnToIdle();
    }
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
