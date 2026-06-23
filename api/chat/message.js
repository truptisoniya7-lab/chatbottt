const Groq = require('groq-sdk');
const jwt = require('jsonwebtoken');

// ── Helpers ─────────────────────────────────────────────────────────────────

// PII Stripper
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
  /<\s*script[\s\S]*?>/i,
  /javascript\s*:/i,
  /\beval\s*\(/i,
  /document\.(cookie|write|location)/i,
];

function detectInjection(text) {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

function stripPII(text) {
  if (!text) return text;
  return text
    .replace(/(\+91[\s-]?|0)?[6-9]\d{9}\b/g, '[PHONE]')
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[AADHAAR]')
    .replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, '[PAN]')
    .replace(/\b[\w.]+@(upi|paytm|ybl|okaxis|okhdfcbank|okicici|oksbi|ibl|axl|apl|barodampay)\b/gi, '[UPI]')
    .replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g, '[IFSC]')
    .replace(/\b(?:\d[ -]?){13,19}\b/g, '[CARD]')
    .replace(/\b(otp|OTP|passcode)\s*[:\s]\s*\d{4,6}\b/g, '[OTP]')
    .replace(/\b[A-Z]\d{7}\b/g, '[PASSPORT]');
}

function sanitiseUserInput(raw) {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.substring(0, 2000);
  if (detectInjection(trimmed)) return null;
  return stripPII(trimmed)
    .replace(/[\u0966-\u096F]{10}/g, '[PHONE]')
    .replace(/[\u0966-\u096F]{12}/g, '[AADHAAR]')
    .trim();
}

// System prompt builder
function buildSystemPrompt(user, language) {
  const userContext = user
    ? `User: ${user.name || user.email} (logged in). Use tools to fetch their orders directly.`
    : `User: Guest (not logged in). Ask them to login for order help.`;

  const lang =
    language === 'hi'
      ? 'Reply in Hindi (Devanagari). Use Hinglish if the user mixes languages.'
      : 'Reply in English. Switch to Hindi if the user writes in Hindi.';

  return [
    `You are Vaani, the helpful AI assistant for Vasudha Couture, a premium Indian fashion brand.`,
    `Be warm, culturally aware, and concise (under 120 words per reply).`,
    userContext,
    lang,
    `Always use the available functions/tools to fetch real-time information.`,
    `Never invent product details — always use tool results.`,
    `Politely decline requests about politics, medical/legal advice, or explicit content.`,
  ]
    .filter(Boolean)
    .join('\n');
}

// Tool definitions
const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'search_catalogue',
      description: 'Search Vasudha Couture product catalogue with filters.',
      parameters: {
        type: 'object',
        properties: {
          category:  { type: 'string', description: 'saree, lehenga, kurta, etc' },
          occasion:  { type: 'string', description: 'wedding, festive, casual' },
          max_price: { type: 'number', description: 'Maximum price in INR' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_order_status',
      description: 'Fetch real-time order status.',
      parameters: {
        type: 'object',
        properties: {
          order_id:     { type: 'string' },
          phone_last4:  { type: 'string' },
          fetch_recent: { type: 'boolean' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'initiate_return',
      description: 'Create a return or exchange request.',
      parameters: {
        type: 'object',
        properties: {
          order_id:    { type: 'string' },
          reason:      { type: 'string' },
          return_type: { type: 'string' },
        },
        required: ['order_id', 'reason', 'return_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_size_recommendation',
      description: 'Calculate recommended garment size from body measurements.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          bust_cm:  { type: 'number' },
          waist_cm: { type: 'number' },
          unit:     { type: 'string' },
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookup_promo',
      description: 'Get current active promotions and discount codes.',
      parameters: {
        type: 'object',
        properties: {
          context: { type: 'string' },
        },
      },
    },
  },
];

function executeTool(name, args) {
  if (name === 'search_catalogue') {
    return {
      status: 'success',
      products: [
        { id: 'P101', name: 'Banarasi Saree', price: 12999, category: 'saree', url: '/product/P101' },
        { id: 'P102', name: 'Silk Lehenga', price: 24999, category: 'lehenga', url: '/product/P102' },
        { id: 'P103', name: 'Linen Kurta', price: 2499, category: 'kurta', url: '/product/P103' },
      ],
    };
  }
  if (name === 'get_order_status') {
    return {
      status: 'success',
      orders: [
        {
          order_id: args.order_id || 'VC-20245781',
          items: ['Linen Kurta'],
          status: 'OUT FOR DELIVERY',
          courier: 'Delhivery',
          expected_delivery: 'Today by 8 PM',
        },
      ],
    };
  }
  if (name === 'initiate_return') {
    return {
      status: 'success',
      return_id: 'RT-20248823',
      pickup_eta: '2-3 business days',
      refund_eta: '5-7 business days',
    };
  }
  if (name === 'get_size_recommendation') {
    return {
      status: 'success',
      recommended_size: 'L',
      fit_notes: 'This style has a contemporary fitted silhouette. Large provides a comfortable drape.',
    };
  }
  if (name === 'lookup_promo') {
    return {
      status: 'success',
      promotions: [
        { code: 'VASUDHA15', description: '15% off all sarees', expiry: 'June 30' },
        { code: 'FIRSTLOOK', description: '10% off your first order', expiry: 'No expiry' },
      ],
    };
  }
  return { status: 'error', message: 'Tool not found' };
}

// In-memory session store (stateless serverless — no Redis/DB needed for MVP)
const sessionStore = new Map();

function getSessionHistory(sessionId) {
  return sessionStore.get(sessionId) || [];
}

function appendToSession(sessionId, role, content) {
  const history = sessionStore.get(sessionId) || [];
  history.push({ role, content });
  // Keep last 20 messages
  if (history.length > 20) history.splice(0, history.length - 20);
  sessionStore.set(sessionId, history);
}

// ── CORS Helper ──────────────────────────────────────────────────────────────
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ── Main Handler ─────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  setCORSHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { session_id, message, language, page_context } = req.body || {};

    if (!session_id || !message) {
      return res.status(400).json({ error: 'session_id and message are required' });
    }

    // Sanitise input
    const safeMessage = sanitiseUserInput(message);
    if (safeMessage === null) {
      return res.status(200).json({
        session_id,
        response: { text: "I'm sorry, I cannot process this request." },
        metadata: { tokens_used: 0, latency_ms: Date.now() - startTime },
      });
    }

    // Optional: decode JWT for user context (non-blocking)
    let user = null;
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ') && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        user = decoded;
      } catch (_) {
        // Guest fallback
      }
    }

    // Check Groq key
    if (!process.env.GROQ_API_KEY) {
      return res.status(200).json({
        session_id,
        response: { text: "I'm currently unable to access my AI engine. Please configure the GROQ_API_KEY environment variable in Vercel." },
        metadata: { tokens_used: 0, latency_ms: Date.now() - startTime },
      });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const systemPrompt = buildSystemPrompt(user, language || 'en');

    // Build messages with history
    const history = getSessionHistory(session_id);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: safeMessage },
    ];

    let assistantText = "I'm sorry, something went wrong. Please try again.";
    let tokensUsed = 0;

    // Groq call with tool-use loop
    let completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools: toolDefinitions,
      tool_choice: 'auto',
      max_tokens: 1024,
      temperature: 0.7,
    });

    let responseMessage = completion.choices[0].message;
    tokensUsed += completion.usage?.total_tokens || 0;

    while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments || '{}');
        const toolResult = executeTool(toolCall.function.name, args);

        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolCall.function.name,
          content: JSON.stringify(toolResult),
        });
      }

      completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        tools: toolDefinitions,
        max_tokens: 1024,
        temperature: 0.7,
      });

      responseMessage = completion.choices[0].message;
      tokensUsed += completion.usage?.total_tokens || 0;
    }

    assistantText = responseMessage.content || assistantText;

    // Persist to session store
    appendToSession(session_id, 'user', safeMessage);
    appendToSession(session_id, 'assistant', assistantText);

    const latencyMs = Date.now() - startTime;

    return res.status(200).json({
      session_id,
      response: { text: assistantText },
      metadata: {
        tokens_used: tokensUsed,
        latency_ms: latencyMs,
        language_detected: language || 'en',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
