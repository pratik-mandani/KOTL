const fs = require('fs');
const path = require('path');

const wsPath = path.join(__dirname, '../services/websocket.js');
let content = fs.readFileSync(wsPath, 'utf8');

const targetStr = `    const sttResult = await transcribeAudio(tempWavPath);
    const transcript = (sttResult.text || "").trim();`;

const replacement = `    const sttResult = await transcribeAudio(tempWavPath);
    if (!sttResult.success) {
      console.warn(\`[WebSocket \${ws.deviceId}] STT error: \${sttResult.error}\`);
    }
    const transcript = (sttResult.text || "").trim();`;

const targetCrlf = targetStr.replace(/\n/g, '\r\n');
const replacementCrlf = replacement.replace(/\n/g, '\r\n');

if (content.includes(targetCrlf)) {
  content = content.replace(targetCrlf, replacementCrlf);
  fs.writeFileSync(wsPath, content, 'utf8');
  console.log('Successfully updated websocket.js (CRLF)');
} else if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync(wsPath, content, 'utf8');
  console.log('Successfully updated websocket.js (LF)');
} else {
  console.error('Target not found in websocket.js');
  process.exit(1);
}
