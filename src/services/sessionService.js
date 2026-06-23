const { pool } = require('../config/database');
const redisClient = require('../config/redis');

async function getSessionHistory(sessionId) {
  const cacheKey = `session:${sessionId}:history`;
  if (redisClient) {
     const cached = await redisClient.get(cacheKey);
     if (cached) return JSON.parse(cached);
  }

  // Fallback to DB
  const { rows } = await pool.query(
    'SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 50',
    [sessionId]
  );
  
  const history = rows.map(r => ({
    role: r.role === 'assistant' ? 'model' : r.role,
    parts: [{ text: r.content }]
  }));

  if (redisClient && typeof redisClient.set === 'function') {
     await redisClient.set(cacheKey, JSON.stringify(history));
     await redisClient.expire(cacheKey, 1800); // 30 mins
  }
  return history;
}

async function appendToSession(sessionId, messageData) {
  const { rows: sessionRows } = await pool.query('SELECT session_id FROM chat_sessions WHERE session_id = $1', [sessionId]);
  if (sessionRows.length === 0) {
    await pool.query(
      'INSERT INTO chat_sessions (session_id, created_at, last_active_at) VALUES ($1, NOW(), NOW())',
      [sessionId]
    );
  } else {
    await pool.query('UPDATE chat_sessions SET last_active_at = NOW() WHERE session_id = $1', [sessionId]);
  }

  await pool.query(
    `INSERT INTO chat_messages (session_id, role, content, language, latency_ms, tokens_used, is_flagged, flag_reason) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      sessionId, 
      messageData.role, 
      messageData.content, 
      messageData.language || 'en', 
      messageData.latencyMs || null, 
      messageData.tokensUsed || null,
      messageData.isFlagged || false,
      messageData.flagReason || null
    ]
  );

  if (redisClient && typeof redisClient.del === 'function') {
     const cacheKey = `session:${sessionId}:history`;
     await redisClient.del(cacheKey);
  }
}

module.exports = { getSessionHistory, appendToSession };
