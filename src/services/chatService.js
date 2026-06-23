const { groq, buildSystemPrompt, GROQ_MODEL } = require('./groqService');
const { getSessionHistory, appendToSession } = require('./sessionService');
const { sanitiseUserInput } = require('../middleware/piiStripper');
const tools = require('./tools');

async function processMessage({ sessionId, userMessage, user, language, pageContext }) {
  const startTime = Date.now();
  
  const safeMessage = sanitiseUserInput(userMessage);
  if (safeMessage === null) {
    await appendToSession(sessionId, {
        role: 'user', content: userMessage, language, isFlagged: true, flagReason: 'Prompt Injection Attempt'
    });
    return {
      text: "I'm sorry, I cannot process this request.",
      latencyMs: Date.now() - startTime,
      tokensUsed: 0
    };
  }

  if (!groq) {
      return {
          text: "I'm currently unable to access my AI engine. Please try again later.",
          latencyMs: Date.now() - startTime,
          tokensUsed: 0
      };
  }

  const systemPrompt = buildSystemPrompt(user, language, []);
  
  // Get history
  let dbHistory = await getSessionHistory(sessionId);
  
  // Format for Groq
  let messages = [
    { role: "system", content: systemPrompt },
    ...dbHistory.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.parts[0].text })),
    { role: "user", content: safeMessage }
  ];

  let assistantText = "I'm sorry, an error occurred while processing your request.";
  let tokensUsed = 0;
  
  try {
    let completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: messages,
        tools: tools.definitions,
        tool_choice: "auto",
        max_tokens: 1024,
        temperature: 0.7
    });
    
    let responseMessage = completion.choices[0].message;
    tokensUsed += completion.usage?.total_tokens || 0;

    // Handle function/tool calls loop
    while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage); // Add assistant tool_calls message to history
      
      for (const toolCall of responseMessage.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          const toolResult = await tools.execute(toolCall.function.name, args, user);
          
          messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: toolCall.function.name,
              content: JSON.stringify(toolResult),
          });
      }
      
      // Make second request with tool results
      completion = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: messages,
          tools: tools.definitions,
          max_tokens: 1024,
          temperature: 0.7
      });
      
      responseMessage = completion.choices[0].message;
      tokensUsed += completion.usage?.total_tokens || 0;
    }

    assistantText = responseMessage.content;
  } catch (e) {
    console.error('Groq chat error:', e);
  }

  const latencyMs = Date.now() - startTime;

  await appendToSession(sessionId, { role: 'user', content: safeMessage, language });
  await appendToSession(sessionId, { role: 'assistant', content: assistantText, latencyMs, tokensUsed, language });

  return {
    text: assistantText,
    latencyMs,
    tokensUsed,
  };
}

module.exports = { processMessage };
