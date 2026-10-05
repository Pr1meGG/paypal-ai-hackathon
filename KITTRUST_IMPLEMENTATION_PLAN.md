# KitTrust — implementation plan for review

**Status:** architectural direction approved; product decisions locked; implementation remains explicitly paused. Runtime AI choices below are recommendations pending credential/access and empirical validation, not a claim of operational availability.  
**Inspected and AI decision updated:** 2026-10-04.  
**Scope:** one participating Sandbox merchant, one authenticated counter operator, one short-duration equipment rental with 5–8 accessories, one authorization and one final settlement per rental.

## 1. Authority, outcome, and evidence labels

This planning task permits this document only. No application/configuration changes, application startup, PayPal API calls, order creation, authorization, capture, void, or reauthorization were performed for it. The previously verified USD 10 authorization remains outside the application's execution path and must not be captured, voided, imported, or reused automatically. Actual diagnostic transaction identifiers and account information are deliberately omitted from this reviewable document.

### Locked product decisions

1. **KitTrust replaces ScopeBridge** as the product; existing ScopeBridge files are legacy implementation, not the target concept.
2. AI's runtime role is **evidence reconciliation only**: identify/compare returned items, report discrepancies, cite evidence, and communicate uncertainty/confidence.
3. AI cannot independently determine liability, select money amounts, authorize payments, capture funds, or void authorizations. Explicit human review and confirmation are required before every financial action.
4. **One final settlement per rental:** complete/no charge -> void; human-approved partial charge -> one final partial capture; human-approved full charge -> full capture; unresolved evidence -> no financial action.
5. Partial capture followed by void is a separately authorized PayPal diagnostic only, **not the KitTrust product flow**.
6. Keep **FastAPI + SQLite + SQLAlchemy + requests**, with same-origin **HTML/CSS/JavaScript** and the minimal architecture below.
7. Runtime and demonstration use **real PayPal Sandbox and real runtime AI**. No mock integrations, simulated-provider mode, fabricated result, or silent fallback to rules. Isolated unit-test doubles may test safety logic; they are not product integrations and cannot satisfy integration acceptance.
8. Architecture approval is **not permission to start coding or mutate PayPal**. Only this document may change in the current task.

Target outcome:

```text
actual-issued manifest + approved exceptions + return evidence
    -> AI item reconciliation with citations and uncertainty
    -> operator reviews evidence and determines whether any charge is justified
    -> server validates a settlement proposal using the human-selected amount
    -> explicit authenticated human confirmation of the exact action
    -> server-side PayPal action + independent read-back
    -> evidence-linked settlement receipt
```

**AI never determines liability, chooses a monetary charge, or executes a financial action.** An authorization is not escrow, an AI finding is not a debt, and an HTTP success is not sufficient proof of completed settlement.

| Classification | What is established |
| --- | --- |
| **EXPERIMENTALLY PROVEN — diagnostic, not app** | US Personal Sandbox buyer -> existing IN Business merchant -> USD 10.00 -> Orders `AUTHORIZE` -> actual buyer approval -> exactly one authorization POST, HTTP 201 -> authorization `CREATED` for USD 10.00. Order and authorization GET read-backs were HTTP 200; one authorization, zero captures. The order's `COMPLETED` status represented authorization completion, not capture. |
| **EXPERIMENTALLY PROVEN — limitation of that diagnostic** | The buyer returned to a documentation-placeholder `example.com` URL. Buyer approval was independently verified by GET. This did not test an application callback, database persistence, UI, or recovery. |
| **EXISTING APPLICATION** | ScopeBridge FastAPI/SQLite API, rules-based risk scoring, keyword sentiment, CAPTURE-oriented PayPal code, and starter browser tests. Details below. |
| **PROPOSED** | KitTrust evidence workflow, actual runtime AI, human settlement gate, application AUTHORIZE lifecycle, UI, persistence, verification, and tests in this plan. |
| **STILL REQUIRES PAYMENT TESTING** | Complete-return void; partial capture; full capture; final-partial behavior; partial non-final capture followed by void if selected; capture/void idempotency and recovery; real app callbacks and persisted states. No capture or void success is claimed. |
| **STILL REQUIRES PRODUCT VALIDATION** | Six-case evidence safety/value experiment, repeat stability, competent checklist comparison, real operator workflow evidence, and operator commitment. Payment authorization alone establishes neither AI value nor rental demand. |

The current request authorizes architecture work; it does not turn unexecuted product-validation gates into passes. The intended implementation is a narrow pilot, not a production-readiness claim.

## 2. Repository inspection: reuse, replace, and quarantine

Paths below are relative to this repository. Source inspection was static; no existing startup hooks, demo commands, or tests with external effects were run.

| Area | Observed behavior | Consequence for KitTrust |
| --- | --- | --- |
| Stack | `requirements.txt`: FastAPI, Uvicorn, SQLAlchemy, Pydantic, python-dotenv, python-multipart, requests. | Keep this stack. No separate payment service or frontend framework is needed. |
| Entry point | `app/main.py` registers health, orders, PayPal, and leads routers; startup calls `init_db()`. Root returns JSON. CORS currently allows all origins with credentials. | Mount KitTrust UI/routes; restrict origins. Do not run legacy financial routes alongside the new workflow. |
| PayPal transport | `app/services/paypal.py` obtains a new OAuth token per helper call and uses `requests`. `create_order()` hardcodes `CAPTURE` at line 97 and extracts only `rel=approve`. | Add explicit AUTHORIZE helpers; support the documented `payer-action` response. Do not claim current OAuth caching or AUTHORIZE support. |
| Currency | Same service converts integer INR paise to USD using a fixed floating-point rate, irrespective of the currency argument. Its “Sandbox only supports USD” comment is false. | KitTrust uses exact USD minor units; no conversion or float-based financial calculations. Keep the legacy converter out of this flow. |
| Capture | `capture_order()` at line 134 calls `/v2/checkout/orders/{id}/capture`, not Payments authorization capture. | Cannot settle the verified authorization through this helper. |
| Capture correctness | Service lines 160–165 treat the top-level Orders response ID as a capture ID; router lines 110–112 persist it and mark `PAYMENT_CAPTURED` without inspecting the nested capture result. `verify_capture()` at line 185 just gets a token and returns true. | Correctly extract resource IDs and independently GET/verify captures. Existing success assertions are not reusable proof. |
| Models | `app/models.py`: `Brand`, COD-centric `Order`, `Lead`, and `AuditLog`. Order requires customer phone/pincode, has order/capture IDs but no authorization ID. No authorized/partial/void lifecycle. | Add small KitTrust-specific tables instead of forcing rentals into COD fields or changing existing data. |
| Auth | `app/auth.py:get_brand()` hashes a bearer key and looks up a Brand. `AUTH_TOKEN`/`BRAND_ID` settings do not by themselves seed an authenticated operator. | Reuse bearer authentication with an explicit local bootstrap. One operator principal only; do not claim named multi-user approval attribution. |
| Webhook | `app/routers/paypal.py` accepts webhook JSON without signature verification. Its resource-ID-first lookup also confuses capture IDs with order IDs. | Do not mount this legacy endpoint in the KitTrust pilot. No webhook dependency for the first slice. |
| Audit/storage | `AuditLog.payload_json` can contain full responses; “immutable” is a docstring, not enforced tamper resistance. `app/db.py` enables SQL echo in dev. A local SQLite DB exists. | Allowlist audit fields, disable sensitive SQL/body logging, preserve existing DB. Describe logs as application-append-only, not tamper-proof. |
| AI | `app/services/risk.py` is rule scoring; `sentiment.py` is keyword scoring. No runtime LLM/image integration was found. | Add one real image-capable reconciliation call, not another risk-score wrapper. |
| Frontend | No application HTML/CSS/JS/React UI, static mount, checkout screen, or settlement UI was found. | Build a small same-origin interface; Swagger is not the product UI. |
| Tests | `tests/example.spec.ts` only visits playwright.dev. `package.json` has no scripts. Playwright's app baseURL/webServer are commented out; CI retries and retry tracing are enabled. No app Python tests were found. | Add offline application tests; keep real payment tests opt-in, serial, and without automatic retries or sensitive artifacts. |
| Configuration | `app/config.py` loads PayPal credentials/base URL, app/auth/brand settings, Slack URL, and DB URL. Template additionally names buyer credentials, `AI_MODEL`, and `OPENAI_API_KEY`, but no AI runtime is wired. | Separate app credentials, diagnostic-only buyer login, and runtime AI configuration. Presence of names is not evidence of working provider access. |
| Secret hygiene | Safe classification found non-placeholder REST entries in `.env.example`; values were not displayed. `.env` and the DB are ignored. | Sanitize the template and review/rotate potentially exposed secrets before publishing, as a separately authorized implementation task. Never put raw secrets in a diff or report. |
| Docs | README/demo and AGENTS still describe ScopeBridge, autonomous money actions, holds, and end-to-end test claims unsupported by this source. PAYPAL_SETUP describes nonexistent helpers/agent/dashboard. LOCAL_SETUP contains obsolete authentication failures. | Rewrite these during implementation to match KitTrust and measured results, not during this planning-only task. |

**Current routes:** `GET /`, `/me`, `/health`; `POST/GET /orders`, `GET /orders/{id}`; `POST /paypal/webhook`, `POST /paypal/orders/{id}/capture`, `GET /paypal/orders/{id}/status`; `POST/GET /leads`, `POST /leads/{id}/reply`, `GET /leads/due`, `GET /leads/{id}`. There is no browser return/cancel handler, authorize endpoint, authorization-capture endpoint, or void endpoint.

## 3. Minimal architecture and deliberate limits

```text
Same-origin HTML + CSS + small JavaScript
                  |
             FastAPI routes
                  |
       services/kittrust.py — checks, approval, orchestration
          /             |                \
 reconciliation.py   SQLAlchemy/SQLite    services/paypal.py
 one AI call         durable records     explicit REST helpers
 no payment tools    + private files     sandbox only
```

- Reuse `Brand`, `AuditLog`, the DB session pattern, Pydantic, `requests`, and installed Playwright.
- Add four KitTrust tables. Do not add queues, Redis, event sourcing, agent frameworks, a provider registry, vector search, microservices, a marketplace, or a new JavaScript build stack.
- Ship one local/single-instance pilot with explicit refresh/recovery. Do not promise unattended asynchronous settlement or multi-instance deployment.
- New KitTrust routes do not call `process_payment_decision()`. Unmount legacy orders/leads/PayPal routes in the KitTrust entry point; retain their files/data initially rather than deleting unrelated work. Keep health read-only and network-free.
- Do not build damage valuation, liability adjudication, insurance, refunds, multi-merchant routing, recurring payments, currency conversion, multiple successive charges, or automatic reauthorization.
- The first product slice is a staffed-counter workflow, not a remote borrower account portal. The borrower uses hosted PayPal checkout; staff uses the authenticated app. A separate borrower portal or multi-operator identity system is a later scope decision.

## 4. Persistence: four new tables, not a generic ledger

Add these alongside the existing tables, with foreign keys/ownership checks. Keep original records and photo versions; do not rewrite evidence after approval.

| Table | Minimum fields and purpose |
| --- | --- |
| `Rental` | UUID, brand ID, kit/loan label, immutable actual-issued manifest and agreed-terms snapshot JSON, approved-exception records, currency `USD`, intended hold amount in integer cents, evidence revision, review revision and current human-review snapshot (bound to a reconciliation run and evidence revision), row version, latest reconciliation reference, PayPal order ID, authorization ID, private payee binding, raw order/authorization statuses, actual authorized/captured minor amounts, authorization creation/expiration, last successful read-back time, active payment-action ID, timestamps. Order and authorization IDs unique when present. |
| `EvidenceAsset` | UUID, rental ID, evidence revision, checkout/return/follow-up phase, image or structured count/exception record, generated private storage key, content hash, safe label, MIME/size, uploader principal, timestamp. No user-controlled filesystem paths. Images live outside the public static directory. |
| `ReconciliationRun` | UUID, rental ID, exact manifest/evidence revision and content digest, model and prompt version, run status, validated item-level result JSON, clarification request, timestamps/latency. Immutable result per run; old runs remain inspectable but cannot approve a newer return. |
| `PaymentAction` | UUID, rental ID, kind `CREATE_ORDER / AUTHORIZE / CAPTURE / VOID`, immutable request fingerprint/body, app request ID, unique PayPal request ID, requested minor amount/currency/final flag, authenticated requester, confirmation timestamp, reconciliation/revision and human-reviewed evidence snapshot for settlement actions, human reason, execution state, returned resource IDs, sanitized HTTP/error metadata, verification result/timestamps. This row is both the human approval record and durable external-action journal. |

No separate approval service or approval table is needed: settlement approval and its exact immutable action live together in `PaymentAction`. Amounts/financial decisions are never stored in AI output as authoritative data.

**Money rules:** use strict integer minor units internally. Parse decimal input on the server with exact decimal validation; reject booleans, floats, scientific notation, negatives, zero-value captures, and excess precision. Format two-decimal USD strings only at the PayPal boundary. Enforce `0 < charge <= currently available authorized amount`; do not use any provider overcapture allowance. A full charge means equality with the verified available authorization, not an AI classification.

**Database rollout:** these are additive tables; existing `create_all()` can create them without a migration framework in the initial slice. It cannot alter existing columns. Back up/preserve the existing DB; use a separate local demo DB URL for fixtures. Do not drop/reseed existing tables. Later schema alterations require an explicit migration, not reliance on `create_all()`.

## 5. Separate evidence, provider, and execution state

Do not overload the old `OrderStatus` or use PayPal order `COMPLETED` as “paid.”

- **Evidence:** `AWAITING_EVIDENCE -> RECONCILING -> COMPLETE | DISCREPANCY | UNRESOLVED`; invalid output/provider failure is `REVIEW_REQUIRED`, never a financial success. New evidence increments the revision and invalidates old settlement previews.
- **Provider facts:** retain raw Orders, authorization, and capture resource statuses separately. Authorization `CREATED` means an authorization exists; a capture must itself be `COMPLETED` before claiming collection. A void must be read back as `VOIDED`.
- **PaymentAction:** `APPROVED_READY -> IN_FLIGHT -> SUCCEEDED | PENDING | UNKNOWN | FAILED`. Here `APPROVED_READY` means app human approval, not PayPal buyer approval. A timeout, crash during dispatch, or unverified successful response is `UNKNOWN`, not `FAILED` and not permission for a fresh payment.
- **UI summaries are derived:** not authorized, awaiting buyer approval, hold authorized, settlement in progress, settlement uncertain, no charge/authorization voided, charge completed, or authorization unavailable/expired. Persist provider evidence, not contradictory independent “paid” booleans.

### Required settlement branches

| Human-reviewed outcome | Deterministic server gate | Proposed operation | Proof before success UI |
| --- | --- | --- | --- |
| Complete return; no charge due | Current reviewed evidence is complete; explicit no-charge confirmation; zero prior captures; authorization is usable | Void authorization | Authorization GET is `VOIDED`; captures remain zero |
| Partial charge approved | Supported, human-reviewed discrepancy; explicit rationale and amount; no unresolved/conflicting items; amount below available authorization | Capture that exact amount with `final_capture:true` | Capture GET is `COMPLETED`, exact USD amount, correct authorization/order binding and final flag; refresh authorization/order |
| Full charge approved | Same review/consent gates; amount equals available authorization | Full capture with `final_capture:true` | Capture GET is `COMPLETED`, exact authorized amount, correct binding; refresh authorization/order |
| Unresolved evidence or invalid/stale review | No valid current review | No financial operation, including no automatic void | Existing financial state unchanged; show the next evidence check |

**Locked product behavior:** one final settlement, including a single partial capture with `final_capture:true`. Partial capture with `final_capture:false` followed by a void is confined to a separately approved diagnostic experiment and is not implemented as a KitTrust settlement option. Never silently substitute one sequence for the other. Diagnostic success would not change this product decision.

For a partial final capture, record the uncaptured difference as **not collected**, not “refunded.” Do not promise immediate bank hold release or assume a particular authorization terminal status without observing it. Verify the capture's final flag and refreshed provider state; unexpected combinations require investigation.

## 6. PayPal transport and checkout setup

Extend the existing service with small, explicit functions. Keep amount conversion, AI decisions, and UI concerns out of it.

| Helper | API operation |
| --- | --- |
| `create_authorize_order(...)` | `POST /v2/checkout/orders`: `intent=AUTHORIZE`, exact USD amount, `payment_source.paypal`, configured experience context, stable request ID |
| `get_order(order_id)` | `GET /v2/checkout/orders/{order_id}` |
| `authorize_order(order_id, request_id)` | `POST /v2/checkout/orders/{order_id}/authorize` after independently verified buyer approval |
| `get_authorization(authorization_id)` | `GET /v2/payments/authorizations/{authorization_id}` |
| `capture_authorization(authorization_id, amount_minor, final_capture, request_id)` | `POST /v2/payments/authorizations/{authorization_id}/capture` |
| `get_capture(capture_id)` | `GET /v2/payments/captures/{capture_id}` |
| `void_authorization(authorization_id, request_id)` | `POST /v2/payments/authorizations/{authorization_id}/void` |

- Keep current merchant/app, Sandbox, USD, and REST payer-action flow. No JS SDK migration or currency/country switch.
- OAuth credentials/tokens remain backend-only and in memory; obtaining an OAuth token is an authentication POST, not a read-only GET. No token files, query-string credentials, or raw request/response logging.
- Use explicit timeouts, TLS verification, no automatic financial POST retries, no following arbitrary redirects, and allowlisted Sandbox API/action hosts. Returned `api.sandbox.paypal.com` links and configured `api-m.sandbox.paypal.com` must be handled deliberately, not treated as different merchants.
- Request full representations when useful. Capture accepts documented 201/200 responses but inspects resource status. Void handles 204 with no body and documented 200 representations; always read back.
- On create, persist returned order ID and private payee binding before presenting checkout. Bind all later operations to that stored rental/order/authorization, not arbitrary IDs from clients.
- Use real application-owned `/paypal/return` and `/paypal/cancel` URLs derived from a validated configured public origin. Reject placeholder Example Domain settings. Freeze amount, terms, and issued manifest for checkout.
- Preserve `user_action:CONTINUE` for the initial integration. Before redirect and on return, show the exact hold amount and rental terms. The staffed-counter demo must include the buyer's final review; the explicit server authorization action is separate from later staff settlement approval.
- Return/cancel handlers perform no financial mutation. Query parameters are untrusted routing hints, not approval evidence. Require authenticated lookup of the locally bound order and server-side GET before enabling authorization. A cancel visit is not a void; an order ID in the URL is not authentication. Suppress/redact callback query strings in access logs, remove them from the address bar after local routing, set a no-referrer policy, and load no third-party assets on these pages.
- After final review, an explicit authenticated POST authorizes only an `APPROVED` order with matching intent, amount, currency, payee, and no existing authorization/capture. Persist authorization ID, amount, status, and expiration; independently GET it and the order.
- Do not offer a general “attach external authorization ID” route. The protected diagnostic authorization is not auto-associated with a Rental. Test new setup only with explicitly approved fresh Sandbox fixtures later.

## 7. Human approval, concurrency, idempotency, and recovery

The sole product settlement mutation endpoint is `POST /rentals/{id}/settlement/approve`. It receives a human-selected proposal, never an AI tool call. There are no public raw capture/void endpoints accepting arbitrary provider IDs.

1. Authenticate the operator and check rental ownership. Keep the existing bearer-key pattern for the local pilot; use a strong configured key, not a documented default. Derive the actor from authentication, never an `approved_by` client field.
2. Validate the exact current evidence/reconciliation revision, human-reviewed item findings, citations, terms, action, amount, currency, and reason. Any unresolved finding blocks settlement. An operator resolving an AI uncertainty must add a recorded evidence-backed finding/update and obtain a new valid preview, not just check a liability box.
3. Compare the confirmation fingerprint against the server's canonical preview. It binds the rental, current authorization, evidence revision/run, saved human-review revision/content, terms, action, amount, currency, and final-capture flag. It is a stale/tamper check, not a substitute for authenticated confirmation.
4. In a short DB transaction, create the immutable `PaymentAction` and claim `Rental.active_payment_action_id` with a conditional update/row-version check. Same app request ID + same fingerprint returns the existing action; a different payload with the same ID is a conflict. Different request IDs racing for the rental cannot both claim it.
5. Evidence, human-review, and terms edits are refused while an action owns this gate. Perform a fresh PayPal GET preflight outside the DB transaction and compare authorization/order/payee/amount/currency/prior captures/expiration. Unexpected prior activity blocks dispatch, rather than treating the remaining amount as automatically approved.
6. Commit `IN_FLIGHT` before sending the external request. Use a server-generated UUID `PayPal-Request-Id`, stable for this exact action/payload and different across create, authorize, capture, and void. Do not hold SQLite write locks during network calls.
7. Save allowlisted response evidence, then independently read back the relevant resources. Only the matching, verified outcome makes the action `SUCCEEDED`. Pending/unknown outcomes retain the gate and show a recoverable pending state.
8. An explicit refresh reads PayPal resources and updates local evidence. After a timeout/crash, GET first. If a unique matching outcome cannot be established, remain `UNKNOWN`; no new key, replacement order, second charge, or compensating void is automatic.
9. An explicitly requested retry may reuse the exact saved payload/key only within the provider's supported idempotency retention and while the approval/state is still valid. If identity, retention, or outcome is ambiguous, require manual investigation. Do not claim distributed exactly-once execution; combine durable intent, local exclusion, provider idempotency, and reconciliation.

A verified terminal settlement blocks further settlements for that rental. An explicit failure may permit a newly reviewed action only after read-back proves no financial effect. Recovery and retries retain the original approval snapshot; changed evidence/amount requires new review, not silent reuse.

**Validity:** store provider `expiration_time`; show age and the three-day honor-period warning. Default pilot rentals must fit the short return window. Expired, voided, denied, pending, or unexpectedly changed authorizations block dispatch. No automatic reauthorization/expiry charge/expiry void. The documented 29-day lifetime is not a guaranteed 29-day collectible deposit or a guaranteed duration of a card hold.

## 8. Evidence and AI boundary

### Input and output contract

Input is the actual-issued manifest, approved substitutions/exceptions, relevant checkout/return photos, permitted inventory/count records, and the kit/loan context. A template accessory list is not proof an item was issued. Absence from a photograph is not proof of absence from the return.

Use one fixed, versioned prompt and one image-capable runtime call per reconciliation run. The server owns the run ID, evidence revision/digest, provider/model metadata, timestamps, latency, and usage; these are not model-generated claims.

**Exact model input contract:** a versioned instruction; an actual-issued manifest with packet-local item IDs, descriptions and issued quantities; approved exceptions with evidence references; and a labelled list of permitted evidence records/images. Each image is accompanied by its packet-local evidence ID and checkout/return/follow-up phase, then transmitted as sanitized inline bytes. Structured inventory records contain only relevant observations. The server supplies no buyer identity, private account/payment IDs, authorization amount, charge schedule, credentials, or payment tools. No arbitrary remote image URLs or outside factual lookup.

**Expected output contract:** one object with exactly `items`, `disposition`, `next_check`, and `limitations`; every item contains exactly the fields below. This is an illustrative shape, not an observed reconciliation result:

```json
{
  "items": [
    {
      "item_id": "manifest-item-1",
      "finding": "present",
      "observed_quantity": 1,
      "confidence": "high",
      "evidence_ids": ["evidence-1"],
      "explanation": "Visible in the supplied return evidence."
    }
  ],
  "disposition": "complete",
  "next_check": null,
  "limitations": []
}
```

- Allowed item findings: `present`, `supported_discrepancy`, `unresolved`; overall disposition: `complete`, `discrepancy_for_review`, `unresolved`.
- Exactly one item result for each supplied manifest item; `observed_quantity` is a non-negative integer or null when not established. Zero is not inferred merely because something is outside a photograph. Counts are advisory observations, not verified inventory unless supported by the provided evidence.
- `confidence` is `low | medium | high`: an explicitly labelled model self-assessment, **not a calibrated probability, liability finding, or financial-action threshold**. High confidence never replaces evidence or human review.
- `evidence_ids` can refer only to supplied packet IDs. `explanation` is a short evidence summary, not private chain-of-thought. `next_check` is null or one specific clarification request; `limitations` is a short list of evidence/visibility conflicts. An unresolved disposition must request a useful check or explain why resolution is blocked.
- Generate a shallow JSON Schema from the Pydantic contract: all keys required, nullable values where specified, `additionalProperties:false`, fixed enums, bounded arrays/text, and server-side semantic validation. Structured output controls shape; it does not establish factual correctness.
- No amount, liability, charge recommendation, PayPal ID, API operation, or tool execution fields. The evidence-backed recommendation is qualitative: complete, discrepancy for human review, or unresolved. The **operator**, not the model, selects any monetary proposal.
- Pydantic validation rejects extra fields, missing/duplicate/unknown item IDs, citations outside the rental/revision, unsupported status values, and inconsistent aggregate dispositions. Identity/count/amount permissions are deterministic. Citation existence cannot prove semantic correctness; the operator must inspect the cited evidence.
- Prompt instructions treat photo text, OCR-like content, notes, and uploaded records as untrusted evidence, never instructions. No tool access, shell, URL retrieval, payment credentials, or internal payment endpoints are supplied to the model.
- Invalid output, timeout, provider outage, wrong-kit/conflicting records, or obscured evidence produces review-required/unresolved and no settlement eligibility. No silent rules/mock replacement reported as AI success.
- Save the operator's item review locally before settlement preview: current run/evidence revision, reviewed findings, citations, explanations, authenticated principal, and time. Store its current snapshot/revision on Rental and append allowlisted change history to AuditLog. Preserve a correction rather than overwriting the model's original output. New physical observations are additional evidence records; rerun reconciliation for the new evidence revision before saving its review. A human may correct an advisory finding using explicit current evidence, but an unresolved human-reviewed finding still blocks all financial action. Saving/revising a review never approves a payment, and every revision invalidates prior previews.

### Storage and runtime access

Accept only bounded JPEG/PNG/WebP uploads and typed inventory records. Validate actual decoded type, size, pixel limits, ownership, and traversal protections. Re-encode/strip EXIF before provider submission; store sanitized bytes privately under generated names. A small image-decoding library such as Pillow is a justified focused addition, not a media pipeline. Exact upload limits are constants to confirm against the real test packets.

Serve photos through authenticated, tenant-scoped endpoints; JavaScript can fetch protected blobs. Never place evidence under the public static mount, send arbitrary URLs to the model, or commit photos/private records. Obtain permission for image transfer to the selected AI provider and define deletion/retention before collecting real rental evidence. Keep audit metadata after deletion only according to the agreed policy, not a claim that deleted photos remain auditable.

### Runtime AI decision — selected, not yet operational

**Primary recommendation: Google Gemini Developer API, `gemini-3.8-flash`.**  
**One fallback: OpenAI API, `gpt-6.1-sol`.**

These exact model IDs are currently documented as image-capable with structured outputs. The selection is an engineering recommendation, not a benchmark win or proof that this project's account can call either model.

#### Actual local availability, checked without exposing values

- Neither the project's actual `.env` nor the inspected process environment contains a direct OpenAI, Gemini/Google, Anthropic, OpenRouter, or Azure OpenAI API key. `AI_MODEL` and `AI_PROVIDER` are not configured in the actual runtime environment. Names/placeholders in `.env.example` do not grant access.
- An inherited custom Anthropic-compatible endpoint/auth token exists. Its address/token were not displayed or used. Project-use entitlement, image/schema support, quota, billing, and availability outside the coding session are unknown. It is **not** accepted as an application provider credential or copied into the repository. Coding-assistant access is not app API access.
- No AI credential stores or private account dashboards were opened. No packages were installed, no inference POST was sent, and no image/prompt was uploaded.
- Unauthenticated public model-list GETs from this environment reached Google Gemini (HTTP 403), OpenAI (HTTP 401), and direct Anthropic (HTTP 401). These observations establish an HTTP path only—not authentication, model entitlement, regional eligibility, quota, billing readiness, or inference latency.
- **Operational verdict: no image-capable provider is yet verified usable by this project.** A project-owned credential and a real image-plus-schema request are prerequisites before claiming otherwise.

#### Controlled provider feasibility result — BLOCKED

**Observed preflight:** 2026-10-04 at 12:25:05 UTC. This is the result of the explicitly requested single-inference feasibility task, not a model benchmark.

The project `.env` and current process environment were checked without displaying credential values. `GEMINI_API_KEY`, `GOOGLE_API_KEY`, and `GOOGLE_GENAI_API_KEY` were all absent. The designated OpenAI fallback's `OPENAI_API_KEY` was also absent in both locations. No credential was selected, borrowed from the coding session, retrieved from a private credential store, or written to a file.

| Required observation | Primary: Gemini | Designated fallback: OpenAI |
| --- | --- | --- |
| Intended model | `gemini-3.8-flash` | `gpt-6.1-sol` |
| Existing project-usable API credential | Not configured in the inspected locations | Not configured in the inspected locations |
| Authentication result | **NOT ATTEMPTED — missing credential** | **NOT ATTEMPTED — missing credential** |
| Model actually used | None | None |
| Image input success/failure | Not tested; no image sent | Not tested; no image sent |
| Structured-output/schema validation | Not tested; no model response exists | Not tested; no model response exists |
| Inference response latency | N/A — no inference request | N/A — no inference request |
| API/quota errors | None observed; no API request sent | None observed; no API request sent |
| Inference request count | **0** | **0** |

**Verdict: implementation is blocked on runtime provider access.** This is a failed prerequisite, not an authentication rejection, quota failure, invalid model, schema failure, or evidence of poor reconciliation accuracy. The earlier unauthenticated model-list HTTP responses are not substituted for an authenticated inference result.

No automatic provider switch occurred. Because neither provider could be authenticated using an available project credential, the task stopped before creating a synthetic fixture or sending a prompt/image. No temporary test artifacts were needed, so none require cleanup. No application/configuration files or PayPal resources were changed.

To unblock a later explicitly authorized attempt, supply a legitimate Gemini project API credential privately in the local configuration or process environment; never in chat or source control. Then repeat the bounded task with one non-sensitive synthetic image, the section 8 JSON contract, and real response/schema/latency recording. The selected primary and fallback remain unchanged; neither is reported as authenticated or operational.

#### Focused comparison and rationale

| Option | Image/structured output | Access, cost, and free availability | Reliability/latency and demo fit | Decision |
| --- | --- | --- | --- | --- |
| Google `gemini-3.8-flash` | Documented multi-image input, text output, JSON Schema, and low/medium/high thinking. Stable model ID, not a preview. | Requires a project Gemini API key. A free tier is listed, subject to account/model quotas and data terms. Current Standard paid rates: USD 0.75/M input tokens and USD 3.75/M output tokens including thinking through 2026-12-31; announced rates afterward are USD 1.50/7.50. No working project key yet. | Flash's speed/cost positioning, stable release, and one-shot multimodal structured output fit a short interactive demo. This is a documented capability assessment; KitTrust accuracy, latency, availability, and quota are unmeasured. | **Primary.** Free non-sensitive evaluation path, modest paid cost, and no agent infrastructure needed. |
| OpenAI `gpt-6.1-sol` | Documented text/image input, text output and Structured Outputs. Responses API; low reasoning is supported. | Requires a separate OpenAI API key and usable account quota/billing. Standard rates: USD 2/M input, USD 10/M output. No free API allowance or credits verified for this project. No working project key yet. | Independent provider fallback with an explicitly documented image/schema contract. Low reasoning and bounded output are plausible for the demo, not measured latency claims. First use of a schema may add latency. | **Fallback.** More expensive but still modest at pilot volume; chosen for provider independence and supported contract, not proven superior recognition. |
| Direct Anthropic / inherited custom route | Current official Claude models are image-capable; the inherited route's actual model/capabilities are unknown. | No direct project key; inherited token is not an established deployable app entitlement. For reference, current Sonnet 5.5 pricing is USD 2/M input, USD 10/M output; no free project allocation verified. | No observed access or project-specific reliability advantage over the selected fallback. Proxy compatibility and account authority would add unresolved work. | **Not selected.** Do not add a third adapter or depend on the coding-session route. |

Do not default to Gemini 2.5 merely because old tutorials use it: the current catalog restricts 2.5 access to users with prior usage and directs new projects to newer models. Do not use image-generation, Live/voice, autonomous agent, or deep-research models for accessory reconciliation.

**Cost illustration, not an observed bill:** at a hypothetical 6,000 billed input tokens (including images) and 1,500 billed output/thinking tokens, one request is about USD 0.0101 on the current Gemini rate or USD 0.027 on Sol. Actual image tokenization, reasoning, and output differ; record returned usage rather than claiming a fixed per-photo price. No credits, billing activation, or spending authority have been established. Propose a USD 1 initial validation budget for approval, not automatic spending.

#### Exact runtime integration role and minimal call shape

The future function remains `reconcile_return(manifest, exceptions, evidence) -> ReconciliationResult`. It performs real visual comparison only when the operator requests reconciliation, and returns the validated contract above. It has no payment tools or code-execution tools and never calls settlement code.

- **Primary transport:** one synchronous `requests` POST to the documented Gemini Interactions endpoint, `https://generativelanguage.googleapis.com/v1beta/interactions`, with `model:gemini-3.8-flash`, labelled text/image input, `response_format` specifying JSON MIME type and schema, and `store:false`. No conversation chain, background mode, tools, remote URLs, file-search, or persistent provider upload is needed. Inline bytes avoid a separately managed provider file resource; they still transmit the images to the provider under its data terms. The full encoded request must stay below the documented 20 MB inline-request limit.
- Start with `generation_config.thinking_level:low`. The model-specific page says `minimal` is unsupported; do not copy generic examples that use it. A stable model with a documented REST interface does not require installing a Google SDK or changing the backend stack.
- **Fallback transport:** a separate small request-shaping function for `POST https://api.openai.com/v1/responses`, model `gpt-6.1-sol`, image input, `text.format` JSON Schema with `strict:true`, `reasoning.effort:low`, and `store:false`. Do not assume provider request/response formats are interchangeable. Normalize only the validated result and usage metadata into the same existing contract.
- Use explicit HTTP timeouts, a bounded output-token limit, and no automatic inference retry loops. Handle refusals, incomplete/truncated output, invalid schema/semantics, quota exhaustion, and connection errors as unavailable/review-required. Never manufacture a successful result.
- Keep only one selected provider active per run. A simple explicit provider choice and two small functions are sufficient; no generic provider registry/router or fallback orchestration framework. Primary implementation comes first; fallback is not called ready until its real access and fixture checks pass.

#### Fallback policy, latency, and the under-three-minute demo

Fallback is an **operator-visible, explicitly selected rerun** after an availability/configuration failure, using the same evidence revision and schema. It requires its own valid credential, data-transfer permission, and usage budget. Never silently send photos to another company. Do not invoke a second model to overturn a refusal, avoid a safety restriction, convert unresolved evidence into a charge, or cherry-pick a more convenient answer. Conflicting conclusions stay visible for human review; no voting or automatic financial decision.

Proposed demo readiness target: one 5–8-item case with a small, readable photo packet, a real inference response within 20 seconds in rehearsals, and a hard 40-second application deadline before showing an honest failure/review-required state. These are engineering targets, **not measured performance**. Record cold and warm timings, upload/preprocessing, model latency, follow-up work and human correction separately. Preserve enough image detail to identify accessories; do not win a latency metric by hiding evidence or silently omitting photos. No batch/flex execution for the interactive demo.

Once a key and permitted evidence are supplied, the next bounded validation is a real image-plus-schema smoke call, followed by the six fixed cases and four tricky-case repeats already specified below. Record model ID, evidence digest, prompt/schema version, returned usage, latency, schema validity, evidence fidelity, and disposition. Passing schema validation alone is not passing reconciliation. Fallback must pass the same safety checks before use. No such calls or results exist yet.

#### Data terms and unresolved risks

- **Free is not private.** Under Google's applicable unpaid-service terms, submitted content/output may be used for product improvement and human review; sensitive, confidential, or personal information must not be submitted. Free evaluation is limited to permitted, non-sensitive physically staged evidence. For real operator evidence and the hosted judge demo, recommend a paid Gemini project with the applicable data terms reviewed. EEA/Switzerland/UK distribution also has paid-service requirements; verify the deployment audience/region rather than inferring eligibility from the PayPal accounts.
- Paid Gemini terms state prompts/responses are not used to improve products, but safety/legal logging can remain. `store:false` disables stored Interaction resources; it is **not** a universal zero-retention guarantee. The fallback's retention/region settings and terms also need review before sending real photos.
- **Access remains blocked:** project credentials, account eligibility, model permission, billing/free quota, and a successful authenticated inference are all unverified. HTTP 401/403 and public documentation do not resolve those gaps.
- **Reliability/latency remain unmeasured:** free quotas and actual capacity are not guaranteed; a short demo needs rehearsal and an honest failure state, not an asserted SLA. Confirm limits in the provider's own dashboard after setup.
- **Visual safety remains unproven:** similar cables, occlusion, misleading labels, wrong-kit records, prompt injection and overconfident citations can defeat either model. Confidence is descriptive only; human review and the frozen evidence experiment remain mandatory.
- **Version/cost drift:** use the exact chosen IDs, not `latest` aliases, record the reported model version when available, and recheck pricing/deprecation/capacity before submission and judge access. Current Gemini pricing is promotional through year-end.
- **No mocked runtime integrations:** missing credentials/providers cause an explicit unavailable state. No mock/rules fallback is shipped as runtime AI, and no coding-assistant answer is inserted as an app inference result.

## 9. Proposed routes and frontend UX

### Route surface

All rental/evidence/settlement APIs require the operator principal and ownership checks. Browser callbacks render only a neutral return/cancel page until an authenticated lookup; they expose no account data and perform no financial operation.

| Route | Purpose and side-effect boundary |
| --- | --- |
| `GET /kittrust` | Serve the public shell; no embedded secrets or rental data |
| `POST /rentals`; `GET /rentals`; `GET /rentals/{id}` | Create/list/read local rentals; creation alone makes no PayPal call |
| `POST /rentals/{id}/checkout` | Explicitly create one AUTHORIZE order from frozen server-side terms |
| `GET /paypal/return`; `GET /paypal/cancel` | Application-owned browser destinations; never trust query status or auto-authorize/settle |
| `POST /rentals/{id}/authorize` | Explicit, idempotent server authorization after final review and fresh approved-order check |
| `POST /rentals/{id}/evidence`; `GET /rentals/{id}/evidence/{asset_id}` | Store/read permitted evidence; update revision and invalidate stale previews |
| `POST /rentals/{id}/reconcile` | Run/save AI reconciliation; cannot move money |
| `POST /rentals/{id}/review` | Save versioned human item findings/corrections with current evidence citations; no payment approval or PayPal mutation |
| `POST /rentals/{id}/settlement/preview` | Validate human review/amount and return canonical proposal + fingerprint; no PayPal mutation |
| `POST /rentals/{id}/settlement/approve` | Explicit human confirmation; the only capture/void dispatch boundary |
| `GET /rentals/{id}/actions/{action_id}` | Read action/verification status |
| `POST /rentals/{id}/payment/refresh` | GET-only business-resource inspection at PayPal, update local evidence; may need OAuth POST, never capture/void/create |

No borrower passwords are accepted by these APIs. Do not store the operator key in source, URLs, localStorage, reports, or traces. For the minimal local pilot, keep the entered bearer key in page memory and require re-entry after reload/redirect if necessary. Close CORS to same-origin; authenticate every mutation with the header rather than ambient cookies. A later cookie-based login would require proper session/CSRF handling, not an improvised extension of this scheme. HTTPS is required for any hosted use; do not publish an unrestricted money-moving operator session.

### One case page, not a dashboard suite

Build plain HTML/CSS/JavaScript served by FastAPI. Three sections on one rental page:

1. **Rental and hold:** kit, actual-issued manifest, agreed terms, exact hold amount, buyer-approval/authorization milestones, expiry and verified-at labels. Setup controls create checkout, open the API-returned payer-action link, return to final review, and explicitly authorize. No misleading “paid” badge after approval or authorization.
2. **Return review:** evidence thumbnails with click-to-inspect views; item rows with present/discrepancy/unresolved labels; citations beside each finding; original AI output and human corrections clearly distinguished. Unresolved prominently requests the single most useful next check.
3. **Settlement:** no action preselected. Operator enters a reason and, if applicable, exact charge. Server preview shows original hold, charge, uncaptured difference, and evidence version. A final confirmation says **“Approve USD X.XX charge”** or **“Approve no charge and void authorization.”** The AI has no confirm button or execution tools.

After confirmation, disable competing actions and show progress. On uncertainty, show **“Outcome not verified — refresh status; do not submit a new charge.”** On verified success, show a receipt binding evidence version, operator approval, action, gross amount, provider resource IDs (operator-only), and timestamps. Distinguish fees/net receipt from the approved gross charge. No fake undo for a capture or void; refunds are out of scope.

Use native labelled controls, visible keyboard focus, accessible confirmation-dialog focus management, persistent inline errors, readable 16px body text, adequate contrast, and text labels in addition to color. Target comfortable 44px controls on narrow screens, responsive evidence/card layout, and an `aria-live` status region. Do not add animation, charts, a component library, or a second visual theme to prove this workflow.

## 10. Configuration, deployment, and privacy

Proposed settings extend `app/config.py`; no values are changed by this plan:

- Existing `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_BASE_URL`: preserve the current app/merchant and enforce Sandbox in this pilot.
- `APP_PUBLIC_URL`: validated application origin used to derive exact return/cancel paths; no user-supplied redirect destinations or Example Domain fallbacks.
- Existing DB/auth settings: explicit demo bootstrap for the single operator; no default operator key accepted in a shared deployment. Turn off SQL parameter echo.
- `EVIDENCE_DIR`: private ignored local directory, not a static asset directory. Single-instance deployment requires a persistent private disk for DB/evidence or remains a disclosed local demo.
- Runtime model settings, proposed but not written: primary `AI_PROVIDER=gemini`, `AI_MODEL=gemini-3.8-flash`, and a private `GEMINI_API_KEY`. The explicit fallback is `AI_PROVIDER=openai`, `AI_MODEL=gpt-6.1-sol`, with its own private `OPENAI_API_KEY`. Do not populate `.env.example` with real values or repurpose inherited coding-session tokens. Fail clearly when missing; no silent provider switch or simulated runtime AI.
- `PAYPAL_SETTLEMENT_ENABLED`: explicit deployment guard, initially false. It does not bypass per-action approval when enabled. Tests use injected fakes and cannot enable external calls just by inheriting developer credentials.
- Buyer email/password are diagnostic-only. The product does not load, auto-login with, expose, or transmit them; hosted PayPal checkout handles buyer authentication.

Before a public push, repair `.env.example` to placeholders, review possible prior secret exposure without printing values, rotate/reset affected credentials through the appropriate UI, and verify ignore rules for DBs, evidence, browser traces, screenshots, videos, and logs. Do not assume deletion from a file retracts exposure from history or transcripts.

Do not mount the current unsigned webhook route. The pilot uses synchronous response verification plus authenticated explicit refresh; pending results stay pending. Add verified, deduplicated webhooks only if a later asynchronous requirement justifies them. This is a stated pilot limit, not a claim that browser redirects guarantee delivery.

## 11. Tests and acceptance evidence

### Offline tests — default, no PayPal or AI network access

Use standard-library `unittest` and isolated test doubles for pure service/state safety tests; these are not integrations or product-runtime modes. Add `httpx` as a small test-only dependency if using FastAPI TestClient; no additional Python test framework is required. Use a temporary SQLite DB and private fixture directory. Override settings before imports; test mode must not load the real `.env`. Deny external networking in the default suite. Default API/browser checks cover local non-financial UI, validation, auth, and blocked/cancelled actions. Actual AI/PayPal integration and end-to-end success checks use the real providers in separately authorized suites; do not create a fake-provider demo app.

| Test group | Required assertions |
| --- | --- |
| Money and transport | Strict cents/decimal validation; correct AUTHORIZE payload; exact capture amount/currency/final flag; correct authorization rather than order capture endpoint; no float conversion; no live host; correct ID extraction; minimal and representation responses; void 204 parsing. |
| Approval and binding | Missing auth/wrong tenant/arbitrary provider ID rejected; callback token alone grants nothing; no settlement from upload/reconcile/GET/callback; changed evidence, human review, terms, authorization, amount, or preview digest invalidates approval; actor is server-derived. |
| Four financial branches | Complete + human no-charge -> one fake void; approved partial/full -> one exact fake capture; unresolved/invalid/stale -> zero mutations even if a client directly calls approve. All branches require read-back before success. |
| Concurrency/idempotency | Double-click, two tabs/different keys, same key/different body, refresh during execution, restart after dispatch, and failed local commit after provider success. At most one local owner; reuse durable key/payload; uncertain state blocks a fresh action. |
| Verification/recovery | Capture PENDING/DECLINED, wrong amount/currency/order/auth ID, failed read-back, timeout/5xx, expired/voided authorization, and unexpected prior capture. No success from order `COMPLETED`, HTTP 201 alone, or the old verify stub. |
| Evidence/AI | Actual-issued versus template items, approved substitution, missing citations, invented IDs, prompt injection, obscured photos, wrong kit, malformed JSON, extra money/action fields, provider outage; no financial calls from AI processing. |
| Upload/privacy | Decode/type/size/pixel limits, unsafe filenames/path traversal, cross-tenant file access, EXIF removal, missing provider consent, safe error/audit output, and deletion rules. |
| Browser behavior | Setup return/cancel; evidence upload and clarification; exact confirmation text; cancel confirmation sends no mutation; double-submit guard; uncertainty/refresh UX; keyboard/focus/error behavior; mobile layout. |

Planned commands after those tests exist: `python -m unittest discover -s tests/unit`, `python -m unittest discover -s tests/api`, and `npx playwright test --project=chromium` for isolated non-financial browser checks. Real provider integration suites are separate, opt-in, and explicitly authorized; they never run from the default command. These are proposed checks, not commands run or passed in this planning task. Do not run the current playwright.dev examples and call them application coverage.

### AI value/safety validation — not replaced by unit tests

Retain the six-case protocol: complete return; supported missing issued accessory; occluded item resolved by follow-up; template-only item never issued; approved substitution; wrong-kit/conflicting records. Use permitted actual or physically staged evidence, not generated photos or invented scans. Repeat tricky cases unchanged; keep hidden answer keys and blind scoring. Compare competent checklist and human-plus-AI on identical evidence, including capture/preparation/clarification/correction time.

The safety gate includes correct dispositions, no fabricated decisive evidence, no missed supported shortage, and stable repeats. The proposed value gate remains at least 25% and 20 seconds median saving, faster in at least four of six comparisons with no accuracy loss, or a replicated actual baseline evidence-error prevention acceptable to the operator. Fixtures prove technical behavior, not demand or operator value. No such result is claimed here.

### Real Sandbox tests — opt-in and separately authorized

Default automated suites must never create orders or settle the existing diagnostic authorization. Payment tests use explicitly approved app-owned fixtures, serial execution, fixed per-action idempotency keys, and no automatic test-runner retries. Disable secret-bearing screenshots/traces/video; record only an allowlisted transaction summary.

| Still-unproven test | Required observed evidence |
| --- | --- |
| App checkout -> authorization | Correct application callback, actual buyer approval, server GET `APPROVED`, explicit authorize POST, persisted authorization `CREATED`, matching USD amount/payee, successful restart/read-back |
| Complete-return void | Successful void response, authorization GET `VOIDED`, zero captures; do not claim immediate issuer hold release |
| Final partial capture | Capture `COMPLETED` for exactly the approved amount, correct resource binding, returned final flag, refreshed authorization/order, one capture; record actual final-partial authorization behavior |
| Full capture | Capture `COMPLETED` for the full approved amount, correct binding, authorization/order read-back, no duplicate capture |
| Separate diagnostic only: partial non-final -> void | Completed partial capture with `final_capture:false`, observed intermediate state, separately approved void, authorization `VOIDED`, original capture still completed for only the partial amount |
| Idempotency/recovery | Only with explicit replay permission: same payload/key returns the same capture/void outcome; no second capture; restart/timeout reconciliation does not submit a fresh payment |

These are mutually constraining branches: one fully captured or voided authorization cannot prove every alternative. New authorizations/orders require separate permission; no “test all branches” loop is implied. The existing USD 10 authorization stays protected unless explicitly released for a named diagnostic step.

## 12. Implementation sequence and file map

Each phase is reviewable and should leave a runnable slice. Coding and external experiments remain gated by the user's next instruction.

| Phase | Focused changes | Exit evidence |
| --- | --- | --- |
| 0. Safety and configuration | Review secret/template hygiene; add test settings and sandbox guards; unmount unsafe legacy financial surfaces for KitTrust; preserve data; correct misleading documentation as work lands. | No default test network access; no uncontrolled legacy settlement route; no secrets in tracked examples. |
| 1. Authorize vertical slice | Add Rental/PaymentAction storage, explicit REST helpers, real return/cancel pages, exact USD setup and authenticated authorize flow. | Offline tests first; separately permitted app Sandbox setup/approval/authorization and restart verification. Do not import the protected diagnostic authorization. |
| 2. Evidence and real reconciliation | Add EvidenceAsset/ReconciliationRun, bounded uploads, single selected AI call, schema/citation validation, and clarification/review UI. | Six fixtures handled without payment access; real image call labelled and measured; human corrections/versioning tested. |
| 3. Settlement boundary | Add preview, exact human approval, durable action claim, capture/void helpers, resource read-back, uncertain/pending recovery, and receipt. Product partial is locked to one final capture; its actual provider behavior still requires the live-test gate. | All four branches and race/crash cases pass offline; unresolved cannot move money. |
| 4. Controlled Sandbox settlement | Execute only the individually approved branch/amount on explicitly approved app-owned fixtures. | Capture/void/partial-final claims backed by resource GETs and IDs/counts; no claims based solely on HTTP/order status. |
| 5. Demo and product check | Replace ScopeBridge README/demo instructions, wire local Playwright tests, document limitations and operator validation. | Reproducible setup; honest under-three-minute walkthrough; remaining gaps visible. |

Expected file changes after approval:

- **Modify:** `app/config.py`, `app/db.py`, `app/models.py` (additive models), `app/main.py`, `app/services/paypal.py`, and small auth/bootstrap wiring as needed.
- **Add:** `app/services/kittrust.py`, `app/services/reconciliation.py`, `app/routers/kittrust.py`; `app/static/kittrust.html`, `kittrust.css`, `kittrust.js`; a local fixture/bootstrap script that makes no PayPal calls; focused unit/API/browser tests.
- **Adjust only when justified:** runtime requirements for image validation; test-only requirements for TestClient; package scripts/Playwright configuration; placeholder env template and ignore rules.
- **Refresh:** README, PAYPAL_SETUP, LOCAL_SETUP, and stale project instructions to reflect actual KitTrust behavior and observed checks.
- **Preserve initially:** unrelated risk, sentiment, lead, alerting, and legacy Order code/data, but do not expose or call their old payment paths from KitTrust. No wholesale restore or framework rewrite.

## 13. Honest demo flow

1. Show a permitted staged/real kit and actual-issued record. Explain that KitTrust reconciles accessories and supports review, not damage valuation or autonomous billing.
2. Show an **app-owned, separately approved** authorized Sandbox rental, or explicitly label a previously recorded setup segment. Display “authorized, not captured.” Existing unrelated diagnostic authorization is not a demo seed.
3. Upload return evidence and perform an actual runtime AI reconciliation. Show an unresolved/occluded case requesting a check, with no financial action.
4. Show a resolved complete return and human no-charge confirmation leading to a verified void on its own approved fixture, if that branch has passed.
5. On a different approved fixture, show a supported discrepancy, operator-selected amount, exact confirmation, and only that amount captured. Full capture can be documented/tested without spending the short video on another identical checkout.
6. Finish with the receipt: evidence revision -> human decision -> PayPal resource read-back. Clearly distinguish authorization, capture, and void. Show uncertainty honestly if a payment is pending.

Do not manufacture rental incidents, imply an AI chose the fee, describe staged examples as operator demand, call unsigned logs immutable, or present prerecorded/mocked settlement as a live API result. Default demo/setup commands create local fixtures only; they must not move money on startup.

## 14. Locked decisions and remaining execution prerequisites

The KitTrust replacement, minimal stack/frontend, reconciliation-only AI, mandatory human approval, real integrations, and one-final-settlement branches are locked in section 1. Partial-then-void is diagnostic-only; this is no longer an open product choice.

1. **Selected AI, not yet usable:** primary Gemini `gemini-3.8-flash`; fallback OpenAI `gpt-6.1-sol`. Supply project-owned credentials locally, confirm account/model quota and billing/free-tier terms, approve a small validation budget, and perform a real image/schema check before claiming runtime availability. Do not paste credentials into chat.
2. **Human financial terms:** specify agreed charge rules and the operator's review responsibility using actual-issued evidence. Do not expand into AI damage/liability automation.
3. **Runtime origin/storage:** choose local-only versus a hosted single-instance demo with persistent private storage; set real return/cancel origin before testing callbacks.
4. **Evidence rights/retention:** supply permitted evidence packets and decide deletion/transfer policy for each selected provider before transmitting real rental photos.
5. **Separate permissions:** architecture approval does not lift the current implementation pause or authorize PayPal mutations. Name the fixture and authorize each payment branch separately. The existing diagnostic authorization remains protected.

## 15. Official references and verification scope

Previously inspected official PayPal references underpin the proposed API semantics; documentation support is not an observed result for this merchant:

- [Orders REST integration and payer-action/return flow](https://developer.paypal.com/whats-an-order/)
- [Authorize payment for order](https://developer.paypal.com/api/orders/v2/orders-authorize/)
- [Capture authorized payment, amount and final_capture](https://developer.paypal.com/api/payments/v2/authorizations-capture/)
- [Void authorized payment](https://developer.paypal.com/api/payments/v2/authorizations-void/)
- [Authorization validity and honor period](https://developer.paypal.com/docs/checkout/standard/customize/authorization/)
- [Idempotency](https://developer.paypal.com/api/rest/reference/idempotency/)
- [India domestic-receipt restriction](https://www.paypal.com/in/cshelp/article/can-i-use-paypal-to-receive-payments-from-indian-customers-help1049)

### Runtime AI sources checked for this decision

- [Gemini current model catalog and legacy-access restrictions](https://ai.google.dev/gemini-api/docs/models)
- [Gemini 3.8 Flash model capabilities and supported thinking levels](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)
- [Gemini multi-image input and inline request limit](https://ai.google.dev/gemini-api/docs/image-understanding)
- [Gemini JSON Schema structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- [Gemini Interactions API and store=false](https://ai.google.dev/gemini-api/docs/interactions)
- [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini project rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Gemini unpaid/paid service and data terms](https://ai.google.dev/gemini-api/terms)
- [OpenAI GPT-6.1 Sol capabilities, pricing, and effort settings](https://developers.openai.com/api/docs/models/gpt-6.1-sol.md)
- [OpenAI Structured Outputs, refusals, and first-schema latency](https://developers.openai.com/api/docs/guides/structured-outputs.md)
- [Anthropic current model comparison](https://platform.claude.com/docs/en/about-claude/models/overview.md)

This document reflects static repository inspection, safe environment/credential-presence checks, official public documentation, and three unauthenticated public AI model-list GETs. No credential value or private endpoint was disclosed or used in those requests. No authenticated inference, image upload, private database-row inspection, app startup, payment/browser test, PayPal API call, or application/configuration change occurred. Only this architecture/AI-decision document was updated; model access, latency, accuracy, and billable runtime performance remain unverified.
