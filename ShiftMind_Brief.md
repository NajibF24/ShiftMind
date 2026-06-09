# ShiftMind
### *Your company's memory, powered by AI.*

---

## What Is It?

ShiftMind is an enterprise AI assistant that prevents companies from losing what their people know.

When an employee leaves, they take years of tacit knowledge with them — how to handle specific machine failures, unwritten SOP shortcuts, tribal knowledge that never made it into a document. ShiftMind captures, stores, and serves that knowledge automatically.

---

## Core Capabilities

| Feature | Description |
|---|---|
| **AI Chat (RAG)** | Ask anything about SOPs, policies, or procedures — answers sourced from your actual documents |
| **Work Journal** | Daily task logging that AI auto-categorizes and extracts lessons learned |
| **Workflow Recorder** | Record step-by-step procedures, AI converts them into formal SOP documents |
| **Daily Checklists** | Operational safety checklists with AI anomaly detection on FAIL items |
| **Expert Finder** | Discover domain experts within your org based on journal contributions |
| **Knowledge Analytics** | Detect knowledge gaps from query logs before they become incidents |
| **Approval & Contract Review** | AI-assisted legal risk assessment on contracts and purchase orders |
| **OneDrive Sync** | Automatically ingests SOP documents from SharePoint/OneDrive via Microsoft Graph |
| **WhatsApp Alerts** | Real-time notifications on critical events (checklist FAIL, approvals) |
| **3D Knowledge Gallery** | Immersive navigation interface built on Three.js + React Three Fiber |

---

## Tech Stack

**Backend:** FastAPI · PostgreSQL + pgvector (vector search) · SQLAlchemy · APScheduler  
**AI:** OpenAI-compatible API via 9Router · FastEmbed (local embeddings) · RAG pipeline  
**Auth:** LDAP / Active Directory · JWT  
**Integrations:** Microsoft Graph (OneDrive) · WhatsApp (Baileys) · SSE real-time dashboard  
**Frontend:** React 18 · Vite · Three.js · React Three Fiber · Framer Motion  
**Infra:** Docker Compose · Nginx · pgvector

---

## What's Working Well

- Full RAG pipeline with pgvector — semantic search across all company documents
- LDAP/AD authentication with role-based access (admin / user / viewer)
- Auto-learning: frequently asked queries are fed back into the knowledge base
- OneDrive sync with change detection (only re-syncs modified files)
- Real-time dashboard via Server-Sent Events
- 3D art gallery navigation — genuinely memorable UI differentiator
- Knowledge Lineage tracking (source type, confidence score, age)
- Multi-format document parsing: PDF, DOCX, XLSX, PPTX, TXT

---

## Gaps & Recommendations

### 🔴 Critical — Fix Before Demo

**1. Auto-learning is too noisy**  
Every query above a similarity threshold gets written back to the knowledge base. After a few days of usage, the KB will be polluted with low-quality AI-generated responses ranked alongside real SOPs. **Fix:** Add a human-approval step before auto-learned entries enter the main search index. Mark them as `source=draft` and gate behind admin review.

**2. Knowledge Health dashboard is built but not exposed in UI**  
`backend/services/knowledge_health.py` is complete — staleness detection, contradiction detection — but there's no route or UI page consuming it. This is actually the most defensible differentiator in the entire app. **Fix:** Wire up a `/api/knowledge-health` route and add a "Knowledge Health" page (the code is already in `analisis-shiftmind.md`).

**3. Scraper failure shows `$0.00` on dashboard**  
When Yahoo Finance is unavailable, `steel_hrc` returns `None`, but the dashboard renders it as `$0.00`. **Fix:** Already partially handled in `scraper_service.py` — propagate the `errors` field to the frontend and render "N/A" with an info tooltip instead.

**4. `vite.config.js` proxy is already correct**  
`target: 'http://backend:8000'` — this is fine for Docker. Don't change this.

---

### 🟡 High Impact — Add If Time Allows

**5. Transition system is flat**  
Page navigation currently fades in with `animate-fade-in`. For a hackathon demo, transitions are the difference between "cool app" and "this feels production-ready." Recommendation below.

**6. No offline indicator**  
If the backend goes down during demo, the UI gives no feedback. Add a connection status bar.

**7. Session history is lost on refresh**  
`sessionStorage` for chat history means a page refresh clears the conversation. Consider `localStorage` with a max-message cap.

**8. Mobile layout is not demoed**  
The 3D gallery is desktop-only. Add a fallback card grid for mobile to show judges the app is production-aware.

---

## Transition & 3D Enhancement Plan

### Smooth Page Transitions (inspired by transitions.dev)

Add a **full-viewport clip-path wipe** between routes using Framer Motion's `AnimatePresence`. The effect: a dark panel slides in from the bottom-left corner (like a book page turning), reveals the new page, then retracts. This is the "curtain" pattern common in award-winning portfolios.

```jsx
// In App.jsx — wrap routes with AnimatePresence
const pageVariants = {
  initial: { clipPath: 'inset(0 0 100% 0)', opacity: 0 },
  animate: {
    clipPath: 'inset(0 0 0% 0)',
    opacity: 1,
    transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] }
  },
  exit: {
    clipPath: 'inset(100% 0 0 0)',
    opacity: 0,
    transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] }
  }
};
```

**Recommended transitions per route:**
- `/explore` → `/ask`: Knowledge particles converge into the chat input (Three.js particle burst)
- `/ask` → `/dashboard`: Columns of data unfurl from center outward
- Any → `/explore`: Full-screen 3D environment swallow effect (scale from gallery painting)

---

### Immersive 3D Additions

**Floating Knowledge Nodes on Dashboard**  
Replace the static stats cards with a mini Three.js scene: knowledge entries float as glowing orbs, connected by edges (like a knowledge graph). Hover an orb → tooltip with entry title. Click → navigate to that document. This turns a boring dashboard into something you'd screenshot.

```jsx
// Mini knowledge graph — add to Dashboard.jsx
<Canvas style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
  <KnowledgeGraph nodes={entries} onNodeClick={navigateTo} />
</Canvas>
```

**Morphing Logo in Nav**  
The ShiftMind logo in `FloatingNav` can be a live Three.js torus that slowly morphs and rotates. 12 lines of Three.js, massive visual payoff.

**Liquid Metal Background on Login**  
Replace `NeuralBackground` on the login page with a GLSL shader — a dark liquid metal surface that ripples when the mouse moves. Libraries like `three-custom-shader-material` make this approachable.

**SOP Document Preview as 3D Object**  
When a knowledge entry is viewed in the sidebar, animate it in as a 3D card that flips from back to front (CSS `transform-style: preserve-3d`). Fast to implement, tactile feel.

**Particle Trail on Route Change**  
On navigation, spawn 40–60 particles from the clicked element's position. They arc across the screen in the direction of travel and dissolve. Pure CSS + vanilla JS, no Three.js overhead.

---

## One-Line Pitch for Judges

> **ShiftMind** — the AI system that makes sure the next person who sits at your desk can do your job from day one.

---

## Demo Script (3 Minutes)

1. **(0:00–0:30)** Open the 3D gallery. Walk toward the "Ask ShiftMind AI" painting. Click it. Show the AI answering a detailed SOP question with source citations.
2. **(0:30–1:00)** Navigate to Work Journal. Log a quick entry. Show AI auto-categorizing it and extracting lessons learned.
3. **(1:00–1:30)** Open Checklists. Submit a checklist with one FAIL item. Show the AI safety analysis appearing in real-time + WhatsApp alert simulation.
4. **(1:30–2:00)** Show the Dashboard — live market data, knowledge source breakdown, system health.
5. **(2:00–2:30)** Open Expert Finder. Search "electrode". Show ranked experts with scores from actual data.
6. **(2:30–3:00)** Close with Knowledge Analytics — show a knowledge gap ("there are 47 questions about HRC pricing with only 2 knowledge entries"). "This is what no other system tells you."

---

*Built for PT Garuda Yamato Steel · ShiftMind v2.0 · 2025 Hackathon*
