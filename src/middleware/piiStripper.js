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
    .replace(/\b[A-Z]\d{7}\b/g, '[PASSPORT]')
    
    // Hindi numbers (Devanagari)
    .replace(/[\u0966-\u096F]{10}/g, '[PHONE]')    // Devanagari 10-digit number
    .replace(/[\u0966-\u096F]{12}/g, '[AADHAAR]'); // Devanagari 12-digit number
}

function sanitiseUserInput(raw) {
  if (typeof raw !== 'string') return '';
  
  // Length limit
  const trimmed = raw.substring(0, 2000);
  
  // Injection check
  if (detectInjection(trimmed)) {
    console.warn(`[SECURITY] Prompt injection detected: ${trimmed}`);
    return null; // Signal to reject this message
  }
  
  return stripPII(trimmed.trim());
}

module.exports = {
  detectInjection,
  stripPII,
  sanitiseUserInput
};
