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
  return INJECTION_PATTERNS.some(pattern => pattern.test(text));
}

function stripPII(text) {
  if (!text) return text;
  return text
    .replace(/(\+91[\s-]?|0)?[6-9]\d{9}\b/g, '[PHONE]')
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[AADHAAR]')
    .replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, '[PAN]')
    .replace(/\b\w[\w.]+@(upi|paytm|ybl|okaxis|okhdfcbank|okicici|oksbi|ibl|axl|apl|barodampay)\b/gi, '[UPI]')
    .replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g, '[IFSC]')
    .replace(/\b(?:\d[ -]?){13,19}\b/g, '[CARD]')
    .replace(/\b(otp|OTP|passcode)\s*[:\s]\s*\d{4,6}\b/g, '[OTP]')
    .replace(/\b[A-Z]\d{7}\b/g, '[PASSPORT]');
}

function stripPIIHindi(text) {
  return stripPII(text)
    .replace(/[\u0966-\u096F]{10}/g, '[PHONE]')
    .replace(/[\u0966-\u096F]{12}/g, '[AADHAAR]');
}

function sanitiseUserInput(raw) {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.substring(0, 2000);
  if (detectInjection(trimmed)) {
    console.warn('Security: Prompt injection attempt detected', { length: trimmed.length });
    return null;
  }
  return stripPIIHindi(trimmed).trim();
}

module.exports = { sanitiseUserInput, stripPII, stripPIIHindi, detectInjection };
