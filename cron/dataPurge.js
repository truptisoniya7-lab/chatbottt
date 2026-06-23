const cron = require('node-cron');
const { pool } = require('../config/database');

// runs daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const msgResult = await pool.query(
      `DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '90 days'`
    );
    
    const sessResult = await pool.query(
      `DELETE FROM chat_sessions WHERE created_at < NOW() - INTERVAL '90 days'`
    );
    
    await pool.query(
      `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE`
    );
    
    await pool.query(
      `DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '24 months'`
    );
    
    console.log(`[PURGE] Messages: ${msgResult.rowCount}, Sessions: ${sessResult.rowCount}`);
  } catch (err) {
    console.error('[PURGE ERROR]', err);
  }
});
