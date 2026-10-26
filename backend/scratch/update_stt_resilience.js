const fs = require('fs');
const path = require('path');

const sttPath = path.join(__dirname, '../services/stt.js');
let sttContent = fs.readFileSync(sttPath, 'utf8');

const targetFunction = `async function transcribeWithGroq(filePath) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      provider: "groq",
      text: null,
      confidence: null,
      error: "GROQ_API_KEY not configured",
    };
  }

  const audioBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const model = process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3";

  const { form, language, prompt } = prepareCompletionsFormData(
    audioBuffer,
    fileName,
    model,
    "en",
    "Hello KOTL."
  );

  console.log(\`[STT groq] Sending request to Groq STT API. Model: \${model}, Language: \${language}, Prompt: "\${prompt}"\`);

  try {
    const response = await fetch(GROQ_TRANSCRIPTION_URL, {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${apiKey}\`,
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(\`[STT groq] API returned error status: \${response.status}. Response: \${errorText}\`);
      return {
        success: false,
        provider: "groq",
        text: null,
        confidence: null,
        error: \`Groq transcription failed: \${response.status} \${errorText}\`,
      };
    }

    const data = await response.json();
    console.log(\`[STT groq] Raw response received:\`, JSON.stringify(data));

    const rawTranscript = typeof data.text === "string" ? data.text.trim() : "";
    const cleanTranscript = isBlacklistedNoiseTranscript(rawTranscript) ? "" : rawTranscript;

    if (rawTranscript && !cleanTranscript) {
      console.log(\`[STT groq] Filtered blacklisted noise/hallucination: "\${rawTranscript}"\`);
    }

    return {
      success: true,
      provider: "groq",
      text: cleanTranscript,
      confidence: typeof data.x_groq?.error === "undefined" ? 1.0 : null,
      error: null,
    };
  } catch (error) {
    console.error(\`[STT groq] Fetch error:\`, error.message);
    return {
      success: false,
      provider: "groq",
      text: null,
      confidence: null,
      error: error.message,
    };
  }
}`;

const replacementFunction = `async function transcribeWithGroq(filePath) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      provider: "groq",
      text: null,
      confidence: null,
      error: "GROQ_API_KEY not configured",
    };
  }

  const audioBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const candidateModels = [
    process.env.GROQ_TRANSCRIPTION_MODEL,
    "whisper-large-v3-turbo",
    "whisper-large-v3"
  ].filter(Boolean);
  const uniqueModels = [...new Set(candidateModels)];

  let lastError = null;

  for (const model of uniqueModels) {
    const { form, language, prompt } = prepareCompletionsFormData(
      audioBuffer,
      fileName,
      model,
      "en",
      "Hello KOTL."
    );

    console.log(\`[STT groq] Sending request to Groq STT API. Model: \${model}, Language: \${language}, Prompt: "\${prompt}"\`);

    try {
      const response = await fetch(GROQ_TRANSCRIPTION_URL, {
        method: "POST",
        headers: {
          Authorization: \`Bearer \${apiKey}\`,
        },
        body: form,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(\`[STT groq] Model \${model} returned status \${response.status}: \${errorText.slice(0, 120)}. Trying next candidate...\`);
        lastError = \`Groq transcription failed (\${model}): \${response.status} \${errorText}\`;
        continue;
      }

      const data = await response.json();
      console.log(\`[STT groq] Raw response received from \${model}:\`, JSON.stringify(data));

      const rawTranscript = typeof data.text === "string" ? data.text.trim() : "";
      const cleanTranscript = isBlacklistedNoiseTranscript(rawTranscript) ? "" : rawTranscript;

      if (rawTranscript && !cleanTranscript) {
        console.log(\`[STT groq] Filtered blacklisted noise/hallucination: "\${rawTranscript}"\`);
      }

      return {
        success: true,
        provider: "groq",
        model,
        text: cleanTranscript,
        confidence: typeof data.x_groq?.error === "undefined" ? 1.0 : null,
        error: null,
      };
    } catch (error) {
      console.warn(\`[STT groq] Model \${model} fetch error: \${error.message}. Trying next candidate...\`);
      lastError = error.message;
    }
  }

  return {
    success: false,
    provider: "groq",
    text: null,
    confidence: null,
    error: lastError || "All Groq STT models failed",
  };
}`;

const targetCrlf = targetFunction.replace(/\n/g, '\r\n');
const replacementCrlf = replacementFunction.replace(/\n/g, '\r\n');

if (sttContent.includes(targetCrlf)) {
  sttContent = sttContent.replace(targetCrlf, replacementCrlf);
  fs.writeFileSync(sttPath, sttContent, 'utf8');
  console.log('Successfully updated stt.js (CRLF)');
} else if (sttContent.includes(targetFunction)) {
  sttContent = sttContent.replace(targetFunction, replacementFunction);
  fs.writeFileSync(sttPath, sttContent, 'utf8');
  console.log('Successfully updated stt.js (LF)');
} else {
  console.error('Target function not found in stt.js');
  process.exit(1);
}
