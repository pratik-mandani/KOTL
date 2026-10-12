# 🏛️ KOTL Architecture, Single Source of Truth & Execution Plan

> **CRITICAL DIRECTIVE FOR ALL AGENTS & DEVELOPERS:**
> Read this file before proposing or changing ANY audio, backend, or firmware code.
> **DO NOT DEVIATE FROM THIS ARCHITECTURE.**

---

## 1. 🎯 The Core Philosophy: "Zero FFmpeg, Pure Direct API"
1. **NO Local Binary Executables**:
   - ❌ NO `ffmpeg.exe` or `ffmpeg` binaries.
   - ❌ NO `whisper-cli.exe` or local Whisper models.
   - ❌ NO `piper.exe` or local Piper models.
   - **Reason**: OS-specific binary executables cause path conflicts (`D:\...` on Windows vs `/app/...` on Linux containers like Render), fail silently in production, add deployment bloat, and create fragile multi-hop dependencies.
2. **Direct Google AI Studio (Gemini) Architecture**:
   - All voice intelligence (audio understanding & generation) is powered directly via **Google AI Studio / Gemini APIs**.
   - Gemini natively understands audio (multimodal speech-to-text-and-thought).
   - Clean, direct dataflow with zero brittle middleware.

---

## 2. 🚫 Banned Approaches & Lessons Learned (DO NOT REPEAT)

| Feature / Pattern | What Happened | Why It Is Banned |
| :--- | :--- | :--- |
| **FFmpeg Audio Conversion** | Tried converting MP3 to WAV using `ffmpeg` / `ffmpeg-static`. | Broke on Render (path mismatch `D:/KOTL...`), caused `tts_error` and silent failures. **BANNED.** |
| **4-Hop Legacy Pipeline** | ESP32 -> HTTP -> Groq Whisper -> Gemini LLM -> Edge TTS -> FFmpeg -> HTTP -> ESP32. | Took 6–8 seconds latency. If any single hop failed, entire device froze. **BANNED.** |
| **Analog Microphone (MAX9814)** | Captured analog via ADC1 Channel 6 (GPIO 34). | High noise floor, analog power sag from speaker, DC drift. **REPLACED by INMP441.** |
| **I2S MCLK Default to 0** | ESP32 Arduino 3.x defaulted `mck_io_num` to 0. | Threw `ESP_ERR_INVALID_ARG` because GPIO 0 (BOOT) was claimed by I2S 0. **FIXED: Always set `mck_io_num = I2S_PIN_NO_CHANGE`.** |
| **Static DRAM Buffer > 64 KB** | Set capture buffer to 112 KB (56,000 samples). | `dram0_0_seg` overflowed by 40 KB in ESP32 linker. **RULE: Buffer must remain <= 64 KB (32,000 samples).** |
| **Silent Backend Responses** | ESP32 ignored JSON responses without logging. | Device returned to `TURN IDLE` with zero feedback. **FIXED: Always log full JSON transcript and errors.** |

---

## 3. 🔌 Verified Hardware Configuration (LOCKED)

| Component | Interface | ESP32 Pins | Status |
| :--- | :--- | :--- | :--- |
| **INMP441 Mic** | Digital I2S DMA (`I2S_NUM_1`) | `SCK`=32, `WS`=33, `SD`=35, `L/R`=GND, `VDD`=3.3V | **VERIFIED & WORKING** (Senses amplitudes up to 16,000+) |
| **MAX98357A Speaker** | Digital I2S DMA (`I2S_NUM_0`) | `BCLK`=26, `LRC`=25, `DIN`=27, `VIN`=5V, `GND`=GND | **VERIFIED & WORKING** (Volume capped at 55% for zero distortion) |
| **SSD1306 OLED** | I2C (`400 kHz`) | `SDA`=21, `SCL`=22 | **VERIFIED & WORKING** (RoboEyes at 50 FPS) |
| **BOOT Button** | Digital GPIO | `GPIO 0` | **VERIFIED & WORKING** (Triggers manual voice turn) |

---

## 4. 🚀 Path 1: Target Architecture (Google Studio API Direct)

```
[Child Speaks]
      │
      ▼
[INMP441 I2S Mic] (16-bit 8kHz/16kHz Raw PCM in ESP32 DMA)
      │
      ▼ (HTTP POST /audio or WebSocket)
[Node.js Backend Gateway]
      │
      ▼ (Direct Multimodal Audio Payload: base64 audio/wav)
[Google AI Studio - Gemini 1.5/2.0 Flash]
      │ (Gemini directly listens, transcribes, and generates Gujarati response)
      ▼
[Cloud Audio Synthesis] (Clean PCM/WAV output WITHOUT local FFmpeg)
      │
      ▼ (Direct Stream to ESP32)
[MAX98357A I2S Speaker] ───> Instant Voice Reply!
```

---

## 5. 📋 Execution Checklist

- [x] Hardware: INMP441 I2S wiring verified and working.
- [x] Hardware: MAX98357A I2S speaker volume tuned to 55%.
- [x] Firmware: MCLK pin conflict fixed with `I2S_PIN_NO_CHANGE`.
- [x] Firmware: Buffer memory fits in DRAM (32,000 samples = 64KB).
- [ ] Backend: Integrate direct Gemini Multimodal Audio in `backend/services/gemini.js` (bypassing Whisper).
- [ ] Backend: Eliminate all FFmpeg calls from TTS pipeline; output direct WAV/PCM.
- [ ] Backend: Deploy and verify end-to-end on Render.
- [ ] Hardware Test: Voice spoken into INMP441 -> Gemini answers -> Speaker speaks loudly and clearly.
