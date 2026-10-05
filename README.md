# ScopeGuard Enterprise — Contract Baseline Governance & PayPal Orders v2 Financial Settlement

> **Mission-critical enterprise platform for automated Statement of Work (SOW) semantic delta analysis, commercial change order authorization, and PayPal Orders v2 REST capture.**

Built for the **PayPal AI Hackathon**.

---

## Executive Summary & Problem Space

Enterprise engineering teams, professional services organizations, and technical consultancies lose 12–18% of contracted revenue annually to **unmonitored scope deviation**:
- Clients execute binding Statements of Work (SOWs) defining project deliverables, milestones, and explicit boundary exclusions.
- Throughout execution, stakeholders submit change requests across unstructured communications channels (Slack, Jira Service Desk, Salesforce, and Email) under the guise of "minor adjustments."
- Project managers face operational friction:
  1. **Absorb scope deviation unbilled:** Margin erosion, unallocated engineering burn, and delivery deadline jeopardy.
  2. **Manual dispute cycles:** Protracted email debates, subjective interpretations of contract briefs, and relationship strain.
  3. **Delayed invoicing:** High abandonment rates and accounts receivable drag.

---

## ScopeGuard Enterprise Solution

**ScopeGuard Enterprise** establishes a deterministic financial security boundary that converts inbound scope deviations into pre-authorized, captured revenue using **Semantic AI Contract Diffing** and **PayPal Orders v2 REST Settlement**:

```
 [Inbound Request] ───► [Semantic SOW Diff Engine] ───► [Classification & Evidence Citation]
 (Slack / Jira / Email)     (AI Clause Matcher)             ├─ INCLUDED ($0.00 / Warranty)
                                                            └─ EXTRA_PROPOSED (Scope Creep)
                                                                       │
                                                            [Merchant Human-in-the-Loop]
                                                            (Authorized Pricing & Terms)
                                                                       │
                                                            [PayPal Orders v2 REST Engine]
                                                            (POST /v2/checkout/orders)
                                                                       │
                                                            [Instant Capture & Audit Ledger]
                                                            (POST /v2/checkout/orders/{id}/capture)
```

1. **AI Semantic Contract Governance & Clause Citation:** Compares inbound requests against baseline SOWs. Extracts verbatim contract citations, itemizes deliverable requirements, and provides an objective confidence score:
   - **`INCLUDED` ($0.00):** Validated under warranty provisions, minor defect correction, or existing baseline scope.
   - **`EXTRA_PROPOSED` (Billable Change Order):** Out-of-scope architectural extensions, third-party integrations, or custom engineering.
2. **Deterministic Human-in-the-Loop Financial Security:** AI suggests classifications and pricing estimates; merchants retain deterministic authority over approved amounts, deliverable descriptions, and commercial terms before financial dispatch.
3. **PayPal Orders v2 REST API Settlement:**
   - Idempotent order creation via `POST /v2/checkout/orders` with `intent: "CAPTURE"` and `PayPal-Request-Id`.
   - Buyer approval via PayPal Checkout web redirect or mobile authorization.
   - Direct server-side capture via `POST /v2/checkout/orders/{id}/capture` with fee accounting, immutable transaction ledger entry, and webhook distribution.

---

## System Architecture

ScopeGuard Enterprise is architected around a unified high-density operational platform:

- **Scope Diff Workbench:** Split-screen interface for real-time contract comparison, clause citation analysis, and PayPal order initialization.
- **Financial Audit Ledger:** Searchable, filterable compliance ledger recording all scope evaluations, classifications, and settlements with one-click CSV export.
- **Webhook Dispatcher & Stream Inspector:** Interactive payload validator and listener for `PAYMENT.CAPTURE.COMPLETED` and `CHECKOUT.ORDER.APPROVED` webhook events.
- **Contract Vault:** Repository of active Statements of Work, change order exhibits, and commercial master agreements.

---

## Enterprise Design System & Tokens

- **Palette:** Dark Slate Charcoal (`#080c14`, `#0d1322`, `#11192e`), PayPal Navy (`#003087`), Interactive PayPal Blue (`#0070e0`), Emerald (`#10b981`), Amber (`#f59e0b`), Slate Borders (`#223154`).
- **Typography:** `Inter` & `Plus Jakarta Sans` for UI labels; `Geist Mono` & `JetBrains Mono` with `font-feature-settings: "tnum" on` for financial values, contract citations, and transaction identifiers.
- **Strict Vector Icons:** 100% clean SVG line iconography with zero emojis or non-standard glyphs.

---

## Technical Stack & API Integration

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend API** | FastAPI / Python 3.10+ | High-concurrency REST API with Pydantic v2 validation and SQLite/PostgreSQL persistence. |
| **Payment Gateway** | PayPal Orders v2 REST API | OAuth 2.0 client credentials authentication, order intent creation, capture execution, and idempotency key handling. |
| **Semantic AI Engine** | OpenAI / Anthropic / Heuristic Fallback | Multi-stage prompt evaluation, clause citation retrieval, and JSON deliverable decomposition. |
| **Frontend Platform** | Native HTML5 / CSS3 / Vanilla ES6+ | High-density enterprise dashboard with zero external framework dependencies or runtime overhead. |

---

## Getting Started

### 1. Prerequisites
- Python 3.10 or higher
- Modern Web Browser (Chrome, Safari, Firefox, Edge)

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
APP_ENV=dev
DATABASE_URL=sqlite:///./scopeguard.db

# PayPal Sandbox Credentials (https://developer.paypal.com)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

# AI Provider Configuration (Optional: deterministic fallback operates out-of-the-box)
AI_PROVIDER=openai
AI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4o-mini
```

### 3. Launch Development Server
```bash
python3 -m uvicorn app.main:app --reload --port 8080
```
Access the application at **`http://127.0.0.1:8080`**.

### 4. Execute Automated Test Suite
```bash
PYTHONPATH=. pytest -v
```
All 6 automated integration and unit test suites validate with 100% pass rates.

---

## Security & Compliance Considerations

- **Server-Side Secret Isolation:** All PayPal credentials, OAuth access tokens, and AI API keys are isolated on the server.
- **Idempotency Guarantees:** Order generation and capture calls include UUID-v4 `PayPal-Request-Id` headers to eliminate duplicate billing risks.
- **Immutable Audit Trail:** Scope evaluations and capture receipts are stored with timestamps, channel provenance, and cryptographic transaction IDs.
