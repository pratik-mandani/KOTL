# Piper Setup for KOTL Backend

## Overview

KOTL can use Piper as a local TTS provider when `TTS_PROVIDER=piper`. The backend keeps the same `/audio` response contract and still normalizes generated speech to mono PCM16 WAV for ESP32 playback.

## Windows Setup

1. Download a Windows Piper release.
   Recommended source: the Piper project releases page on GitHub.
2. Extract the archive to a stable local path, for example:
   `C:\tools\piper\`
3. Download a voice model and its matching JSON config file.
   Example:
   `en_US-lessac-medium.onnx`
   `en_US-lessac-medium.onnx.json`
4. Place both files under:
   `D:\KOTL\backend\models\piper\`
5. Make sure `ffmpeg` is installed and available on `PATH`.

## .env Configuration

Set these values in `backend/.env`:

```env
TTS_PROVIDER=piper
PIPER_BIN=C:/tools/piper/piper.exe
PIPER_MODEL_PATH=D:/KOTL/backend/models/piper/en_US-lessac-medium.onnx
PIPER_CONFIG_PATH=D:/KOTL/backend/models/piper/en_US-lessac-medium.onnx.json
TTS_PLAYBACK_SAMPLE_RATE=16000
```

To switch back to OpenAI TTS:

```env
TTS_PROVIDER=openai
```

## Validation

Run:

```bash
npm run check:piper
```

The check script validates:

- Piper binary exists and runs
- Piper model file exists
- Piper config file exists
- `ffmpeg` is available
- Piper can generate a short test WAV
- `ffmpeg` can normalize that WAV to the KOTL playback format

## Expected Runtime Behavior

- `AI_PROVIDER` can remain `ollama`
- `TTS_PROVIDER=piper` makes local assistant replies generate local speech
- final TTS WAV files are saved under `backend/uploads/tts/`
- `/tts/<filename>.wav` continues to serve the normalized output without any ESP32 firmware changes
