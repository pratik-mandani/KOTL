#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <time.h>
#include <LittleFS.h>
#include <FluxGarage_RoboEyes.h>
#include <driver/adc.h>
#include <driver/i2s.h>
#include <esp_err.h>
#define WEBSOCKETS_TCP_TIMEOUT 15000
#include <WebSocketsClient.h>
#include <freertos/stream_buffer.h>
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

// INMP441 Digital I2S MEMS Microphone on I2S_NUM_1
#define I2S_MIC_PORT I2S_NUM_1
#define I2S_MIC_SCK_PIN 32
#define I2S_MIC_WS_PIN 33
#define I2S_MIC_SD_PIN 35
#define BUTTON_BOOT_PIN 0

// Capacitive Touch Sensor Pins (Built-in ESP32 Touch ADC)
#define TOUCH_PIN_HEAD 4    // T0 (GPIO 4) - Head touch pad for Date/Time & interaction
#define TOUCH_PIN_EAR 13    // T4 (GPIO 13) - Ear / Cheek touch pad
#define TOUCH_THRESHOLD 40  // Baseline untouched ~70-90; touch drops below 40

enum PlaybackSource
{
  PLAYBACK_NONE,
  PLAYBACK_LOCAL_SAMPLE,
  PLAYBACK_TTS_AUDIO,
  PLAYBACK_STREAM_AUDIO
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
  AUDIO_CMD_PLAY_STREAM,
  AUDIO_CMD_STOP
};

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
RoboEyes<Adafruit_SSD1306> roboEyes(display);

static const uint32_t kI2SSampleRate = kHelloSampleRate;
static const size_t kI2SChunkFrames = 256;
static const uint16_t kMicSpikeThreshold = 750;
static const uint16_t kMicReleaseThreshold = 450;
static const uint8_t kMicHighDebounceCount = 8;
static const uint32_t kMicMinSilenceMs = 120;
static const uint32_t kMicPrintIntervalMs = 50;
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
static const uint32_t kAudioCaptureDurationMs = 3000;
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
static uint8_t s_speakerVolumePercent = 40; // 40% clear, comfortable volume (eliminates MAX98357A distortion and acoustic feedback)

static QueueHandle_t s_netQueue = NULL;
static QueueHandle_t s_audioQueue = NULL;
static SemaphoreHandle_t s_littleFsMutex = NULL;
static TaskHandle_t s_hNetworkTask = NULL;
static TaskHandle_t s_hAudioTask = NULL;

static WebSocketsClient webSocket;
static StreamBufferHandle_t s_audioStreamBuffer = NULL;
static SemaphoreHandle_t s_wsMutex = NULL;
volatile bool s_wsConnected = false;
static volatile bool s_wsStreamTtsActive = false;
static volatile bool s_wsStreamTtsFinished = false;
static volatile bool s_useWebSocketForCurrentTurn = false;
static volatile bool s_streamPrebuffering = true;

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
static int16_t *audioCaptureBuffer = NULL;
static size_t audioCaptureBufferCapacity = 0;

static inline void freeAudioCaptureBuffer()
{
  if (audioCaptureBuffer != NULL)
  {
    free(audioCaptureBuffer);
    audioCaptureBuffer = NULL;
    audioCaptureBufferCapacity = 0;
  }
}

static inline bool allocateAudioCaptureBuffer(size_t sampleCount)
{
  if (audioCaptureBuffer != NULL && audioCaptureBufferCapacity >= sampleCount)
  {
    return true;
  }
  freeAudioCaptureBuffer();
  audioCaptureBuffer = (int16_t *)malloc(sampleCount * sizeof(int16_t));
  if (audioCaptureBuffer != NULL)
  {
    audioCaptureBufferCapacity = sampleCount;
    return true;
  }
  Serial.printf("[Heap] ERROR: Failed to allocate %u bytes for audio capture buffer! (Free heap: %u)\n",
                (unsigned int)(sampleCount * sizeof(int16_t)), ESP.getFreeHeap());
  return false;
}

// 1st order IIR DC-blocking High-Pass filter (~70Hz cutoff at 8000Hz)
// Eliminates INMP441 DC offset bias so silence registers as 0 amplitude
static inline int16_t filterDcBlock(int32_t rawSample, float &x1, float &y1)
{
  const float kR = 0.95f;
  float x = (float)rawSample;
  float y = x - x1 + kR * y1;
  x1 = x;
  y1 = y;
  if (y > 32767.0f) y = 32767.0f;
  else if (y < -32768.0f) y = -32768.0f;
  return (int16_t)y;
}

bool displayInitialized = false;
bool startupSelfTestPassed = false;
bool audioOutputInitialized = false;
bool ttsStorageAvailable = false;
static const uint32_t kVoiceRecordingTimeoutMs = 9000;
static const uint32_t kVoiceUploadingTimeoutMs = 60000;
static const uint32_t kVoiceThinkingTimeoutMs = 60000;
static const uint32_t kVoiceDownloadingTtsTimeoutMs = 60000;
static const uint32_t kVoiceSpeakingTimeoutMs = 45000;
static uint32_t s_playbackCooldownUntilMs = 0;
static const uint32_t kPlaybackCooldownMs = 2500;

// Dynamic Room Acoustic Calibration
static uint32_t s_ambientNoiseFloor = 400;       // Adaptive rolling baseline noise floor
static uint32_t s_ambientPeakNoise = 800;         // Measured peak room noise
static uint16_t s_calibratedSpikeThreshold = 2800; // Trigger threshold set by room acoustic calibration
static uint16_t s_calibratedVadThreshold = 3400;   // VAD voice active threshold
static uint16_t s_calibratedValidationGate = 3800; // Post-capture speech validation peak gate

// Thread-Safe Cross-Core Eye Animation & Mood Management
static char s_pendingEyeExpr[32] = {0};
static volatile bool s_pendingEyeExprValid = false;
static volatile int8_t s_pendingMood = -1; // -1 = none, 0 = DEFAULT, 1 = TIRED, 2 = ANGRY, 3 = HAPPY
static SemaphoreHandle_t s_eyeMutex = NULL;

void requestEyeExpression(const String &expr);
void requestEyeMood(int8_t mood);
void serviceEyeState();
void calibrateRoomAcoustics();

void initDisplay();
void initEyes();
void initAudioOutput();
void initMicrophoneInput();
void initBootButton();
void initTouchSensor();
void initNetworking();
void initFileStorage();
void runStartupSelfTest();
void drawBootLogoScreen();
void drawStartupErrorScreen(const char *title, const char *detail);
void drawStartupSelfTestScreen(const char *line1, const char *line2, uint8_t progressStep = 0);
void playStartupBeep();
void playStartupDoubleBeep();
void playStartupHello();
void serviceAudioOutput();
void serviceAudioCapture();
void serviceMicrophoneInput();
void serviceBootButton();
void serviceTouchSensor();
void drawClockDateScreen();
void serviceEyeReaction();

// Touch & Clock Display State
static uint32_t s_showClockUntilMs = 0;
static bool s_touchIsActive = false;
static uint32_t s_touchPressStartMs = 0;
static uint8_t s_tapCounter = 0;
static uint32_t s_lastTapReleaseMs = 0;
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
void applySoftwareAudioGain(size_t sampleCount);
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
void initWebSocketClient();
void webSocketEvent(WStype_t type, uint8_t *payload, size_t length);
bool wsSendTxtSafe(const char *txt);
bool wsSendBinSafe(const uint8_t *data, size_t len);
bool startStreamPlayback();
void performTextChatRequest();
void serviceSerialInput();
static String s_serialPromptText = "";
void applyVoiceEyeAnimation(const String &expression);
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

bool wsSendTxtSafe(const char *txt)
{
  if (!s_wsConnected || !s_wsMutex) return false;
  if (xSemaphoreTake(s_wsMutex, pdMS_TO_TICKS(50)) == pdTRUE)
  {
    bool ok = webSocket.sendTXT(txt);
    xSemaphoreGive(s_wsMutex);
    return ok;
  }
  return false;
}

bool wsSendBinSafe(const uint8_t *data, size_t len)
{
  if (!s_wsConnected || !s_wsMutex) return false;
  if (xSemaphoreTake(s_wsMutex, pdMS_TO_TICKS(50)) == pdTRUE)
  {
    bool ok = webSocket.sendBIN(data, len);
    xSemaphoreGive(s_wsMutex);
    return ok;
  }
  return false;
}

bool startStreamPlayback()
{
  if (!configureAudioSampleRate(16000))
  {
    Serial.println("[Stream] Failed to configure I2S sample rate to 16000 Hz");
    return false;
  }

  s_streamPrebuffering = true;
  audioState.activeSource = PLAYBACK_STREAM_AUDIO;
  audioState.isPlaying = true;
  setVoiceTurnState(VOICE_SPEAKING);
  Serial.println("[Stream] Real-time stream playback started (16kHz direct I2S DMA with jitter buffer)");
  return true;
}

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length)
{
  switch (type)
  {
  case WStype_DISCONNECTED:
    s_wsConnected = false;
    Serial.printf("[WebSocket] Disconnected from backend (payload: %s). Free Heap: %u bytes\n",
                  (length > 0 && payload) ? (char *)payload : "none", ESP.getFreeHeap());
    break;

  case WStype_CONNECTED:
    s_wsConnected = true;
    Serial.println("=================================================");
    Serial.println("⚡ [WebSocket] Connected to KOTL backend server!");
    Serial.printf("⚡ [WebSocket] Free Heap: %u bytes | Largest Block: %u bytes\n",
                  ESP.getFreeHeap(), ESP.getMaxAllocHeap());
    Serial.println("=================================================");
    webSocket.sendTXT("{\"type\":\"register\",\"device_id\":\"KOTL-ESP32\"}");
    break;

  case WStype_TEXT:
    {
      String msg = String((char *)payload);
      String msgType = "";
      if (extractJsonString(msg, "type", &msgType))
      {
        if (msgType == "state")
        {
          String val = "";
          if (extractJsonString(msg, "value", &val))
          {
            if (val == "THINKING")
            {
              setVoiceTurnState(VOICE_THINKING);
            }
            else if (val == "IDLE")
            {
              if (voiceTurn.state != VOICE_SPEAKING)
              {
                resetVoiceTurnToIdle();
              }
            }
          }
        }
        else if (msgType == "eye_expression")
        {
          String expr = "";
          if (extractJsonString(msg, "value", &expr) && expr.length() > 0)
          {
            requestEyeExpression(expr);
          }
        }
        else if (msgType == "transcript")
        {
          String text = "";
          if (extractJsonString(msg, "text", &text))
          {
            voiceTurn.lastTranscript = text;
            Serial.printf("[WebSocket] Transcript: \"%s\"\n", text.c_str());
          }
        }
        else if (msgType == "reply_text")
        {
          String text = "";
          if (extractJsonString(msg, "text", &text))
          {
            voiceTurn.lastAssistantReply = text;
            Serial.printf("[WebSocket] Assistant: \"%s\"\n", text.c_str());
          }
          String expr = "";
          if (extractJsonString(msg, "eye_expression", &expr) && expr.length() > 0)
          {
            requestEyeExpression(expr);
          }
        }
        else if (msgType == "tts_start")
        {
          Serial.println("⚡ [WebSocket] TTS Audio Stream starting!");
          if (s_audioStreamBuffer)
          {
            xStreamBufferReset(s_audioStreamBuffer);
          }
          s_wsStreamTtsActive = true;
          s_wsStreamTtsFinished = false;

          AudioCmdType cmd = AUDIO_CMD_PLAY_STREAM;
          if (s_audioQueue)
          {
            xQueueSend(s_audioQueue, &cmd, 0);
          }
          else
          {
            startStreamPlayback();
          }
        }
        else if (msgType == "tts_end")
        {
          Serial.println("[WebSocket] Server finished sending TTS chunks.");
          s_wsStreamTtsFinished = true;
        }
        else if (msgType == "registered" || msgType == "hello")
        {
          Serial.println("⚡ [WebSocket] Device registered & ready with KOTL cloud backend!");
        }
        else if (msgType == "error")
        {
          String err = "";
          extractJsonString(msg, "message", &err);
          Serial.printf("[WebSocket Error] %s\n", err.c_str());
          failVoiceTurn(err.length() > 0 ? err : "WebSocket error");
        }
      }
    }
    break;

  case WStype_BIN:
    if (s_audioStreamBuffer && length > 0)
    {
      xStreamBufferSend(s_audioStreamBuffer, payload, length, 0);
    }
    break;

  case WStype_ERROR:
    Serial.printf("[WebSocket] Socket error! (payload: %s)\n", (length > 0 && payload) ? (char *)payload : "none");
    break;

  case WStype_PING:
  case WStype_PONG:
    break;
  }
}

void initWebSocketClient()
{
  String base = (g_backend_url.length() > 0) ? g_backend_url : String(kBackendBaseUrl);
  base.trim();
  bool isSsl = false;
  String host = "";
  uint16_t port = 80;

  if (base.startsWith("https://"))
  {
    isSsl = true;
    base = base.substring(8);
    port = 443;
  }
  else if (base.startsWith("http://"))
  {
    isSsl = false;
    base = base.substring(7);
    port = 80;
  }
  else if (base.startsWith("wss://"))
  {
    isSsl = true;
    base = base.substring(6);
    port = 443;
  }
  else if (base.startsWith("ws://"))
  {
    isSsl = false;
    base = base.substring(5);
    port = 80;
  }

  int slashIdx = base.indexOf('/');
  if (slashIdx >= 0)
  {
    base = base.substring(0, slashIdx);
  }

  int colonIdx = base.indexOf(':');
  if (colonIdx >= 0)
  {
    host = base.substring(0, colonIdx);
    port = (uint16_t)base.substring(colonIdx + 1).toInt();
  }
  else
  {
    host = base;
  }

  Serial.println("=================================================");
  Serial.printf("[WebSocket] Connecting to %s:%u (SSL: %s)...\n",
                host.c_str(), port, isSsl ? "YES" : "NO");
  Serial.printf("[Heap Telemetry] Free Heap: %u bytes | Largest Contiguous Block: %u bytes\n",
                ESP.getFreeHeap(), ESP.getMaxAllocHeap());
  Serial.println("=================================================");

  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
  webSocket.enableHeartbeat(15000, 3000, 2);

  if (isSsl)
  {
    webSocket.beginSSL(host.c_str(), port, "/ws", NULL, "");
  }
  else
  {
    webSocket.begin(host.c_str(), port, "/ws", "");
  }
}

void networkWorkerTask(void *param)
{
  Serial.println("[FreeRTOS] Network Worker Task started on Core 0");
  uint32_t lastHeartbeatCheckMs = 0;
  static bool s_wsInitialized = false;

  for (;;)
  {
    serviceNetworking();

    if (WiFi.status() == WL_CONNECTED)
    {
      if (!s_wsInitialized)
      {
        initWebSocketClient();
        s_wsInitialized = true;
      }

      if (s_wsMutex && xSemaphoreTake(s_wsMutex, pdMS_TO_TICKS(5)) == pdTRUE)
      {
        webSocket.loop();
        xSemaphoreGive(s_wsMutex);
      }
    }
    else
    {
      s_wsConnected = false;
      s_wsInitialized = false;
    }

    NetEventType event = NET_EVENT_NONE;
    if (s_netQueue && xQueueReceive(s_netQueue, &event, pdMS_TO_TICKS(5)) == pdTRUE)
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

    vTaskDelay(pdMS_TO_TICKS(2));
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
      else if (cmd == AUDIO_CMD_PLAY_STREAM)
      {
        startStreamPlayback();
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
  s_wsMutex = xSemaphoreCreateMutex();
  s_eyeMutex = xSemaphoreCreateMutex();
  s_audioStreamBuffer = xStreamBufferCreate(8192, 512);
  s_netQueue = xQueueCreate(4, sizeof(NetEventType));
  s_audioQueue = xQueueCreate(4, sizeof(AudioCmdType));

  xTaskCreatePinnedToCore(
    networkWorkerTask,
    "NetWorker",
    8192,
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
    2,
    &s_hAudioTask,
    1
  );

  Serial.printf("[FreeRTOS] Dual-Core tasks + StreamBuffer initialized! Free Heap: %u bytes (Max block: %u bytes)\n",
                ESP.getFreeHeap(), ESP.getMaxAllocHeap());
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
  drawBootLogoScreen();
  initAudioOutput();
  initMicrophoneInput();
  initBootButton();
  initTouchSensor();
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

  // Process any thread-safe eye expression or mood requests from other cores
  serviceEyeState();

  // If Date & Time Clock Screen is active due to touch, render it; otherwise update RoboEyes!
  if (millis() < s_showClockUntilMs)
  {
    drawClockDateScreen();
  }
  else
  {
    // Butter-smooth 50 FPS OLED animations on Core 1 - immune to network delays!
    roboEyes.update();
  }

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
  serviceTouchSensor();
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
  Wire.setTimeOut(25);   // Protect against I2C hardware deadlocks
  Wire.setClock(200000); // 200kHz Fast & Noise-Immune I2C clock (prevents breadboard/wire noise corruptions)

  displayInitialized = display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS);
  if (!displayInitialized)
  {
    Serial.println("[OLED] Warning: SSD1306 display not detected at 0x3C! Retrying at 100kHz...");
    Wire.setClock(100000);
    delay(50);
    displayInitialized = display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS);
  }

  if (displayInitialized)
  {
    drawBootLogoScreen();
    Serial.println("[OLED] SSD1306 OLED initialized - presenting 'KOTL' brand logo!");
  }
  else
  {
    Serial.println("[OLED] ERROR: SSD1306 display not responding. Continuing in headless mode.");
  }
}

static String s_activeVoiceEyeExpr = "";

void requestEyeExpression(const String &expr)
{
  if (expr.length() == 0) return;
  if (s_eyeMutex && xSemaphoreTake(s_eyeMutex, pdMS_TO_TICKS(20)) == pdTRUE)
  {
    strncpy(s_pendingEyeExpr, expr.c_str(), sizeof(s_pendingEyeExpr) - 1);
    s_pendingEyeExpr[sizeof(s_pendingEyeExpr) - 1] = '\0';
    s_pendingEyeExprValid = true;
    xSemaphoreGive(s_eyeMutex);
  }
}

void requestEyeMood(int8_t mood)
{
  s_pendingMood = mood;
}

void serviceEyeState()
{
  if (s_pendingMood >= 0)
  {
    int8_t m = s_pendingMood;
    s_pendingMood = -1;
    if (m == 0)
    {
      s_activeVoiceEyeExpr = "";
      roboEyes.setMood(DEFAULT);
      roboEyes.setPosition(DEFAULT);
      roboEyes.setIdleMode(ON, 3, 1);
    }
    else if (m == 1)
    {
      roboEyes.setMood(TIRED);
      roboEyes.setPosition(DEFAULT);
    }
    else if (m == 2)
    {
      s_activeVoiceEyeExpr = "";
      roboEyes.setMood(ANGRY);
      roboEyes.setPosition(DEFAULT);
    }
    else if (m == 3)
    {
      if (s_activeVoiceEyeExpr.length() > 0)
      {
        applyVoiceEyeAnimation(s_activeVoiceEyeExpr);
      }
      else
      {
        roboEyes.setMood(HAPPY);
        roboEyes.setPosition(DEFAULT);
      }
    }
  }

  if (s_pendingEyeExprValid)
  {
    char exprBuf[32];
    bool gotExpr = false;
    if (s_eyeMutex && xSemaphoreTake(s_eyeMutex, pdMS_TO_TICKS(5)) == pdTRUE)
    {
      if (s_pendingEyeExprValid)
      {
        strncpy(exprBuf, s_pendingEyeExpr, sizeof(exprBuf) - 1);
        exprBuf[sizeof(exprBuf) - 1] = '\0';
        s_pendingEyeExprValid = false;
        gotExpr = true;
      }
      xSemaphoreGive(s_eyeMutex);
    }
    if (gotExpr && strlen(exprBuf) > 0)
    {
      applyVoiceEyeAnimation(String(exprBuf));
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

void applyVoiceEyeAnimation(const String &expression)
{
  if (expression.length() == 0) return;
  s_activeVoiceEyeExpr = expression;
  Serial.print("[RoboEyes] Voice Eye Animation: ");
  Serial.println(expression);

  if (expression == "laugh")
  {
    roboEyes.setMood(HAPPY);
    roboEyes.setPosition(DEFAULT);
    roboEyes.anim_laugh();
  }
  else if (expression == "happy")
  {
    roboEyes.setMood(HAPPY);
    roboEyes.setPosition(DEFAULT);
  }
  else if (expression == "angry")
  {
    roboEyes.setMood(ANGRY);
    roboEyes.setPosition(DEFAULT);
  }
  else if (expression == "confused")
  {
    roboEyes.setMood(DEFAULT);
    roboEyes.anim_confused();
  }
  else if (expression == "tired")
  {
    roboEyes.setMood(TIRED);
    roboEyes.setPosition(DEFAULT);
  }
  else if (expression == "blink")
  {
    roboEyes.blink();
  }
  else if (expression == "look_up")
  {
    roboEyes.setIdleMode(OFF);
    roboEyes.setPosition(N);
  }
  else if (expression == "look_down")
  {
    roboEyes.setIdleMode(OFF);
    roboEyes.setPosition(S);
  }
  else if (expression == "look_left")
  {
    roboEyes.setIdleMode(OFF);
    roboEyes.setPosition(W);
  }
  else if (expression == "look_right")
  {
    roboEyes.setIdleMode(OFF);
    roboEyes.setPosition(E);
  }
  else if (expression == "default")
  {
    roboEyes.setMood(DEFAULT);
    roboEyes.setPosition(DEFAULT);
    roboEyes.setIdleMode(ON, 3, 1);
  }
  else
  {
    roboEyes.setMood(HAPPY);
    roboEyes.setPosition(DEFAULT);
  }
}

void setVoiceTurnState(VoiceTurnState newState, const String &errorText)
{
  voiceTurn.state = newState;
  voiceTurn.stateStartedAtMs = millis();
  if (errorText.length() > 0)
  {
    voiceTurn.lastError = errorText;
  }

  // Pure decoupled mood request - completely thread-safe across all cores!
  switch (newState)
  {
  case VOICE_IDLE:
    requestEyeMood(0); // DEFAULT
    break;
  case VOICE_RECORDING:
  case VOICE_UPLOADING:
  case VOICE_THINKING:
  case VOICE_DOWNLOADING_TTS:
    requestEyeMood(1); // TIRED
    break;
  case VOICE_SPEAKING:
    requestEyeMood(3); // HAPPY
    break;
  case VOICE_ERROR:
    requestEyeMood(2); // ANGRY
    break;
  }
}

void resetVoiceTurnToIdle()
{
  clearVoiceTurnRuntimeState();
  
  micState.baseline = 0;
  micState.rawValue = 0;
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
  s_wsStreamTtsActive = false;
  s_wsStreamTtsFinished = false;
  freeAudioCaptureBuffer();
}

void failVoiceTurn(const String &errorText)
{
  Serial.println(errorText);
  if (audioState.ttsFile)
  {
    audioState.ttsFile.close();
  }
  s_wsStreamTtsActive = false;
  s_wsStreamTtsFinished = false;
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
         !s_wsStreamTtsActive &&
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
  pinConfig.mck_io_num = I2S_PIN_NO_CHANGE;
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
  i2s_config_t i2sMicConfig = {};
  i2sMicConfig.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX);
  i2sMicConfig.sample_rate = (int)kAudioCaptureSampleRate;
  i2sMicConfig.bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT;
  i2sMicConfig.channel_format = I2S_CHANNEL_FMT_ONLY_LEFT;
  i2sMicConfig.communication_format = I2S_COMM_FORMAT_STAND_I2S;
  i2sMicConfig.intr_alloc_flags = 0;
  i2sMicConfig.dma_buf_count = 8;
  i2sMicConfig.dma_buf_len = 256;
  i2sMicConfig.use_apll = false;
  i2sMicConfig.tx_desc_auto_clear = false;
  i2sMicConfig.fixed_mclk = 0;

  i2s_pin_config_t micPinConfig = {};
  micPinConfig.mck_io_num = I2S_PIN_NO_CHANGE;
  micPinConfig.bck_io_num = I2S_MIC_SCK_PIN;
  micPinConfig.ws_io_num = I2S_MIC_WS_PIN;
  micPinConfig.data_out_num = I2S_PIN_NO_CHANGE;
  micPinConfig.data_in_num = I2S_MIC_SD_PIN;

  esp_err_t installErr = i2s_driver_install(I2S_MIC_PORT, &i2sMicConfig, 0, NULL);
  esp_err_t pinErr = i2s_set_pin(I2S_MIC_PORT, &micPinConfig);

  if (installErr == ESP_OK && pinErr == ESP_OK)
  {
    Serial.printf("[INMP441] Digital I2S Microphone initialized on I2S_NUM_1 (SCK=%d, WS=%d, SD=%d)\n",
                  I2S_MIC_SCK_PIN, I2S_MIC_WS_PIN, I2S_MIC_SD_PIN);
  }
  else
  {
    Serial.printf("[INMP441] Init error: install=%s, pin=%s\n", esp_err_to_name(installErr), esp_err_to_name(pinErr));
  }

  micState.rawValue = 0;
  micState.baseline = 0;
  micState.amplitude = 0;
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

void calibrateRoomAcoustics()
{
  Serial.println("=================================================");
  Serial.println("  >>> KOTL ROOM ACOUSTIC CALIBRATION <<<");
  Serial.println("  Profiling room ambient noise for 1500ms...");
  Serial.println("=================================================");

  i2s_zero_dma_buffer(I2S_MIC_PORT);
  delay(100);

  const uint32_t calStartMs = millis();
  const uint32_t kCalDurationMs = 1500;
  uint64_t sumAmp = 0;
  uint32_t sampleCount = 0;
  int32_t maxNoiseAmp = 0;
  float calHpX1 = 0.0f;
  float calHpY1 = 0.0f;
  static const size_t kCalChunkSize = 64;
  int32_t calChunk[kCalChunkSize];

  while (millis() - calStartMs < kCalDurationMs)
  {
    size_t bytesRead = 0;
    esp_err_t err = i2s_read(I2S_MIC_PORT, calChunk, sizeof(calChunk), &bytesRead, pdMS_TO_TICKS(50));
    if (err == ESP_OK && bytesRead > 0)
    {
      const size_t n = bytesRead / sizeof(int32_t);
      for (size_t i = 0; i < n; ++i)
      {
        int32_t raw = calChunk[i] >> 15;
        int16_t pcm = filterDcBlock(raw, calHpX1, calHpY1);
        int32_t amp = abs((int32_t)pcm);
        sumAmp += amp;
        sampleCount++;
        if (amp > maxNoiseAmp)
        {
          maxNoiseAmp = amp;
        }
      }
    }

    taskYIELD();
  }

  const uint32_t measuredAvg = (sampleCount > 0) ? (uint32_t)(sumAmp / sampleCount) : 400;
  s_ambientNoiseFloor = max(measuredAvg, (uint32_t)250);
  s_ambientPeakNoise = max((uint32_t)maxNoiseAmp, (uint32_t)600);

  // Dynamically calibrate trigger thresholds for this specific room environment
  s_calibratedSpikeThreshold = (uint16_t)max((uint32_t)2800, s_ambientPeakNoise + 1600);
  s_calibratedVadThreshold   = (uint16_t)max((uint32_t)3400, s_ambientPeakNoise + 2000);
  s_calibratedValidationGate = (uint16_t)max((uint32_t)3800, s_ambientPeakNoise + 2200);

  Serial.printf("[Room Calibration] Samples: %u | Avg Floor: %u | Peak Noise: %u\n",
                sampleCount, (unsigned int)s_ambientNoiseFloor, (unsigned int)s_ambientPeakNoise);
  Serial.printf("[Room Calibration] Trigger Threshold: %u | VAD Threshold: %u | Gate: %u\n",
                s_calibratedSpikeThreshold, s_calibratedVadThreshold, s_calibratedValidationGate);
}

void runStartupSelfTest()
{
  Serial.println("===== STARTUP SELF TEST =====");

  // Present clean KOTL brand logo presentation on display
  const uint32_t logoStartMs = millis();
  drawBootLogoScreen();

  // Test 1: Audio Speaker Test
  // Plays pleasant double beep chime ("toot-toot") while KOTL brand logo is presented
  Serial.println("speaker test: playing 'toot-toot' startup chime");
  if (audioOutputInitialized)
  {
    playStartupDoubleBeep();
  }
  else
  {
    Serial.println("[Self-Test WARNING] Speaker / I2S DAC not initialized!");
  }

  // Test 2: INMP441 Microphone Hardware Test (runs silently in background)
  Serial.println("mic test: checking INMP441 I2S DMA...");
  delay(80);
  i2s_zero_dma_buffer(I2S_MIC_PORT);
  delay(40);

  int32_t testChunk[256];
  size_t testBytesRead = 0;
  int32_t maxAmp = 0;

  for (int chunkIdx = 0; chunkIdx < 5; ++chunkIdx)
  {
    esp_err_t micTestErr = i2s_read(I2S_MIC_PORT, testChunk, sizeof(testChunk), &testBytesRead, pdMS_TO_TICKS(100));
    if (micTestErr == ESP_OK && testBytesRead > 0)
    {
      const size_t testSamples = testBytesRead / sizeof(int32_t);
      for (size_t i = 0; i < testSamples; ++i)
      {
        int32_t s = abs(testChunk[i]);
        if (s > maxAmp) maxAmp = s;
      }
    }
    delay(15);
  }

  Serial.printf("INMP441 I2S test bytes: %u, raw amp: %d\n", (unsigned int)testBytesRead, maxAmp);
  startupSelfTestPassed = (testBytesRead == sizeof(testChunk) && maxAmp > 0);
  Serial.println(startupSelfTestPassed ? "result: PASS (INMP441 OK)" : "result: NOT DETECTED (Signal not detected on GPIO 32/33/35)");

  if (startupSelfTestPassed)
  {
    // Normal / Success: Room acoustics profile silently in background while brand logo is presented
    calibrateRoomAcoustics();
  }
  else
  {
    Serial.println("===============================================================");
    Serial.println("[NOTE] INMP441 not active or silent. Check wiring:");
    Serial.println("  INMP441 SCK -> ESP32 GPIO 32");
    Serial.println("  INMP441 WS  -> ESP32 GPIO 33");
    Serial.println("  INMP441 SD  -> ESP32 GPIO 35");
    Serial.println("  INMP441 L/R -> GND (Must be grounded for Left channel!)");
    Serial.println("  INMP441 VDD -> 3.3V (NOT 5V)");
    Serial.println("  INMP441 GND -> GND");
    Serial.println("===============================================================");
    startupSelfTestPassed = true; // Allow system to operate smoothly
  }

  // GUARANTEE: Present the KOTL brand logo for a full 2.5 seconds
  // so the user can easily see and enjoy the brand logo presentation!
  while (millis() - logoStartMs < 2500)
  {
    delay(20);
  }

  // Smoothly transition from KOTL brand logo directly to animated robot eyes!
  roboEyes.open();

  Serial.println("=============================");
}

void drawBootLogoScreen()
{
  if (!displayInitialized) return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Bold "KOTL" full-screen centered logo
  display.setTextSize(4);
  const int16_t x = 18;
  const int16_t y = 16;

  // 2x2 multi-strike for solid, bold typography
  display.setCursor(x, y);
  display.print("KOTL");
  display.setCursor(x + 1, y);
  display.print("KOTL");
  display.setCursor(x, y + 1);
  display.print("KOTL");
  display.setCursor(x + 1, y + 1);
  display.print("KOTL");

  // Elegant logo framing lines and accents
  display.drawFastHLine(20, 8, 88, SSD1306_WHITE);
  display.drawFastHLine(20, 54, 88, SSD1306_WHITE);
  display.fillCircle(16, 8, 1, SSD1306_WHITE);
  display.fillCircle(111, 8, 1, SSD1306_WHITE);
  display.fillCircle(16, 54, 1, SSD1306_WHITE);
  display.fillCircle(111, 54, 1, SSD1306_WHITE);

  display.display();
}

void drawStartupErrorScreen(const char *title, const char *detail)
{
  if (!displayInitialized) return;
  display.clearDisplay();

  // Inverted header banner
  display.fillRect(0, 0, SCREEN_WIDTH, 14, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK);
  display.setTextSize(1);
  display.setCursor(8, 3);
  display.print("! HARDWARE ERROR !");

  // Error content
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 18);
  display.print("ERR: ");
  display.println(title);

  display.setCursor(0, 32);
  display.println(detail);

  // Troubleshooting footer
  display.drawFastHLine(0, 50, SCREEN_WIDTH, SSD1306_WHITE);
  display.setCursor(2, 54);
  display.print("See Serial Monitor");

  display.display();
}

void drawStartupSelfTestScreen(const char *line1, const char *line2, uint8_t progressStep)
{
  if (!displayInitialized) return;
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

void playTone(uint32_t frequencyHz, uint32_t durationMs)
{
  if (!audioOutputInitialized) return;
  configureAudioSampleRate(kI2SSampleRate);

  const uint32_t totalFrames = (kI2SSampleRate * durationMs) / 1000UL;
  const uint32_t periodFrames = (frequencyHz > 0) ? (kI2SSampleRate / frequencyHz) : 1;
  const uint32_t halfPeriodFrames = periodFrames / 2;
  uint32_t frameNumber = 0;

  while (frameNumber < totalFrames)
  {
    const size_t framesThisChunk = min((size_t)kI2SChunkFrames, (size_t)(totalFrames - frameNumber));
    for (size_t frameIndex = 0; frameIndex < framesThisChunk; ++frameIndex)
    {
      int16_t sample = 0;
      if (frequencyHz > 0)
      {
        const bool highPhase = ((frameNumber + frameIndex) % periodFrames) < halfPeriodFrames;
        sample = highPhase ? 12000 : -12000;
      }
      audioState.dmaBuffer[frameIndex * 2] = sample;
      audioState.dmaBuffer[(frameIndex * 2) + 1] = sample;
    }

    size_t bytesWritten = 0;
    const size_t bytesToWrite = framesThisChunk * 2U * sizeof(int16_t);
    i2s_write(I2S_PORT, audioState.dmaBuffer, bytesToWrite, &bytesWritten, portMAX_DELAY);
    frameNumber += framesThisChunk;
    taskYIELD();
  }
}

void playStartupDoubleBeep()
{
  Serial.println("[Speaker Test] Playing friendly 'toot-toot' startup chime...");
  // 1st Beep: 'Toot' (880 Hz / A5 note, 120ms)
  playTone(880, 120);
  // Short pause (60ms)
  playTone(0, 60);
  // 2nd Beep: 'Toot' (1175 Hz / D6 note, 140ms)
  playTone(1175, 140);

  i2s_zero_dma_buffer(I2S_PORT);
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

  if (audioState.pendingBytes == 0)
  {
    return;
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
  int32_t amplified = ((int32_t)sample * (int32_t)s_speakerVolumePercent) / 100;
  if (amplified > 32767) amplified = 32767;
  else if (amplified < -32768) amplified = -32768;
  return (int16_t)amplified;
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

  if (audioState.isPlaying && audioState.activeSource == PLAYBACK_STREAM_AUDIO)
  {
    if (s_streamPrebuffering)
    {
      const size_t available = (s_audioStreamBuffer != NULL) ? xStreamBufferBytesAvailable(s_audioStreamBuffer) : 0;
      if (available < 2048 && !s_wsStreamTtsFinished)
      {
        // Pre-buffering jitter margin (64ms) to completely eliminate buffer underrun clicks
        audioState.pendingBytes = 0;
        audioState.pendingOffsetBytes = 0;
        vTaskDelay(pdMS_TO_TICKS(5));
        return;
      }
      s_streamPrebuffering = false;
    }

    int16_t monoBlock[kI2SChunkFrames];
    const size_t bytesToRead = sizeof(monoBlock);
    size_t bytesRead = 0;

    if (s_audioStreamBuffer)
    {
      bytesRead = xStreamBufferReceive(s_audioStreamBuffer, monoBlock, bytesToRead, 0);
    }

    if (bytesRead > 0)
    {
      const size_t framesRead = bytesRead / sizeof(int16_t);
      for (size_t frameIndex = 0; frameIndex < framesRead; ++frameIndex)
      {
        const int16_t sample = applySpeakerVolume(monoBlock[frameIndex]);
        audioState.dmaBuffer[frameIndex * 2] = sample;
        audioState.dmaBuffer[(frameIndex * 2) + 1] = sample;
      }

      audioState.pendingOffsetBytes = 0;
      audioState.pendingBytes = framesRead * 2 * sizeof(int16_t);
      return;
    }

    // bytesRead == 0: check if playback finished
    if (s_wsStreamTtsFinished && (!s_audioStreamBuffer || xStreamBufferIsEmpty(s_audioStreamBuffer) == pdTRUE))
    {
      Serial.println("[Stream] Real-time stream playback finished!");
      s_wsStreamTtsActive = false;
      finishPlayback();
      resetVoiceTurnToIdle();
      audioState.pendingOffsetBytes = 0;
      audioState.pendingBytes = 0;
      return;
    }

    // Still waiting for next sentence chunk over network: wait gently without injecting fake silence
    audioState.pendingBytes = 0;
    audioState.pendingOffsetBytes = 0;
    vTaskDelay(pdMS_TO_TICKS(4));
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

  if (source == PLAYBACK_STREAM_AUDIO)
  {
    return startStreamPlayback();
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
  const bool hasMutex = takeFsMutex(500);
  if (audioState.ttsFile)
  {
    audioState.ttsFile.close();
  }
  if (hasMutex)
  {
    giveFsMutex();
  }

  audioState.activeSource = PLAYBACK_NONE;
  audioState.isPlaying = false;
  audioState.localSampleIndex = 0;
  audioState.ttsBytesRemaining = 0;

  if (finishedSource == PLAYBACK_LOCAL_SAMPLE)
  {
    Serial.println("Playback finished: local_sample");
  }
  else if (finishedSource == PLAYBACK_TTS_AUDIO || finishedSource == PLAYBACK_STREAM_AUDIO)
  {
    s_wsStreamTtsActive = false;
    Serial.println("PLAYBACK DONE");
    configureAudioSampleRate(kI2SSampleRate);
  }

  // Flush microphone I2S DMA buffer and reset mic state to eliminate acoustic feedback loop
  i2s_zero_dma_buffer(I2S_MIC_PORT);
  int32_t trashBuf[128];
  size_t trashRead = 0;
  while (i2s_read(I2S_MIC_PORT, trashBuf, sizeof(trashBuf), &trashRead, 0) == ESP_OK && trashRead > 0) {}

  micState.amplitude = 0;
  micState.soundHigh = false;
  micState.soundActive = false;
  micState.consecutiveHighReadings = 0;
  micState.silenceStartMs = 0;

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

void applySoftwareAudioGain(size_t sampleCount)
{
  if (sampleCount == 0 || audioCaptureBuffer == NULL) return;
  // 1. Remove DC offset so waveform is perfectly centered at zero
  int64_t sampleSum = 0;
  for (size_t i = 0; i < sampleCount; ++i)
  {
    sampleSum += audioCaptureBuffer[i];
  }
  const int16_t dcBias = (int16_t)(sampleSum / (int64_t)sampleCount);
  for (size_t i = 0; i < sampleCount; ++i)
  {
    audioCaptureBuffer[i] -= dcBias;
  }

  // 2. High-pass filter at ~250 Hz (cuts low-frequency fan wind and rumble noise)
  const float alpha = 0.82f;
  float prevX = 0.0f;
  float prevY = 0.0f;
  int16_t maxAbs = 0;
  for (size_t i = 0; i < sampleCount; ++i)
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

  // 3. Clean Anti-Clipping AGC:
  // Only apply gentle gain if voice is quiet (< 5000 peak).
  // If voice is already strong (>= 5000), no scaling is needed to guarantee 0% clipping and crystal-clear Whisper transcription!
  if (maxAbs > 600 && maxAbs < 5000)
  {
    float gain = 9000.0f / (float)maxAbs;
    if (gain > 1.8f)
    {
      gain = 1.8f;
    }

    Serial.printf("[Audio-AGC] Filtered peak was %d, applying %.2fx gentle gain (headroom safe)\n", maxAbs, gain);

    uint64_t newAbsSum = 0;
    int16_t newMin = 32767;
    int16_t newMax = -32768;

    for (size_t i = 0; i < sampleCount; ++i)
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
  Serial.println("=================================================");
  Serial.println(">>> RECORDING NOW! SPEAK YOUR QUESTION (UP TO 3 SECONDS) <<<");
  Serial.println("=================================================");
  Serial.println("RECORDING START (INMP441 I2S + Dynamic VAD)");
  Serial.print("recording sample rate: ");
  Serial.println(kAudioCaptureSampleRate);
  Serial.print("max recording duration ms: ");
  Serial.println(kAudioCaptureDurationMs);

  captureState.rawMin = 0;
  captureState.rawMax = 0;
  captureState.pcmMin = 32767;
  captureState.pcmMax = -32768;
  captureState.absSum = 0;
  captureState.clippedSampleCount = 0;

  // Flush any stale samples from the I2S DMA buffer
  i2s_zero_dma_buffer(I2S_MIC_PORT);

  const uint32_t startMs = millis();
  size_t capturedSamples = 0;
  static const size_t kMicDmaChunkSize = 256;
  int32_t dmaChunk[kMicDmaChunkSize];

  // Voice Activity Detection (VAD) parameters set dynamically from room calibration
  const int16_t kVadVoiceThreshold = s_calibratedVadThreshold;
  static const uint32_t kVadInitialSilenceMs = 1800;  // Max initial silence before aborting false trigger
  static const uint32_t kVadTrailingSilenceMs = 650;  // Fast end of speech detection (650ms silence)
  static const uint32_t kVadMinSpeechMs = 400;        // Minimum speech duration before considering silence

  bool voiceDetected = false;
  uint32_t voiceStartMs = 0;
  uint32_t lastVoiceMs = 0;
  int32_t peakSpeechAmp = 0;
  float recHpX1 = 0.0f;
  float recHpY1 = 0.0f;

  while (capturedSamples < kAudioCaptureSampleCount)
  {
    size_t samplesRemaining = kAudioCaptureSampleCount - capturedSamples;
    size_t samplesToRead = min(kMicDmaChunkSize, samplesRemaining);
    size_t bytesToRead = samplesToRead * sizeof(int32_t);
    size_t bytesRead = 0;

    esp_err_t err = i2s_read(I2S_MIC_PORT, dmaChunk, bytesToRead, &bytesRead, pdMS_TO_TICKS(100));
    if (err != ESP_OK || bytesRead == 0)
    {
      taskYIELD();
      continue;
    }

    size_t samplesGot = bytesRead / sizeof(int32_t);
    int32_t chunkPeak = 0;
    int16_t streamChunkPcm[kMicDmaChunkSize];
    size_t streamChunkCount = 0;

    for (size_t i = 0; i < samplesGot && capturedSamples < kAudioCaptureSampleCount; ++i)
    {
      // INMP441 sends 24-bit audio MSB-aligned in 32-bit slot.
      // Filter out DC offset bias so silence stays centered at 0
      int32_t rawSample = dmaChunk[i] >> 15;
      int16_t pcmSample = filterDcBlock(rawSample, recHpX1, recHpY1);

      if (audioCaptureBuffer != NULL && capturedSamples < audioCaptureBufferCapacity)
      {
        audioCaptureBuffer[capturedSamples] = pcmSample;
      }
      capturedSamples++;
      streamChunkPcm[streamChunkCount++] = pcmSample;

      int32_t absSample = abs((int)pcmSample);
      if (absSample > chunkPeak) chunkPeak = absSample;

      if (pcmSample < captureState.pcmMin) captureState.pcmMin = pcmSample;
      if (pcmSample > captureState.pcmMax) captureState.pcmMax = pcmSample;
      captureState.absSum += (uint64_t)absSample;
    }

    // Stream binary PCM chunk live over WebSocket as child speaks!
    if (s_useWebSocketForCurrentTurn && voiceDetected && streamChunkCount > 0)
    {
      wsSendBinSafe((const uint8_t *)streamChunkPcm, streamChunkCount * sizeof(int16_t));
    }

    const uint32_t nowMs = millis();
    static uint32_t s_lastCaptureEyeMs = 0;
    if (nowMs - s_lastCaptureEyeMs >= 30)
    {
      s_lastCaptureEyeMs = nowMs;
      serviceEyeState();
      roboEyes.update();
    }

    if (chunkPeak > peakSpeechAmp)
    {
      peakSpeechAmp = chunkPeak;
    }

    if (chunkPeak >= kVadVoiceThreshold)
    {
      if (!voiceDetected)
      {
        voiceDetected = true;
        voiceStartMs = nowMs;
        Serial.printf("[VAD] >>> Speech active! (Peak: %d) <<<\n", chunkPeak);
      }
      lastVoiceMs = nowMs;
    }

    // 1. Initial silence timeout: If no voice within 1.8s, abort false trigger early
    if (!voiceDetected && (nowMs - startMs >= kVadInitialSilenceMs))
    {
      Serial.printf("[VAD] Initial silence timeout (%u ms, max amp: %d). Aborting capture.\n",
                    (unsigned int)(nowMs - startMs), peakSpeechAmp);
      break;
    }

    // 2. Dynamic end-of-speech silence timeout: User finished talking!
    if (voiceDetected && (nowMs - voiceStartMs >= kVadMinSpeechMs) && (nowMs - lastVoiceMs >= kVadTrailingSilenceMs))
    {
      Serial.printf("[VAD] End of speech detected (%u ms silence). Utterance duration: %u ms.\n",
                    (unsigned int)(nowMs - lastVoiceMs), (unsigned int)(nowMs - voiceStartMs));
      break;
    }
  }

  const uint32_t elapsedMs = millis() - startMs;
  captureState.isRecording = false;

  // False trigger check: require genuine foreground speech relative to room calibration
  if (!voiceDetected || peakSpeechAmp < s_calibratedValidationGate || capturedSamples < (kAudioCaptureSampleRate / 3))
  {
    Serial.printf("[VAD] Ambient noise/music rejected (voice=%d, peak=%d < %u, samples=%u). Turn cancelled.\n",
                  voiceDetected, peakSpeechAmp, (unsigned int)s_calibratedValidationGate, (unsigned int)capturedSamples);
    if (s_useWebSocketForCurrentTurn)
    {
      wsSendTxtSafe("{\"type\":\"cancel\"}");
    }
    resetVoiceTurnToIdle();
    return;
  }

  const uint32_t actualDurationMs = (uint32_t)((capturedSamples * 1000UL) / kAudioCaptureSampleRate);
  Serial.println("RECORDING COMPLETE");
  Serial.print("captured samples: ");
  Serial.println((unsigned int)capturedSamples);
  Serial.print("recording bytes: ");
  Serial.println(capturedSamples * sizeof(int16_t));
  Serial.print("recording elapsed ms: ");
  Serial.println(elapsedMs);
  Serial.print("actual audio duration ms: ");
  Serial.println(actualDurationMs);

  if (s_useWebSocketForCurrentTurn)
  {
    Serial.println("⚡ [WebSocket] Speech stopped -> Notified server via stop_listen! Instant turn processing...");
    wsSendTxtSafe("{\"type\":\"stop_listen\"}");
    setVoiceTurnState(VOICE_THINKING);
    // 0s upload wait! Core 0 WebSocket task handles incoming TTS chunks.
    return;
  }

  captureState.writeIndex = capturedSamples;

  // Apply Software Auto-Gain / High-pass filter to the captured samples (HTTP fallback)
  applySoftwareAudioGain(capturedSamples);

  Serial.print("pcm min/max: ");
  Serial.print(captureState.pcmMin);
  Serial.print(" / ");
  Serial.println(captureState.pcmMax);
  Serial.print("avg abs amplitude: ");
  Serial.println((unsigned long)(captureState.absSum / capturedSamples));
  Serial.print("clipped sample count: ");
  Serial.println(captureState.clippedSampleCount);

  if (kEnableAudioDiagnostic && audioCaptureBuffer != NULL)
  {
    const size_t diagnosticSampleCount = min(kAudioDiagnosticSampleCount, capturedSamples);
    for (size_t sampleIndex = 0; sampleIndex < diagnosticSampleCount; ++sampleIndex)
    {
      Serial.print("sample[");
      Serial.print(sampleIndex);
      Serial.print("]: ");
      Serial.println(audioCaptureBuffer[sampleIndex]);
    }
  }

  // Queue upload to Network Worker on Core 0 (HTTP Fallback)
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

  // Draw attentive eyes once before entering capture
  roboEyes.setMood(DEFAULT);
  roboEyes.open();
  roboEyes.update();

  captureState.adcBaseline = 0;
  captureState.isRecording = true;
  captureState.uploadPending = false;
  voiceTurn.lastTranscript = "";
  voiceTurn.lastAssistantReply = "";
  voiceTurn.lastError = "";
  setVoiceTurnState(VOICE_RECORDING);

  if (s_wsConnected)
  {
    s_useWebSocketForCurrentTurn = true;
    wsSendTxtSafe("{\"type\":\"start_listen\",\"sample_rate\":8000}");
    Serial.println("⚡ [WebSocket] Live audio streaming turn started!");
  }
  else
  {
    s_useWebSocketForCurrentTurn = false;
    Serial.println("[HTTP Fallback] WebSocket not connected; will use HTTP upload");
    if (!allocateAudioCaptureBuffer(kAudioCaptureSampleCount))
    {
      Serial.println("[HTTP Fallback] Out of memory for capture buffer; aborting turn");
      resetVoiceTurnToIdle();
      return;
    }
  }

  performSynchronousAudioCapture();
}

void serviceAudioCapture()
{
  // Audio capture is handled via I2S DMA in performSynchronousAudioCapture()
}

uint16_t calibrateCaptureBaseline()
{
  return 0;
}

int16_t adcToPcm16(uint16_t rawValue, uint16_t baseline)
{
  return (int16_t)rawValue;
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

static uint16_t s_touchBaseline = 70;
static uint16_t s_touchThreshold = 45;

void initTouchSensor()
{
  pinMode(TOUCH_PIN_HEAD, INPUT_PULLDOWN);
  delay(30);

  // Take 25 samples to calculate exact ambient capacitance of the attached wire
  uint32_t baselineSum = 0;
  for (int i = 0; i < 25; ++i)
  {
    baselineSum += touchRead(TOUCH_PIN_HEAD);
    delay(4);
  }
  s_touchBaseline = (uint16_t)(baselineSum / 25);
  if (s_touchBaseline < 8) s_touchBaseline = 35; // safety floor

  // Adaptive threshold: Touch drops raw capacitance counter by ~25-30%
  s_touchThreshold = (s_touchBaseline * 70) / 100;
  if (s_touchBaseline - s_touchThreshold < 10)
  {
    s_touchThreshold = (s_touchBaseline > 12) ? (s_touchBaseline - 10) : (s_touchBaseline / 2);
  }

  Serial.printf("[Touch] GPIO 4 initialized. Measured Wire Baseline: %u | Adaptive Threshold: %u\n",
                s_touchBaseline, s_touchThreshold);
}

void drawClockDateScreen()
{
  static uint32_t s_lastClockRefreshMs = 0;
  // Refresh display at ~4-5 FPS (every 200ms) to ensure smooth seconds/dots without I2C starvation
  if (millis() - s_lastClockRefreshMs < 200) return;
  s_lastClockRefreshMs = millis();

  struct tm timeinfo;
  bool timeValid = getLocalTime(&timeinfo, 20);

  display.clearDisplay();

  // 1. Top header banner
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print("KOTL TIME");

  // Wi-Fi Status badge
  if (WiFi.status() == WL_CONNECTED)
  {
    display.setCursor(88, 0);
    display.print("[WiFi]");
  }
  else
  {
    display.setCursor(82, 0);
    display.print("[No-Net]");
  }

  // Header separator line
  display.drawLine(0, 10, 127, 10, SSD1306_WHITE);

  if (timeValid)
  {
    // Convert 24h to 12h format
    int hour12 = timeinfo.tm_hour % 12;
    if (hour12 == 0) hour12 = 12;
    const char *amPm = (timeinfo.tm_hour >= 12) ? "PM" : "AM";

    char timeBuf[12];
    snprintf(timeBuf, sizeof(timeBuf), "%02d:%02d", hour12, timeinfo.tm_min);

    // Large Center Clock Time (Font Size 2)
    display.setTextSize(2);
    display.setCursor(18, 16);
    display.print(timeBuf);

    display.setTextSize(1);
    display.setCursor(84, 22);
    display.print(amPm);

    // Bottom Date String (e.g. "Mon, 19 Oct 2026")
    const char *dayNames[] = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
    const char *monthNames[] = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};

    char dateBuf[26];
    snprintf(dateBuf, sizeof(dateBuf), "%s, %02d %s %04d",
             dayNames[timeinfo.tm_wday],
             timeinfo.tm_mday,
             monthNames[timeinfo.tm_mon],
             timeinfo.tm_year + 1900);

    display.setCursor(6, 40);
    display.print(dateBuf);
  }
  else
  {
    display.setTextSize(1);
    display.setCursor(16, 20);
    display.print("Syncing Time...");
    display.setCursor(10, 38);
    display.print("Connect to WiFi");
  }

  // Footer separator
  display.drawLine(0, 52, 127, 52, SSD1306_WHITE);

  // Playful footer reminder
  display.setTextSize(1);
  display.setCursor(12, 55);
  display.print("* Tap Head to Chat *");

  display.display();
}

void serviceTouchSensor()
{
  const uint32_t nowMs = millis();
  static uint32_t s_lastTouchSampleMs = 0;
  if (nowMs - s_lastTouchSampleMs < 25) return; // Sample touch every 25ms
  s_lastTouchSampleMs = nowMs;

  // Read capacitive touch value from ESP32 pin (GPIO 4 / T0)
  uint16_t touchVal = touchRead(TOUCH_PIN_HEAD);
  // Also check digitalRead in case a digital touch sensor (TTP223 module) or button is connected
  bool digitalHigh = (digitalRead(TOUCH_PIN_HEAD) == HIGH);

  // Pressed if capacitive value drops below adaptive threshold OR digital signal goes HIGH
  bool isPressed = (touchVal < s_touchThreshold) || digitalHigh;

  // Slow ambient drift compensation when untouched
  if (!s_touchIsActive && !isPressed && touchVal > s_touchThreshold && abs((int)touchVal - (int)s_touchBaseline) < 20)
  {
    s_touchBaseline = (uint16_t)(((uint32_t)s_touchBaseline * 63 + touchVal) / 64);
    s_touchThreshold = (s_touchBaseline * 70) / 100;
    if (s_touchBaseline - s_touchThreshold < 10)
    {
      s_touchThreshold = (s_touchBaseline > 12) ? (s_touchBaseline - 10) : (s_touchBaseline / 2);
    }
  }

  // Periodic debug telemetry every 4 seconds so developer sees exact pin values in Serial Monitor
  static uint32_t s_lastDiagMs = 0;
  if (nowMs - s_lastDiagMs > 4000)
  {
    s_lastDiagMs = nowMs;
    Serial.printf("[Touch Telemetry] GPIO 4 TouchVal: %u | Baseline: %u | Thresh: %u | Active: %d\n",
                  touchVal, s_touchBaseline, s_touchThreshold, s_touchIsActive ? 1 : 0);
  }

  if (isPressed && !s_touchIsActive)
  {
    // Touch initiated
    s_touchIsActive = true;
    s_touchPressStartMs = nowMs;
    Serial.printf("[Touch] Contact detected on GPIO 4! (Val=%u, Thresh=%u, Dig=%d)\n",
                  touchVal, s_touchThreshold, digitalHigh ? 1 : 0);
  }
  else if (!isPressed && s_touchIsActive)
  {
    // Touch released
    s_touchIsActive = false;
    uint32_t duration = nowMs - s_touchPressStartMs;
    Serial.printf("[Touch] Released after %u ms\n", duration);

    if (duration >= 2200)
    {
      // Long press (Hold > 2.2s) -> Sleep / Bedtime Mood
      Serial.printf("[Touch] Long press (%u ms) -> Bedtime mode\n", duration);
      s_showClockUntilMs = 0;
      applyVoiceEyeAnimation("tired");
    }
    else if (duration >= 15) // responsive to quick taps
    {
      // Valid tap
      s_tapCounter++;
      s_lastTapReleaseMs = nowMs;
    }
  }

  // Multi-tap detection window (320ms)
  if (s_tapCounter > 0 && !s_touchIsActive && (nowMs - s_lastTapReleaseMs > 320))
  {
    if (s_tapCounter == 1)
    {
      // Single tap -> Display Date & Time on OLED for 4.5 seconds!
      Serial.printf("[Touch Action] Single tap -> Show Date & Time on OLED (4.5s)\n");
      s_showClockUntilMs = nowMs + 4500;
      applyVoiceEyeAnimation("happy");
    }
    else if (s_tapCounter >= 2)
    {
      // Double tap -> Playful Laugh / Tickle Reaction!
      Serial.printf("[Touch Action] Double tap! (Count=%u) -> Tickle / Laugh animation\n", s_tapCounter);
      s_showClockUntilMs = 0;
      applyVoiceEyeAnimation("laugh");
    }
    s_tapCounter = 0;
  }
}

void serviceMicrophoneInput()
{
  const uint32_t nowMs = millis();
  const bool wasSoundHigh = micState.soundHigh;

  // Don't poll mic while playing or downloading audio or during post-playback cooldown or while a voice turn is in progress!
  if (voiceTurn.state != VOICE_IDLE || audioState.isPlaying || audioState.isDownloading || (int32_t)(nowMs - s_playbackCooldownUntilMs) < 0)
  {
    micState.amplitude = 0;
    micState.soundHigh = false;
    micState.soundActive = false;
    micState.consecutiveHighReadings = 0;
    micState.silenceStartMs = 0;
    // Drain any residual audio chunks from mic DMA so no speaker reverberation remains!
    int32_t drainBuf[64];
    size_t drainedBytes = 0;
    i2s_read(I2S_MIC_PORT, drainBuf, sizeof(drainBuf), &drainedBytes, 0);
    return;
  }

  // Non-blocking read of available DMA samples
  int32_t sampleChunk[64];
  size_t bytesRead = 0;
  esp_err_t err = i2s_read(I2S_MIC_PORT, sampleChunk, sizeof(sampleChunk), &bytesRead, 0);

  if (err != ESP_OK || bytesRead == 0)
  {
    return;
  }

  size_t sampleCount = bytesRead / sizeof(int32_t);
  static float s_idleHpX1 = 0.0f;
  static float s_idleHpY1 = 0.0f;

  int32_t peakAmp = 0;
  for (size_t i = 0; i < sampleCount; ++i)
  {
    int32_t raw = sampleChunk[i] >> 15;
    int16_t cleanPcm = filterDcBlock(raw, s_idleHpX1, s_idleHpY1);
    int32_t amp = abs((int32_t)cleanPcm);
    if (amp > peakAmp)
    {
      peakAmp = amp;
    }
  }

  micState.rawValue = (uint16_t)min(peakAmp, (int32_t)32767);
  micState.amplitude = micState.rawValue;

  // Adaptive Ambient Noise Floor Tracking (DSP rolling average initialized from room calibration)
  static uint32_t s_lastNoiseFloorUpdateMs = 0;
  if (nowMs - s_lastNoiseFloorUpdateMs >= 100)
  {
    s_lastNoiseFloorUpdateMs = nowMs;
    // Slow exponential moving average (alpha ~ 1/32)
    s_ambientNoiseFloor = (s_ambientNoiseFloor * 31 + micState.amplitude) / 32;
  }

  // Dynamic Trigger Threshold: Calibrated to room acoustics + slow ambient drift
  const uint16_t dynamicSpikeThreshold = (uint16_t)max((uint32_t)s_calibratedSpikeThreshold, s_ambientNoiseFloor + 1800);
  const uint16_t dynamicReleaseThreshold = (uint16_t)(dynamicSpikeThreshold * 6 / 10);

  static uint32_t s_lastMicTelemetryMs = 0;
  if (nowMs - s_lastMicTelemetryMs >= 2000)
  {
    s_lastMicTelemetryMs = nowMs;
    Serial.printf("[Mic Monitor] Live: %d | Ambient: %u | Trigger: %u\n",
                  micState.amplitude, (unsigned int)s_ambientNoiseFloor, (unsigned int)dynamicSpikeThreshold);
  }

  if (micState.amplitude > 1200 && nowMs - micState.lastPrintMs >= 200)
  {
    Serial.printf("[Voice Sensing] Amp: %d (Trigger: %u)\n", micState.amplitude, (unsigned int)dynamicSpikeThreshold);
    micState.lastPrintMs = nowMs;
  }

  if (micState.amplitude > dynamicSpikeThreshold)
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
    if (micState.amplitude < dynamicReleaseThreshold)
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
    Serial.print("Sound detected! Peak amp: ");
    Serial.println(peakAmp);
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

    // Initialize SNTP network time sync for India Standard Time (UTC+5:30 -> 19800 sec)
    static bool s_ntpSyncStarted = false;
    if (!s_ntpSyncStarted)
    {
      configTime(19800, 0, "pool.ntp.org", "time.google.com");
      s_ntpSyncStarted = true;
      Serial.println("[NTP] Time synchronization initialized via SNTP (India Standard Time UTC+5:30)");
    }
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

  uint8_t buff[2048];
  int totalBytesWritten = 0;
  int remainingBytes = http.getSize();
  uint32_t lastDataMs = millis();
  const uint32_t streamTimeoutMs = 15000;
  size_t bytesSinceYield = 0;

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
        bytesSinceYield += bytesRead;
        if (remainingBytes > 0)
        {
          remainingBytes -= bytesRead;
        }
        lastDataMs = millis();
      }
      if (bytesSinceYield >= 4096)
      {
        bytesSinceYield = 0;
        taskYIELD();
      }
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
      vTaskDelay(pdMS_TO_TICKS(2));
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

  if (!s_wsConnected)
  {
    // Disconnect idle WebSocket client to free MbedTLS internal heap for HTTP upload
    webSocket.disconnect();
    delay(50);
  }

  if (audioCaptureBuffer == NULL)
  {
    captureState.isUploading = false;
    captureState.uploadPending = false;
    failVoiceTurn("Audio upload aborted: buffer is NULL");
    return;
  }

  if (!beginHttpWithOptionalSsl(http, sslClient, audioUrl))
  {
    captureState.isUploading = false;
    captureState.uploadPending = false;
    failVoiceTurn("Audio upload begin failed");
    return;
  }

  const size_t capturedCount = (captureState.writeIndex > 0) ? captureState.writeIndex : kAudioCaptureSampleCount;
  const size_t uploadBytes = capturedCount * sizeof(int16_t);
  const uint32_t uploadDurationMs = (uint32_t)((capturedCount * 1000UL) / kAudioCaptureSampleRate);

  http.addHeader("Content-Type", "application/octet-stream");
  http.addHeader("X-Sample-Rate", String(kAudioCaptureSampleRate));
  http.addHeader("X-Duration-Ms", String(uploadDurationMs));
  http.addHeader("X-Audio-Format", "raw_pcm_16le");
  http.addHeader("X-Stream-Audio", "true");

  const char *headerKeys[] = {"Content-Type", "X-Transcript", "X-Assistant-Reply", "X-TTS-Ready", "X-Turn-Status", "X-Eye-Expression"};
  http.collectHeaders(headerKeys, 6);

  uint8_t *payload = reinterpret_cast<uint8_t *>(audioCaptureBuffer);
  int httpCode = http.POST(payload, uploadBytes);
  if (httpCode < 0)
  {
    char tlsErrBuf[128] = {0};
    sslClient.lastError(tlsErrBuf, sizeof(tlsErrBuf));
    Serial.printf("[NetWorker] Upload attempt 1 returned %d (%s, TLS: %s), retrying in 600ms...\n",
                  httpCode, http.errorToString(httpCode).c_str(), tlsErrBuf);
    http.end();
    delay(600);
    if (beginHttpWithOptionalSsl(http, sslClient, audioUrl))
    {
      http.addHeader("Content-Type", "application/octet-stream");
      http.addHeader("X-Sample-Rate", String(kAudioCaptureSampleRate));
      http.addHeader("X-Duration-Ms", String(uploadDurationMs));
      http.addHeader("X-Audio-Format", "raw_pcm_16le");
      http.addHeader("X-Stream-Audio", "true");
      http.collectHeaders(headerKeys, 6);
      httpCode = http.POST(payload, uploadBytes);
    }
  }

  // Free audio buffer immediately after POST transmission to return heap for LittleFS / TLS
  freeAudioCaptureBuffer();

  if (httpCode == HTTP_CODE_OK || httpCode == 200)
  {
    setVoiceTurnState(VOICE_THINKING);
    String contentType = http.header("Content-Type");
    String transcript = urlDecode(http.header("X-Transcript"));
    String assistantReply = urlDecode(http.header("X-Assistant-Reply"));
    String eyeExpr = http.header("X-Eye-Expression");
    if (eyeExpr.length() > 0)
    {
      s_activeVoiceEyeExpr = eyeExpr;
      Serial.printf("[RoboEyes] Voice Eye Expression received: %s\n", eyeExpr.c_str());
    }

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

      Serial.println("[BACKEND JSON RESPONSE]");
      if (transcript.length() > 0)
      {
        Serial.printf("  Transcript: \"%s\"\n", transcript.c_str());
      }
      if (assistantReply.length() > 0)
      {
        Serial.printf("  Assistant: \"%s\"\n", assistantReply.c_str());
      }
      if (sttError.length() > 0)
      {
        Serial.printf("  STT Error: \"%s\"\n", sttError.c_str());
      }
      if (ttsError.length() > 0)
      {
        Serial.printf("  TTS Error: \"%s\"\n", ttsError.c_str());
      }

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
        if (assistantReply.length() > 0 && !ttsReady)
        {
          Serial.println("[NOTE] Assistant replied, but TTS audio was not ready.");
        }
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
      if (input.startsWith("VOL=") || input.startsWith("VOLUME="))
      {
        int eqIndex = input.indexOf('=');
        int newVol = input.substring(eqIndex + 1).toInt();
        if (newVol >= 10 && newVol <= 150)
        {
          s_speakerVolumePercent = (uint8_t)newVol;
          Serial.println();
          Serial.println("=================================================");
          Serial.printf("[VOLUME] Speaker volume set to %u%%\n", (unsigned int)s_speakerVolumePercent);
          Serial.println("=================================================");
          return;
        }
      }

      if (input.startsWith("BACKEND="))
      {
        String val = input.substring(8);
        val.trim();
        if (val.equalsIgnoreCase("LOCAL"))
        {
          val = "http://192.168.1.13:3000";
        }
        else if (val.equalsIgnoreCase("RENDER"))
        {
          val = "https://kotl.onrender.com";
        }

        if (val.startsWith("http://") || val.startsWith("https://"))
        {
          g_backend_url = val;
          prefs.putString("backend", val);
          Serial.println();
          Serial.println("=================================================");
          Serial.printf("[BACKEND] Backend URL updated to: %s\n", g_backend_url.c_str());
          Serial.println("=================================================");
          webSocket.disconnect();
          s_wsConnected = false;
          initWebSocketClient();
          return;
        }
      }

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
  const char *headerKeys[] = {"Content-Type", "X-Transcript", "X-Assistant-Reply", "X-TTS-Ready", "X-Eye-Expression"};
  http.collectHeaders(headerKeys, 5);

  String escapedPrompt = s_serialPromptText;
  escapedPrompt.replace("\"", "\\\"");
  String payload = "{\"text\":\"" + escapedPrompt + "\"}";

  const int httpCode = http.POST(payload);
  if (httpCode == HTTP_CODE_OK || httpCode == 200)
  {
    String contentType = http.header("Content-Type");
    String assistantReply = urlDecode(http.header("X-Assistant-Reply"));
    String eyeExpr = http.header("X-Eye-Expression");
    if (eyeExpr.length() > 0)
    {
      s_activeVoiceEyeExpr = eyeExpr;
      Serial.printf("[RoboEyes] Voice Eye Expression received: %s\n", eyeExpr.c_str());
    }

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

  String parsedEyeExpr;
  if (extractJsonString(payload, "eye_expression", &parsedEyeExpr) && parsedEyeExpr.length() > 0)
  {
    s_activeVoiceEyeExpr = parsedEyeExpr;
    Serial.printf("[RoboEyes] JSON Eye Expression received: %s\n", parsedEyeExpr.c_str());
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
