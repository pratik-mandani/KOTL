const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const modelsToTest = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.2-3b-preview",
  "llama-3.2-1b-preview",
  "mixtral-8x7b-32768",
  "gemma2-9b-it"
];

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  console.log("Testing Groq API Key:", apiKey ? apiKey.slice(0, 8) + "..." : "NONE");

  for (const model of modelsToTest) {
    console.log(`\nTesting Groq model: ${model}...`);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Hi" }],
          max_tokens: 20
        })
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`  -> SUCCESS! Response: "${data.choices[0]?.message?.content}"`);
      } else {
        console.log(`  -> FAILED (${res.status}):`, data.error?.message || JSON.stringify(data));
      }
    } catch (err) {
      console.log(`  -> FETCH ERROR:`, err.message);
    }
  }
}

testGroq();
