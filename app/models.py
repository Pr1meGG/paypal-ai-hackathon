import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    DateTime,
    ForeignKey,
    Enum,
    create_engine
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def _utc_now():
    return datetime.now(timezone.utc)

class ScopeStatus(str, PyEnum):
    ANALYZING = "ANALYZING"
    INCLUDED = "INCLUDED"
    EXTRA_PROPOSED = "EXTRA_PROPOSED"
    MERCHANT_APPROVED = "MERCHANT_APPROVED"
    PAID = "PAID"
    REJECTED = "REJECTED"

class PaymentStatus(str, PyEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    client_name = Column(String(255), nullable=False)
    client_email = Column(String(255), nullable=True)
    original_brief = Column(Text, nullable=False)
    created_at = Column(DateTime, default=_utc_now)

    scope_changes = relationship("ScopeChange", back_populates="project", cascade="all, delete-orphan")

class ScopeChange(Base):
    __tablename__ = "scope_changes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    
    # Input
    client_request = Column(Text, nullable=False)
    
    # AI Analysis Output
    classification = Column(Enum(ScopeStatus), default=ScopeStatus.ANALYZING)
    ai_summary = Column(Text, nullable=True)
    extracted_items_json = Column(Text, nullable=True)
    evidence_quote = Column(Text, nullable=True)
    confidence = Column(String(32), default="HIGH")
    
    # Commercial Terms
    amount_cents = Column(Integer, default=0)
    currency = Column(String(3), default="USD")
    merchant_notes = Column(Text, nullable=True)
    
    # PayPal details
    paypal_order_id = Column(String(64), nullable=True, unique=True)
    paypal_approve_url = Column(String(512), nullable=True)
    paypal_capture_id = Column(String(64), nullable=True)
    
    created_at = Column(DateTime, default=_utc_now)
    updated_at = Column(DateTime, default=_utc_now, onupdate=_utc_now)

    project = relationship("Project", back_populates="scope_changes")
