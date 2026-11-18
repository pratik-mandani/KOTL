/**
 * KOTL — Standalone Gemini Live API Prototype Server
 * Path: prototypes/gemini-live/server.js
 *
 * Implements Google's Gemini Multimodal Live API over WebSockets:
 * - Model: models/gemini-3.8-live (configured via GEMINI_LIVE_MODEL)
 * - Endpoint: wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent
 * - Input Audio: 16kHz 16-bit Mono PCM (realtimeInput.audio)
 * - Output Audio: Native 24kHz 16-bit Mono PCM (serverContent.modelTurn.parts[].inlineData)
 * - Interruption: Native server-side VAD & barge-in handling (serverContent.interrupted)
 *
 * SAFETY GUARANTEES:
 * - Completely isolated under prototypes/gemini-live/
 * - Zero modifications to production backend, dashboard, or ESP32 firmware
 * - Resolves existing ws, express, and dotenv from backend/node_modules
 * - Never logs or exposes GEMINI_API_KEY
 */

const path = require('path');
const http = require('http');

// Resilient module loader: resolves locally or from backend/node_modules
function loadModule(name) {
  try {
    return require(name);
  } catch (_) {
    return require(path.resolve(__dirname, '../../backend/node_modules', name));
  }
}
const express = loadModule('express');
const WebSocket = loadModule('ws');
const dotenv = loadModule('dotenv');

// Load environment variables from backend/.env if present (Render injects directly into process.env)
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

// Listen on Render's assigned PORT with fallback to GEMINI_LIVE_PORT or 4000
const PORT = Number(process.env.PORT) || Number(process.env.GEMINI_LIVE_PORT) || 4000;
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_LIVE_MODEL || 'models/gemini-3.8-live';
const VOICE = process.env.GEMINI_LIVE_VOICE || 'Puck';

const app = express();
const server = http.createServer(app);

// Serve isolated static prototype frontend
app.use(express.static(path.join(__dirname, 'public')));

// Minimal health & status route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    prototype: 'gemini-live',
    model: MODEL,
    voice: VOICE,
    keyConfigured: Boolean(API_KEY && API_KEY.length > 5),
  });
});

// Setup local WebSocket relay server on path /live
const wss = new WebSocket.Server({ server, path: '/live' });

wss.on('connection', (clientWs, req) => {
  console.log('[Prototype] Browser client connected to /live');

  if (!API_KEY || API_KEY.trim().length === 0) {
    console.error('[Prototype] ERROR: GEMINI_API_KEY is not configured in backend/.env');
    clientWs.send(
      JSON.stringify({
        type: 'error',
        error: 'GEMINI_API_KEY is missing in backend/.env. Please configure your key and restart.',
      })
    );
    clientWs.close();
    return;
  }

  const googleWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
  let googleWs = null;
  let isGoogleReady = false;

  try {
    googleWs = new WebSocket(googleWsUrl);
  } catch (err) {
    console.error('[Prototype] Failed to initialize WebSocket to Google:', err.message);
    clientWs.send(JSON.stringify({ type: 'error', error: 'Failed to connect to Google Live API: ' + err.message }));
    return;
  }

  googleWs.on('open', () => {
    console.log(`[Prototype] Connected to Google Gemini Live API. Initializing setup for model: ${MODEL}...`);

    // Official setup schema using camelCase
    const setupPayload = {
      setup: {
        model: MODEL,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: VOICE,
              },
            },
          },
        },
        systemInstruction: {
          parts: [
            {
              text: 'You are KOTL, a warm, lively, empathetic emotional assistant robot companion for children and families. Keep your answers natural, friendly, conversational, and concise.',
            },
          ],
        },
      },
    };

    googleWs.send(JSON.stringify(setupPayload));
  });

  googleWs.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString('utf8'));

      // 1. Handshake Acknowledgment
      if (msg.setupComplete) {
        isGoogleReady = true;
        console.log('[Prototype] Setup complete! Gemini Live session active.');
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'setupComplete',
              model: MODEL,
              voice: VOICE,
            })
          );
        }
        return;
      }

      // 2. Interruption / Barge-in Detection
      if (msg.serverContent && msg.serverContent.interrupted) {
        console.log('⚡ [Prototype] Gemini output interrupted by user voice (Barge-in)!');
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'interrupted' }));
        }
        return;
      }

      // 3. Audio & Text Content Streaming
      if (msg.serverContent && msg.serverContent.modelTurn && msg.serverContent.modelTurn.parts) {
        for (const part of msg.serverContent.modelTurn.parts) {
          // Native Audio chunk (24kHz PCM)
          if (part.inlineData && part.inlineData.data) {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'audio',
                  mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                  data: part.inlineData.data,
                })
              );
            }
          }
          // Optional text/transcript chunk
          if (part.text && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'transcript',
                role: 'model',
                text: part.text,
              })
            );
          }
        }
      }

      // 4. Turn Completion
      if (msg.serverContent && msg.serverContent.turnComplete) {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'turnComplete' }));
        }
      }

      // 5. Connection Expiration Notice (GoAway)
      if (msg.goAway) {
        console.warn('[Prototype] Received goAway notification from Google. Time left:', msg.goAway.timeLeft);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'goAway',
              timeLeft: msg.goAway.timeLeft,
            })
          );
        }
      }
    } catch (parseErr) {
      console.warn('[Prototype] Non-JSON or unhandled message from Google:', parseErr.message);
    }
  });

  googleWs.on('error', (err) => {
    console.error('[Prototype] Google Live API WebSocket error:', err.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error: 'Google Gemini Live API error. Check API key validity or quota.',
        })
      );
    }
  });

  googleWs.on('close', (code, reason) => {
    const reasonStr = reason ? reason.toString('utf8') : '';
    console.log(`[Prototype] Google Live socket closed (code: ${code}, reason: "${reasonStr}")`);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'googleClosed',
          code,
          reason: reasonStr,
        })
      );
    }
  });

  // Relay client microphone audio upstream to Google
  clientWs.on('message', (data, isBinary) => {
    if (!googleWs || googleWs.readyState !== WebSocket.OPEN || !isGoogleReady) {
      return;
    }

    if (isBinary) {
      // Raw 16kHz 16-bit PCM binary frame from browser
      const base64Audio = data.toString('base64');
      const inputPayload = {
        realtimeInput: {
          audio: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Audio,
          },
        },
      };
      googleWs.send(JSON.stringify(inputPayload));
    } else {
      // JSON control message from browser
      try {
        const parsed = JSON.parse(data.toString('utf8'));
        if (parsed.type === 'audio' && parsed.data) {
          const inputPayload = {
            realtimeInput: {
              audio: {
                mimeType: parsed.mimeType || 'audio/pcm;rate=16000',
                data: parsed.data,
              },
            },
          };
          googleWs.send(JSON.stringify(inputPayload));
        } else if (parsed.type === 'text' && parsed.text) {
          // Client manual text turn
          const textPayload = {
            clientContent: {
              turns: [
                {
                  role: 'user',
                  parts: [{ text: parsed.text }],
                },
              ],
              turnComplete: true,
            },
          };
          googleWs.send(JSON.stringify(textPayload));
        }
      } catch (err) {
        console.warn('[Prototype] Invalid JSON from client:', err.message);
      }
    }
  });

  clientWs.on('close', () => {
    console.log('[Prototype] Browser client disconnected.');
    if (googleWs && googleWs.readyState === WebSocket.OPEN) {
      googleWs.close();
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('=====================================================================');
  console.log(`  KOTL — Gemini Live Prototype Server running on: http://0.0.0.0:${PORT}`);
  console.log(`  Target Live Model: ${MODEL} | Voice: ${VOICE}`);
  console.log('=====================================================================');
});
