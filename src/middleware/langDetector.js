const HINDI_UNICODE_RANGE = /[\u0900-\u097F]/;
const COMMON_HINDI_WORDS = /\b(kya|hai|mujhe|chahiye|hain|namasté|namaste|aap|mera|tera|kaisa|kitna|kahan)\b/i;

function detectLanguage(text) {
  if (!text) return 'en';
  if (HINDI_UNICODE_RANGE.test(text)) return 'hi';        // Devanagari script = Hindi
  if (COMMON_HINDI_WORDS.test(text)) return 'hi';         // Hinglish words = Hindi mode
  return 'en';                                            // Default: English
}

function resolveLanguage(userPreference, detectedLang, sessionLang) {
  // Explicit preference always wins
  if (userPreference) return userPreference;
  // Detected language from current message overrides session
  if (detectedLang) return detectedLang;
  // Fall back to session language
  return sessionLang || 'en';
}

module.exports = {
  detectLanguage,
  resolveLanguage
};
