# AGENTS.md — PayPal AI Hackathon Team Charter

**Repository:** `/Users/nitz/Code'n'Stuff/paypal-ai-hackathon`  
**Deadline:** November 12, 2026 noon PST (November 13, 2026 1:30 AM IST)  
**Primary Target:** Best Use of PayPal + AI ($5,000) | Best Demo Delivery ($5,000)  
**Concept:** ScopeBridge — service brief diff → evidence-linked quote → merchant approval → sandbox PayPal capture

---

## Shared Context (All Agents Read This)

### Non-negotiable Constraints
- **PayPal must be central** — real Orders/Checkout API calls, verified results
- **AI must be meaningful** — agent decides, not just recommends
- **Working build mandatory** — no static mockups
- **Judge access free through Dec 15, 2026**
- **Public GitHub repo with complete setup instructions**
- **YouTube demo < 3 minutes showing real behavior**

### Proven Foundation (Do Not Re-verify)
- **PayPal auth works** — OAuth token obtained via `api-m.sandbox.paypal.com`
- **Order creation works** — v2 endpoint (`/v2/checkout/orders`) returns `CREATED` with approve URL
- **Capture flow works** — requires buyer approval (correct behavior)
- **Credentials in `.env`** — already configured, 600 perms, git-ignored

### Judges' Emphasis (from JUDGES_AND_STRATEGY.md)
1. One credible user problem, obvious before/after
2. Real model decision grounded in supplied evidence
3. Real approval + real sandbox payment result
4. One difficult case, not just happy path
5. Understandable, runnable from public repo

---

## Agent Roles & Responsibilities

### 1. ARCHITECT (Lead)
**Model:** gpt-6-astra / claude-opus-5-5  
**Scope:** Repo structure, API contracts, data models, integration points  
**Outputs:** `app/`, `config.py`, `models.py`, `db.py`, `auth.py`, `routers/__init__.py`  
**Handoff:** Interface definitions only — other agents implement against them

### 2. RTO_RISK (AI Decision Engine)
**Model:** gpt-6-astra / claude-opus-5-5  
**Scope:** Risk scoring — phone validity, pincode match, repeat RTO, order-value vs area average  
**Inputs:** Order JSON → **Outputs:** `GREEN` / `YELLOW` / `RED` + evidence + confidence  
**Contracts:** `services/risk.py` with typed schema

### 3. PAYMENT (PayPal Execution)
**Model:** gpt-6-astra / claude-opus-5-5  
**Scope:** On YELLOW/RED → create PayPal order, capture, verify, idempotency, webhook handling  
**Outputs:** `routers/paypal.py`, `services/paypal.py`, sandbox test scripts  
**Non-negotiable:** Server-side monetary integrity, idempotency keys, capture verification

### 4. FOLLOWUP (Behavior-Aware Drip)
**Model:** gpt-6-astra / claude-opus-5-5  
**Scope:** Sentiment-aware follow-ups with reply kill-switch; hard negatives cancel all  
**Outputs:** `services/sentiment.py`, `services/sequences.py`, `routers/leads.py`

### 5. ALERTING (Observability)
**Model:** gpt-6-astra / claude-opus-5-5  
**Scope:** Slack webhook + console log for RTO red, hot lead, fatigue, revival  
**Outputs:** `services/alerting.py`, dashboard integration

### 6. DEMO (Presentation & Polish)
**Model:** gpt-6-astra / claude-opus-5-5  
**Scope:** Vanilla JS dashboard, YouTube script, README polish, judge test instructions  
**Outputs:** `dashboard/`, `README.md`, `DEMO.md`, test data fixtures

---

## Coordination Protocol

### Shared Log (Mandatory)
**File:** `ORCHESTRATION.log` in repo root  
**Format:** `[ISO_TIMESTAMP] [AGENT_NAME] [ACTION] message`  
**Every agent appends** — no exceptions. This is the single source of truth.

### Inter-Agent Communication
- **Spawn via OpenClaw:** `sessions_spawn` with `context: "fork"` (shares this transcript)
- **Message via:** `sessions_send(sessionKey, message)` — async, fire-and-forget
- **Structured handoff:** JSON payload with `type`, `payload`, `correlation_id`

### Decision Gates (Human-in-loop Only Here)
1. **Product scope approval** — you confirm ScopeBridge vs alternatives
2. **Architecture sign-off** — ARCHITECT proposes, you approve
3. **Demo narrative** — DEMO proposes script, you approve

Everything else: agents execute, log, move on.

### File Ownership (No Conflicts)
| Directory | Owner | Others May |
|-----------|-------|------------|
| `app/` | ARCHITECT | Read only |
| `app/routers/` | Each router's agent | Read only |
| `app/services/` | Each service's agent | Read only |
| `app/models.py` | ARCHITECT | Read only |
| `tests/` | Matching agent | Add tests |
| `dashboard/` | DEMO | Read only |
| `ORCHESTRATION.log` | ALL | Append only |

---

## Current Phase: Research → Build

### Phase 0: Foundation (DONE)
- ✅ Repo exists, git init, .env working
- ✅ PayPal auth proven (OAuth + order create + approve URL)
- ✅ Judge research complete (13/13 profiled)
- ✅ Product concept selected (ScopeBridge)

### Phase 1: Skeleton (THIS WEEK)
- [ ] ARCHITECT: FastAPI skeleton, config, models, db, auth
- [ ] RTO_RISK: Risk schema + stub scorer
- [ ] PAYMENT: PayPal client wrapper + order/capture functions
- [ ] FOLLOWUP: Sentiment schema + sequence stubs
- [ ] ALERTING: Slack webhook + log sink
- [ ] DEMO: Dashboard scaffold + static demo data

### Phase 2: Integration (NEXT WEEK)
- [ ] Wire risk → payment decision gate
- [ ] End-to-end sandbox test with real buyer approval
- [ ] Idempotency + retry handling
- [ ] Error states + recovery

### Phase 3: Polish (LAST WEEK)
- [ ] Dashboard UX + real data
- [ ] YouTube demo recording
- [ ] README + judge instructions
- [ ] Edge case handling

---

## Quick Start for Any Agent

```bash
cd "/Users/nitz/Code'n'Stuff/paypal-ai-hackathon"
source .env  # loads PAYPAL_* vars
# Your work starts here
```

### PayPal Helper (Copy-Paste Ready)
```bash
# Get OAuth token
TOKEN=$(curl -s -u "$PAYPAL_CLIENT_ID:$PAYPAL_CLIENT_SECRET" \
  "https://api-m.sandbox.paypal.com/v1/oauth2/token" \
  -X POST -d "grant_type=client_credentials" | jq -r .access_token)

# Create order (v2 endpoint!)
ORDER=$(curl -s -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://api-m.sandbox.paypal.com/v2/checkout/orders" \
  -X POST -d '{"intent":"CAPTURE","purchase_units":[{"amount":{"value":"25.00","currency_code":"USD"}}]}')
OID=$(echo "$ORDER" | jq -r .id)
APPROVE_URL=$(echo "$ORDER" | jq -r '.links[] | select(.rel=="approve").href')
echo "ORDER=$OID  APPROVE=$APPROVE_URL"

# After buyer approves: capture
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://api-m.sandbox.paypal.com/v2/checkout/orders/$OID/capture" -X POST -d '{}'
```

---

## Append-Only Log Format

```
[2026-10-03T23:45:12+05:30] [ARCHITECT] [START] Skeleton: FastAPI app structure created
[2026-10-03T23:46:01] [RTO_RISK] [DECISION] Schema: risk_score enum {GREEN,YELLOW,RED} + evidence array
[2026-10-03T23:47:22] [PAYMENT] [DONE] PayPal client wrapper with idempotency keys
...
```

---

## Anti-Patterns (Don't Do These)

- ❌ Re-verifying PayPal auth (already proven)
- ❌ Building features not in ScopeBridge scope
- ❌ Adding agent types without human approval
- ❌ Writing to another agent's directory
- ❌ Skipping the log
- ❌ Blocking on another agent without a handoff record
- ❌ Committing `.env` or secrets

---

## Escalation

If blocked > 30 min on something another agent owns:
1. Check `ORCHESTRATION.log` for their last update
2. `sessions_send` them a structured nudge with `correlation_id`
3. If no response in 1h, log `[ESCALATION]` and continue with reasonable assumption

---

*This charter is the single source of truth. If it's not here, it's not agreed.*
