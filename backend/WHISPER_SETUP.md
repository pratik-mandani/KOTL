# Whisper.cpp Setup for KOTL Backend

## Overview

KOTL can use whisper.cpp as a local speech-to-text provider when `STT_PROVIDER=whisper_cpp`. This keeps the existing `/audio` flow and metadata keys unchanged while replacing only the transcription backend.

## Windows Setup

1. Download or build whisper.cpp for Windows.
2. Place the CLI binary under:
   `D:/KOTL/tools/whisper/`
   Example:
   `D:/KOTL/tools/whisper/whisper-cli.exe`
3. Download the model file:
   `ggml-base.en.bin`
4. Place the model under:
   `D:/KOTL/backend/models/whisper/`
5. Confirm `ffmpeg` remains available through:
   `FFMPEG_BIN=D:/KOTL/tools/ffmpeg/bin/ffmpeg.exe`

## .env Configuration

Set these values in `backend/.env`:

```env
STT_PROVIDER=whisper_cpp
WHISPER_BIN=D:/KOTL/tools/whisper/whisper-cli.exe
WHISPER_MODEL_PATH=D:/KOTL/backend/models/whisper/ggml-base.en.bin
WHISPER_LANGUAGE=auto

AI_PROVIDER=ollama
TTS_PROVIDER=piper
```

To switch back to OpenAI STT:

```env
STT_PROVIDER=openai
```

## Validation

Run:

```bash
npm run check:whisper
```

The check validates:

- Whisper binary exists and runs
- Whisper model exists
- ffmpeg is available
- a test WAV is available from `backend/uploads` or can be generated locally
- whisper.cpp can transcribe the test WAV
- the transcript is non-empty after normalization

## Expected Runtime Behavior

- `/audio` still saves raw audio, WAV, and metadata
- `transcript_provider` becomes `whisper_cpp`
- `assistant_provider` can remain `ollama`
- `tts_provider` can remain `piper`
- `/tts/<filename>.wav` behavior is unchanged
