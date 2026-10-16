/**
 * KOTL Phonetic Pronunciation Formatter
 * Ensures the robot name "KOTL" is spoken naturally as "Kotil" / "કોટિલ" / "कोटिल"
 * instead of spelling letters out individually ("K-O-T-L").
 */

function toPhoneticSpokenText(text, preferredLang = null) {
  if (!text || typeof text !== "string") return "";

  const isGujarati = (preferredLang && preferredLang.startsWith("gu")) || /[\u0A80-\u0AFF]/.test(text);
  const isHindi = (preferredLang && preferredLang.startsWith("hi")) || /[\u0900-\u097F]/.test(text);

  let replacement = "Kotil";
  if (isGujarati) {
    replacement = "કોટિલ";
  } else if (isHindi) {
    replacement = "कोटिल";
  }

  // Matches KOTL, kotl, K.O.T.L., K-O-T-L, K O T L
  return text.replace(/\bK[\s.-]*O[\s.-]*T[\s.-]*L\b/gi, replacement);
}

module.exports = {
  toPhoneticSpokenText,
};
