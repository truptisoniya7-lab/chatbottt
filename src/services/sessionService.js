const redis = require('../config/redis');
const db = require('../config/database');

async function getSessionHistory(sessionId) {
  const historyStr = await redis.get(`session:${sessionId}:history`);
  return historyStr ? JSON.parse(historyStr) : [];
}

async function appendToSession(sessionId, message) {
  const historyKey = `session:${sessionId}:history`;
  const historyStr = await redis.get(historyKey);
  let history = historyStr ? JSON.parse(historyStr) : [];
  
  // Keep only the last 20 messages for Gemini context
  if (history.length >= 20) {
    history = history.slice(history.length - 19);
  }

  // Format specifically for Gemini 2.5 Flash
  const geminiMessage = {
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }]
  };
  
  history.push(geminiMessage);
  
  await redis.set(historyKey, JSON.stringify(history));
  await redis.expire(historyKey, 1800); // 30 mins TTL
  
  // Persist to Neon DB asynchronously
  try {
    // If user message, we might need to upsert session
    if (message.role === 'user') {
      await db.query(`
        INSERT INTO chat_sessions (session_id, language, page_context)
        VALUES ($1, $2, $3)
        ON CONFLICT (session_id) DO UPDATE 
        SET last_active_at = NOW(), language = $2
      `, [sessionId, message.language || 'en', message.page_context || '']);
    }

    await db.query(`
      INSERT INTO chat_messages (session_id, role, content, tokens_used, latency_ms, language)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      sessionId, 
      message.role, 
      message.content, 
      message.tokensUsed || null, 
      message.latencyMs || null, 
      message.language || 'en'
    ]);
  } catch (err) {
    console.error('Error persisting message to DB:', err);
  }
}

async function getSessionMeta(sessionId) {
  const metaStr = await redis.get(`session:${sessionId}:meta`);
  return metaStr ? JSON.parse(metaStr) : null;
}

async function setSessionMeta(sessionId, meta) {
  const key = `session:${sessionId}:meta`;
  await redis.set(key, JSON.stringify(meta));
  await redis.expire(key, 1800);
}

module.exports = {
  getSessionHistory,
  appendToSession,
  getSessionMeta,
  setSessionMeta
};
