# Local PayPal sandbox setup

Status checked: 2026-10-03. The user has joined the hackathon and created a PayPal sandbox app. Local credential fields are now filled, but an OAuth check against the explicitly fixed official sandbox endpoint returned **HTTP 401**. The configured `PAYPAL_BASE_URL` is `https://sandbox.paypal.com`, which is the browser-facing sandbox website, not the REST API server. Its public page was checked without credentials; no app secrets were sent to that address. Correct the URL and re-copy both credentials from the same Sandbox app before retesting. `.env` remains owner-only (`0600`), ignored, and untracked. No credentials were printed or payments made.

## 1. Put credentials in the existing local file

Open Terminal and run:

```sh
cd "/Users/nitz/Code'n'Stuff/paypal-ai-hackathon"
open -e .env
```

This opens the existing hidden file in TextEdit. Replace the values of these existing settings (do not add duplicate lines):

```dotenv
PAYPAL_CLIENT_ID=PASTE_YOUR_SANDBOX_CLIENT_ID_HERE
PAYPAL_CLIENT_SECRET=PASTE_YOUR_SANDBOX_SECRET_HERE
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

Use **Sandbox** app credentials from the PayPal Developer Dashboard. Paste each value on one line without spaces around `=`. Save with **Command-S**. Keep the file as plain text named exactly `.env`, not `.env.txt`. Do not replace unrelated existing settings.

Do not paste credentials into chat, screenshots, a README, `.env.example`, or GitHub. The Client Secret must stay on the backend; never put it in a frontend `NEXT_PUBLIC_*` variable. `.env.example` is tracked and should contain placeholders only.

## 2. Confirm local protection without showing values

From the same directory:

```sh
chmod 600 .env
git check-ignore .env
git status --short
```

`git check-ignore .env` should print `.env`. The secret file should not appear as a new tracked file in `git status`. Never use `git add -f .env`. Ignoring a file does not remove it from history if it was previously committed; the current local index does not track this `.env`.

If you accidentally publish a secret, rotate it in PayPal; deleting the visible copy alone is insufficient.

## 3. Understand the three accounts/URLs

| Location | Purpose | Credentials |
| --- | --- | --- |
| `developer.paypal.com` | Manage sandbox accounts and apps | Your real PayPal developer login |
| `www.sandbox.paypal.com` | Approve/view fictional transactions | Sandbox personal buyer or business seller login |
| `api-m.sandbox.paypal.com` | Backend REST API calls | Sandbox app Client ID + Secret exchanged for an OAuth access token |

Buyer/seller passwords are not the Client ID/Secret. Do not put account passwords in the app's `.env` for the standard checkout flow.

Ensure you can identify:
- The sandbox **business** account associated with the app.
- A separate sandbox **personal** account to approve test checkout.
- The countries and supported currency appropriate to the eventual demonstration.

India-to-India domestic PayPal receipt is not supported. A USD display label does not bypass that restriction. A cross-border sandbox demonstration does not prove production eligibility.

## 4. What will happen after the credentials are saved

Tell the coding assistant only: **“Sandbox credentials saved locally.”** Do not send the values.

A setup check requests a sandbox OAuth access token and reports only success/failure—not the token or secret. This does not create an order or transfer money. The latest check failed with HTTP 401; authentication is **not yet working**. Python's local certificate trust store also failed verification, so the check used system `curl` with TLS verification enabled instead. No TLS protections or global settings were disabled.

After the product scenario is chosen, build the smallest complete test flow:

1. Backend creates a PayPal order.
2. Buyer approves checkout using a sandbox personal account.
3. Backend captures the approved payment (or authorizes then captures, if the chosen product requires that flow).
4. Backend verifies the result and records the PayPal order/capture identifiers.
5. Add refund/void only when the chosen use case needs it.

Creating an order is not the same as successfully collecting payment.

**There is not yet a runnable application in this repository.** Saving `.env` does not automatically connect PayPal or load variables into Python/Node. The eventual server must explicitly load configuration; no framework, SDK, new provider, or app architecture is being selected here.

### Why the browser screenshot shows 403

Opening `https://api-m.sandbox.paypal.com/` in a browser sends a GET request to the API root, not the required authenticated `POST /v1/oauth2/token` request. The supplied screenshot shows that root request receiving a CDN/server 403; it does not establish whether the app credentials work. The earlier separate OAuth request returned 401. These are different requests and errors.

Use `https://sandbox.paypal.com` for buyer/seller browser sessions and `https://api-m.sandbox.paypal.com` for server-side API calls. Do not replace the API host with the login site to work around a browser-root 403. See [official authentication instructions](https://developer.paypal.com/api/rest/authentication/).

The saved URL and credential values were not changed during this diagnosis. Correct the API URL and obtain a matched Client ID/Secret from the same Sandbox app before the next OAuth check.

## 5. What can wait

Do not set these up merely for the sake of having them:

- Live PayPal processing or real-money payments.
- Braintree/ACP, MCP, or additional sponsor integrations.
- Cloud hosting, public webhook endpoints, and background workers.
- Vector databases or multi-agent orchestration.
- A separate AI provider/account before the runtime needs are decided.

Using Astra/OmniRush to write code is distinct from adding an AI feature to the submitted app. Runtime model access, credentials, terms, and costs must be confirmed separately; the existing OmniRush login should not be assumed to authorize arbitrary direct OpenAI API calls.

## 6. Discord access from OmniRush

Current state: no Discord connector is exposed to this assistant; `~/.omnirush/mcp.json` does not currently exist. Membership in the PayPal Developer server does not by itself authorize installing a bot or exporting all conversations.

### Fastest option for this third-party server

Manually share relevant announcements, pinned messages, screenshots, or an administrator-approved export. Redact private details and share only content you are permitted to share. Discord's personal data package contains your sent messages, not the entire server's conversation history.

### Ongoing read-only bot option (requires administrator approval)

1. Ask the server administrators whether they permit a scoped read-only bot or offer an approved integration/export.
2. A person with **Manage Server / MANAGE_GUILD** must authorize a server installation. Installing an app to your own user account does not grant arbitrary channel-history access.
3. Grant only **View Channel** and **Read Message History** for the approved channels. General message text may require the **Message Content** privileged intent and any applicable Discord approval. Private channels/threads remain governed by their permissions.
4. Select or build and review a local stdio MCP adapter exposing only the required read tools, with server/channel allowlists. No particular adapter has yet been chosen, installed, or audited.
5. Keep the bot token outside the repo and command-line arguments, ideally retrieved by a reviewed launcher from the OS credential store. Do not use your personal Discord session token or cookies.
6. Add the approved adapter to `~/.omnirush/mcp.json`, preserving any existing servers, then restart OmniRush and use `/mcp` to inspect status.

The installed bridge accepts this **configuration shape only** (not a working installation):

```json
{
  "mcpServers": {
    "discord-readonly": {
      "command": "node",
      "args": ["/absolute/path/to/reviewed-discord-reader.mjs"]
    }
  }
}
```

The placeholder adapter does not exist. No global configuration was created. The bridge supports stdio `command`/`args`/literal `env` or a Streamable HTTP `url`. The inspected HTTP configuration does not implement arbitrary auth headers/OAuth settings. It exposes all tools advertised by the adapter, so a `readonly` name alone does not enforce anything. Restrict the adapter and Discord permissions themselves. Do not globally export secrets into unrelated tool processes.

`/mcp reconnect` reconnects existing loaded entries; it does not reread a newly edited config in this installed version. Restart for newly added servers.

Sources:
- [Discord installation contexts](https://docs.discord.com/developers/quick-start/getting-started)
- [Channel permissions](https://docs.discord.com/developers/topics/permissions)
- [Message Content intent](https://docs.discord.com/developers/events/gateway#message-content-intent)
- [Discord self-bot prohibition](https://support.discord.com/hc/en-us/articles/115002192352-Automated-User-Accounts-Self-Bots)
- [Personal data package scope](https://support.discord.com/hc/en-us/articles/360004957991-Your-Discord-Data-Package)
- Installed OmniRush `assets/extensions/omnirush/mcp-lib.ts` and `mcp.ts` (configuration and tool registration).

## Official references

- Hackathon: https://paypalaihackathon.devpost.com/
- Official rules: https://paypalaihackathon.devpost.com/rules
- Developer dashboard: https://developer.paypal.com/dashboard/
- Sandbox: https://developer.paypal.com/tools/sandbox/
- Sandbox accounts: https://developer.paypal.com/tools/sandbox/accounts/
- India domestic-payments limitation: https://www.paypal.com/in/cshelp/article/can-i-use-paypal-to-receive-payments-from-indian-customers-help1049
