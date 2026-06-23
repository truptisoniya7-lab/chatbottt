const chatService = require('../services/chatService');

const handleMessage = async (req, res) => {
  try {
    const { session_id, message, language, page_context } = req.body;
    
    if (!session_id || !message) {
      return res.status(400).json({ error: 'session_id and message are required' });
    }

    const responseData = await chatService.processMessage({
      sessionId: session_id,
      userMessage: message,
      user: req.user,
      language: language || 'en',
      pageContext: page_context
    });

    res.json({
      session_id,
      response: { text: responseData.text },
      metadata: {
        tokens_used: responseData.tokensUsed,
        latency_ms: responseData.latencyMs,
        language_detected: language
      }
    });
  } catch (error) {
    console.error('Chat controller error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { handleMessage };
