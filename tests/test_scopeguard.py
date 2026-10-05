import os
import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.db import Base, get_db
from app.main import app
from app.services.ai import analyze_scope
from app.models import ScopeStatus

# Use in-memory SQLite with StaticPool for test isolation
TEST_DB = "sqlite:///:memory:"
engine = create_engine(
    TEST_DB,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
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
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_ai_scope_analysis_included():
    brief = "Deliverables: 3-page website (Home, About, Contact). 2 minor revisions included."
    request = "Can you fix the typo in the contact page phone number?"
    result = analyze_scope(brief, request)
    assert result.classification == "INCLUDED"
    assert result.suggested_price_usd == 0.0
    assert len(result.evidence_quote) > 0

def test_ai_scope_analysis_extra():
    brief = "Deliverables: 3-page marketing website. Custom payment integrations are out of scope."
    request = "We want to add a multi-currency PayPal checkout and an analytics dashboard."
    result = analyze_scope(brief, request)
    assert result.classification == "EXTRA_PROPOSED"
    assert result.suggested_price_usd > 0
    assert len(result.extracted_items) > 0

def test_ai_scope_analysis_major_extension():
    brief = "Single-tenant internal driver tracking app. Strictly limited to single company domain without RBAC or multi-tenancy."
    request = "Our enterprise client demands Okta SAML 2.0 SSO integration and role-based access control (RBAC)."
    result = analyze_scope(brief, request)
    assert result.classification == "EXTRA_PROPOSED"
    assert result.suggested_price_usd > 0
    assert len(result.extracted_items) > 0

def test_full_project_and_scope_workflow():
    # 1. Create a Project
    project_payload = {
        "title": "Fintech Landing Page",
        "client_name": "Starlight Capital",
        "client_email": "ops@starlight.io",
        "original_brief": "Build a responsive landing page. Admin dashboard and crypto/payments are out of scope."
    }
    create_res = client.post("/api/projects", json=project_payload)
    assert create_res.status_code == 201
    proj_data = create_res.json()
    project_id = proj_data["id"]
    assert proj_data["title"] == "Fintech Landing Page"

    # 2. Analyze an out-of-scope request
    analyze_payload = {
        "client_request": "Please add a custom admin portal and a payment gateway."
    }
    analyze_res = client.post(f"/api/scope/projects/{project_id}/analyze", json=analyze_payload)
    assert analyze_res.status_code == 201
    scope_data = analyze_res.json()
    scope_id = scope_data["id"]
    assert scope_data["classification"] == "EXTRA_PROPOSED"
    assert scope_data["amount_cents"] > 0

    # 3. Merchant Approves and Sets Commercial Terms (generating PayPal Sandbox Order)
    approve_payload = {
        "amount_cents": 45000,
        "currency": "USD",
        "merchant_notes": "Estimated 8 hours of custom backend engineering."
    }
    approve_res = client.post(f"/api/scope/{scope_id}/approve", json=approve_payload)
    assert approve_res.status_code == 200
    approved_data = approve_res.json()
    assert approved_data["classification"] == "MERCHANT_APPROVED"
    assert approved_data["amount_cents"] == 45000
    assert approved_data["paypal_order_id"] is not None

    # 4. Capture PayPal Order
    capture_res = client.post(f"/api/paypal/capture/{scope_id}")
    assert capture_res.status_code == 200
    captured_data = capture_res.json()
    assert captured_data["classification"] == "PAID"
    assert captured_data["paypal_capture_id"] is not None

    # 5. Verify Project Scope History
    get_proj = client.get(f"/api/projects/{project_id}")
    assert get_proj.status_code == 200
    history = get_proj.json()
    assert len(history["scope_changes"]) == 1
    assert history["scope_changes"][0]["classification"] == "PAID"
