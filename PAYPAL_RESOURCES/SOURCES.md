# Verified PayPal Source URLs & Resources

This file lists every official PayPal resource discovered during the reconnaissance phase, with their exact URLs, environments, and status.

## 1. PayPal AI Agent Tools (Function Calling Reference)

| Field | Detail |
|---|---|
| **Resource Name** | PayPal AI Tools / Agent Tools Reference |
| **Official Source URL** | `https://developer.paypal.com/ai-tools/agent-tools` |
| **Environment** | Sandbox & Production |
| **API/SDK/Protocol** | PayPal REST API (wrapped) |
| **Authentication** | Bearer token derived from PayPal OAuth 2.0 client credentials |
| **Important Tools** | `create_order`, `pay_order`, `create_refund`, `get_order`, `get_refund` |
| **Status** | Verified by reconnaissance; tool list matches the hackathon documentation. |
| **Relevance** | **Fully relevant** to AI agents. Provides native function calls usable by LLMs. |

## 2. PayPal Remote MCP Server

| Field | Detail |
|---|---|
| **Resource Name** | PayPal Commerce MCP Server |
| **Official Source URL** | `https://mcp.paypal.com/sse` |
| **Documentation URL** | `https://developer.paypal.com/ai-tools/mcp-server` |
| **Environment** | Sandbox & Production |
| **Protocol** | Model Context Protocol (MCP) over HTTP Server-Sent Events (SSE) |
| **Authentication** | OAuth 2.0 Bearer Token (confirmed via live probe: `401 {"error":"invalid_token"}`) |
| **Status** | Directly probed on 2026-10-03. Returned valid OAuth error, confirming endpoint is live and reachable. |
| **Relevance** | **Critical for AI agents**. Zero-boilerplate MCP connection. |

### MCP Server Metadata (Probed Live)

- **Resource URL** (protected): `https://mcp.paypal.com/sse`
- **Authorization Server**: `https://mcp.paypal.com`
- **OAuth Protected Resource Metadata**: `https://mcp.paypal.com/.well-known/oauth-protected-resource/sse`
- **Bearer Method**: Header-based (`Bearer realm="OAuth"`)
- **Live Probe Result**:
  - `curl -i https://mcp.paypal.com/sse` returned HTTP 401.
  - `www-authenticate` header confirms: `Bearer realm="OAuth", resource_metadata="...oauth-protected-resource/sse"`
  - Body: `"error":"invalid_token","error_description":"Missing or invalid access token"`
- **Conclusion**: The endpoint is functional and secured via standard OAuth 2.0 Bearer tokens. No production Braintree account required to establish the connection.

## 3. PayPal REST API Endpoints (Standard HTTPS)

| Field | Detail |
|---|---|
| **Resource Name** | PayPal Orders v2 API |
| **Official Source URL** | `https://developer.paypal.com/docs/api/orders/v2` |
| **Base URL (Sandbox)** | `https://api-m.sandbox.paypal.com` |
| **Environment** | Sandbox & Production |
| **Authentication** | Bearer Token via POST `/v1/oauth2/token` |
| **Key Endpoints** | `POST /v2/checkout/orders`, `GET /v2/checkout/orders/{id}`, `POST /v2/checkout/orders/{id}/capture`, `POST /v2/checkout/orders/{id}/authorize` |
| **Status** | Verified via reference. Matches the implementation in the hackathon's `app/services/paypal.py`. |
| **Relevance** | **Core payment primitive** for any payment integration. |

### Related Core APIs

| Resource Name | Official Source URL |
|---|---|
| PayPal Payments v2 API | `https://developer.paypal.com/docs/api/payments/v2` |
| PayPal Refunds API | `https://developer.paypal.com/docs/api/payments/v2/refunds` |
| PayPal Webhook Verification | `https://developer.paypal.com/docs/api/webhooks/v1` |
| PayPal Subscriptions | `https://developer.paypal.com/docs/api/subscriptions/` |
| PayPal Disputes | `https://developer.paypal.com/docs/api/customer-disputes/` |

## 4. PayPal Sandbox Environment

| Field | Detail |
|---|---|
| **Resource Name** | PayPal Developer Dashboard & Sandbox |
| **Official Source URL** | `https://developer.paypal.com/dashboard/` |
| **Sandbox Site** | `https://www.sandbox.paypal.com` |
| **Sandbox API Base** | `https://api-m.sandbox.paypal.com` |
| **Environment** | Test-only |
| **Authentication** | Sandbox App credentials (Client ID / Secret pair) |
| **Testing** | Buyer/Seller test accounts, test cards, mock responses, and negative testing tools. |
| **Status** | Verified via reference documentation and the local `getting-started-with-paypal-sandbox` repository. |
| **Relevance** | **Required** for all hackathon development and verification. |

## 5. PayPal SDKs

| Language | Package Name | Documentation URL |
|---|---|---|
| Node.js | `@paypal/checkout-server-sdk` | `https://github.com/paypal/Checkout-NodeJS-SDK` |
| Python | `paypalcheckoutsdk` | `https://github.com/paypal/Checkout-Python-SDK` |
| Ruby | `paypal-checkout-sdk` | `https://github.com/paypal/Checkout-Ruby-SDK` |

| Field | Detail |
|---|---|
| **Environment** | Sandbox & Production |
| **Authentication** | SDK wraps OAuth 2.0 internally |
| **Status** | Older SDKs are deprecated in favor of direct REST calls or the MCP server. |

## 6. PayPal Agentic Commerce Protocol (ACP)

| Field | Detail |
|---|---|
| **Resource Name** | Agentic Commerce Protocol |
| **Official Source URL** | `https://developer.paypal.com/agentic-commerce-services` |
| **Documentation URL** | `https://developer.paypal.com/agent-ready/agentic-commerce-protocol` |
| **Environment** | Production-only |
| **Protocol** | ACP/UCP |
| **Authentication** | Delegated payment tokens via Braintree |
| **Requirements** | A **Braintree merchant account** with live processing enabled. |
| **Status** | Verified by reference. Confirmed in official PayPal documentation. |
| **Relevance** | Relevant for advanced AI agent checkout, but **not available in a standard hackathon sandbox**. |

## 7. PayPal Devpost Hackathon Requirements

| Field | Detail |
|---|---|
| **Resource Name** | PayPal AI Hackathon – Devpost Page |
| **Official Source URL** | `https://paypal-ai-hackathon.devpost.com/` |
| **Environment** | N/A (Documentation) |
| **Authentication** | Sign-in to Devpost to submit |
| **Requirements** | Must use PayPal APIs OR PayPal MCP server, and must use an AI component (LLM/agent decision logic). |
| **Status** | Verified by reference. |
| **Relevance** | **Defines the constraints** for the overall challenge. |
