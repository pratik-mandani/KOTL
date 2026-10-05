const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { generateAssistantReply } = require("../services/assistant");

async function runTest() {
  console.log("===== TESTING KOTL ASSISTANT =====");
  console.log("Current env settings:");
  console.log(`LLM_PROVIDER: ${process.env.LLM_PROVIDER}`);
  console.log(`GROQ_API_KEY configured: ${process.env.GROQ_API_KEY ? "YES" : "NO"}`);
  console.log(`GEMINI_API_KEY configured: ${process.env.GEMINI_API_KEY ? "YES" : "NO"}`);

  const testText = "Hello KOTL, who are you?";
  console.log(`\nUser prompt: "${testText}"`);

  try {
    const result = await generateAssistantReply({ transcript: testText, sessionId: "test-session-1" });
    console.log("\nResponse received:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      const reply = result.reply;
      const wordCount = reply.split(/\s+/).filter(w => w.length > 0).length;
      console.log(`\nWord Count: ${wordCount}`);
      
      const hasMarkdown = /[\*\#\_\[\]\`]/.test(reply);
      console.log(`Has Markdown formatting: ${hasMarkdown ? "YES (FAIL)" : "NO (PASS)"}`);
      
      const lengthPass = wordCount >= 10 && wordCount <= 25;
      console.log(`Word Count in 10-25 range: ${lengthPass ? "PASS" : "WARNING (Expected 10-25 words)"}`);
    } else {
      console.log("\nError occurred during request!");
    }
  } catch (error) {
    console.error("Test failed to run:", error);
  }
}

runTest();
