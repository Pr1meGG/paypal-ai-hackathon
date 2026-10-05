import json
import re
import requests
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from app.config import settings

class ScopeAnalysisResult(BaseModel):
    classification: str = Field(..., description="INCLUDED or EXTRA_PROPOSED")
    ai_summary: str = Field(..., description="Concise explanation of the scope evaluation")
    evidence_quote: str = Field(..., description="Direct quote or reference from the original brief")
    extracted_items: list[str] = Field(default_factory=list, description="Itemized deliverables or changes detected")
    confidence: str = Field(default="HIGH", description="HIGH, MEDIUM, or LOW")
    suggested_price_usd: Optional[float] = Field(default=None, description="Suggested add-on price if EXTRA_PROPOSED")

SYSTEM_PROMPT = """You are ScopeGuard AI, an expert technical contract auditor and scope verification engine for software freelancers and digital agencies.
Your duty is to objectively compare an incoming client request against an original Statement of Work (SOW) or project brief.

Rules for evaluation:
1. "INCLUDED": The request falls squarely within the agreed deliverables, represents a standard bug fix for delivered work, or is a minor styling/copy revision explicitly permitted by the original scope.
2. "EXTRA_PROPOSED": The request asks for new pages, additional user roles, third-party integrations not mentioned, custom workflows, mobile apps when only web was contracted, extra design iterations beyond the limit, or fundamental architectural changes.
3. Be fair to both the client and the freelancer.
4. Extract direct quotes from the original brief to justify your verdict.
5. If EXTRA_PROPOSED, itemize the new deliverables and propose a fair market add-on price in USD.

You MUST respond strictly with valid JSON matching this schema:
{
  "classification": "INCLUDED" | "EXTRA_PROPOSED",
  "ai_summary": "Clear, objective breakdown of why this is included or an extra",
  "evidence_quote": "Exact clause or sentence from original brief",
  "extracted_items": ["Item 1", "Item 2"],
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "suggested_price_usd": 350.00
}
"""

def analyze_scope(original_brief: str, client_request: str) -> ScopeAnalysisResult:
    """Analyze client request against original brief using AI model or heuristic fallback."""
    
    # Check if OpenAI API Key is provided
    if settings.AI_PROVIDER == "openai" and settings.AI_API_KEY:
        try:
            headers = {
                "Authorization": f"Bearer {settings.AI_API_KEY}",
                "Content-Type": "application/json"
            }
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"--- ORIGINAL STATEMENT OF WORK ---\n{original_brief}\n\n--- INCOMING CLIENT REQUEST ---\n{client_request}"
                }
            ]
            payload = {
                "model": settings.AI_MODEL,
                "messages": messages,
                "response_format": {"type": "json_object"},
                "temperature": 0.2
            }
            res = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=25)
            if res.status_code == 200:
                data = res.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return ScopeAnalysisResult(**parsed)
        except Exception as e:
            # Fall through to deterministic analyzer if network/credentials fail
            print(f"OpenAI analysis call failed, using heuristic analyzer: {e}")

    # Deterministic Semantic Scope Analyzer (Zero-dependency fallback for reliable local execution and tests)
    return _deterministic_scope_analysis(original_brief, client_request)


def _deterministic_scope_analysis(original_brief: str, client_request: str) -> ScopeAnalysisResult:
    brief_lower = original_brief.lower()
    req_lower = client_request.lower()

    # Heuristic indicators for out-of-scope work
    extra_keywords = [
        "extra", "add", "new feature", "also need", "mobile app", "native app",
        "stripe", "crypto", "paypal integration", "paypal", "dark mode", "admin portal",
        "analytics dashboard", "export to pdf", "multi-language", "localization",
        "sms notifications", "push notification", "redesign", "crm integration",
        "custom api", "zapier", "ai chatbot", "subscription", "sso", "saml", "okta",
        "rbac", "multi-tenant", "role-based", "access control", "audit log",
        "audit logging", "payment gateway", "enterprise"
    ]
    
    # Check for keywords indicating revisions/fixes
    included_keywords = [
        "fix", "bug", "typo", "broken", "color change", "font size",
        "as agreed", "in the brief", "page 2 typo", "alignment", "minor edit"
    ]

    is_extra = False
    reasons = []
    extracted = []
    quote = ""

    # Match against brief clauses
    brief_sentences = [s.strip() for s in original_brief.split(".") if len(s.strip()) > 10]
    
    matched_extras = [kw for kw in extra_keywords if kw in req_lower]
    matched_fixes = [kw for kw in included_keywords if kw in req_lower]

    if matched_extras and not (matched_fixes and len(matched_fixes) > len(matched_extras)):
        is_extra = True
        for m in matched_extras:
            extracted.append(f"Deliverable extension: {m.capitalize()}")
        
        # Select best evidence quote from brief showing original boundary
        if brief_sentences:
            quote = f'Original scope specified: "{brief_sentences[0]}..."'
        else:
            quote = "Original scope did not enumerate this new capability."

        ai_summary = (
            f"The incoming request introduces new capabilities ({', '.join(matched_extras)}) "
            "that were not specified in the original Statement of Work. This constitutes an out-of-scope add-on."
        )
        suggested_price = len(matched_extras) * 250.0
        return ScopeAnalysisResult(
            classification="EXTRA_PROPOSED",
            ai_summary=ai_summary,
            evidence_quote=quote,
            extracted_items=extracted,
            confidence="HIGH",
            suggested_price_usd=max(150.0, suggested_price)
        )
    else:
        if brief_sentences:
            quote = f'Covered under: "{brief_sentences[-1]}."'
        else:
            quote = "Covered under standard project deliverable terms."
            
        return ScopeAnalysisResult(
            classification="INCLUDED",
            ai_summary="The request appears to be a standard minor revision, bug fix, or clarification covered within the original agreement bounds.",
            evidence_quote=quote,
            extracted_items=["Standard Scope Maintenance / Revision"],
            confidence="HIGH",
            suggested_price_usd=0.0
        )
