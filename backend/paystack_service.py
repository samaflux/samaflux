import httpx
import logging
import os
from typing import Dict, Any
import uuid

logger = logging.getLogger(__name__)

PAYSTACK_SECRET_KEY = os.environ.get('PAYSTACK_SECRET_KEY')
PAYSTACK_BASE_URL = "https://api.paystack.co"

class PaystackService:
    def __init__(self):
        self.base_url = PAYSTACK_BASE_URL
        self.secret_key = PAYSTACK_SECRET_KEY
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
    
    async def get_banks(self, currency: str = "NGN") -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/bank",
                    params={"currency": currency},
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()
            except httpx.RequestError as e:
                logger.error(f"Error fetching banks: {str(e)}")
                raise Exception(f"Failed to fetch banks: {str(e)}")
    
    async def verify_account(self, account_number: str, bank_code: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/bank/resolve",
                    params={"account_number": account_number, "bank_code": bank_code},
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("status"):
                    return {
                        "success": True,
                        "account_name": result["data"]["account_name"],
                        "account_number": result["data"]["account_number"]
                    }
                else:
                    return {"success": False, "error": result.get("message", "Account verification failed")}
            except httpx.RequestError as e:
                logger.error(f"Error verifying account: {str(e)}")
                return {"success": False, "error": f"Account verification error: {str(e)}"}
    
    async def create_transfer_recipient(self, account_number: str, bank_code: str, account_name: str, currency: str = "NGN") -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            try:
                payload = {
                    "type": "nuban",
                    "name": account_name,
                    "account_number": account_number,
                    "bank_code": bank_code,
                    "currency": currency
                }
                
                response = await client.post(
                    f"{self.base_url}/transferrecipient",
                    json=payload,
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("status"):
                    return {
                        "success": True,
                        "recipient_code": result["data"]["recipient_code"],
                        "recipient_id": result["data"]["id"]
                    }
                else:
                    return {"success": False, "error": result.get("message", "Failed to create transfer recipient")}
            except httpx.RequestError as e:
                logger.error(f"Error creating transfer recipient: {str(e)}")
                return {"success": False, "error": f"Transfer recipient creation error: {str(e)}"}
    
    async def initiate_transfer(self, recipient_code: str, amount: int, reason: str = "Withdrawal to bank account") -> Dict[str, Any]:
        transfer_reference = f"WD_{uuid.uuid4().hex[:12].upper()}"
        
        async with httpx.AsyncClient() as client:
            try:
                payload = {
                    "source": "balance",
                    "amount": amount,
                    "recipient": recipient_code,
                    "reason": reason,
                    "reference": transfer_reference
                }
                
                response = await client.post(
                    f"{self.base_url}/transfer",
                    json=payload,
                    headers=self.headers,
                    timeout=10.0
                )
                response.raise_for_status()
                result = response.json()
                
                if result.get("status"):
                    return {
                        "success": True,
                        "transfer_code": result["data"]["transfer_code"],
                        "transfer_reference": transfer_reference,
                        "status": result["data"]["status"],
                        "amount": result["data"]["amount"]
                    }
                else:
                    return {
                        "success": False,
                        "error": result.get("message", "Failed to initiate transfer"),
                        "transfer_reference": transfer_reference
                    }
            except httpx.RequestError as e:
                logger.error(f"Error initiating transfer: {str(e)}")
                return {
                    "success": False,
                    "error": f"Transfer initiation error: {str(e)}",
                    "transfer_reference": transfer_reference
                }