# Public judge research and entry strategy

Research date: 2026-10-03. Coverage: **13/13 judges currently named on the official event page**. This is public professional-background research, not private profiling or a prediction of anyone's preferences or vote.

## Source and limitations

- [Official roster](https://paypalaihackathon.devpost.com/#judges)
- [Official rules and rubric](https://paypalaihackathon.devpost.com/rules)
- [Sponsor resources](https://paypalaihackathon.devpost.com/resources)

The event lists six PayPal judges and seven judges from other organizations. All roles below use the event's wording. The rules permit additional unnamed judges and changes to the panel; this is not a guarantee of the final panel or each judge's assigned category. No specific prior hackathon-judging engagement was independently verified. Conference recordings, announced workshops, and submitted sessions are different kinds of evidence and are labelled accordingly.

**The final column contains our recommendations, not statements of what an individual personally wants.** A sponsor affiliation does not establish that only that judge evaluates the sponsor prize.

## Judge-by-judge findings

| Judge / official role | Supported expertise and sources | Confidence / gaps | Our inferred demonstration emphasis |
| --- | --- | --- | --- |
| **Jo Franchetti — Developer Advocate, PayPal** | JavaScript/TypeScript, developer education, practical AI. [GitNation profile](https://gitnation.com/person/jo_franchetti) corroborates PayPal and lists local-LLM/schema-validation workshop material. | High for affiliation and technical domains. A listed workshop is not proof of its delivery. | Validated AI outputs, approachable UX, clear approval and recovery behavior. Do not choose a local model merely to match a speaker topic. |
| **Eddie Jaoude — Developer Advocate, PayPal** | Full-stack development, open source/developer education, documentation, testing and DevOps. [GitNation profile and talks](https://gitnation.com/person/eddie_jaoude), including React/MDX documentation material. | High for affiliation and broad background; distinguish delivered recordings from future/listed sessions. | A public repo another developer can run, good tests, understandable code and a demonstrable failure/retry case. |
| **Marco Podien — Developer Advocate, PayPal** | TypeScript, generative AI, developer tools and experience; 20+ years in IT stated in [PayPal Developer's welcome post](https://www.linkedin.com/posts/paypaldev_a-big-welcome-to-marco-podien-to-the-paypal-activity-7495551777854033920-8UD0). | High for role and employer-stated areas; no specific delivered talk or prior judging engagement verified. | Typed tool boundaries, correct PayPal API methods, actionable errors, simple setup. |
| **Karthik Ravi — Software Engineer, PayPal** | A matching [self-published Sessionize submission](https://sessionize.com/s/kaddynator/beyond-gpu-counts-proving-kubernetes-dra-workloads/188308) identifies AI/ML infrastructure work and discusses Kubernetes DRA/GPU workload correctness. | Medium-high for matching professional field; specialization is self-published. The session is submitted, not verified as delivered. | Observable state transitions, bounded model latency/cost, recovery after interruption. Kubernetes is not necessary for this product. |
| **Himraj Singh — Engineering Manager, PayPal** | Quality engineering, automation architecture, enterprise testing and generative AI in an [organizer speaker announcement](https://www.linkedin.com/posts/ai-every-time_ai-future-innovation-activity-7476488284358012928-rHTu). | High for roster-aligned role; domains partly from speaker-supplied bio. Talk delivery not confirmed. | Duplicate requests, access-control tests, prompt injection, payment failures and clear verification evidence. Multiple agents are not a requirement. |
| **Nathaniel Olson — Senior Product Manager, PayPal** | Developer-facing payments and SDK integration product education. [PayPal Server-side SDK presentation](https://www.youtube.com/watch?v=dGk95JzABJU) identifies him as a PayPal product manager. | High for identity and PM affiliation; exact seniority comes from the event roster. | A complete buyer/merchant task, justified API choices, and truthful approval/capture/payment states. |
| **Sylwia Vargas — Senior Technical Community Manager, AG Grid** | Technical writing, developer education, background jobs and durable execution. [GitNation profile and recordings](https://gitnation.com/person/sylwia_vargas). | Technical history is well supported; the current AG Grid title is roster-confirmed, while an older external bio still names Inngest. | A clear, inspectable operations UI, durable work, visible pending/retry states and useful documentation. |
| **Ameer Hassan — Co-Founder, APIMatic** | [APIMatic team page](https://www.apimatic.io/about) confirms Co-founder & CCO. Company context: API contracts, generated SDKs/docs and AI-consumable integration context. | High for role; individual hands-on specialization beyond the company domain was not independently established. | Contract-grounded API integration, accurate authentication/endpoint usage, typed inputs and reproducible tests. |
| **Mats Bryntse — CEO, Bryntum** | [Bryntum company page](https://bryntum.com/company/) confirms founder/CEO. Long-running product domain: web scheduling, Gantt/calendar/grid components. | High for role/product domain; no verified prior judging/talk record in this scan. Company capabilities are not all personal credentials. | Coherent visual workflow and editable constraints. Scheduling belongs in our app only if the actual use case needs it. |
| **Ignacio Valdez Bicard — Founding Engineer, Channel3** | Exact role from the official roster. [Channel3 company description](https://trychannel3.com/about): normalized product catalogs and agentic shopping infrastructure. | Limited independently matched personal biography. Catalog expertise here is role/company context, not a verified list of his projects. | Grounded product data, explicit constraints and legitimate merchant payment authority if building a shopping project. Not a reason to add shopping to ScopeBridge. |
| **Carly Richmond — Senior Manager, Developer Advocacy, Elastic** | [Elastic author bio](https://www.elastic.co/blog/author/carly-richmond) and [conference record](https://gitnation.com/person/carly_richmond): financial-services software, observability, frontend performance, synthetic testing and RAG. | High for affiliation and domains; older bios may use earlier titles. | Evidence-grounded AI output and traces linking the model decision to its input and payment outcome. |
| **Pooja Mistry — Sr. Developer Advocate, Postman** | [Official Postman author page](https://blog.postman.com/author/pooja-mistry/): API testing, GraphQL, automation, human-centered API design, AI/MCP material. | High for employer and subject areas; exact seniority comes from the event. | Positive/negative API tests, clear request/response contracts, scoped agent tools and secret-free test artifacts. |
| **Shifra Williams — Founding Developer Relations Engineer, Render** | Exact role from official roster. [Render's company domain](https://render.com/about): deployment, cloud infrastructure and developer experience. | Limited independently matched personal biography or speaking record. Do not infer prior employers or personal projects. | Reproducible deployment, server-side secrets, persistent data, health checks and recovery after restart. |

## What the research actually changes

The panel spans developer experience, payments product, quality engineering, AI infrastructure, visual developer tools, APIs, search/observability, and deployment. That supports a common demonstration standard:

1. Solve one credible user problem; make the before/after obvious.
2. Show a real model decision grounded in supplied evidence.
3. Show user/merchant approval and a real sandbox payment result.
4. Show one difficult case, not only the successful path.
5. Make the project understandable and runnable from the public repo.

This is an inference consistent with the published rubric. It does not establish that particular judges prefer our concept, that sponsor tools are required, or that complex infrastructure improves our score.

## Recommended product and prize positioning

The recommendation remains **ScopeBridge**, described in [HACKATHON_BRIEF.md](HACKATHON_BRIEF.md): compare an original fixed-price service brief with a new client request, separate included revisions from proposed extras using evidence, obtain merchant/client approval, then complete and verify a PayPal sandbox payment for the exact agreed extra.

It is still a hypothesis pending user selection and real-user validation. Competitors already provide proposals, invoicing, deposits and AI features; our narrower scope-diff workflow is not a claim of being the world's first.

### Prize priorities

- **Primary fit:** Best Use of PayPal + AI — **$5,000 cash**.
- **Presentation objective:** Best Demo Delivery — **$5,000 cash**; not an additional major award we can stack with another honorable mention.
- **Agentic-commerce fit:** meaningful if the agent prepares a permitted action, obtains approval, calls tools and verifies the result; a renamed static form is not evidence of agency.
- **Optional cash sponsor:** APIMatic — **three $1,000 awards**, if used meaningfully and evidenced in the integration workflow. AG Grid is an alternative if a substantive review/dashboard UI warrants it, not another guaranteed stacked award.
- Render's sponsor awards are credits, not cash.

Rules allow a maximum of **one Grand Prize plus one Sponsor Prize OR one Honorable Mention plus one Sponsor Prize** for a project. We do not know the competition per prize and cannot estimate winning odds from award counts or judge biographies.

### Production-minded scope

Build one complete, narrow workflow with real security/reliability checks, not an enterprise platform. The [brief's production-readiness checklist](HACKATHON_BRIEF.md#9-prize-strategy-and-production-readiness-bar-proposed) covers authorization, server-side monetary integrity, approval/version binding, idempotency, reconciliation, AI validation, privacy, operations and actual eval evidence.

A compelling technical demonstration would be:

- An included revision remains free despite a request to charge for it.
- A genuine extra gets an evidence-linked, merchant-approved quote.
- A client pays through actual sandbox checkout.
- Repeated submit/retry produces one paid change, not two charges.
- The UI and audit record agree with the verified PayPal result.

Do not claim live production readiness, an escrow service, guaranteed dispute protection, or measured business benefits before those claims are actually supported.

## Immediate blockers

- Saved `PAYPAL_BASE_URL` points to the sandbox website, not the REST API server. The earlier independent OAuth test returned 401; authentication is unresolved. See [LOCAL_SETUP.md](LOCAL_SETUP.md).
- Runtime model API access for the app remains unconfirmed.
- No product choice has yet been approved.
- Automated access to the third-party PayPal Discord requires administrator-approved integration and channel permissions. No Discord connector was installed.

No judges were contacted, no private data was collected, and no credentials, payments, global MCP settings, or application code were changed by this research.
