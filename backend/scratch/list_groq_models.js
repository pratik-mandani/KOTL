const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function listModels() {
  const apiKey = process.env.GROQ_API_KEY;
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  const data = await res.json();
  console.log("Available Groq Models on Key:");
  if (data.data) {
    data.data.forEach(m => console.log(" - " + m.id));
  } else {
    console.log(data);
  }
}

listModels();
