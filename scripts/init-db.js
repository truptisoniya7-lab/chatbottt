require('dotenv').config();
const { pool } = require('../config/database');

const initDb = async () => {
  try {
    console.log('Initializing database schema...');
    
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name              VARCHAR(100) NOT NULL,
        email             VARCHAR(255) UNIQUE NOT NULL,
        password_hash     VARCHAR(255),
        google_id         VARCHAR(100) UNIQUE,
        avatar_url        VARCHAR(500),
        email_verified    BOOLEAN DEFAULT FALSE,
        role              VARCHAR(20) DEFAULT 'customer',
        is_active         BOOLEAN DEFAULT TRUE,
        language_pref     VARCHAR(5) DEFAULT 'en',
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW(),
        last_login_at     TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  VARCHAR(255) NOT NULL UNIQUE,
        expires_at  TIMESTAMPTZ NOT NULL,
        revoked     BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        device_info VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS chat_sessions (
        session_id        VARCHAR(64) PRIMARY KEY,
        user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
        is_authenticated  BOOLEAN DEFAULT FALSE,
        language          VARCHAR(5) DEFAULT 'en',
        page_context      VARCHAR(128),
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        last_active_at    TIMESTAMPTZ DEFAULT NOW(),
        is_escalated      BOOLEAN DEFAULT FALSE,
        freshdesk_ticket  VARCHAR(64),
        csat_score        SMALLINT CHECK (csat_score BETWEEN 1 AND 5),
        csat_feedback     TEXT,
        session_ended_at  TIMESTAMPTZ,
        ip_hash           VARCHAR(64)
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        message_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id    VARCHAR(64) NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
        role          VARCHAR(16) NOT NULL CHECK (role IN ('user','assistant','system')),
        content       TEXT NOT NULL,
        intent        VARCHAR(64),
        confidence    DECIMAL(4,3),
        tokens_used   INTEGER,
        latency_ms    INTEGER,
        language      VARCHAR(5),
        is_flagged    BOOLEAN DEFAULT FALSE,
        flag_reason   VARCHAR(128),
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS return_tickets (
        return_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id      VARCHAR(64) NOT NULL,
        session_id    VARCHAR(64) REFERENCES chat_sessions(session_id),
        user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
        reason        VARCHAR(64),
        return_type   VARCHAR(16) CHECK (return_type IN ('refund','exchange','store_credit')),
        status        VARCHAR(32) DEFAULT 'initiated',
        notes         TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        resolved_at   TIMESTAMPTZ,
        refund_amount DECIMAL(10,2)
      );

      CREATE TABLE IF NOT EXISTS analytics_events (
        event_id      BIGSERIAL PRIMARY KEY,
        session_id    VARCHAR(64),
        user_id       UUID,
        event_type    VARCHAR(64) NOT NULL,
        event_data    JSONB DEFAULT '{}',
        language      VARCHAR(5),
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS knowledge_base (
        kb_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category      VARCHAR(64) NOT NULL,
        title         VARCHAR(256) NOT NULL,
        content_en    TEXT NOT NULL,
        content_hi    TEXT,
        tags          TEXT[],
        is_active     BOOLEAN DEFAULT TRUE,
        created_by    UUID REFERENCES users(id),
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Database schema created successfully.');
  } catch (error) {
    console.error('Error creating database schema:', error);
  } finally {
    pool.end();
  }
};

initDb();
