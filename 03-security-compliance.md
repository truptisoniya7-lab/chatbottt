# DOC 3 — Security & Compliance Document
## Vaani: AI Customer Support Chatbot — Vasudha Couture

> **Document Type:** Security & Compliance  
> **Version:** 2.0.0  
> **Stack:** Gemini 2.5 Flash · Node.js · Neon DB · JWT Auth  
> **Frameworks:** DPDPA 2023 · IT Act 2000 · OWASP Top 10  
> **Owner:** Security Architect

---

## 1. Security Philosophy

Vaani is built under three core security principles:

**1. API Key Isolation** — The Gemini 2.5 Flash API key is exclusively server-side. It never appears in the chat widget JavaScript, browser network calls, or any client-accessible resource.

**2. Privacy by Design** — PII is stripped before reaching the AI model. Data is minimised, encrypted at rest, and auto-purged after 90 days.

**3. Least Privilege Auth** — JWT access tokens are short-lived (15 min). Refresh tokens are single-use, rotated on every use, and hashed in the database. Guest users have read-only access to general AI and FAQs only.

---

## 2. Threat Model (STRIDE Analysis)

| # | Threat | Vector | Risk Level | Mitigation |
|---|--------|--------|-----------|------------|
| T1 | Gemini API key exposed in widget JS | Client-side code inspection | 🔴 Critical | Key lives only in Node.js `.env`; all AI calls proxied through server |
| T2 | Prompt injection via user message | Chat input | 🔴 Critical | Input sanitisation middleware; Gemini safety filters; system prompt hardening |
| T3 | Order data exposed to wrong user | Forged session or IDOR on order lookup | 🔴 Critical | JWT user ID binding; order phone verification for guests; DB-level ownership checks |
| T4 | JWT token theft (XSS) | Malicious script on page | 🟠 High | Access token in memory (not localStorage in widget); HttpOnly cookie for refresh token |
| T5 | Brute force on login | POST /auth/login | 🟠 High | Rate limit: 5 attempts/15 min per IP; account lockout after 10 failures |
| T6 | Credential stuffing | Automated login attempts | 🟠 High | Cloudflare Bot Management; CAPTCHA after 3 failed logins |
| T7 | PII in LLM prompt (sent to Google) | Unfiltered user message | 🟠 High | PII stripper runs before every Gemini API call |
| T8 | DDoS on chat API | Flood of POST /chat/message | 🟡 Medium | Cloudflare WAF + rate limiting at both Cloudflare and app level |
| T9 | Admin KB poisoning | Compromised admin account | 🟡 Medium | MFA required for all admin roles; KB edit approval workflow |
| T10 | Refresh token reuse (token theft) | Stolen cookie/token | 🟡 Medium | Refresh token rotation; revoke all sessions on suspicious reuse |
| T11 | Chat transcript in analytics leak | Third-party SDK | 🟡 Medium | Only anonymised event metadata sent to PostHog; never message content |
| T12 | Neon DB connection string exposed | Misconfigured env | 🟡 Medium | `.env` not committed; Railway/Render secrets vault; Neon IP allowlist |

---

## 3. Gemini API Key Security

### 3.1 Why This Is Critical

The Gemini API key grants unrestricted access to Google AI services and incurs per-token billing. If exposed:
- Competitor could query it freely at Vasudha's cost
- Malicious actors could generate harmful content billed to Vasudha
- Google may suspend the key, taking Vaani offline

### 3.2 Protection Architecture

```
❌ WRONG — Never do this:
<script>
  const API_KEY = 'AIza...';  // Visible to anyone who Views Source
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`);
</script>

✅ CORRECT — Always proxy through backend:
// Widget sends to YOUR server:
POST https://api.vasudha.com/chat/message
  → Node.js backend validates JWT
  → Node.js reads GEMINI_API_KEY from process.env
  → Node.js calls Google AI API (server-to-server)
  → Returns only the text response to the widget
```

### 3.3 Server-Side Key Management

```javascript
// config/gemini.js — API key used only here, server-side
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set. Server cannot start.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Key stored in:
// Development: .env file (gitignored)
// Production: Railway / Render environment secrets vault
```

### 3.4 API Key Rotation Plan

| Event | Action | Timeframe |
|-------|--------|-----------|
| Routine rotation | Generate new key in Google AI Studio; update Railway secret | Every 90 days |
| Suspected exposure | Immediately revoke in Google AI Studio; generate new key | Within 15 minutes |
| Team member leaves | Rotate all secrets | Within 24 hours |
| After deployment | Verify old key deactivated | Same day |

---

## 4. Authentication Security

### 4.1 Password Hashing

```javascript
// services/authService.js
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;  // ~300ms hash time — strong against brute force

async function hashPassword(plaintext) {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

// Password strength requirements
function validatePasswordStrength(password) {
  const rules = {
    minLength:    password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit:     /\d/.test(password),
    hasSpecial:   /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const passed = Object.values(rules).filter(Boolean).length;
  return { valid: passed >= 4, rules };
}
```

### 4.2 JWT Token Design

```javascript
// services/authService.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email:  user.email,
      role:   user.role,
      type:   'access',
    },
    process.env.JWT_SECRET,
    {
      expiresIn:  '15m',                  // Short-lived
      algorithm:  'HS256',
      issuer:     'vasudha-couture',
      audience:   'vaani-widget',
    }
  );
}

async function generateRefreshToken(userId, deviceInfo = '') {
  const rawToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  
  // Store HASH in DB (not raw token)
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info)
     VALUES ($1, $2, NOW() + INTERVAL '7 days', $3)`,
    [userId, tokenHash, deviceInfo]
  );
  
  return rawToken; // Send raw token to client via HttpOnly cookie
}

async function rotateRefreshToken(oldRawToken, userId, deviceInfo) {
  const oldHash = crypto.createHash('sha256').update(oldRawToken).digest('hex');
  
  // Verify token exists and is valid
  const { rows } = await db.query(
    `SELECT * FROM refresh_tokens 
     WHERE token_hash = $1 AND user_id = $2 AND revoked = FALSE AND expires_at > NOW()`,
    [oldHash, userId]
  );
  
  if (!rows[0]) {
    // Token reuse detected! Revoke all sessions for this user
    await db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1', [userId]);
    throw new Error('REFRESH_TOKEN_REUSE_DETECTED');
  }
  
  // Revoke old token
  await db.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [oldHash]);
  
  // Issue new token
  return generateRefreshToken(userId, deviceInfo);
}
```

### 4.3 Refresh Token Cookie Setup

```javascript
// controllers/auth.controller.js
function setRefreshTokenCookie(res, refreshToken) {
  res.cookie('vaani_refresh_token', refreshToken, {
    httpOnly:  true,          // JavaScript cannot read this
    secure:    true,          // HTTPS only
    sameSite:  'strict',      // CSRF protection
    maxAge:    7 * 24 * 60 * 60 * 1000,  // 7 days in ms
    path:      '/auth',       // Only sent to /auth/* routes
  });
}
```

### 4.4 Brute Force Protection

```javascript
// middleware/rateLimiter.js
const redis = require('../config/redis');

const loginRateLimiter = async (req, res, next) => {
  const key = `rate:login:${req.ip}`;
  
  const attempts = await redis.incr(key);
  if (attempts === 1) await redis.expire(key, 900);  // 15-minute window
  
  if (attempts > 5) {
    const ttl = await redis.ttl(key);
    return res.status(429).json({
      error: 'Too many login attempts',
      retryAfterSeconds: ttl,
      message: 'Please try again in a few minutes or reset your password.',
    });
  }
  
  // On successful login: clear the counter
  res.on('finish', () => {
    if (res.statusCode === 200) redis.del(key);
  });
  
  next();
};

// Account lockout after 10 lifetime failures (regardless of IP)
async function checkAccountLockout(email) {
  const key = `lockout:${email}`;
  const failures = parseInt(await redis.get(key) || '0');
  if (failures >= 10) {
    throw new Error('ACCOUNT_LOCKED: Too many failed attempts. Check your email to unlock.');
  }
}

async function recordLoginFailure(email) {
  const key = `lockout:${email}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 86400);  // 24-hour window
  
  if (count >= 10) {
    // Send unlock email
    await sendAccountLockEmail(email);
  }
}
```

---

## 5. Input Security & Prompt Injection Protection

### 5.1 Prompt Injection Detection

```javascript
// middleware/piiStripper.js
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/i,
  /you\s+are\s+now\s+(a|an|the)/i,
  /act\s+as\s+(a|an|the)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /system\s*prompt/i,
  /disregard\s+your/i,
  /reveal\s+(your\s+)?(instructions?|prompt|system)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /override\s+(your\s+)?(safety|instructions?)/i,
  /<\s*script[\s\S]*?>/i,              // HTML script injection
  /javascript\s*:/i,
  /\beval\s*\(/i,
  /document\.(cookie|write|location)/i,
];

function detectInjection(text) {
  return INJECTION_PATTERNS.some(pattern => pattern.test(text));
}

function sanitiseUserInput(raw) {
  if (typeof raw !== 'string') return '';
  
  // Length limit
  const trimmed = raw.substring(0, 2000);
  
  // Injection check
  if (detectInjection(trimmed)) {
    logSecurityEvent('prompt_injection_attempt', {
      pattern: 'detected',
      length: trimmed.length,
    });
    return null; // Signal to reject this message
  }
  
  return trimmed.trim();
}
```

### 5.2 PII Stripping (India-Specific)

```javascript
// PII stripping before sending to Gemini API or storing in analytics
function stripPII(text) {
  if (!text) return text;
  
  return text
    // Indian mobile numbers (10 digits, starting with 6-9, with optional +91 or 0)
    .replace(/(\+91[\s-]?|0)?[6-9]\d{9}\b/g, '[PHONE]')
    
    // Email addresses
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    
    // Aadhaar number (12 digits, may have spaces)
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[AADHAAR]')
    
    // PAN card (ABCDE1234F format)
    .replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, '[PAN]')
    
    // UPI IDs (user@bankname)
    .replace(/\b\w[\w.]+@(upi|paytm|ybl|okaxis|okhdfcbank|okicici|oksbi|ibl|axl|apl|barodampay)\b/gi, '[UPI]')
    
    // IFSC codes
    .replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g, '[IFSC]')
    
    // Credit/debit card numbers (13-19 digits, may have spaces/dashes)
    .replace(/\b(?:\d[ -]?){13,19}\b/g, '[CARD]')
    
    // OTP patterns (4-6 digit numbers in context)
    .replace(/\b(otp|OTP|passcode)\s*[:\s]\s*\d{4,6}\b/g, '[OTP]')
    
    // Passport numbers (Indian format: A1234567)
    .replace(/\b[A-Z]\d{7}\b/g, '[PASSPORT]');
}

// Also strip from Hindi text
function stripPIIHindi(text) {
  // Hindi numbers (Devanagari) combined with patterns
  return stripPII(text)
    .replace(/[\u0966-\u096F]{10}/g, '[PHONE]')    // Devanagari 10-digit number
    .replace(/[\u0966-\u096F]{12}/g, '[AADHAAR]'); // Devanagari 12-digit number
}
```

---

## 6. Data Privacy & Compliance

### 6.1 Data Classification Table

| Data Type | Classification | Storage | Encryption | Retention |
|-----------|---------------|---------|-----------|-----------|
| Passwords | Critical | Neon DB | bcrypt (not reversible) | Until account deleted |
| Refresh tokens | Critical | Neon DB | SHA-256 hash only | 7 days or until revoked |
| Chat messages | Sensitive | Neon DB | AES-256 at rest (Neon) | 90 days → auto-purged |
| User email | PII | Neon DB | AES-256 at rest | Account lifetime |
| User phone (if provided) | PII | Not stored in chat DB | — | Never stored in chat |
| Order IDs in chat | Confidential | Neon DB | AES-256 at rest | 90 days |
| IP addresses | PII | Redis only | Last octet zeroed before storage | 30 days |
| CSAT scores | Internal | Neon DB | Standard | 12 months |
| Analytics events | Internal | PostHog (anonymised) | — | 24 months |
| Google OAuth tokens | Critical | Never stored | — | Not persisted |

### 6.2 DPDPA 2023 Compliance (India)

India's **Digital Personal Data Protection Act, 2023** requirements:

| Obligation | Implementation |
|-----------|---------------|
| **Notice** | Privacy notice shown in chat widget before first message; link to full Privacy Policy |
| **Consent** | Explicit "I agree" checkbox before data-collecting features (account creation) |
| **Purpose Limitation** | Chat data used only for support quality and service improvement; not sold or shared |
| **Data Minimisation** | PII stripped before AI processing; no unnecessary data collected |
| **Accuracy** | Users can update profile via `/auth/me` PUT endpoint |
| **Storage Limitation** | Chat messages auto-deleted after 90 days (scheduled cron job) |
| **Right to Access** | User can request data export via support email → processed in 72 hours |
| **Right to Erasure** | "Delete my account" flow removes all personal data within 72 hours |
| **Grievance Officer** | DPO contact in Privacy Policy: privacy@vasudha.com |
| **Security Safeguards** | Documented in this security document; annual review |
| **Data Breach Notification** | Notify affected users within 72 hours; report to DPBI as required |

### 6.3 Data Retention Auto-Purge

```javascript
// cron/dataPurge.js — runs daily at 2 AM IST
const cron = require('node-cron');
const db = require('../config/database');

cron.schedule('0 2 * * *', async () => {
  try {
    // Delete chat messages older than 90 days
    const msgResult = await db.query(
      `DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '90 days'`
    );
    
    // Delete sessions older than 90 days
    const sessResult = await db.query(
      `DELETE FROM chat_sessions WHERE created_at < NOW() - INTERVAL '90 days'`
    );
    
    // Delete expired refresh tokens
    await db.query(
      `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE`
    );
    
    // Purge analytics events older than 24 months
    await db.query(
      `DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '24 months'`
    );
    
    console.log(`[PURGE] Messages: ${msgResult.rowCount}, Sessions: ${sessResult.rowCount}`);
  } catch (err) {
    console.error('[PURGE ERROR]', err);
    alertOncall('Data purge cron failed', err);
  }
}, { timezone: 'Asia/Kolkata' });
```

---

## 7. Rate Limiting & Abuse Prevention

### 7.1 Rate Limit Policy

| Endpoint | Limit | Window | Action on Exceed |
|----------|-------|--------|-----------------|
| `POST /auth/login` | 5 attempts | 15 minutes | 429 + lockout after 10 total |
| `POST /auth/register` | 10 attempts | 1 hour | 429 |
| `POST /auth/forgot-password` | 3 attempts | 1 hour | 429 (prevent email enumeration) |
| `POST /chat/message` (authenticated) | 30 messages | 1 minute | 429 with retry-after |
| `POST /chat/message` (guest) | 10 messages | 1 minute | 429 + login prompt |
| `GET order_status tool` | 5 lookups | 1 hour | 429 + escalation offer |
| `POST initiate_return tool` | 3 initiations | 24 hours | 429 + human agent offer |
| Global API (all endpoints, per IP) | 200 requests | 1 minute | Cloudflare block |

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

const createLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message, code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:',
  }),
  keyGenerator: (req) => req.user?.id || req.ip,  // Per-user or per-IP
});

const chatLimiter = createLimiter(
  60_000,  // 1 minute
  req => req.user ? 30 : 10,  // More for authenticated users
  'Too many messages. Please slow down.'
);
```

---

## 8. Security Headers & Transport Security

### 8.1 Express Security Middleware

```javascript
// app.js
const helmet = require('helmet');
const cors = require('cors');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "https://cdn.vasudha.com"],
      connectSrc:     ["'self'", "https://api.vasudha.com"],
      imgSrc:         ["'self'", "data:", "https://cdn.vasudha.com", "https://lh3.googleusercontent.com"],
      styleSrc:       ["'self'", "'unsafe-inline'"],  // for widget CSS
      fontSrc:        ["'self'", "https://fonts.gstatic.com"],
      frameSrc:       ["'none'"],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts:            { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard:      { action: 'deny' },
  noSniff:         true,
  xssFilter:       true,
  referrerPolicy:  { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    features: { camera: [], microphone: [], geolocation: [] },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,               // Allow cookies (refresh token)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### 8.2 Neon DB Connection Security

```javascript
// config/database.js — enforcing SSL for Neon
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,       // Verify Neon's certificate
    // Neon provides its CA cert automatically
  },
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Parameterised queries ONLY — never string interpolation
// ✅ CORRECT:
await db.query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ NEVER:
await db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

---

## 9. Admin Access Control

### 9.1 Role-Based Access (RBAC)

| Role | Chat Data | KB Edit | Analytics | User Data | Secrets |
|------|-----------|---------|-----------|-----------|---------|
| `super_admin` | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ |
| `admin` | ✅ Full | ✅ Full | ✅ Full | 🔒 Anonymised | ❌ |
| `kb_manager` | ❌ | ✅ Own entries | 📖 Read-only | ❌ | ❌ |
| `support_lead` | ✅ Escalated only | 📖 Read-only | ✅ Full | ❌ | ❌ |
| `agent` | ✅ Assigned tickets | ❌ | ❌ | ❌ | ❌ |
| `customer` | Own sessions only | ❌ | ❌ | Own data only | ❌ |

```javascript
// middleware/auth.js — role check
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// Usage:
app.get('/admin/analytics', authenticate(true), requireRole('admin', 'super_admin', 'support_lead'), analyticsController.getDashboard);
app.post('/admin/knowledge', authenticate(true), requireRole('admin', 'kb_manager'), kbController.createEntry);
```

### 9.2 Admin Authentication Requirements

- **MFA required** for all admin roles (Google Authenticator or hardware key)
- **SSO via Google Workspace** with domain restriction (`@vasudha.com`)
- Admin sessions expire after 8 hours of inactivity
- All admin actions logged with user ID, timestamp, IP, and action type

---

## 10. Security Logging & Monitoring

### 10.1 Events to Log

```javascript
// utils/securityLogger.js
const securityEvents = {
  LOGIN_SUCCESS:              { level: 'info',  retain: '90 days' },
  LOGIN_FAILURE:              { level: 'warn',  retain: '90 days' },
  ACCOUNT_LOCKED:             { level: 'warn',  retain: '90 days' },
  TOKEN_REFRESH:              { level: 'debug', retain: '30 days' },
  REFRESH_TOKEN_REUSE:        { level: 'alert', retain: '180 days' },  // Possible theft
  PROMPT_INJECTION_ATTEMPT:   { level: 'alert', retain: '180 days' },  // Security threat
  ORDER_LOOKUP_FAILED_VERIFY: { level: 'warn',  retain: '90 days' },
  RATE_LIMIT_EXCEEDED:        { level: 'warn',  retain: '30 days' },
  PII_STRIP_TRIGGERED:        { level: 'info',  retain: '30 days' },
  ADMIN_ACTION:               { level: 'info',  retain: '365 days' },  // Audit trail
  DATA_EXPORT_REQUEST:        { level: 'info',  retain: '365 days' },
  ACCOUNT_DELETION:           { level: 'info',  retain: '365 days' },
};
```

### 10.2 Alerting Rules

| Alert | Threshold | Channel |
|-------|-----------|---------|
| Failed login rate spike | > 50 failures/min from any IP | PagerDuty (P1) |
| Prompt injection attempts | > 10 in any 5-minute window | Slack #security |
| Refresh token reuse | Any single occurrence | PagerDuty (P0) |
| Gemini API errors | > 5% error rate in 1 min | Slack #alerts |
| Neon DB connection failures | > 3 consecutive failures | PagerDuty (P1) |
| Rate limit mass-trigger | > 1000 IPs blocked in 1 min | PagerDuty (P1) + Cloudflare rule |
| API cost spike | Daily spend > ₹2,000 | Email to CTO |

---

## 11. Incident Response Plan

### 11.1 Severity Classification

| Severity | Examples | Response Time | Escalation |
|----------|----------|---------------|------------|
| P0 — Critical | Gemini key exposed; customer PII breach; JWT secret compromised | 15 min | CTO + all engineers |
| P1 — High | Chat service down > 30 min; DDoS attack; mass account lockouts | 1 hour | Engineering Lead |
| P2 — Medium | Elevated error rate; suspicious traffic; one-off injection attempt | 4 hours | On-call engineer |
| P3 — Low | Single user complaint; minor latency spike | 24 hours | Support Lead |

### 11.2 P0 Incident Runbook

```
STEP 1: DETECT
  Alert fires via PagerDuty / Sentry
  On-call engineer acknowledges within 5 min

STEP 2: CONTAIN
  □ Revoke exposed Gemini API key in Google AI Studio immediately
  □ Generate new key, update Railway/Render secret
  □ If JWT secret exposed: invalidate ALL refresh tokens in DB:
    UPDATE refresh_tokens SET revoked = TRUE;
  □ If Neon DB credentials exposed: rotate in Neon dashboard + update env

STEP 3: ASSESS
  □ Determine scope: which users affected, what data accessed, how long
  □ Pull relevant logs from Railway + Sentry

STEP 4: NOTIFY (Internal)
  □ CTO notified within 15 minutes
  □ Legal/DPO notified within 1 hour if PII involved

STEP 5: REMEDIATE
  □ Apply fix
  □ Deploy to production
  □ Verify Vaani is operational with new credentials

STEP 6: NOTIFY (Users / Regulatory)
  □ If PII breach: notify affected users within 72 hours (DPDPA requirement)
  □ Report to Data Protection Board of India if required

STEP 7: POST-MORTEM
  □ Written within 7 days
  □ Root cause analysis
  □ Action items to prevent recurrence
  □ Update runbooks
```

---

## 12. Compliance Checklist

| Control | Standard | Status | Notes |
|---------|----------|--------|-------|
| API key never client-side | Internal / OWASP | ✅ | Gemini key server-only |
| Passwords hashed with bcrypt (rounds=12) | OWASP | ✅ | |
| JWT short-lived (15 min) | OWASP | ✅ | |
| Refresh token rotation + reuse detection | OWASP | ✅ | |
| HttpOnly cookie for refresh token | OWASP | ✅ | XSS protection |
| Input validation and PII stripping | OWASP A03 | ✅ | |
| SQL injection prevention (parameterised queries) | OWASP A03 | ✅ | |
| Rate limiting on all sensitive endpoints | OWASP A04 | ✅ | |
| RBAC for admin functions | OWASP A01 | ✅ | |
| Security headers (Helmet.js) | OWASP | ✅ | |
| TLS 1.3 enforced | Industry standard | ✅ | Via Cloudflare |
| Data minimisation (PII stripped before AI) | DPDPA 2023 | ✅ | |
| 90-day data purge | DPDPA 2023 | ✅ | Automated cron |
| Right to erasure implementation | DPDPA 2023 | ✅ | 72-hour SLA |
| Consent notice before data collection | DPDPA 2023 | ✅ | Widget consent screen |
| Grievance officer appointed | DPDPA 2023 | 🔄 | Appoint DPO before launch |
| MFA for admin accounts | IT Act 2000 | ✅ | Google Workspace MFA |
| Security logging and audit trail | IT Act 2000 | ✅ | |
| Neon DB connection with SSL | Security best practice | ✅ | |
| Neon IP allowlist configured | Security best practice | 🔄 | Configure to Railway IP range |

---

*Document: 03-security-compliance.md · Version 2.0.0 · Vasudha Couture*
