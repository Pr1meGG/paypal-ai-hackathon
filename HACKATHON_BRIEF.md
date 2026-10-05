# PayPal AI Hackathon: researched brief and proposed direction

Researched: 2026-10-03. **Product selection is not approved or finalized.** This document distinguishes organizer requirements from recommendations. No application, model integration, or payment flow was built during this research.

## 1. Verified event requirements

Canonical event: https://paypalaihackathon.devpost.com/

The hyphenated `paypal-ai-hackathon.devpost.com` URL in older notes is incorrect. Use the official [rules](https://paypalaihackathon.devpost.com/rules), [resources](https://paypalaihackathon.devpost.com/resources), and [schedule](https://paypalaihackathon.devpost.com/details/dates).

- **Deadline:** November 12, 2026 at noon PST = **November 13, 2026 at 1:30 a.m. IST**.
- Solo entrants are allowed; age, jurisdiction, IP, and conflict-of-interest rules apply. Check eligibility in the full rules.
- Build or significantly update an application using the **PayPal sandbox** and an **AI tool/model/platform**. PayPal must be central; AI should be meaningful within the experience/functionality.
- Existing work can be reused, but explain significant updates made after the submission period began on October 1. Organizers decide whether updates qualify.
- Any AI provider is acceptable. Sponsor tools, MCP, ACP, and Braintree are not universal requirements.
- A working build is mandatory. A static mockup is insufficient.
- Public deployment is optional if judges receive complete instructions to run a working build.
- Keep judge access available free of charge through the end of judging: **December 15, 2026, 9:30 p.m. IST**.

### Submission checklist

- [ ] Working application with meaningful PayPal and AI integration.
- [ ] English description explaining the problem, user, functionality, tools, and their roles.
- [ ] Public GitHub repo with all necessary source/assets and complete setup instructions.
- [ ] Recognizable open-source license file visible in GitHub's repository About area.
- [ ] Functional hosted demo or a reproducible local test build.
- [ ] Public YouTube video **under three minutes**, showing real application behavior.
- [ ] Safe instructions for judge test access; do not publish merchant secrets.
- [ ] Explain hackathon-period changes if reusing the existing commerce app.
- [ ] Submit the entry, not merely save a draft, before the deadline.

Judges may evaluate only the description, images, and video; they are not required to run the app. Submission materials should be English or include English translations. Avoid unauthorized copyrighted music or third-party material. Rules govern post-deadline changes and eligibility; this brief is not a replacement for reading them.

## 2. What judges score

The first stage is pass/fail viability, theme fit, and appropriate API/tool usage. The second stage has **five equally weighted criteria**:

| Criterion | What our demonstration should prove |
| --- | --- |
| Technological implementation | Actual AI use and actual PayPal API results, safe state transitions, meaningful verification. |
| Design | A coherent task a person can complete, with understandable approval, pending, cancelled, and error states. |
| Potential impact | A specific audience and real problem, supported by user evidence rather than invented market statistics. |
| Innovation/idea | A clear difference from existing products, stated narrowly and honestly. |
| Presentation | A concise, compelling end-to-end demonstration with visible results. |

Tie-breaks apply these criteria in the listed order, then a judges' vote.

**Our interpretation:** A small, polished workflow is a better fit than a broad suite of unfinished agents. No concept or implementation can guarantee an award.

## 3. Prizes and useful sponsor resources

From the [rules, section 8](https://paypalaihackathon.devpost.com/rules):

- Grand prizes: **$12,000 / $8,000 / $5,000**.
- Honorable mentions: **$5,000 each** for Most Creative, Most Impactful, Best Demo Delivery, Best Use of PayPal + AI, and Best Use of Agentic Commerce.
- A project can win **one Grand Prize + one Sponsor Prize OR one Honorable Mention + one Sponsor Prize**. Do not plan around stacking several sponsor awards or a grand plus honorable award.

| Resource | Verified advertised offer / relevance | Award |
| --- | --- | --- |
| [APIMatic](https://paypalaihackathon.devpost.com/details/apimatic) | PayPal Context Plugin without extra APIMatic credentials; one month Basic claim requires demonstrated usage/project evidence and approval. | Three $1,000 awards + six months Business each. |
| [AG Grid / AG Studio](https://paypalaihackathon.devpost.com/details/aggrid) | 45-day trial and dashboard/agent tooling. Sponsor guidance emphasizes meaningful use and polish. | $5,000, $2,000, and three $1,000 awards. |
| [Render](https://paypalaihackathon.devpost.com/details/render) | $50 build credits; potentially useful for hosted demo. Credits are not an unlimited spending cap. | $1,000 / $750 / $500 in credits. |
| [Channel3](https://paypalaihackathon.devpost.com/details/channel3) | 20,000 search/API credits, promo `PAYPAL-HACKATHON-2026`, no card advertised. Useful only for a real product-search need. Its developer page marks programmatic Checkout as coming soon. | One $1,500 award. |
| [Bryntum](https://paypalaihackathon.devpost.com/details/bryntum) | 45-day trial for scheduling, calendar, and Gantt tooling. | Three $1,000 awards. |
| [KERNEL](https://paypalaihackathon.devpost.com/details/kernel) | $50 cloud-browser credits. | No dedicated prize listed. |
| [Elastic](https://paypalaihackathon.devpost.com/details/elastic) | 14-day trial plus advertised 30-day extension, or local option. | No dedicated prize listed. |
| [Zapier](https://paypalaihackathon.devpost.com/details/zapier) | 14-day Professional trial for new accounts, then Free plan. | No dedicated prize listed. |
| [Astropods](https://paypalaihackathon.devpost.com/details/astropods) | Free account for agent infrastructure; no quantified bonus found. | No dedicated prize listed. |
| [Postman](https://paypalaihackathon.devpost.com/details/postman) | API testing and PayPal collection. | No dedicated prize listed. |

**Trial pitfall:** A 45-day trial started October 3 ends before December judging. Verify licensing, redistribution rights, extensions, and continued judge access before adopting proprietary components. Render overages can be billed; inspect credit terms before enabling paid services. No credits were claimed or services activated during this research.

Pick at most the integrations that improve the selected product. Sponsor count is not a judging criterion.

### Helpful live sessions

The official resources page lists:
- October 6: PayPal build session, **9:30 p.m. IST** start.
- October 7: APIMatic session, **9:30 p.m. IST** start.
- October 12: payments dashboard session, **7:30 p.m. IST** start.
- October 13: PayPal build session, **1:30 p.m. IST** start.

Confirm the registration page/time before attending. The resources page has an apparent a.m./p.m. typo for the October 6 end time. Official [PayPal Discord](https://discord.gg/sJ2G6DyvSK) and `support@devpost.com` are routes for questions. Request written organizer clarification when a rule is ambiguous.

## 4. Proposed top concept: ScopeBridge

**Working name; not a trademark clearance or final product decision.**

> Agree on the extra work before doing it.

### Audience and problem hypothesis

Fixed-price freelancers/small agencies receive client messages mixing included revisions with additional deliverables. They need to avoid both unfair extra charges and unpaid additional work. Validate this with actual practitioners; frequency, willingness to pay, and impact are not established yet.

### Narrow demonstration

Start with one niche: landing-page copywriting, one merchant, and international clients or a clearly labelled supported-market sandbox scenario.

Original brief: one English landing page, two revision rounds, no additional languages.

New client request: “Make the headline friendlier, and also create a Spanish version.”

1. AI compares the brief and message.
2. It highlights the headline revision as **included**, the additional language as a **proposed extra**, and quotes the supporting input text.
3. If evidence is ambiguous, it asks a focused question rather than inventing a charge.
4. Merchant reviews the proposed change. Price comes from a merchant-maintained rate card, not an invented model estimate.
5. Client sees the exact approved deliverable, price, and delivery terms, then explicitly accepts and pays through PayPal sandbox.
6. Server checks capture status, amount, currency, and linkage to the approved change. Only confirmed payment marks that version paid.
7. A receipt/audit view links the original brief, accepted change, approval, and PayPal identifiers.

Example $60 extra is synthetic demonstration data, not a market price or a payment authorization.

### Why AI and PayPal both matter

- AI performs semantic comparison of informal language against the original agreed scope, with evidence and uncertainty.
- PayPal completes a reviewed, buyer-approved payment for that exact extra work.
- Deterministic code owns money amounts, allowed actions, version binding, and payment-state transitions.

The first integration can use **Orders v2 with CAPTURE intent**. Buyer approval is required before server-side capture. No automatic saved-card charge, marketplace onboarding, escrow, or long authorization hold is necessary.

Official flow: https://developer.paypal.com/api/rest/integration/orders-api/api-use-cases/standard/

### Honest competitive position

[Bonsai](https://www.hellobonsai.com/proposals) already provides proposals, approval, deposit capture, rate cards, and AI-connected operations. [Contra](https://help.contra.com/en/articles/9322763-paid-projects) provides paid projects/milestones. “AI proposals + payments” is not a novel category.

Our proposed differentiation is the **evidence-linked scope change**, protecting clients from being billed for included work and freelancers from starting unpaid extras. Whether this is sufficiently valuable and differentiated must be tested; no claim of a unique market moat is made.

### Smallest coherent product

Three views:
1. Original brief + new request + evidence-linked classification.
2. Merchant review + client approval/checkout.
3. Accepted change + verified payment receipt and status history.

Exclude from MVP: CRM, ad optimization, WhatsApp, OCR, legal advice, deliverable-quality judging, escrow, marketplaces, payouts, subscriptions, autonomous negotiation, and a general-purpose chatbot.

### Demo target: approximately 2 minutes 30 seconds

- 0:00–0:20: concrete freelancer/client problem.
- 0:20–0:55: real model response classifies the mixed request and refuses to bill the included part.
- 0:55–1:20: merchant reviews, then client accepts the exact extra.
- 1:20–2:05: complete actual sandbox buyer approval and server capture.
- 2:05–2:30: show verified payment ID, scope version, and a cancelled/duplicate-payment safeguard.

Use a disclosed demo fixture for the brief. Never substitute a canned model response or fabricated payment ID while claiming a live integration. Test actual timings before recording.

## 5. Alternatives considered

| Rank | Concept | Useful distinction | Why not first |
| --- | --- | --- | --- |
| 2 | Switch, Don't Cancel | AI matches a mistaken workshop purchase to a suitable alternative, then settles an upgrade difference via fresh buyer-approved payment. | More payment branches and recovery states. Gorgias already offers many AI cancellation/refund/replacement actions; narrower opportunity is completing additional-payment upgrades. |
| 3 | FairPause | Interprets subscription cancellation reasons and offers one relevant pause/downgrade, while always honoring cancellation. | Crowded category; Churnkey already offers AI retention features. Subscription consent, billing timing, and no-proration constraints add complexity. |

Comparator sources:
- https://docs.gorgias.com/en-US/ai-agent-actions-make-changes-to-shopify-orders-757792
- https://churnkey.co/feature/cancel-flows

The earlier generic refund-assistant suggestion is weaker on differentiation than the narrower proposals above. These comparisons are research findings, not guarantees that competitors lack equivalent features elsewhere.

## 6. Feasibility checks before committing to a build

1. Save sandbox credentials locally using [LOCAL_SETUP.md](LOCAL_SETUP.md); never send them in chat.
2. Verify sandbox OAuth only. Do not treat authentication as proof of a working payment.
3. Confirm authorized **runtime AI access**, cost, and one actual structured-output response. Coding-assistant access alone does not provide an app API key.
4. Ask 3 relevant freelancers/agencies for a recent anonymized scope-change example and how they currently handle it. Do not upload private client material without permission.
5. Choose the concept explicitly. A recommendation is not permission to build a different product.
6. Preserve the existing FastAPI/SQLite and Next.js foundation where useful; copy only required pieces into the selected project after approval. Do not restore the incomplete payment backup wholesale.

### Required behavior checks for ScopeBridge if selected

- Clearly included work is not turned into a payable extra.
- Ambiguous/unsupported changes request clarification.
- Quotes actually occur in the supplied source; interpretation also gets human/fixture review.
- Missing rate-card entries cannot become model-invented prices.
- Edited scope invalidates any old unaccepted quote; payment is bound to the accepted version.
- Duplicate click/retry does not double-charge or duplicate the paid change.
- Cancelled, failed, or pending payments never appear as paid.
- Server verifies amount, currency, merchant/order ownership, and capture state.
- Secrets stay out of browser bundles, logs, screenshots, and the public repository.

## 7. Human contribution and execution milestones

### User owns

- Choose the audience/problem and approve scope.
- Gather real examples and tell us when the workflow feels unfair or impractical.
- Define which revisions are included and the allowed rate card for demo cases.
- Control accounts/credentials and perform sandbox buyer checkout in the browser.
- Test as both client and merchant, challenge the AI's answers, and prioritize changes.
- Explain the product in the pitch and submit the final Devpost entry.

### Coding assistant can help with

- API research, bounded implementation, database/state handling, UI, and tests.
- Failure-case analysis and evidence-backed debugging.
- Setup documentation, demo script, and a review of the submission checklist.

### Milestones (proposed sequence, not completed work)

1. **Access:** protected `.env`, successful sandbox OAuth, usable runtime AI access.
2. **Problem:** real examples and one chosen audience/workflow.
3. **Vertical slice:** brief → AI scope diff → reviewed quote → buyer-approved sandbox capture → verified receipt.
4. **Reliability:** core failure tests, usable error states, simple audit trail.
5. **Proof:** realistic users try it; record observed quality/time and limitations without invented impact claims.
6. **Submission:** reproducible judge access, public licensed repo, English description, under-three-minute YouTube video.

## 8. Research coverage and limits

Checked official overview, complete rules, resources, dates, visible updates, discussion index and both visible threads, gallery status, all ten sponsor resource pages, and selected official capability/competitor pages.

- The **project gallery is not yet published**. This is not evidence that no one has submitted and does not establish originality.
- Visible discussion posts are participant questions, not authoritative organizer clarifications. No official maximum-team-size clarification was found; solo eligibility is explicit.
- Some claim portals rendered no readable content; APIMatic's resource PDF did not render, AG Studio licensing returned 403, and the Elastic extension form timed out. Additional terms remain unverified.
- Some resource-linked PayPal AI quickstarts returned 404; the official [PayPal AI Toolkit repository](https://github.com/paypal/AI-Toolkit) was available.
- Rules and schedule differ slightly on opening and winners-announcement times; the deadline agrees. Rules take precedence.
- Account eligibility, actual sandbox transactions, runtime AI access, product demand, and competitive uniqueness remain unverified.

## 9. Prize strategy and production-readiness bar (proposed)

### Target the quality of one entry, not a count of integrations

Primary positioning for ScopeBridge: **Best Use of PayPal + AI ($5,000 cash)**, with a strong demonstration also relevant to **Best Demo Delivery ($5,000 cash)** and possible overall consideration. Best Use of Agentic Commerce can fit if the agent visibly interprets the request, proposes and prepares the permitted next action, obtains human approval, and verifies the payment result. There is no need to pretend the agent can charge money without consent.

These are alignment judgments, not predicted awards. The rules permit only one Grand Prize or one Honorable Mention, plus at most one Sponsor Prize. Multiple category fits do not mean multiple major awards. No odds are estimated; the number/quality of entries and judging decisions are unknown.

For a **cash sponsor award**, APIMatic is a low-overhead candidate (three $1,000 awards) if its PayPal context tooling is actually used and evidenced. AG Grid offers five cash award slots and is worth considering only if its review/dashboard functionality materially improves the product; do not adopt a proprietary trial-dependent stack just to add a logo. Render awards are infrastructure credits, not cash. Neither sponsor selection nor product selection is finalized.

### Production-minded sandbox pilot, not an unearned production claim

Keep the first product one merchant and one service niche. Reuse the existing stack where it fits; do not build microservices, a marketplace, escrow, or a general financial agent.

Before calling the narrow workflow production-ready, require observed evidence for:

1. **Authentication and authorization:** correct ownership checks on every brief, change, approval, and payment. Unauthenticated access and cross-user reads/writes fail. Demo roles must not be mistaken for production auth.
2. **Payment integrity:** integer minor-unit amounts, supported currency, approved merchant rate card, server-side pricing, and binding between accepted scope version, order, amount, currency, payee, and capture.
3. **Consent:** merchant review and explicit client approval. Edits invalidate stale acceptance/quotes. The model cannot set arbitrary prices or execute unapproved charges.
4. **Retries and recovery:** persistent operation/idempotency identifiers and database constraints; repeated clicks/events do not duplicate charges. After timeouts, reconcile server-side payment state before retrying.
5. **Trustworthy status:** browser returns are not proof of payment. Handle pending/failed/cancelled states explicitly; verify webhook signatures and replay handling if webhooks are added.
6. **AI boundaries:** validated structured output, evidence quotations checked against source text, ambiguity handling, prompt-injection tests, context limits, and explicit runtime model failure behavior. A model failure must not invent a quote.
7. **Security and privacy:** secrets stay server-side; redact logs, use least-privilege access, appropriate input limits/rate limits, and document data retention. Relevant documents are untrusted input, not agent instructions.
8. **Operational evidence:** known setup steps, health check, persistent storage/backup-and-restore appropriate to hosting, bounded timeouts, usable error reporting, and documented recovery after a failed payment/local update.
9. **Product quality:** client and merchant can complete the flow without coaching; keyboard/accessibility basics and responsive layouts work; clear loading/empty/error states are exercised.
10. **Evaluation:** a small reviewed case set covers included work, legitimate extras, ambiguity, conflicting instructions, missing prices, stale scope, duplicate payment requests, abandoned checkout, and payment failure. Record actual results rather than reporting fixture count as proof of general reliability.

Sandbox completion does not establish live merchant eligibility, legal/regulatory readiness, or production payment approval. Do not claim escrow, guaranteed dispute wins, proven revenue uplift, or security certification.

### Evidence package for judging

A compelling deliverable is: a working application; under-three-minute video; public licensed repo with reproducible instructions; exact PayPal sandbox operation IDs/statuses in the demo; a concise architecture diagram; observed test/eval results; and anonymized, consented user feedback. Use measured outcomes from actual trials, with sample size/limitations, rather than invented ROI.

## 10. Current local work completed

- Added `LOCAL_SETUP.md` with exact local credential steps.
- Set existing `.env` permissions to `0600`; verified it is ignored and untracked. Existing values were preserved and not printed.
- Added a current-status warning to `README.md` so its historical proposal is not mistaken for implemented code.
- Added this research brief. No package installation, application build, token exchange, payment, account change, commit, or push was performed.
