import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.config import settings

# Setup in-memory SQLite test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_ai_scope_analysis_minor_fix(client):
    # Create project
    proj_res = client.post("/api/projects", json={
        "title": "Mobile App QA",
        "client_name": "Acme Corp",
        "client_email": "acme@example.com",
        "original_brief": "Includes 14 days of bug fixes and minor UI tweaks."
    })
    assert proj_res.status_code == 201
    proj_id = proj_res.json()["id"]

    # Submit minor request
    scope_res = client.post(f"/api/scope/projects/{proj_id}/analyze", json={
        "client_request": "Please change the button border radius to 8px and color to #0ea5e9."
    })
    assert scope_res.status_code == 201
    scope_data = scope_res.json()
    assert scope_data["classification"] == "INCLUDED"
    assert scope_data["confidence"] in ["HIGH", "MEDIUM", "LOW"]

def test_ai_scope_analysis_billable_addon(client):
    proj_res = client.post("/api/projects", json={
        "title": "FinVibe Portal",
        "client_name": "FinVibe Inc",
        "original_brief": "Core dashboard with standard CSV exports. AI features and QuickBooks integrations are excluded."
    })
    proj_id = proj_res.json()["id"]

    scope_res = client.post(f"/api/scope/projects/{proj_id}/analyze", json={
        "client_request": "Can we get an automated QuickBooks daily sync and an AI summary generator added?"
    })
    assert scope_res.status_code == 201
    scope_data = scope_res.json()
    assert scope_data["classification"] == "EXTRA_PROPOSED"
    assert scope_data["amount_cents"] > 0

def test_ai_scope_analysis_major_extension(client):
    proj_res = client.post("/api/projects", json={
        "title": "Enterprise Portal",
        "client_name": "HealthCloud",
        "original_brief": "Patient booking portal with basic email notifications. SSO and RBAC excluded."
    })
    proj_id = proj_res.json()["id"]

    scope_res = client.post(f"/api/scope/projects/{proj_id}/analyze", json={
        "client_request": "We urgently need Okta SAML 2.0 Single Sign-On and Role-Based Access Control before security audit."
    })
    assert scope_res.status_code == 201
    scope_data = scope_res.json()
    assert scope_data["classification"] == "EXTRA_PROPOSED"
    assert scope_data["amount_cents"] >= 50000

def test_full_merchant_paypal_flow(client):
    # 1. Create Project
    proj_res = client.post("/api/projects", json={
        "title": "E-Commerce Rebrand",
        "client_name": "StyleCo",
        "original_brief": "Includes Shopify theme setup and 5 catalog pages."
    })
    proj_id = proj_res.json()["id"]

    # 2. Client asks for out-of-scope custom multi-currency subscription engine
    scope_res = client.post(f"/api/scope/projects/{proj_id}/analyze", json={
        "client_request": "We also want a custom recurring subscription billing engine with multi-currency conversion."
    })
    scope_id = scope_res.json()["id"]

    # 3. Merchant Approves and initializes PayPal Order
    approve_res = client.post(f"/api/scope/{scope_id}/approve", json={
        "amount_cents": 65000,
        "currency": "USD",
        "merchant_notes": "Estimated 6 hours development for multi-currency recurring billing add-on."
    })
    assert approve_res.status_code == 200
    approve_data = approve_res.json()
    assert approve_data["classification"] == "MERCHANT_APPROVED"
    assert approve_data["paypal_order_id"] is not None
    assert approve_data["paypal_approve_url"] is not None

    # 4. Capture Payment
    capture_res = client.post(f"/api/paypal/capture/{scope_id}")
    assert capture_res.status_code == 200
    capture_data = capture_res.json()
    assert capture_data["classification"] == "PAID"
    assert capture_data["paypal_capture_id"] is not None

def test_direct_workbench_and_ledger_flow(client):
    # 1. Direct Analysis
    analyze_res = client.post("/api/scope/analyze", json={
        "client_name": "Nova Dynamics",
        "client_email": "ops@novadynamics.com",
        "contract_sow": "Standard web MVP. Custom webhook pipelines and automated AI indexing are excluded.",
        "client_message": "Please build a real-time webhook ingestion pipeline and an automated AI indexing vector store.",
        "request_channel": "jira"
    })
    assert analyze_res.status_code == 200
    data = analyze_res.json()
    assert data["status"] == "EXTRA_PROPOSED"
    assert len(data["itemized_scope"]) > 0
    scope_id = data["id"]

    # 2. Direct PayPal Order Creation
    order_res = client.post("/api/paypal/orders/create", json={
        "client_name": "Nova Dynamics",
        "client_email": "ops@novadynamics.com",
        "item_name": "Webhook Pipeline Add-on",
        "amount": 750.0,
        "currency": "USD",
        "scope_analysis_id": scope_id
    })
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert order_data["id"] != ""
    assert "paypal.com" in order_data["checkout_url"]
    order_id = order_data["id"]

    # 3. Direct PayPal Order Capture
    capture_res = client.post(f"/api/paypal/orders/{order_id}/capture")
    assert capture_res.status_code == 200
    capture_data = capture_res.json()
    assert capture_data["status"] == "COMPLETED"
    assert capture_data["amount"] == 750.0

    # 4. Verify Ledger & History
    history_res = client.get("/api/scope/history")
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) >= 1
    assert any(h["client_name"] == "Nova Dynamics" for h in history)

    # 5. Verify Aggregate KPIs
    kpi_res = client.get("/api/kpis")
    assert kpi_res.status_code == 200
    kpis = kpi_res.json()
    assert kpis["total_creep_prevented"] >= 4850.0
    assert kpis["total_settled_revenue"] >= 2850.0
