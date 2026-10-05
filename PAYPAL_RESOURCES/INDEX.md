# PAYPAL_RESOURCES — Documentation Knowledge Base

This directory is a **documentation-only** knowledge base created during the reconnaissance phase of the PayPal AI Hackathon.

**Purpose**: To document every official PayPal capability, protocol, and building block available for the hackathon — without proposing a final product or modifying any application code.

**Scope**: Pure documentation and analysis. No application code, no product architecture, no product recommendations.

## File Map

| File | Contents |
|---|---|
| `INDEX.md` | This file. Directory map and reading order. |
| `SOURCES.md` | Verified official source URLs, environments, and live probe results. |
| `PAYPAL_CORE.md` | PayPal REST API core: OAuth, Orders, Payments, Capture, Authorize, Refunds, Webhooks, Idempotency, Error Handling, Sandbox accounts, negative testing, SDKs. |
| `PAYPAL_AI_AGENTS.md` | PayPal AI / Agent capabilities: Agent Tools, MCP, LLM tool-calling, Agentic Commerce, tool catalog, auth, sandbox availability, prerequisites, limitations. |
| `MCP.md` | Deep dive on the Model Context Protocol server: protocol, transport, auth, available tools, integration options. |
| `AGENTIC_COMMERCE.md` | Agentic Commerce Protocol (ACP) and Universal Commerce Protocol (UCP): requirements, Braintree dependency, sandbox vs. production. |
| `SANDBOX_TESTING.md` | Sandbox environment: accounts, test cards, mock responses, negative testing, webhook verification. |
| `HACKATHON_REQUIREMENTS.md` | Devpost hackathon requirements: PayPal requirement, AI requirement, demo requirement, license, judging criteria, sponsor resources. |

## Reading Order

1. Start with `SOURCES.md` for verified URLs.
2. Read `PAYPAL_CORE.md` for the underlying API primitives.
3. Read `PAYPAL_AI_AGENTS.md` and `MCP.md` for AI/agent integration paths.
4. Read `AGENTIC_COMMERCE.md` for advanced agentic commerce protocols.
5. Read `SANDBOX_TESTING.md` for test environment details.
6. Read `HACKATHON_REQUIREMENTS.md` for challenge constraints.

## Classification Legend

Throughout these documents, capabilities are classified as:

- **A — Officially Documented**: Directly confirmed by PayPal official documentation or live probe.
- **B — Technical Inference**: Reasonable deduction from documented behavior, but not explicitly stated by PayPal.
- **C — Possible Product Pattern**: A plausible application pattern that could be built using documented primitives, but is not an official PayPal capability.

## Repository Integrity

**No files in `paypal-ai-hackathon/` outside of `PAYPAL_RESOURCES/` have been modified.** No `.env` changes, no Git configuration changes, no commits, no pushes, no application code created.
