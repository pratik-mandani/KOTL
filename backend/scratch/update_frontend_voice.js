const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../frontend/app/page.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `  // Handlers
  const playVoice = (text) => {
    if (!text) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    }
  };`;

const targetCrlf = targetStr.replace(/\n/g, '\r\n');

const replacement = `  const fallbackBrowserTts = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const maleVoice = voices.find(v => {
          const n = (v.name || '').toLowerCase();
          return (n.includes('prabhat') || n.includes('male') || n.includes('david') || n.includes('ravi') || n.includes('george')) && !n.includes('female');
        });
        if (maleVoice) u.voice = maleVoice;
      }
      window.speechSynthesis.speak(u);
    }
  };

  // Handlers
  const playVoice = (text) => {
    if (!text || !text.trim()) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Fetch authentic hardware Edge TTS voice (en-IN-PrabhatNeural - Male)
    fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim() })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.url) {
          const audio = new Audio(data.url);
          audio.play().catch(() => fallbackBrowserTts(text));
        } else {
          fallbackBrowserTts(text);
        }
      })
      .catch(() => {
        fallbackBrowserTts(text);
      });
  };`;

const replacementCrlf = replacement.replace(/\n/g, '\r\n');

if (content.includes(targetCrlf)) {
  content = content.replace(targetCrlf, replacementCrlf);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated frontend/app/page.jsx (CRLF match)');
} else if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated frontend/app/page.jsx (LF match)');
} else {
  console.error('Target not found!');
  process.exit(1);
}
