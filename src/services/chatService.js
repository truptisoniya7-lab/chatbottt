const { model, buildSystemPrompt, genAI } = require('./gemini');
const tools = require('./tools');
const { getSessionHistory, appendToSession } = require('./sessionService');
const { stripPII } = require('../middleware/piiStripper');

// active offers mock or fetch
async function getActiveOffers() {
  return []; // In real app, fetch from Redis or DB
}

async function processMessage({ sessionId, userMessage, user, language, pageContext }) {
  const startTime = Date.now();
  
  // 1. Strip PII before logging or sending to Gemini
  const safeMessage = stripPII ? stripPII(userMessage) : userMessage; // Fallback if stripPII is missing
  
  if (!safeMessage) {
    await appendToSession(sessionId, {
        role: 'user', content: userMessage, language, isFlagged: true, flagReason: 'Prompt Injection Attempt'
    });
    return {
      text: "I'm sorry, I cannot process this request.",
      latencyMs: Date.now() - startTime,
      tokensUsed: 0
    };
  }

  // 2. Fetch active offers (cached in Redis)
  const activeOffers = await getActiveOffers();
  
  // 3. Build fresh model instance with current system prompt
  const chatModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: buildSystemPrompt(user, language, activeOffers),
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  });

  // 4. Get conversation history from Redis
  const history = await getSessionHistory(sessionId);
  
  // 5. Start Gemini chat session with history
  const chat = chatModel.startChat({
    history: history,
    tools: [{ functionDeclarations: tools.definitions }],
  });

  let assistantText = "I'm sorry, an error occurred while processing your request.";
  let tokensUsed = 0;

  try {
    // 6. Send message
    let result = await chat.sendMessage(safeMessage);
    let response = result.response;
    tokensUsed += response.usageMetadata?.totalTokenCount || 0;

    // 7. Handle function/tool calls (Gemini function calling)
    while (response.functionCalls()?.length > 0) {
      const functionCalls = response.functionCalls();
      const functionResponses = [];

      for (const functionCall of functionCalls) {
        const toolResult = await tools.execute(functionCall.name, functionCall.args, user);
        functionResponses.push({
          functionResponse: {
            name: functionCall.name,
            response: toolResult,
          }
        });
      }

      result = await chat.sendMessage(functionResponses);
      response = result.response;
      tokensUsed += response.usageMetadata?.totalTokenCount || 0;
    }

    assistantText = response.text();
  } catch (e) {
    console.error('Gemini chat error:', e);
  }

  const latencyMs = Date.now() - startTime;

  // 8. Persist to Neon DB
  await appendToSession(sessionId, {
    role: 'user',
    content: safeMessage,
    originalLength: userMessage.length,
    language,
  });
  await appendToSession(sessionId, {
    role: 'assistant', 
    content: assistantText,
    latencyMs,
    tokensUsed,
  });

  return {
    text: assistantText,
    latencyMs,
    tokensUsed,
  };
}

module.exports = { processMessage };
