(function() {
  const scriptTag = document.currentScript;
  const config = {
    apiUrl: scriptTag.getAttribute('data-api-url') || '',
    brandColor: scriptTag.getAttribute('data-brand-color') || '#2D1B35',
    accentColor: scriptTag.getAttribute('data-accent-color') || '#C8A96A',
    defaultLang: scriptTag.getAttribute('data-default-language') || 'en'
  };

  const style = document.createElement('style');
  style.innerHTML = `
    #vaani-widget-container {
      position: fixed; bottom: 20px; right: 20px; z-index: 9999;
      font-family: 'Inter', sans-serif;
    }
    #vaani-bubble {
      width: 60px; height: 60px; border-radius: 50%; background: ${config.brandColor};
      color: ${config.accentColor}; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer; transition: transform 0.2s;
    }
    #vaani-bubble:hover { transform: scale(1.05); }
    #vaani-panel {
      position: absolute; bottom: 80px; right: 0; width: 350px; height: 500px;
      background: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      display: none; flex-direction: column; overflow: hidden;
    }
    #vaani-panel.open { display: flex; }
    .vaani-header {
      background: ${config.brandColor}; color: ${config.accentColor}; padding: 15px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .vaani-header h3 { margin: 0; font-weight: 500; }
    .vaani-close { cursor: pointer; font-size: 20px; }
    .vaani-messages {
      flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;
      background: #f9f9f9;
    }
    .vaani-msg { max-width: 80%; padding: 10px 14px; border-radius: 12px; line-height: 1.4; font-size: 14px; word-wrap: break-word; }
    .vaani-msg.bot { background: white; border: 1px solid #eee; align-self: flex-start; border-bottom-left-radius: 4px; }
    .vaani-msg.user { background: ${config.brandColor}; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
    .vaani-input-area {
      padding: 10px; background: white; border-top: 1px solid #eee; display: flex; gap: 8px;
    }
    .vaani-input-area input {
      flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none;
    }
    .vaani-input-area button {
      background: ${config.accentColor}; color: ${config.brandColor}; border: none;
      border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-weight: bold;
    }
    .loading-dots { display: flex; gap: 4px; padding: 5px; }
    .dot { width: 6px; height: 6px; background: #888; border-radius: 50%; animation: blink 1.4s infinite both; }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'vaani-widget-container';
  container.innerHTML = `
    <div id="vaani-panel">
      <div class="vaani-header">
        <h3>✨ Vaani</h3>
        <span class="vaani-close">&times;</span>
      </div>
      <div class="vaani-messages" id="vaani-messages">
        <div class="vaani-msg bot">Namaste! 🙏 I'm Vaani, your style companion at Vasudha Couture. How can I help you today?</div>
      </div>
      <form class="vaani-input-area" id="vaani-form">
        <input type="text" id="vaani-input" placeholder="Ask anything..." autocomplete="off">
        <button type="submit">➤</button>
      </form>
    </div>
    <div id="vaani-bubble">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    </div>
  `;
  document.body.appendChild(container);

  const bubble = document.getElementById('vaani-bubble');
  const panel = document.getElementById('vaani-panel');
  const closeBtn = document.querySelector('.vaani-close');
  const form = document.getElementById('vaani-form');
  const input = document.getElementById('vaani-input');
  const messagesDiv = document.getElementById('vaani-messages');

  let sessionId = localStorage.getItem('vaani_session_id') || `sess_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('vaani_session_id', sessionId);
  let accessToken = localStorage.getItem('vaani_access_token');

  bubble.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) input.focus();
  });

  closeBtn.addEventListener('click', () => panel.classList.remove('open'));

  function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `vaani-msg ${sender}`;
    msg.textContent = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'vaani-msg bot loader';
    loader.innerHTML = '<div class="loading-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
    messagesDiv.appendChild(loader);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function hideLoading() {
    const loader = document.querySelector('.loader');
    if (loader) loader.remove();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    addMessage(text, 'user');
    showLoading();

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const res = await fetch(`${config.apiUrl}/chat/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          language: config.defaultLang,
          page_context: window.location.pathname
        })
      });

      hideLoading();
      
      if (!res.ok) {
        if (res.status === 429) {
             addMessage("You are sending messages too quickly. Please slow down.", 'bot');
        } else {
             addMessage("I'm having trouble connecting to my servers right now.", 'bot');
        }
        return;
      }

      const data = await res.json();
      addMessage(data.response?.text || data.text || "Sorry, I didn't get that.", 'bot');
      
    } catch (err) {
      hideLoading();
      addMessage('Network error. Please try again.', 'bot');
    }
  });

})();
