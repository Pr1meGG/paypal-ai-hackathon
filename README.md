# 🛡️ ScopeGuard

> **Automated AI Scope Enforcement & Instant PayPal Scope-Creep Monetization for Freelancers and Agencies.**

Built for the **PayPal AI Hackathon**.

---

## 💡 The Problem

Every freelance developer, designer, and agency has experienced **"Scope Creep"**:
- A client signs a contract for a 4-page website.
- Midway through development, the client sends emails or Slack messages asking for "just a small addition"—a custom payment checkout, an analytics dashboard, or CRM sync.
- Freelancers face an uncomfortable dilemma:
  1. **Do it for free:** Lose margins, work unpaid hours, and harbor resentment.
  2. **Argue over email:** Friction, awkwardness, delayed payments, and damaged relationships.
  3. **Send a manual invoice days later:** High drop-off, unpaid invoices, and delayed project timelines.

---

## ⚡ The Solution: ScopeGuard

**ScopeGuard** eliminates awkward scope disputes by combining **Semantic AI Contract Reasoning** with **PayPal Instant Checkout**:

1. **AI Contract Diffing & Evidence:** Ingests the client's message and cross-references it against the original Statement of Work (SOW). It quotes exact clauses, itemizes deliverables, and classifies the request as:
   - **`INCLUDED` (Free):** Minor revisions, bug fixes, or agreed deliverables ($0.00).
   - **`EXTRA_PROPOSED` (Billable Add-on):** New features, integrations, or out-of-scope work.
2. **Deterministic Financial Control:** The AI proposes classifications and estimates; human merchants retain deterministic control to adjust pricing and scope notes before any financial transaction is initiated.
3. **Instant PayPal Sandbox Checkout:** Automatically generates a verified PayPal Orders v2 checkout link. The client authorizes the add-on in seconds, funds are captured, and the scope change is formally unlocked.

---

## 🏆 Why PayPal & AI Genuinely Matter

| Dimension | Role in ScopeGuard | Why It's Essential |
| :--- | :--- | :--- |
| **PayPal Orders v2** | Transactional & settlement primitive | Powers immediate, trusted, multi-currency client authorization (`POST /v2/checkout/orders` with `intent: "CAPTURE"` and server-side capture via `POST /v2/checkout/orders/{id}/capture`). Prevents unauthorized scope work before payment. |
| **AI Semantic Reasoning** | Contract diffing & evidence extraction | Synthesizes unstructured legal briefs and messy client chat into objective contract diffs, quotes exact clauses, and removes human emotional bias from scope negotiations. |
| **Deterministic Safeguards** | Financial security boundaries | All currency calculations, state transitions (`ANALYZING` → `MERCHANT_APPROVED` → `PAID`), and PayPal secrets are kept server-side with strict idempotency keys (`PayPal-Request-Id`). |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│               ScopeGuard SPA (Vanilla JS + CSS)         │
│  - 1-Click Demo Scenarios (Included vs Scope Creep)    │
│  - Real-Time AI Diff Inspector & Contract Evidence     │
│  - PayPal Sandbox Order Generation & Capture Buttons   │
└──────────────────────────┬─────────────────────────────┘
                           │ REST API
┌──────────────────────────▼─────────────────────────────┐
│                 FastAPI Backend (app/)                 │
│  ├── routers/projects.py  (Project SOW management)     │
│  ├── routers/scope.py     (AI analysis & approval)     │
│  └── routers/paypal.py    (Capture & return handler)   │
└────────────┬─────────────────────────────┬─────────────┘
             │                             │
┌────────────▼────────────┐   ┌────────────▼────────────┐
│   app/services/ai.py    │   │  app/services/paypal.py │
│   - Semantic comparison │   │  - OAuth 2.0 Auth       │
│   - Evidence extraction │   │  - Orders v2 Creation   │
│   - Structured JSON     │   │  - Orders v2 Capture    │
└─────────────────────────┘   └─────────────────────────┘
```

---

## ⏱️ The 3-Minute Demo Script

1. **The Scenario (0:00 - 0:30):** Open the dashboard. Point to the preloaded Statement of Work for *Apex Retailers LLC* (4-page website, 2 revision rounds, custom payments out of scope).
2. **Scenario 1: Minor Revision (0:30 - 1:00):**
   - Click **"Scenario 1: Minor Bug / Revision"** -> Client asks: *"Can you fix the alignment of the submit button on mobile?"*
   - Click **"Audit Scope"** -> AI immediately classifies as **`INCLUDED` ($0.00)** and quotes: *"Includes 2 rounds of minor copy and layout revisions."* No invoice is generated.
3. **Scenario 2: Scope Creep & PayPal Checkout (1:00 - 2:15):**
   - Click **"Scenario 2: Unscoped Feature Creep"** -> Client asks: *"We also need an analytics dashboard and a multi-currency PayPal checkout."*
   - Click **"Audit Scope"** -> AI classifies as **`EXTRA_PROPOSED`**, itemizes deliverables, and quotes the exclusion clause.
   - Merchant reviews the suggested $500.00 price, adds a scope note, and clicks **"Generate PayPal Sandbox Order"**.
   - A live PayPal Sandbox Order ID (`CREATED`) and Checkout URL appear.
4. **Settlement & Audit Trail (2:15 - 3:00):**
   - Click **"Capture & Settle Payment"** -> Instant capture verification (`PAID`) with PayPal Capture ID.
   - Show the **Audit Log** reflecting real-time transaction records and formal contract amendments.

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- Python 3.10+
- (Optional) PayPal Sandbox Developer credentials (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`)
- (Optional) OpenAI API Key (`AI_API_KEY`)

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
APP_ENV=dev
DATABASE_URL=sqlite:///./scopeguard.db

# PayPal Sandbox Credentials (https://developer.paypal.com)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

# AI API Key (Optional: deterministic fallback works out-of-the-box)
AI_PROVIDER=openai
AI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4o-mini
```

### 3. Run the Application
```bash
# From paypal-ai-hackathon/
python3 -m uvicorn app.main:app --reload --port 8000
```
Open your browser at **`http://localhost:8000`** to access the ScopeGuard UI.

### 4. Run Automated Tests
```bash
PYTHONPATH=. pytest -v
```

---

## 🔒 Security & Best Practices

- **Zero Secrets in Frontend:** All PayPal client secrets and AI tokens reside exclusively in server-side environment variables.
- **Idempotent Financial Calls:** All PayPal order creations and captures use unique UUID `PayPal-Request-Id` headers.
- **State Progression Enforcement:** Transitions follow a strict DAG (`ANALYZING` → `EXTRA_PROPOSED` → `MERCHANT_APPROVED` → `PAID`), preventing double captures or unapproved order issuance.
