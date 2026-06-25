require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

const schema = `
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- USERS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(100) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255),           -- NULL for OAuth-only users
  google_id         VARCHAR(100) UNIQUE,    -- Google OAuth user ID
  avatar_url        VARCHAR(500),
  email_verified    BOOLEAN DEFAULT FALSE,
  role              VARCHAR(20) DEFAULT 'customer',  -- customer | admin | agent
  is_active         BOOLEAN DEFAULT TRUE,
  language_pref     VARCHAR(5) DEFAULT 'en',         -- en | hi
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  last_login_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- ─────────────────────────────────────────
-- REFRESH TOKENS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,   -- store hashed, not raw
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  device_info VARCHAR(255)                    -- optional: browser/device
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ─────────────────────────────────────────
-- CHAT SESSIONS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id        VARCHAR(64) PRIMARY KEY,
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL = guest
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
  ip_hash           VARCHAR(64)               -- hashed, not raw IP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON chat_sessions(created_at);

-- ─────────────────────────────────────────
-- CHAT MESSAGES TABLE
-- ─────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON chat_messages(is_flagged) WHERE is_flagged = TRUE;

-- ─────────────────────────────────────────
-- RETURN TICKETS TABLE
-- ─────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_returns_order_id ON return_tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON return_tickets(user_id);

-- ─────────────────────────────────────────
-- ANALYTICS EVENTS TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  event_id      BIGSERIAL PRIMARY KEY,
  session_id    VARCHAR(64),
  user_id       UUID,                         -- NULL for guest
  event_type    VARCHAR(64) NOT NULL,
  event_data    JSONB DEFAULT '{}',
  language      VARCHAR(5),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);

-- ─────────────────────────────────────────
-- KNOWLEDGE BASE TABLE
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_base (
  kb_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      VARCHAR(64) NOT NULL,
  title         VARCHAR(256) NOT NULL,
  content_en    TEXT NOT NULL,               -- English content
  content_hi    TEXT,                        -- Hindi translation
  tags          TEXT[],
  is_active     BOOLEAN DEFAULT TRUE,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_kb_tags ON knowledge_base USING GIN(tags);
`;

async function initDb() {
  try {
    console.log('Connecting to Neon DB...');
    await pool.query(schema);
    console.log('Successfully initialized schema.');
  } catch (error) {
    console.error('Error initializing DB:', error);
  } finally {
    pool.end();
  }
}

initDb();
