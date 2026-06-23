# DOC 1 — Product Requirements Document (PRD)
## Vaani: AI Customer Support Chatbot — Vasudha Couture

> **Document Type:** PRD  
> **Version:** 2.0.0  
> **AI Engine:** Google Gemini 2.5 Flash  
> **Stack:** Node.js · Neon DB · JWT Auth · Website Chat Widget  
> **Languages:** English · Hindi  
> **Owner:** Product Manager

---

## 1. Executive Summary

Vasudha Couture sells 2,400+ curated fashion styles spanning traditional Indian ethnic wear (sarees, lehengas, sherwanis, kurtas) and modern contemporary fashion. As order volume scales, human-only support becomes unsustainable during peak events (Diwali, Wedding Season, seasonal sales).

**Vaani** is Vasudha Couture's AI-powered chatbot, embedded as a floating widget on the website. Powered by **Google Gemini 2.5 Flash**, Vaani delivers:

- Instant, always-on customer support
- Authenticated, personalised sessions for logged-in users
- General AI conversation for styling, fashion advice, and cultural context
- Bilingual support in English and Hindi
- Full self-service for orders, returns, size guidance, FAQs, and offers

---

## 2. Business Goals

| Priority | Goal | Target Metric |
|----------|------|---------------|
| P0 | Instant first response (< 4 seconds) | p95 latency ≤ 4s |
| P0 | Deflect ≥ 60% of support tickets without human | Deflection rate ≥ 60% |
| P0 | Authenticated user sessions for personalised service | 100% logged-in users identified |
| P1 | Increase cart conversion from chat-assisted browsing | +8% conversion on guided sessions |
| P1 | Improve post-purchase CSAT | CSAT ≥ 4.4 / 5.0 |
| P1 | Full Hindi language parity | Hindi sessions ≥ English quality score |
| P2 | General AI answers to build brand loyalty & stickiness | Avg. session depth ≥ 4 messages |
| P2 | Reduce peak season human agent load | Agent tickets ↓ 40% during Diwali, Wedding Season |

---

## 3. Scope

### 3.1 In Scope — Phase 1

| Domain | Capabilities |
|--------|-------------|
| **Authentication** | Login / signup via email+password or Google OAuth; JWT sessions; guest (anonymous) mode |
| **Product Discovery** | Natural language search, multi-filter recommendations, occasion-based styling |
| **Order Management** | Real-time order tracking, status updates, delivery timeline |
| **Returns & Refunds** | Eligibility check, self-service return initiation, refund status |
| **Size Guidance** | Measurement-based size calculator per category |
| **General AI** | Fashion advice, styling tips, fabric information, cultural context, general conversation |
| **FAQ Resolution** | Shipping, COD, payment methods, customisation, gifting |
| **Offers & Promotions** | Active coupon display, discount explanations, sale info |
| **Human Escalation** | Freshdesk ticket creation, chat transcript handoff |
| **Bilingual Support** | English ↔ Hindi, auto-detection and switching |

### 3.2 Out of Scope — Phase 1

- WhatsApp / Telegram integration (Phase 2)
- Mobile app SDK (Phase 2)
- Voice interface (Phase 3)
- Payment processing inside chat (no PCI scope)
- Regional languages beyond Hindi (Phase 2: Tamil, Telugu, Bengali)

---

## 4. User Personas

### Persona 1 — Priya, 28 · Bridal Shopper · Logged In
> *"I need a lehenga for my cousin's wedding. I know my size but don't know which fabric suits the December weather."*

- **Auth State:** Logged in (has purchase history)
- **Language:** English
- **Primary needs:** Occasion-specific filtering, fabric guidance, delivery confidence
- **General AI use:** "What's the difference between Georgette and Net for a winter wedding?"
- **Pain points:** Too many options, unsure about seasonal fabric suitability

---

### Persona 2 — Ramesh, 52 · Festival Buyer · Guest
> *"मुझे दीवाली के लिए एक शेरवानी चाहिए। साइज़ नहीं पता मेरा।"*

- **Auth State:** Guest (not logged in)
- **Language:** Hindi
- **Primary needs:** Simple product discovery, size help in Hindi, COD confirmation
- **General AI use:** "शेरवानी के साथ कौन से जूते पहनें?"
- **Pain points:** English-only UI, intimidated by online shopping, fears sizing mistakes

---

### Persona 3 — Ananya, 35 · Return Customer · Logged In
> *"I received the kurta but the colour is completely different from the website photo."*

- **Auth State:** Logged in (chatbot auto-fetches her orders)
- **Language:** English
- **Primary needs:** Fast return initiation without repeating order details
- **General AI use:** Not applicable — focused on resolution
- **Pain points:** Being asked for order ID she already forgot, slow refund timelines

---

### Persona 4 — Vikram, 24 · Trend Buyer · Logged In
> *"What's the most stylish ethnic fusion look for a sangeet right now?"*

- **Auth State:** Logged in (wishlist active)
- **Language:** English
- **Primary needs:** Trend-aware recommendations, lookbook links, add-to-wishlist from chat
- **General AI use:** Heavy — uses Vaani for styling conversations, not just support
- **Pain points:** Generic suggestions, no memory of previous conversations

---

### Persona 5 — Sunita, 45 · Gift Buyer · Guest
> *"मुझे अपनी माँ के लिए साड़ी गिफ्ट करनी है। वो वाराणसी से हैं।"*

- **Auth State:** Guest
- **Language:** Hindi
- **Primary needs:** Regional textile expertise, gift wrapping option, artisan authenticity info
- **General AI use:** "बनारसी और कांजीवरम में क्या अंतर है?"
- **Pain points:** Not knowing what's authentic handloom vs. machine-made

---

## 5. Functional Requirements

### 5.1 Authentication & User Sessions

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | Support email + password registration with email verification | P0 |
| FR-AUTH-02 | Support Google OAuth 2.0 login ("Sign in with Google") | P0 |
| FR-AUTH-03 | Issue JWT access token (15-min) + refresh token (7-day) on login | P0 |
| FR-AUTH-04 | Chat widget detects login state: authenticated or guest | P0 |
| FR-AUTH-05 | Authenticated users auto-identified — no need to re-enter order IDs or phone numbers | P0 |
| FR-AUTH-06 | Guest users can access general AI and FAQs; order lookups require login or OTP verification | P1 |
| FR-AUTH-07 | "Login to get personalised help" prompt shown to guest users attempting order queries | P1 |
| FR-AUTH-08 | Session persists across page navigation within same browser tab for 30 minutes | P1 |
| FR-AUTH-09 | Logout clears JWT, chat session, and local widget state | P1 |
| FR-AUTH-10 | Password reset via email link (24-hour expiry) | P1 |

---

### 5.2 General AI Conversation (Gemini 2.5 Flash)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AI-01 | Answer general fashion and styling questions beyond the Vasudha catalogue | P0 |
| FR-AI-02 | Provide cultural context for Indian textiles, occasions, and traditions | P0 |
| FR-AI-03 | Give fabric care and maintenance advice for any garment type | P0 |
| FR-AI-04 | Assist with general styling advice: colour combinations, accessory pairing | P1 |
| FR-AI-05 | Answer body-type and silhouette guidance questions | P1 |
| FR-AI-06 | Respond to conversational greetings and small talk naturally | P1 |
| FR-AI-07 | Always redirect general AI answers toward Vasudha products when relevant | P1 |
| FR-AI-08 | Decline off-topic requests (politics, medical, legal, explicit content) gracefully | P0 |
| FR-AI-09 | General AI answers available to both guest and logged-in users | P0 |
| FR-AI-10 | Maintain conversation context across up to 20 turns within a session | P1 |

---

### 5.3 Product Discovery & Recommendations

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PROD-01 | Accept natural language queries: "sarees under ₹5000 for a wedding" | P0 |
| FR-PROD-02 | Filter by: category, gender, occasion, price range, fabric, colour, region, availability | P0 |
| FR-PROD-03 | Return product cards with image, name, price, discount badge, and "View Product" link | P0 |
| FR-PROD-04 | Suggest cross-sells: "You might also love..." after each recommendation | P1 |
| FR-PROD-05 | Occasion-aware filtering: wedding, festive, office, casual, sangeet, reception, anniversary | P1 |
| FR-PROD-06 | Show trending products (top-viewed in last 7 days) on request | P2 |
| FR-PROD-07 | For logged-in users: factor in purchase history and wishlist for recommendations | P2 |

---

### 5.4 Order Tracking

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ORD-01 | Logged-in users: auto-fetch recent orders, no ID required | P0 |
| FR-ORD-02 | Guest users: accept order ID; verify with last 4 digits of registered phone | P0 |
| FR-ORD-03 | Display status pipeline: Confirmed → Packed → Shipped → Out for Delivery → Delivered | P0 |
| FR-ORD-04 | Show expected delivery date, courier partner, and live tracking link | P0 |
| FR-ORD-05 | Handle delayed orders with empathetic response and escalation offer | P1 |

---

### 5.5 Returns, Refunds & Exchanges

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RET-01 | Check 30-day return eligibility automatically from order date | P0 |
| FR-RET-02 | Guide through eligibility: unused, tags intact, original packaging | P0 |
| FR-RET-03 | Create return request and generate Return ID | P0 |
| FR-RET-04 | Explain refund modes: original method (5–7 days) or store credit (instant) | P0 |
| FR-RET-05 | Handle exchange requests with colour/size selection | P1 |
| FR-RET-06 | Collect return reason and flag quality issues to QA pipeline | P1 |
| FR-RET-07 | For logged-in users: pre-fill all return form data from account | P0 |

---

### 5.6 Size Guidance

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-SIZE-01 | Provide size charts per category: saree blouse, kurta, lehenga, western wear, sherwani | P0 |
| FR-SIZE-02 | Walk user through measurement steps: chest/bust, waist, hip, height, shoulder | P0 |
| FR-SIZE-03 | Calculate and recommend size from entered measurements | P1 |
| FR-SIZE-04 | Note brand-specific sizing notes ("this style runs small — size up") | P1 |
| FR-SIZE-05 | Support measurement input in both cm and inches | P1 |

---

### 5.7 FAQ, Offers & Escalation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-FAQ-01 | Answer: shipping timelines, COD availability, payment methods, gift wrapping, bulk orders | P0 |
| FR-OFFER-01 | Display current active coupons and sale end dates | P1 |
| FR-OFFER-02 | Explain coupon application process at checkout | P1 |
| FR-ESC-01 | Detect escalation triggers: explicit request, 2 failed resolution attempts, negative sentiment | P0 |
| FR-ESC-02 | For logged-in users: pre-fill name/email in escalation form automatically | P0 |
| FR-ESC-03 | Create Freshdesk ticket with full chat transcript attached | P0 |
| FR-ESC-04 | Show estimated human response time | P0 |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| NFR | Requirement | Target |
|-----|-------------|--------|
| NFR-01 | First AI response latency (Gemini 2.5 Flash) | ≤ 4 seconds (p95) |
| NFR-02 | Widget load time on 4G mobile | ≤ 1.5 seconds |
| NFR-03 | Concurrent chat sessions | ≥ 500 simultaneous |
| NFR-04 | Neon DB query response time | ≤ 50ms (p95) |
| NFR-05 | JWT validation overhead | ≤ 5ms |
| NFR-06 | Monthly uptime | ≥ 99.5% |

### 6.2 Multilingual (English & Hindi)

| Requirement | English | Hindi |
|-------------|---------|-------|
| Auto-detect user language from first message | ✅ | ✅ |
| Full chatbot response parity | ✅ | ✅ |
| UI labels in chat widget | ✅ | ✅ |
| Size charts with Hindi labels | ✅ | ✅ |
| Error messages and system prompts | ✅ | ✅ |
| Mid-conversation language switch | ✅ | ✅ |

### 6.3 Accessibility

- WCAG 2.1 AA compliance for chat widget
- Keyboard-navigable widget
- Screen reader compatible (ARIA labels)
- Minimum font size 14px in chat panel
- High contrast mode support

---

## 7. Success Metrics & KPIs

| Metric | Baseline | 3-Month Target | 6-Month Target |
|--------|----------|----------------|----------------|
| Ticket Deflection Rate | 0% | 45% | 62% |
| First Response Time | 4–6 hrs (email) | ≤ 4 seconds | ≤ 3 seconds |
| CSAT Score | 3.8 / 5.0 | 4.2 / 5.0 | 4.5 / 5.0 |
| Auth Login Rate (chat users) | — | 35% | 55% |
| Chat-to-Conversion Rate | — | 6% | 9% |
| Hindi Session Quality Score | — | ≥ 85% | ≥ 92% |
| General AI Satisfaction | — | 4.0 / 5.0 | 4.3 / 5.0 |
| Return Self-Service Rate | 0% | 40% | 60% |
| Avg. Session Depth (messages) | — | ≥ 4 | ≥ 6 |

---

## 8. Assumptions, Constraints & Risks

### 8.1 Assumptions

| # | Assumption |
|---|-----------|
| A1 | Vastra backend exposes REST APIs for order lookup, catalogue search, return initiation |
| A2 | Gemini 2.5 Flash API key is provisioned from Google AI Studio |
| A3 | Neon DB project created with connection pooling enabled |
| A4 | Human agents available 9 AM–9 PM IST, Mon–Sat |
| A5 | Product catalogue data available via API or nightly DB sync |
| A6 | Google OAuth 2.0 app registered in Google Cloud Console |

### 8.2 Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Gemini API hallucination on product prices | Medium | High | Always ground product data from catalogue API, not LLM memory |
| Hindi response quality gaps | Medium | Medium | Prompt engineering with Hindi examples; 4-week human review |
| JWT token theft | Low | High | Short-lived tokens (15 min); HttpOnly cookie for refresh token |
| Neon DB cold start latency | Low | Medium | Connection pooling with PgBouncer (built into Neon) |
| API cost overrun (Gemini) | Low | High | Per-session token budgets; daily cost alerts in GCP Console |
| Low chat-to-login conversion | Medium | Medium | Show personalisation benefits clearly in guest mode |

---

## 9. Release Timeline

```
Week 1–2:   Auth system (login/signup/Google OAuth) + Neon DB schema
Week 3–4:   Chat widget UI + Gemini 2.5 Flash integration + system prompt
Week 5–6:   Product discovery + order tracking tools
Week 7–8:   Returns flow + size guidance + FAQ knowledge base
Week 9:     Hindi language full parity testing + general AI tuning
Week 10:    Security audit + load testing + QA pass
Week 11:    Soft launch (10% traffic) → monitoring
Week 12:    Full launch
```

---

*Document: 01-PRD.md · Version 2.0.0 · Vasudha Couture*
