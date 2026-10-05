const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function testWorkingGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  for (const model of ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]) {
    console.log(`Testing Groq model: ${model}...`);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are Chanakya, wise strategist. Reply in 15 words." },
            { role: "user", content: "who are you can you give me introduction pls?" }
          ],
          max_tokens: 60
        })
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`  -> SUCCESS! Reply: "${data.choices[0]?.message?.content}"`);
      } else {
        console.log(`  -> FAILED:`, data.error?.message || JSON.stringify(data));
      }
    } catch (err) {
      console.log(`  -> ERROR:`, err.message);
    }
  }
}

testWorkingGroq();
