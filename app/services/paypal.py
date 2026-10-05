import uuid
import requests
from typing import Optional, Dict, Any
from app.config import settings

class PayPalService:
    def __init__(self):
        self.base_url = settings.PAYPAL_BASE_URL.rstrip("/")
        self.client_id = settings.PAYPAL_CLIENT_ID
        self.client_secret = settings.PAYPAL_CLIENT_SECRET
        self._cached_token = None

    def get_access_token(self) -> str:
        """Fetch OAuth2 token using Client Credentials"""
        if not self.client_id or not self.client_secret:
            raise ValueError("PayPal Client ID or Secret is not configured.")

        url = f"{self.base_url}/v1/oauth2/token"
        headers = {
            "Accept": "application/json",
            "Accept-Language": "en_US"
        }
        data = {"grant_type": "client_credentials"}

        response = requests.post(
            url,
            auth=(self.client_id, self.client_secret),
            data=data,
            headers=headers,
            timeout=15
        )

        if response.status_code != 200:
            raise Exception(f"PayPal Auth Failed ({response.status_code}): {response.text}")

        token_data = response.json()
        return token_data["access_token"]

    def create_order(
        self,
        amount_cents: int,
        currency: str = "USD",
        reference_id: Optional[str] = None,
        description: Optional[str] = None,
        return_url: str = "http://localhost:8000/api/paypal/return",
        cancel_url: str = "http://localhost:8000/api/paypal/cancel"
    ) -> Dict[str, Any]:
        """Create an order with CAPTURE intent for explicit client approval."""
        token = self.get_access_token()
        url = f"{self.base_url}/v2/checkout/orders"
        
        # Format decimal string (e.g. 5000 cents -> 50.00)
        amount_val = f"{amount_cents / 100.0:.2f}"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "PayPal-Request-Id": str(uuid.uuid4())
        }

        payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": reference_id or str(uuid.uuid4()),
                    "description": description or "ScopeGuard Extra Scope Payment",
                    "amount": {
                        "currency_code": currency,
                        "value": amount_val
                    }
                }
            ],
            "application_context": {
                "return_url": return_url,
                "cancel_url": cancel_url,
                "user_action": "PAY_NOW"
            }
        }

        response = requests.post(url, json=payload, headers=headers, timeout=20)
        if response.status_code not in (200, 201):
            raise Exception(f"Order creation failed ({response.status_code}): {response.text}")

        data = response.json()
        
        # Extract approval URL
        approve_url = None
        for link in data.get("links", []):
            if link.get("rel") == "approve":
                approve_url = link.get("href")
                break

        return {
            "order_id": data["id"],
            "status": data["status"],
            "approve_url": approve_url,
            "raw": data
        }

    def capture_order(self, order_id: str) -> Dict[str, Any]:
        """Capture an approved PayPal order."""
        token = self.get_access_token()
        url = f"{self.base_url}/v2/checkout/orders/{order_id}/capture"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "PayPal-Request-Id": str(uuid.uuid4())
        }

        response = requests.post(url, json={}, headers=headers, timeout=20)
        if response.status_code not in (200, 201):
            raise Exception(f"Capture failed ({response.status_code}): {response.text}")

        data = response.json()
        capture_id = None
        try:
            capture_id = data["purchase_units"][0]["payments"]["captures"][0]["id"]
        except (KeyError, IndexError):
            pass

        return {
            "order_id": data["id"],
            "status": data["status"],
            "capture_id": capture_id,
            "raw": data
        }

    def get_order_details(self, order_id: str) -> Dict[str, Any]:
        """Fetch details of an existing order."""
        token = self.get_access_token()
        url = f"{self.base_url}/v2/checkout/orders/{order_id}"
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            raise Exception(f"Get Order Details failed ({response.status_code}): {response.text}")

        return response.json()

paypal_service = PayPalService()
