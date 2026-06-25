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
    apiEndpoint:        `${baseUrl}/chat/message`,
    useDemo:            true,
    brandName:          'Vasudha Couture',
    petName:            'Vaani',
    greetingDelay:      800,
    bubbleDelay:        2800,
    bubbleAutoDismiss:  0,
    typingDuration:     1200,
    replyToRedirectMs:  900,
    panelToScrollMs:    300,
    highlightDelayMs:   400,
    highlightDurationMs:2500,
    closePanelOnRedirect: true,
    showRedirectIndicator: true,
  };

  const VAANI_SVG = `
  <img src="/assets/vaani-pet.png" alt="Vaani Chatbot Mascot" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; box-shadow: 0 8px 24px rgba(200,169,106,0.4); border: 3px solid rgba(200,169,106,0.8); background-color: #FAF8F5;">
  `;

  const GREETING_CHIPS = [
    { label: '🛍️ Browse Styles',   query: 'browse all collections'        },
    { label: '🥻 Sarees',          query: 'show me sarees'                },
    { label: '💃 Lehengas',        query: 'show me lehengas'              },
    { label: '🤵 Sherwanis',       query: 'show me sherwanis'             },
    { label: '📦 Track Order',     query: 'track my order'                },
    { label: '↩️ Returns',         query: 'help with returns'             },
    { label: '📏 Size Guide',      query: 'help me find my size'          },
    { label: '🔥 Trending Now',    query: 'what is trending right now'    },
    { label: '🏛️ Ethnic Wear',    query: 'show me ethnic heritage wear'  },
    { label: '📸 Lookbook',        query: 'show me the lookbook'          },
  ];

  /* ── BUILD WIDGET HTML ── */
  function buildWidget() {
    const div = document.createElement('div');
    div.className = 'vaani-widget';
    div.id = 'vaani-widget';
    
    const chipsHTML = GREETING_CHIPS.map(c => `<button class="vaani-chip" data-q="${c.query}">${c.label}</button>`).join('');

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
        
        <div class="vaani-typing hidden" id="vaaniTyping">
          <div class="vaani-msg-avatar"><img src="/assets/vaani-pet.png" style="width:100%; height:100%; object-fit:cover; border-radius:50%;"></div>
          <div class="vaani-typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>

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
.vaani-typing.hidden { display: none !important; }

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

/* ── VAANI HIGHLIGHT — glows on redirected product card ── */
.vaani-highlight {
  outline: 2px solid #C8A96A !important;
  outline-offset: 2px;
  box-shadow:
    0 0 0 4px rgba(200,169,106,0.25),
    0 0 50px rgba(200,169,106,0.2),
    0 20px 60px rgba(0,0,0,0.5) !important;
  transition: outline 0.3s, box-shadow 0.3s;
  animation: vaaniCardPulse 0.55s ease-in-out 3;
  position: relative;
  z-index: 10;
}

@keyframes vaaniCardPulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.018); }
}

/* ── REDIRECT INDICATOR inside chat ── */
.vaani-redirect-indicator {
  display: flex; align-items: center; gap: 0.4rem; font-size: 0.7rem;
  color: rgba(200,169,106,0.6); padding: 0.4rem 0.6rem;
  background: rgba(200,169,106,0.06); border: 1px solid rgba(200,169,106,0.12);
  border-radius: 20px; margin: 0 0 0.5rem 2.4rem;
  animation: vaaniMsgIn 0.3s ease both; font-style: italic; width: fit-content;
}

.vaani-redirect-indicator strong { color: rgba(200,169,106,0.9); font-style: normal; }
.vaani-redirect-arrow { color: var(--vw-gold, #C8A96A); font-size: 0.8rem; }
.vaani-redirect-dots { display: flex; gap: 3px; align-items: center; }
.vaani-redirect-dots span { width: 4px; height: 4px; background: rgba(200,169,106,0.5); border-radius: 50%; animation: vaaniTyping 1s ease-in-out infinite; }
.vaani-redirect-dots span:nth-child(2) { animation-delay: 0.15s; }
.vaani-redirect-dots span:nth-child(3) { animation-delay: 0.3s; }

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

  /* ── DATA ── */
  const INTENT_MAP = [
    { id: 'women_saree', keywords: ['saree', 'sari', 'silk saree', 'banarasi saree', 'kanjivaram', 'chanderi', 'georgette saree', 'zari', 'drape', 'six yards'], response: "We have 340+ stunning sarees! 🥻 From Banarasi Silk at ₹8,499 to Chanderi Cotton at ₹3,499. Let me take you to our Women's collection right now!", action: { type: 'scroll', target: '#women', options: { block: 'start' } } },
    { id: 'women_lehenga', keywords: ['lehenga', 'lehnga', 'bridal lehenga', 'wedding lehenga', 'ghagra', 'choli', 'skirt blouse', 'embroidered lehenga'], response: "Our Embroidered Bridal Lehenga at ₹14,999 is breathtaking! 💃 And the Sangeet Fusion Lehenga at ₹9,999 is perfect for celebrations. Scrolling to Women's Finest...", action: { type: 'multi', target: null, options: { steps: [{ type: 'scroll', target: '#women', delay: 0 }, { type: 'highlight', target: '#women .pcard.tall', delay: 800 }] } } },
    { id: 'women_anarkali', keywords: ['anarkali', 'suit', 'salwar', 'churidar', 'palazzo suit', 'punjabi suit', 'patiala'], response: "Our Georgette Anarkali Suit at ₹5,499 is a showstopper! 🧥 Taking you to the Women's collection now.", action: { type: 'scroll', target: '#women', options: { block: 'start' } } },
    { id: 'women_kurta_set', keywords: ['kurta set', 'kurti set', 'chikankari set', 'ethnic set', 'cotton set', 'palazzo set', 'co-ord set'], response: "Our Chikankari Kurta Set at ₹2,799 is a fan favourite — delicate Lucknow embroidery! 🌸 Let me show you the Women's collection.", action: { type: 'scroll', target: '#women', options: { block: 'start' } } },
    { id: 'women_dress', keywords: ['dress', 'maxi dress', 'floral dress', 'western dress', 'gown', 'evening wear', 'cocktail dress'], response: "Our Floral Maxi Dress at ₹3,299 is perfect for any occasion! 👗 Heading to Women's Finest...", action: { type: 'scroll', target: '#women', options: { block: 'start' } } },
    { id: 'women_dupatta', keywords: ['dupatta', 'scarf', 'stole', 'kanjivaram dupatta', 'silk dupatta'], response: "Our Kanjivaram Silk Dupatta at ₹2,199 is a dream — rich silk with gold border! ✨ Let me show you trending accessories.", action: { type: 'filter', target: 'Women', options: { tabDelay: 600 } } },
    { id: 'women_general', keywords: ['women', 'woman', 'ladies', 'her', 'female', 'girls', 'women collection', 'women wear', 'ladies wear'], response: "Our Women's Finest collection has something for every occasion — from casual to bridal! 🌸 Taking you there now.", action: { type: 'scroll', target: '#women', options: { block: 'start' } } },
    { id: 'men_sherwani', keywords: ['sherwani', 'groom', 'wedding dress men', 'dulha', 'royal sherwani', 'gold sherwani', 'wedding outfit men'], response: "The perfect groom look! 🤵 Our Royal Gold-Work Sherwani Set at ₹18,999 is hand-crafted in Varanasi with real zari work. Taking you to Men's Signatures...", action: { type: 'multi', target: null, options: { steps: [{ type: 'scroll', target: '#men', delay: 0 }, { type: 'highlight', target: '#men .pcard.tall', delay: 800 }] } } },
    { id: 'men_kurta', keywords: ['men kurta', 'kurta men', 'linen kurta', 'cotton kurta', 'mandarin kurta', 'kurta pajama', 'kurta pyjama', 'ethnic men wear'], response: "Our Linen Mandarin Kurta at ₹1,499 (was ₹1,999) is incredibly popular! 👘 Light, breathable, perfect for all occasions. Heading to Men's Signatures...", action: { type: 'scroll', target: '#men', options: { block: 'start' } } },
    { id: 'men_shirt', keywords: ['shirt', 'formal shirt', 'oxford shirt', 'cotton shirt', 'office shirt', 'men shirt', 'casual shirt'], response: "Our Oxford Cotton Shirt at ₹1,899 is a wardrobe essential — crisp, comfortable, and timeless! 👔 Taking you to Men's collection.", action: { type: 'scroll', target: '#men', options: { block: 'start' } } },
    { id: 'men_jeans', keywords: ['jeans', 'denim', 'slim fit', 'trousers', 'pants', 'dark jeans', 'men bottoms'], response: "Our Slim Fit Dark Jeans at ₹2,299 are a modern essential — structured and sharp! 👖 Heading to Men's collection.", action: { type: 'scroll', target: '#men', options: { block: 'start' } } },
    { id: 'men_blazer', keywords: ['blazer', 'jacket', 'tweed', 'heritage blazer', 'suit jacket', 'formal jacket', 'nehru jacket'], response: "The Heritage Tweed Blazer at ₹7,999 is premium craftsmanship — and our Brocade Nehru Jacket at ₹3,499 is perfect for festive occasions! 🧥 Let me take you to Men's Signatures.", action: { type: 'scroll', target: '#men', options: { block: 'start' } } },
    { id: 'men_general', keywords: ['men', 'man', 'male', 'him', 'gents', 'boys', 'men collection', 'men wear', 'gents wear'], response: "From casual kurtas to royal sherwanis — our Men's Signatures has it all! 👔 Taking you there now.", action: { type: 'scroll', target: '#men', options: { block: 'start' } } },
    { id: 'ethnic_banarasi', keywords: ['banarasi', 'varanasi', 'banaras', 'zari silk', 'handloom silk', 'brocade silk', 'woven silk'], response: "Banarasi silks are our crown jewel! 🏛️ Hand-woven by master artisans in Varanasi — each saree takes 15–30 days to craft. Let me show you our Heritage Collections...", action: { type: 'scroll', target: '#ethnic', options: { block: 'start' } } },
    { id: 'ethnic_chikankari', keywords: ['chikankari', 'chikan', 'lucknow embroidery', 'shadow work', 'hand embroidery', 'lucknowi', 'white embroidery'], response: "Chikankari is magic! 🌸 Delicate shadow-work embroidery by Lucknow artisans — each kurta involves 3–10 days of hand work. Taking you to the Ethnic Spotlight!", action: { type: 'scroll', target: '#ethnic', options: { block: 'start' } } },
    { id: 'ethnic_rajasthani', keywords: ['rajasthani', 'jaipur', 'block print', 'bandhani', 'leheriya', 'rajasthan', 'mirror work', 'hand block'], response: "Rajasthani block prints are a burst of colour and heritage! 🎨 Natural dyes, carved wooden blocks, Jaipur artisan families. Heading to the Ethnic Spotlight...", action: { type: 'scroll', target: '#ethnic', options: { block: 'start' } } },
    { id: 'ethnic_kalamkari', keywords: ['kalamkari', 'andhra', 'hand painted', 'natural dye', 'kalam', 'srikalahasti', 'pen painting'], response: "Kalamkari is living art! 🖌️ Drawn by hand using a bamboo pen dipped in natural plant dyes — completely chemical-free. Exploring Heritage Collections for you...", action: { type: 'scroll', target: '#ethnic', options: { block: 'start' } } },
    { id: 'ethnic_kanjivaram', keywords: ['kanjivaram', 'kanchipuram', 'kanjeevaram', 'temple border', 'south silk', 'tamil silk', 'gold border saree'], response: "Kanjivaram silks are the queen of Indian textiles! 👑 GI-tagged, mulberry silk, real gold zari — temple border designs. Let me show you our Heritage section.", action: { type: 'scroll', target: '#ethnic', options: { block: 'start' } } },
    { id: 'ethnic_general', keywords: ['ethnic', 'heritage', 'traditional', 'handloom', 'artisan', 'craft', 'handcrafted', 'authentic', 'regional wear', 'indian wear', 'desi', 'folk'], response: "Rooted in craft, dressed for today! 🏛️ Our Ethnic Spotlight celebrates Banarasi Silks, Rajasthani Prints, Chikankari, and Kalamkari. Taking you there...", action: { type: 'scroll', target: '#ethnic', options: { block: 'start' } } },
    { id: 'trending_all', keywords: ['trending', 'popular', 'bestseller', 'most loved', 'what is trending', 'top picks', 'best seller', 'hot right now', 'what is popular', 'new arrival', 'latest', 'what is new'], response: "Here's what everyone is loving right now! 🔥 Our trending picks include a Kanjivaram Dupatta, Brocade Nehru Jacket, Palazzo Set and Linen Dhoti Pants. Let me show you!", action: { type: 'scroll', target: '#trending', options: { block: 'start' } } },
    { id: 'trending_women', keywords: ['trending women', 'popular women', 'women trending', 'best for women', 'top women', 'women bestseller'], response: "Showing you the hottest women's styles right now! ✨", action: { type: 'filter', target: 'Women', options: { tabDelay: 600 } } },
    { id: 'trending_men', keywords: ['trending men', 'popular men', 'men trending', 'best for men', 'top men', 'men bestseller'], response: "Here are the trending men's picks! 👔 Everyone is loving the Brocade Nehru Jacket right now.", action: { type: 'filter', target: 'Men', options: { tabDelay: 600 } } },
    { id: 'trending_ethnic', keywords: ['trending ethnic', 'popular ethnic', 'ethnic trending', 'best ethnic', 'top ethnic'], response: "Our ethnic picks are flying off shelves! 🌺 The Linen Dhoti Pants are a huge hit right now.", action: { type: 'filter', target: 'Ethnic', options: { tabDelay: 600 } } },
    { id: 'trending_western', keywords: ['trending western', 'popular western', 'western trending', 'western wear', 'indo western', 'fusion'], response: "Fusion fashion at its best! 🌟 Showing you our trending western picks.", action: { type: 'filter', target: 'Western', options: { tabDelay: 600 } } },
    { id: 'lookbook_general', keywords: ['lookbook', 'look book', 'outfit idea', 'style idea', 'how to wear', 'what to wear', 'outfit inspo', 'fashion inspo', 'style guide', 'the edit'], response: "Get inspired by our curated looks! 📸 The Festive Saree Edit, The Groom's Story, and Sangeet Night Looks are waiting for you.", action: { type: 'scroll', target: '#lookbook', options: { block: 'start' } } },
    { id: 'lookbook_wedding', keywords: ['wedding look', 'bridal look', 'wedding outfit', 'wedding style', 'wedding season', 'shaadi look', 'shaadi outfit'], response: "Wedding season is the best season! 💍 Our Lookbook has stunning bridal and groom looks curated just for you.", action: { type: 'scroll', target: '#lookbook', options: { block: 'start' } } },
    { id: 'lookbook_sangeet', keywords: ['sangeet', 'mehndi', 'haldi', 'pre wedding', 'celebration look', 'dance look', 'cocktail look', 'party look'], response: "Sangeet outfits are all about colour and drama! 💃 Let me show you our Sangeet Night Looks in the Lookbook.", action: { type: 'scroll', target: '#lookbook', options: { block: 'start' } } },
    { id: 'lookbook_festive', keywords: ['diwali', 'eid', 'holi', 'navratri', 'puja', 'durga puja', 'festive', 'festival wear', 'festival outfit', 'celebration'], response: "Festival dressing is our favourite! 🪔✨ Our Festive Saree Edit in the Lookbook is full of inspiration for you.", action: { type: 'scroll', target: '#lookbook', options: { block: 'start' } } },
    { id: 'home_top', keywords: ['home', 'homepage', 'top', 'start', 'beginning', 'go back', 'main page', 'go to top'], response: "Taking you back to the top! 🏠", action: { type: 'scroll', target: '#home', options: { block: 'start' } } },
    { id: 'browse_all', keywords: ['browse', 'shop all', 'show me everything', 'see all', 'explore', 'collection', 'categories', 'what do you have'], response: "We have 2,400+ curated styles across 7 categories! 🛍️ Sarees, Kurtas, Lehengas, Shirts, Dresses, Jeans, and Ethnic Wear. Where shall we start?", action: { type: 'scroll', target: '#home', options: { block: 'start' } } },
  ];

  const FALLBACK_RESPONSES = {
    shipping: { keywords: ['ship', 'deliver', 'delivery', 'free shipping', 'cod'], response: "Free delivery on all orders above ₹999! 🚚 Standard delivery: 3–5 days metro, 5–7 days elsewhere. COD available Pan India (₹30 handling charge)." },
    returns: { keywords: ['return', 'refund', 'exchange', 'money back'], response: "Easy 30-day returns! ↩️ Item must be unused with original tags. Refunds in 5–7 business days. Shall I help you start a return?" },
    payment: { keywords: ['pay', 'payment', 'upi', 'card', 'emi', 'cod', 'cash'], response: "We accept UPI, Visa, Mastercard, RuPay, Net Banking, and COD! 💳 EMI available on HDFC, ICICI, Axis, SBI cards for orders above ₹5,000." },
    size: { keywords: ['size', 'fit', 'measurement', 'measure', 'small', 'large'], response: "Happy to help with sizing! 📏 For kurtas I need your chest size. For sarees, one size fits all. For lehengas, your waist size. What are you shopping for?" },
    order: { keywords: ['order', 'track', 'where is', 'status', 'dispatch'], response: "I can track your order! 📦 Please share your Order ID (e.g., VC-XXXXXXX) and the last 4 digits of your registered phone number." },
    price: { keywords: ['price', 'cost', 'budget', 'cheap', 'affordable', 'expensive', 'discount', 'offer'], response: "Our collection ranges from ₹1,499 to ₹25,000+! 💛 Free shipping above ₹999. Use code FIRSTLOOK for 10% off your first order." },
    default: [
      "Great question! 😊 I can help you browse collections, track orders, handle returns, or find your perfect size. What would you like?",
      "I'd love to help! 🌸 Try asking me about a specific style, occasion, or fabric and I'll take you right to it!",
      "Of course! ✨ You can also try the quick buttons below to explore collections, check trending styles, or view the Lookbook."
    ]
  };

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
    
    const chipsHTML = GREETING_CHIPS.map(c => `<button class="vaani-chip" data-q="${c.query}">${c.label}</button>`).join('');

    msgs.innerHTML = `
      <div class="vaani-msg vaani-msg-bot vaani-msg-greeting">
        <div class="vaani-msg-avatar"><img src="/assets/vaani-pet.png" style="width:100%; height:100%; object-fit:cover; border-radius:50%;"></div>
        <div class="vaani-msg-bubble">
          Namaste! 🙏 I'm <strong>Vaani</strong> — your personal style companion
          at Vasudha Couture.<br><br>How can I help you today?
          <div class="vaani-quick-chips">
            ${chipsHTML}
          </div>
        </div>
      </div>`;
  }

  function showTyping() {
    const t = document.getElementById('vaaniTyping');
    if (t) { t.classList.remove('hidden'); t.scrollIntoView({ behavior: 'smooth' }); }
  }

  function hideTyping() {
    const t = document.getElementById('vaaniTyping');
    if (t) { t.classList.add('hidden'); }
  }

  function addRedirectIndicator(intent) {
    const msgs = document.getElementById('vaaniMessages');
    if (!msgs) return;

    const destinations = {
      '#women':   "👗 Women's Collection",
      '#men':     "👔 Men's Signatures",
      '#ethnic':  '🏛️ Ethnic Spotlight',
      '#trending':'🔥 Trending Now',
      '#lookbook':'📸 Season Lookbook',
      '#home':    '🏠 Homepage',
    };

    const target  = intent.action?.target || intent.action?.options?.steps?.[0]?.target;
    const label   = destinations[target] || 'Collection';

    const div = document.createElement('div');
    div.className = 'vaani-redirect-indicator';
    div.innerHTML = `
      <span class="vaani-redirect-arrow">→</span>
      Navigating to <strong>${label}</strong>
      <span class="vaani-redirect-dots"><span></span><span></span><span></span></span>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;

    // Auto-remove indicator after panel closes
    setTimeout(() => div.remove(), 2000);
  }

  /* ── REDIRECT LOGIC ── */
  function matchIntent(message) {
    const m = message.toLowerCase().trim();
    for (const intent of INTENT_MAP) {
      const matched = intent.keywords.some(keyword => m.includes(keyword.toLowerCase()));
      if (matched) return intent;
    }
    return null;
  }

  function getDemoResponse(message) {
    const m = message.toLowerCase();
    for (const [key, fb] of Object.entries(FALLBACK_RESPONSES)) {
      if (key === 'default') continue;
      if (fb.keywords?.some(k => m.includes(k))) return fb.response;
    }
    const arr = FALLBACK_RESPONSES.default;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function redirect(type, target, options) {
    options = options || {};

    switch (type) {
      case 'scroll':
        const scrollTarget = document.querySelector(target);
        if (!scrollTarget) break;
        setTimeout(() => {
          scrollTarget.scrollIntoView({
            behavior: 'smooth',
            block: options.block || 'start'
          });
        }, options.delay || 0);
        break;

      case 'filter':
        const trendSection = document.querySelector('#trending');
        if (trendSection) {
          trendSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setTimeout(() => {
          document.querySelectorAll('.filter-tab').forEach(tab => {
            if (tab.textContent.trim().toLowerCase() === target.toLowerCase()) {
              tab.click();
            }
          });
        }, options.tabDelay || 600);
        break;

      case 'highlight':
        const card = document.querySelector(target);
        if (!card) break;
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          card.classList.add('vaani-highlight');
          setTimeout(() => card.classList.remove('vaani-highlight'), CONFIG.highlightDurationMs || 2500);
        }, 400);
        break;

      case 'multi':
        if (!Array.isArray(options.steps)) break;
        options.steps.forEach((step, i) => {
          setTimeout(() => {
            redirect(step.type, step.target, step.options || {});
          }, step.delay || i * 500);
        });
        break;

      case 'external':
        window.open(target, '_blank', 'noopener');
        break;

      case 'toast':
        if (typeof window.showToast === 'function') {
          window.showToast(target);
        }
        break;
    }
  }

  function executeRedirectFlow(intent) {
    if (!intent || !intent.action) return;
    setTimeout(() => {
      closePanel();
      setTimeout(() => {
        redirect(intent.action.type, intent.action.target, intent.action.options || {});
      }, CONFIG.panelToScrollMs);
    }, CONFIG.replyToRedirectMs);
  }

  /* ── SEND MESSAGE ── */
  async function sendMessage(text) {
    if (!text.trim()) return;

    addMessage(text, 'user');
    showTyping();

    // Simulate thinking time
    await new Promise(r => setTimeout(r, CONFIG.typingDuration));
    hideTyping();

    const intent = matchIntent(text);

    if (intent) {
      addMessage(intent.response, 'bot');
      setTimeout(() => {
        if(CONFIG.showRedirectIndicator) addRedirectIndicator(intent);
      }, 300);
      executeRedirectFlow(intent);
    } else {
      addMessage(getDemoResponse(text), 'bot');
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
      chip.addEventListener('click', () => {
        const query = chip.dataset.q || chip.textContent;
        sendMessage(query);
      });
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
