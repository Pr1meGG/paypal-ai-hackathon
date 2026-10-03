# PayPal AI Hackathon — Agentic Commerce

> **Project:** Payment-aware AI agents that reduce COD **RTO** and lift lead
> conversion for Indian D2C brands — now with **PayPal** as the money rail.

Built for the **PayPal AI Hackathon** on Devpost
(`Best Use of PayPal + AI`, `Best Use of Agentic Commerce`).

---

## The problem

Cash-on-delivery (COD) is the default for Indian D2C, and it bleeds brands:
**25–40% of COD orders are returned to origin (RTO)**, costing double shipping.
The fix isn't logistics — it's *deciding who to trust, and when to ask for
prepaid money*, before the order ships.

## What we built

An AI agent suite where **agents don't just recommend — they act on money**:

1. **RTO Risk Agent** — scores every order green/yellow/red using phone
   validity, pincode match, repeat-RTO customers, and order-value vs area
   average.
2. **Payment Agent (PayPal)** — on a **yellow/red** decision the agent
   *initiates a PayPal payment*: a prepaid discount hold (yellow) or a
   refundable authorization (red). On green it lets COD proceed.
3. **Behavior-Aware Follow-Up Agent** — sentiment-aware drip with a reply
   kill-switch; hard negatives cancel all pending follow-ups.
4. **Alerting** — RTO red, hot lead, severe fatigue, revival events fire to
   Slack + dashboard.

**The only fundamental requirement:** the project meaningfully uses both
**PayPal** (real Orders/Checkout API calls) and **AI** (agent decisioning).

## Architecture

```
app/
  main.py        # FastAPI app, mounts all routers
  config.py      # env config (PayPal sandbox creds)
  db.py          # SQLite + SQLAlchemy
  auth.py        # API-key + brand_id tenancy
  models.py      # money = integer paise, never floats
  routers/       # rto, leads, ads, crm, paypal
  services/      # risk, scorer, sentiment, sequences, paypal
  agent.py       # the agentic loop (decide → act → verify)
tests/
  core business-logic tests
dashboard/      # vanilla JS client UI
```

## Run it

```bash
cp .env.example .env
# fill in PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET (sandbox)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
cd dashboard && python server/serve.py   # :5500
```

## PayPal sandbox setup

1. Sign in at [developer.paypal.com](https://developer.paypal.com)
2. **Dashboard → Sandbox → Apps** → Create App (Sandbox)
3. Copy **Client ID** + **Secret** into `.env`
4. All calls below hit the sandbox — no real money moves.

## Demo

See `DEMO.md` for the exact flow a judge should run, or watch the demo video
(link on the submission form).

## License

See [LICENSE](LICENSE) — MIT.
