const Groq = require('groq-sdk');

let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else {
  console.warn("WARNING: GROQ_API_KEY is missing. Groq API calls will fail.");
}

// Model to use — must support tool/function calling
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function buildSystemPrompt(user = null, language = 'en', activeOffers = []) {
  const userContext = user
    ? `User: ${user.name} (logged in). Use tools to fetch their orders directly.`
    : `User: Guest (not logged in). Ask them to login for order help.`;

  const lang = language === 'hi'
    ? 'Reply in Hindi (Devanagari). Use Hinglish if the user mixes languages.'
    : 'Reply in English. Switch to Hindi if the user writes in Hindi.';

  const offers = activeOffers.length
    ? `Offers: ${activeOffers.map(o => `${o.code} — ${o.description}`).join(', ')}`
    : '';

  return [
    `You are Vaani, the helpful AI for Vasudha Couture, a premium Indian fashion brand.`,
    `Be warm, culturally aware, and concise (under 120 words per reply).`,
    userContext,
    lang,
    offers,
    `Always use the available functions/tools to fetch real-time information.`,
    `Never invent product details — always use tool results.`,
    `Politely decline requests about politics, medical/legal advice, or explicit content.`
  ].filter(Boolean).join('\n');
}

module.exports = { buildSystemPrompt, groq, GROQ_MODEL };
