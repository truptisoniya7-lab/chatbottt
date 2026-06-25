/* ============================================================
   VAANI PET WIDGET — vaani-widget.js
   Self-contained chatbot widget for Vasudha Couture
   ============================================================ */

(function VaaniWidget(window, document) {
  'use strict';
  
  const scriptTag = document.currentScript;
  const baseUrl = scriptTag ? scriptTag.getAttribute('data-api-url') : 'http://localhost:3000';

  /* ── CONFIG ── */
  const CONFIG = {
    apiEndpoint:     `${baseUrl}/chat/message`,
    useDemo:         false, // Set to false to use real backend
    brandName:       'Vasudha Couture',
    petName:         'Vaani',
    greetingDelay:   800,
    bubbleDelay:     2800,
    bubbleAutoDismiss: 0,
    typingDuration:  1200,
  };

  /* ── SVG CHARACTER ── */
  const VAANI_SVG = `
  <img src="/assets/vaani-pet.png" alt="Vaani Chatbot Mascot" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; box-shadow: 0 8px 24px rgba(200,169,106,0.4); border: 3px solid rgba(200,169,106,0.8); background-color: #FAF8F5;">
  `;

  /* ── BUILD WIDGET HTML ── */
  function buildWidget() {
    const div = document.createElement('div');
    div.className = 'vaani-widget';
    div.id = 'vaani-widget';
    div.innerHTML = `
      <!-- PET BUTTON -->
      <button id="vaaniPetBtn" class="vaani-pet-btn" aria-label="Chat with Vaani">
        ${VAANI_SVG}
        <span class="vaani-notif-dot" id="vaaniNotifDot"></span>
      </button>

      <!-- SPEECH BUBBLE -->
      <div class="vaani-bubble hidden" id="vaaniBubble">
        <div class="vaani-bubble-text">Hiii! 👋 <strong>May I help you?</strong></div>
        <div class="vaani-bubble-sub">I'm Vaani, your style companion</div>
        <button class="vaani-bubble-close" id="vaaniBubbleClose">✕</button>
        <div class="vaani-bubble-tail"></div>
      </div>

      <!-- CHAT PANEL -->
      <div class="vaani-panel" id="vaaniPanel" hidden>
        <div class="vaani-panel-header">
          <div class="vaani-header-pet">
            <div class="vaani-avatar-small"><img src="/assets/vaani-pet.png" style="width:100%; height:100%; object-fit:cover; border-radius:50%;"></div>
            <div class="vaani-header-info">
              <div class="vaani-header-name">Vaani</div>
              <div class="vaani-header-status">
                <span class="vaani-status-dot"></span> Online · Style Expert
              </div>
            </div>
          </div>
          <div class="vaani-header-actions">
            <button class="vaani-minimize-btn" id="vaaniMinimize" aria-label="Minimize">—</button>
            <button class="vaani-close-btn"    id="vaaniClose"    aria-label="Close">✕</button>
          </div>
        </div>

        <div class="vaani-messages" id="vaaniMessages"></div>

        <div class="vaani-input-area">
          <div class="vaani-input-wrap">
            <input type="text" id="vaaniInput" class="vaani-input" placeholder="Ask me anything..." autocomplete="off">
            <button class="vaani-send-btn" id="vaaniSend" aria-label="Send">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l2 6-2 6 12-6z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <div class="vaani-powered">Powered by Claude · Vasudha Couture</div>
        </div>
      </div>`;
    return div;
  }

  /* ── INJECT CSS ── */
  function injectCSS() {
    const style = document.createElement('style');
    style.id = 'vaani-widget-styles';
    style.textContent = `
.vaani-widget {
  position: fixed; bottom: 2rem; right: 2rem; z-index: 20000;
  font-family: 'DM Sans', 'Segoe UI', sans-serif;
  --vw-gold: #C8A96A; --vw-gold-lt: #E8D5A3; --vw-plum: #0F0718;
  --vw-plum-mid: #1E0F2E; --vw-rose: #C4847A; --vw-glass: rgba(15,7,24,0.92);
  --vw-border: rgba(200,169,106,0.25); --vw-ease: cubic-bezier(0.16,1,0.3,1);
}

.vaani-pet-btn {
  width: 140px; height: 140px; background: none; border: none; cursor: pointer; padding: 0;
  position: relative; display: flex; align-items: center; justify-content: center;
  filter: drop-shadow(0 8px 24px rgba(200,169,106,0.4));
  animation: vaaniBounceIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.8s both,
             vaaniFloat 3s ease-in-out 2s infinite,
             vaaniGlow 2s ease-in-out 2s infinite alternate;
  transition: transform 0.2s var(--vw-ease), filter 0.2s;
}
.vaani-pet-btn:hover { transform: scale(1.12) translateY(-4px); filter: drop-shadow(0 16px 40px rgba(200,169,106,0.6)); }
.vaani-pet-btn:active { transform: scale(0.96); }

.vaani-widget.panel-open .vaani-pet-btn {
  transform: scale(0) translateY(40px); opacity: 0; pointer-events: none;
  transition: transform 0.3s var(--vw-ease), opacity 0.2s;
}

.vaani-notif-dot {
  position: absolute; top: 4px; right: 8px; width: 12px; height: 12px;
  background: var(--vw-rose); border-radius: 50%; border: 2px solid #04020A;
  animation: vaaniPulse 1.5s ease-in-out infinite; display: none;
}
.vaani-notif-dot.active { display: block; }

.vaani-bubble {
  position: absolute; bottom: 108px; right: 0; background: var(--vw-glass);
  backdrop-filter: blur(20px); border: 1px solid var(--vw-border);
  border-radius: 16px 16px 4px 16px; padding: 1rem 2.5rem 1rem 1.2rem;
  min-width: 200px; max-width: 240px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,169,106,0.1), inset 0 1px 0 rgba(200,169,106,0.1);
  animation: vaaniBubbleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) 2.8s both; transform-origin: bottom right;
}
.vaani-bubble.hidden { animation: none; opacity: 0; pointer-events: none; transform: scale(0); transition: transform 0.2s var(--vw-ease), opacity 0.2s; }
.vaani-bubble-text { font-size: 0.88rem; color: var(--vw-gold-lt); line-height: 1.5; margin-bottom: 0.3rem; }
.vaani-bubble-text strong { color: white; }
.vaani-bubble-sub { font-size: 0.7rem; color: rgba(200,169,106,0.55); font-style: italic; }
.vaani-bubble-close { position: absolute; top: 0.5rem; right: 0.5rem; background: none; border: none; color: rgba(200,169,106,0.4); cursor: pointer; font-size: 0.75rem; line-height: 1; padding: 0.1rem 0.3rem; transition: color 0.2s; }
.vaani-bubble-close:hover { color: var(--vw-gold); }
.vaani-bubble-tail { position: absolute; bottom: -10px; right: 28px; width: 0; height: 0; border-left: 10px solid transparent; border-right: 4px solid transparent; border-top: 10px solid rgba(200,169,106,0.25); }
.vaani-bubble-tail::after { content: ''; position: absolute; bottom: 2px; right: -3px; width: 0; height: 0; border-left: 9px solid transparent; border-right: 3px solid transparent; border-top: 9px solid rgba(15,7,24,0.95); }

.vaani-panel {
  position: absolute; bottom: 0; right: 0; width: 400px; height: 600px;
  background: var(--vw-plum); border: 1px solid var(--vw-border); border-radius: 20px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 20px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,169,106,0.15), 0 0 60px rgba(200,169,106,0.06);
  transform-origin: bottom right; animation: vaaniPanelIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
}
.vaani-panel[hidden] { display: none !important; }

.vaani-panel-header { background: linear-gradient(135deg, #1E0F2E, #2D1B3D); border-bottom: 1px solid var(--vw-border); padding: 1rem 1.2rem; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.vaani-header-pet { display: flex; align-items: center; gap: 0.75rem; }
.vaani-avatar-small { width: 44px; height: 44px; background: linear-gradient(135deg, #C8A96A, #8B4A6B); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; box-shadow: 0 0 0 2px rgba(200,169,106,0.3), 0 4px 12px rgba(0,0,0,0.4); animation: vaaniGlow 2s ease-in-out infinite alternate; }
.vaani-header-name { font-family: 'Cormorant Garamond', 'Georgia', serif; font-size: 1.3rem; font-weight: 500; color: var(--vw-gold-lt); letter-spacing: 0.03em; }
.vaani-header-status { font-size: 0.8rem; color: rgba(200,169,106,0.7); display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem; }
.vaani-status-dot { width: 7px; height: 7px; background: #4ade80; border-radius: 50%; animation: vaaniStatusPulse 2s ease-in-out infinite; }
.vaani-header-actions { display: flex; gap: 0.4rem; }
.vaani-minimize-btn, .vaani-close-btn { background: rgba(200,169,106,0.08); border: 1px solid rgba(200,169,106,0.15); color: rgba(200,169,106,0.5); width: 34px; height: 34px; border-radius: 50%; cursor: pointer; font-size: 0.9rem; line-height: 1; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.vaani-close-btn { font-size: 0.85rem; }
.vaani-minimize-btn:hover, .vaani-close-btn:hover { background: rgba(200,169,106,0.2); color: var(--vw-gold); border-color: rgba(200,169,106,0.4); }

.vaani-messages { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.85rem; scroll-behavior: smooth; }
.vaani-messages::-webkit-scrollbar { width: 4px; }
.vaani-messages::-webkit-scrollbar-track { background: transparent; }
.vaani-messages::-webkit-scrollbar-thumb { background: rgba(200,169,106,0.25); border-radius: 2px; }

.vaani-msg { display: flex; align-items: flex-start; gap: 0.6rem; animation: vaaniMsgIn 0.3s var(--vw-ease) both; }
.vaani-msg-user { flex-direction: row-reverse; }
.vaani-msg-avatar { width: 34px; height: 34px; background: linear-gradient(135deg, #C8A96A, #8B4A6B); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; margin-top: 2px; }
.vaani-msg-bubble { background: rgba(45,27,61,0.8); border: 1px solid rgba(200,169,106,0.12); border-radius: 4px 18px 18px 18px; padding: 0.85rem 1.1rem; font-size: 0.95rem; color: rgba(240,235,227,0.9); line-height: 1.6; max-width: 280px; backdrop-filter: blur(8px); }
.vaani-msg-user .vaani-msg-bubble { background: linear-gradient(135deg, rgba(139,105,20,0.3), rgba(200,169,106,0.15)); border-color: rgba(200,169,106,0.25); border-radius: 18px 4px 18px 18px; color: var(--vw-gold-lt); text-align: right; }

.vaani-quick-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.8rem; }
.vaani-chip { background: rgba(200,169,106,0.1); border: 1px solid rgba(200,169,106,0.25); color: var(--vw-gold); font-size: 0.85rem; padding: 0.45rem 0.8rem; border-radius: 20px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.vaani-chip:hover { background: rgba(200,169,106,0.2); border-color: var(--vw-gold); color: var(--vw-gold-lt); transform: translateY(-1px); }

.vaani-typing { display: flex; align-items: center; gap: 0.6rem; padding: 0 1rem 0.5rem; flex-shrink: 0; }
.vaani-typing-dots { display: flex; gap: 4px; align-items: center; background: rgba(45,27,61,0.8); border: 1px solid rgba(200,169,106,0.12); border-radius: 4px 16px 16px 16px; padding: 0.65rem 1rem; }
.vaani-typing-dots span { width: 6px; height: 6px; background: var(--vw-gold); border-radius: 50%; animation: vaaniTyping 1.2s ease-in-out infinite; }
.vaani-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.vaani-typing-dots span:nth-child(3) { animation-delay: 0.4s; }

.vaani-input-area { border-top: 1px solid rgba(200,169,106,0.1); padding: 0.8rem 1rem; flex-shrink: 0; background: rgba(15,7,24,0.5); }
.vaani-input-wrap { display: flex; gap: 0.5rem; align-items: center; }
.vaani-input { flex: 1; background: rgba(45,27,61,0.6); border: 1px solid rgba(200,169,106,0.2); color: var(--vw-gold-lt); font-size: 0.95rem; padding: 0.85rem 1.1rem; border-radius: 24px; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.25s; }
.vaani-input::placeholder { color: rgba(200,169,106,0.3); }
.vaani-input:focus { border-color: rgba(200,169,106,0.5); }

.vaani-send-btn { width: 44px; height: 44px; background: linear-gradient(135deg, #8B6914, #C8A96A); border: none; border-radius: 50%; color: #0F0718; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 12px rgba(200,169,106,0.3); }
.vaani-send-btn:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(200,169,106,0.5); }
.vaani-send-btn:active { transform: scale(0.95); }
.vaani-powered { font-size: 0.7rem; color: rgba(200,169,106,0.25); text-align: center; margin-top: 0.6rem; letter-spacing: 0.05em; }

@keyframes vaaniBounceIn { from { transform: translateY(100px) scale(0.3); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
@keyframes vaaniFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
@keyframes vaaniGlow { from { filter: drop-shadow(0 8px 24px rgba(200,169,106,0.3)); } to { filter: drop-shadow(0 8px 40px rgba(200,169,106,0.65)); } }
@keyframes vaaniBubbleIn { from { transform: scale(0); opacity: 0; } 60% { transform: scale(1.05); } to { transform: scale(1); opacity: 1; } }
@keyframes vaaniPanelIn { from { transform: scale(0.85) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
@keyframes vaaniTyping { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }
@keyframes vaaniMsgIn { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes vaaniPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.7; } }
@keyframes vaaniStatusPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@media (max-width: 480px) { .vaani-widget { bottom: 1rem; right: 1rem; } .vaani-panel { width: calc(100vw - 2rem); height: 70vh; bottom: 100px; right: 0; } }
@media (prefers-reduced-motion: reduce) { .vaani-pet-btn { animation: none; } .vaani-bubble { animation: none; opacity: 1; } }
    `;
    document.head.appendChild(style);
  }

  /* ── MESSAGE HELPERS ── */
  function addMessage(text, role) {
    const msgs = document.getElementById('vaaniMessages');
    if (!msgs) return;

    const div = document.createElement('div');
    div.className = `vaani-msg vaani-msg-${role}`;

    if (role === 'bot') {
      div.innerHTML = `
        <div class="vaani-msg-avatar"><img src="/assets/vaani-pet.png" style="width:100%; height:100%; object-fit:cover; border-radius:50%;"></div>
        <div class="vaani-msg-bubble">${text}</div>`;
    } else {
      div.innerHTML = `<div class="vaani-msg-bubble">${text}</div>`;
    }

    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addGreeting() {
    const msgs = document.getElementById('vaaniMessages');
    if (!msgs) return;
    msgs.innerHTML = `
      <div class="vaani-msg vaani-msg-bot vaani-msg-greeting">
        <div class="vaani-msg-avatar"><img src="/assets/vaani-pet.png" style="width:100%; height:100%; object-fit:cover; border-radius:50%;"></div>
        <div class="vaani-msg-bubble">
          Namaste! 🙏 I'm <strong>Vaani</strong> — your personal style companion
          at Vasudha Couture.<br><br>How can I help you today?
          <div class="vaani-quick-chips">
            <button class="vaani-chip" data-q="Show me sarees">🥻 Sarees</button>
            <button class="vaani-chip" data-q="Show me lehengas">💃 Lehengas</button>
            <button class="vaani-chip" data-q="Track my order">📦 Track Order</button>
            <button class="vaani-chip" data-q="Help with returns">↩️ Returns</button>
            <button class="vaani-chip" data-q="Size guide">📏 Size Guide</button>
          </div>
        </div>
      </div>`;
  }



  /* ── SEND MESSAGE ── */
  async function sendMessage(text) {
    if (!text.trim()) return;
    addMessage(text, 'user');

    if (CONFIG.useDemo) {
      await new Promise(r => setTimeout(r, CONFIG.typingDuration));
      addMessage("I'm just a demo! Turn off useDemo to connect to the backend.", 'bot');
      return;
    }

    try {
      const res = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          session_id: getSessionId(),
          language: 'en',
          page_context: window.location.pathname
        }),
      });
      const data = await res.json();
      addMessage(data.response?.text || data.text || "I'll get back to you on that!", 'bot');
    } catch {
      addMessage("I'm having a little trouble right now. Please try again! 😊", 'bot');
    }
  }

  /* ── SESSION ── */
  function getSessionId() {
    let sid = sessionStorage.getItem('vaani_sid');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('vaani_sid', sid);
    }
    return sid;
  }

  /* ── PANEL OPEN / CLOSE ── */
  function openPanel() {
    const widget = document.getElementById('vaani-widget');
    const panel  = document.getElementById('vaaniPanel');
    const bubble = document.getElementById('vaaniBubble');
    if (!panel) return;

    panel.hidden = false;
    widget?.classList.add('panel-open');
    bubble?.classList.add('hidden');
    addGreeting();

    // Bind chip clicks
    panel.querySelectorAll('.vaani-chip').forEach(chip => {
      chip.addEventListener('click', () => sendMessage(chip.dataset.q || chip.textContent));
    });
  }

  function closePanel() {
    const widget = document.getElementById('vaani-widget');
    const panel  = document.getElementById('vaaniPanel');
    if (!panel) return;

    panel.hidden = true;
    widget?.classList.remove('panel-open');

    // Clear messages for fresh session next time
    const msgs = document.getElementById('vaaniMessages');
    if (msgs) msgs.innerHTML = '';
  }

  /* ── INIT ── */
  function init() {
    injectCSS();

    const widget = buildWidget();
    document.body.appendChild(widget);

    // Show speech bubble after delay
    setTimeout(() => {
      const bubble = document.getElementById('vaaniBubble');
      bubble?.classList.remove('hidden');

      // Auto-dismiss bubble
      if (CONFIG.bubbleAutoDismiss > 0) {
        setTimeout(() => bubble?.classList.add('hidden'), CONFIG.bubbleAutoDismiss);
      }
    }, CONFIG.bubbleDelay);

    // Pet button → open panel
    document.getElementById('vaaniPetBtn')?.addEventListener('click', openPanel);

    // Bubble click → open panel
    document.getElementById('vaaniBubble')?.addEventListener('click', (e) => {
      if (!e.target.closest('.vaani-bubble-close')) openPanel();
    });

    // Close bubble button
    document.getElementById('vaaniBubbleClose')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('vaaniBubble')?.classList.add('hidden');
    });

    // Close panel
    document.getElementById('vaaniClose')?.addEventListener('click', closePanel);

    // Minimize → close panel (pet re-appears)
    document.getElementById('vaaniMinimize')?.addEventListener('click', closePanel);

    // Send button
    document.getElementById('vaaniSend')?.addEventListener('click', () => {
      const input = document.getElementById('vaaniInput');
      if (input?.value.trim()) {
        sendMessage(input.value.trim());
        input.value = '';
      }
    });

    // Enter key
    document.getElementById('vaaniInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('vaaniSend')?.click();
      }
    });
  }

  /* ── BOOT ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, CONFIG.greetingDelay));
  } else {
    setTimeout(init, CONFIG.greetingDelay);
  }

})(window, document);
