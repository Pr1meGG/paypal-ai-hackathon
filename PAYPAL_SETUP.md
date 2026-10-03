# PayPal Developer — how to use it for this hackathon

This guide covers what PayPal actually offers, what to use for **"Best Use of
PayPal + AI"** and **"Best Use of Agentic Commerce"**, and exactly how to wire
it into the project.

---

## 1. What PayPal offers (the useful bits)

### A. Sandbox (free) — what you'll actually use
- **REST API** — `Orders`, `Payments`, `Refunds`, `Subscriptions`, `Invoices`,
  `Payouts`, `Disputes`, `Catalog`, `Webhooks`.
- Auth: **OAuth 2.0 client-credentials** (`client_id` / `client_secret`).
- All calls hit `https://api.sandbox.paypal.com` — no real money moves.
- Test cards and buyer/seller sandbox accounts are auto-provisioned.

### B. Agent Tools (the AI angle — **this is the differentiator**)
PayPal publishes a **function-calling tool reference** so an LLM agent can call
PayPal directly instead of you hand-writing every API call. Tools:

| Category | Tools |
|---|---|
| Payments | `create_order`, `pay_order` (capture), `create_refund`, `get_order`, `get_refund` |
| Catalog | `create_product`, `list_product`, `show_product_details` |
| Invoices | `create_invoice`, `list_invoices`, `get_invoice`, `send_invoice`, `send_invoice_reminder`, `cancel_sent_invoice`, `generate_invoice_qr_code` |
| Disputes | `list_disputes`, `get_dispute`, `accept_dispute_claim` |
| Subscriptions | `create_subscription`, `create_subscription_plan`, `list_subscription_plans`, `show_subscription_details`, `show_subscription_plan_details`, `update_subscription`, `cancel_subscription` |
| Reporting | `get_merchant_insights`, `list_transaction` |
| Shipping | `create_shipment_tracking`, `get_shipment_tracking`, `update_shipment_tracking` |
| Shopping | `search_product`, `create_cart` |

**How to use them:** PayPal also runs a **remote MCP server** at
`https://mcp.paypal.com/sse`. Connect any MCP-compatible host with:

```json
{
  "mcpServers": {
    "paypal-commerce-ai": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.paypal.com/sse"]
    }
  }
}
```

That exposes all the tools above to your agent automatically — no hand-rolled API
wrappers needed. This is the single strongest "PayPal + AI" story you can tell.

### C. Agentic Commerce Protocol (ACP) — **Best Use of Agentic Commerce**
PayPal supports two agentic protocols:

- **ACP (Agentic Commerce Protocol)** — for ChatGPT Apps; uses *delegated payment
  tokens* through **Braintree**. Your MCP server exposes a `create_checkout`
  tool; the AI assistant orchestrates the checkout session.
- **UCP (Universal Commerce Protocol)** — for Google AI Mode / Gemini; uses the
  **Google Pay** payment handler through Braintree.

ACP requires a **Braintree merchant account** (separate from PayPal sandbox).
For a hackathon submission, the practical path is: **use the Agent Tools MCP
server + Orders API in sandbox** and *describe* the ACP vision in your README.
Judges score a working prototype; ACP needs live Braintree processing.

---

## 2. Setup steps

1. Sign in → [developer.paypal.com](https://developer.paypal.com)
2. **Dashboard → Sandbox → Apps → Create App**
   - App Name: `hackathon`
   - Type: **Merchant**
   - Sandbox Account: your sandbox business account
   - Click **Create App**
3. Copy **Client ID** + **Client Secret** → paste into `.env`
4. Done. All API calls use these creds against the sandbox.

---

## 3. How the project uses it

`app/services/paypal.py` wraps the REST API with:
- OAuth token caching (one grant per session)
- **Idempotency keys** (`PayPal-Request-Id`) so retries never double-charge
- `create_order`, `capture_order`, `refund_capture`, `get_order`, `healthcheck`

The agent loop in `app/services/agent.py` drives it:

| Risk | PayPal action | Why |
|---|---|---|
| **green** | none — COD proceeds | lowest friction, cheapest |
| **yellow** | `create_order` AUTHORIZATION for 10% prepaid hold | customer pays now → order ships → RTO roughly halved |
| **red** | `create_order` → `capture` → `refund` | no goods shipped, no double shipping |

Every action lands in the `payments` table (audit trail) and the dashboard.

---

## 4. What to demo (3-minute video)

1. **Healthcheck** — `GET /health` + PayPal token fetch proves creds work
2. **Green order** — COD proceeds, no PayPal call
3. **Yellow order** — agent creates a PayPal authorization hold
4. **Red order** — agent authorizes, captures, refunds (net-zero money moved)
5. **AI review** — (optional) OpenAI confirms/overrules the risk engine

---

## 5. Links
- Agent Tools reference: `developer.paypal.com/ai-tools/agent-tools`
- Agentic commerce services: `developer.paypal.com/agentic-commerce-services`
- ACP protocol: `developer.paypal.com/agent-ready/agentic-commerce-protocol`
- MCP server: `https://mcp.paypal.com/sse`
- REST API docs: `developer.paypal.com/docs/checkout`
