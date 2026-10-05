from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class ProjectCreate(BaseModel):
    title: str = Field(..., description="Project title")
    client_name: str = Field(..., description="Client Name or Organization")
    client_email: Optional[str] = Field(None, description="Client Email")
    original_brief: str = Field(..., description="Contract Statement of Work")

class ScopeChangeCreate(BaseModel):
    client_request: str = Field(..., description="Incoming client request text")

class MerchantApproveRequest(BaseModel):
    amount_cents: int = Field(..., gt=0, description="Price in cents (e.g. 35000 = $350.00)")
    currency: str = Field(default="USD", description="Currency code")
    merchant_notes: Optional[str] = Field(None, description="Merchant scope justification")

class ScopeChangeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    client_request: str
    classification: str
    ai_summary: Optional[str] = None
    extracted_items_json: Optional[str] = None
    evidence_quote: Optional[str] = None
    confidence: str
    amount_cents: int
    currency: str
    merchant_notes: Optional[str] = None
    paypal_order_id: Optional[str] = None
    paypal_approve_url: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    client_name: str
    client_email: Optional[str] = None
    original_brief: str
    created_at: datetime
    scope_changes: List[ScopeChangeResponse] = []

class OrderCaptureRequest(BaseModel):
    order_id: str
