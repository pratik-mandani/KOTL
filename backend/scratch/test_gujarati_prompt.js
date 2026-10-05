const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const systemPrompt = `You are KOTL, a wise and strategic AI assistant inspired by Chanakya.
Language Guidelines:
- If the user speaks or writes in English, reply in sharp, concise English.
- If the user speaks or writes in Gujarati or Gujlish (Latin script Gujarati like 'taru naam su che', 'kem cho', 'tane kone banavyo'):
  Always reply in natural, fluent Gujarati (e.g. "મારું નામ KOTL છે. હું તમારો સહાયક છું." or natural Gujlish "Maru naam KOTL chhe.").
- When asked who created you ("tane kone banavyo?"): State that you were created by your developer as a smart voice assistant.
- Keep answers strictly concise (10-25 words), direct, and respectful. Never generate broken or gibberish words.`;

async function testPrompt() {
  const apiKey = process.env.GROQ_API_KEY;
  const questions = [
    "ok good taru name su che?",
    "tane kone banavo?",
    "kem cho bhai?"
  ];

  for (const q of questions) {
    console.log(`\nUser: "${q}"`);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: q }
        ],
        max_tokens: 60
      })
    });
    const data = await res.json();
    console.log(`KOTL: "${data.choices?.[0]?.message?.content}"`);
  }
}

testPrompt();
