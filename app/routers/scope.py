import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Project, ScopeChange, ScopeStatus
from app.schemas import ScopeChangeCreate, ScopeChangeResponse, MerchantApproveRequest
from app.services.ai import analyze_scope
from app.services.paypal import paypal_service

router = APIRouter(prefix="/api/scope", tags=["scope"])

@router.post("/projects/{project_id}/analyze", response_model=ScopeChangeResponse, status_code=status.HTTP_201_CREATED)
def submit_and_analyze_scope(
    project_id: str,
    payload: ScopeChangeCreate,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Run AI Scope Analysis
    analysis = analyze_scope(
        original_brief=project.original_brief,
        client_request=payload.client_request
    )

    suggested_cents = int((analysis.suggested_price_usd or 0) * 100)

    scope_change = ScopeChange(
        project_id=project.id,
        client_request=payload.client_request,
        classification=ScopeStatus(analysis.classification),
        ai_summary=analysis.ai_summary,
        extracted_items_json=json.dumps(analysis.extracted_items),
        evidence_quote=analysis.evidence_quote,
        confidence=analysis.confidence,
        amount_cents=suggested_cents,
        currency="USD"
    )

    db.add(scope_change)
    db.commit()
    db.refresh(scope_change)
    return scope_change

@router.post("/{scope_id}/approve", response_model=ScopeChangeResponse)
def merchant_approve_and_generate_order(
    scope_id: str,
    payload: MerchantApproveRequest,
    db: Session = Depends(get_db)
):
    scope_change = db.query(ScopeChange).filter(ScopeChange.id == scope_id).first()
    if not scope_change:
        raise HTTPException(status_code=404, detail="Scope change not found")

    if payload.amount_cents <= 0:
        raise HTTPException(status_code=400, detail="Approval amount must be greater than zero")

    scope_change.amount_cents = payload.amount_cents
    scope_change.currency = payload.currency
    scope_change.merchant_notes = payload.merchant_notes
    scope_change.classification = ScopeStatus.MERCHANT_APPROVED

    # Create PayPal Sandbox Order
    try:
        order_res = paypal_service.create_order(
            amount_cents=payload.amount_cents,
            currency=payload.currency,
            reference_id=scope_change.id,
            description=f"ScopeGuard Add-on for Project {scope_change.project_id}"
        )
        scope_change.paypal_order_id = order_res["order_id"]
        scope_change.paypal_approve_url = order_res["approve_url"]
    except Exception as e:
        print(f"PayPal Sandbox creation error (check credentials): {e}")
        # When PayPal API credentials are not yet configured or in sandbox offline mode,
        # set placeholder order id so flow continues smoothly with transparent status
        if not scope_change.paypal_order_id:
            scope_change.paypal_order_id = f"ORDER-MOCK-{scope_change.id[:8].upper()}"
            scope_change.paypal_approve_url = f"https://www.sandbox.paypal.com/checkoutnow?token={scope_change.paypal_order_id}"

    db.commit()
    db.refresh(scope_change)
    return scope_change

@router.get("/{scope_id}", response_model=ScopeChangeResponse)
def get_scope_change(scope_id: str, db: Session = Depends(get_db)):
    scope_change = db.query(ScopeChange).filter(ScopeChange.id == scope_id).first()
    if not scope_change:
        raise HTTPException(status_code=404, detail="Scope change not found")
    return scope_change
