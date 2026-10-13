/**
 * KOTL Eye Animation & Expression Classifier
 * Detects voice commands and emotional context from speech and AI responses.
 */

function detectEyeExpression(transcript, assistantReply) {
  const text = (transcript || "").toLowerCase().trim();
  const reply = (assistantReply || "").toLowerCase().trim();

  // 1. Explicit voice commands in Hindi, Hinglish, and English:

  // Laugh / Smile / Joke
  if (
    /हंस|हंसो|हंसी|हंसके|मुस्कुरा|laugh|smile|joke|chutkula|चुटकुला|funny|haha|हाहा|hanso|hansi|muskura/.test(text)
  ) {
    return "laugh";
  }

  // Angry / Mad
  if (
    /गुस्सा|गुस्से|angry|mad|gussa|gusse/.test(text)
  ) {
    return "angry";
  }

  // Blink / Wink
  if (
    /पलक|झपका|blink|wink|aankh|आँख|palke|palken|jhapkao/.test(text)
  ) {
    return "blink";
  }

  // Look Up
  if (
    (/ऊपर|up|upar/.test(text) && /देखो|look|dekho/.test(text)) ||
    /look up|upar dekho/.test(text)
  ) {
    return "look_up";
  }

  // Look Down
  if (
    (/नीचे|down|niche|neeche/.test(text) && /देखो|look|dekho/.test(text)) ||
    /look down|niche dekho|neeche dekho/.test(text)
  ) {
    return "look_down";
  }

  // Look Left
  if (
    (/बाएं|left|baayein|baye/.test(text) && /देखो|look|dekho/.test(text)) ||
    /look left|left dekho|baye dekho/.test(text)
  ) {
    return "look_left";
  }

  // Look Right
  if (
    (/दाएं|right|daayein|daye/.test(text) && /देखो|look|dekho/.test(text)) ||
    /look right|right dekho|daye dekho/.test(text)
  ) {
    return "look_right";
  }

  // Confused / Curious / Wonder
  if (
    /कंफ्यूज|confuse|confused|curious|hairan|हैरान|socho|सोचो/.test(text)
  ) {
    return "confused";
  }

  // Sleep / Tired
  if (
    /सो जाओ|नींद|sleep|tired|sleepy|thak|थक|so jao|sojao|neend/.test(text)
  ) {
    return "tired";
  }

  // Normal / Center / Look Straight
  if (
    (/सीधे|सामने|normal|center|straight|saamne/.test(text) && /देखो|dekho|ho jao|हो जाओ/.test(text)) ||
    /look straight|normal ho jao|center dekho/.test(text)
  ) {
    return "default";
  }

  // 2. Contextual emotional cues from assistant's reply:
  if (/हाहा|haha|hehe|मजेदार|funny|laugh|lol/.test(reply)) {
    return "laugh";
  }
  if (/गुस्सा|angry|gussa/.test(reply)) {
    return "angry";
  }
  if (/सो जाओ|नींद|sleep|goodnight|शुभ रात्रि|so jao/.test(reply)) {
    return "tired";
  }
  if (/\?|क्या सच में|really|wonder|सोच/.test(reply)) {
    return "confused";
  }

  // Default happy kid companion expression while speaking
  return "happy";
}

module.exports = {
  detectEyeExpression,
};
