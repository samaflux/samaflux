from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, validator
from dotenv import load_dotenv
from datetime import datetime, timezone
from typing import Optional, List
import os
import logging
import uuid
import httpx
import hmac
import hashlib
from pathlib import Path
from auth_utils import hash_password, verify_password, create_access_token, verify_token
from email_utils import send_email, generate_invoice_email
from fastapi import Request
from paystack_service import PaystackService

paystack_service = PaystackService()

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

PAYSTACK_SECRET_KEY = os.environ.get('PAYSTACK_SECRET_KEY')
PAYSTACK_PUBLIC_KEY = os.environ.get('PAYSTACK_PUBLIC_KEY')
PAYSTACK_BASE_URL = "https://api.paystack.co"

app = FastAPI(title="SamaFlux API")
api_router = APIRouter(prefix="/api")

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v

class RegisterDetailsRequest(BaseModel):
    first_name: str
    surname: str
    address: str
    city: str
    state: str
    zip_code: str
    country: str
    phone_number: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SendMoneyRequest(BaseModel):
    recipient_email: EmailStr
    amount: float
    description: Optional[str] = None
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than zero')
        return v

class InitializePaymentRequest(BaseModel):
    amount: float
    description: Optional[str] = "Wallet funding"
    
    @validator('amount')
    def validate_amount(cls, v):
        if v < 100:
            raise ValueError('Amount must be at least ₦100')
        return v

class CreateInvoiceRequest(BaseModel):
    customer_email: EmailStr
    customer_name: str
    description: str
    amount: float
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than zero')
        return v

class QRPaymentRequest(BaseModel):
    amount: float
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than zero')
        return v

@api_router.get("/")
async def root():
    return {"message": "SamaFlux API is running", "status": "ok"}

@api_router.post("/auth/register")
async def register_step1(data: RegisterRequest):
    existing_user = await db.users.find_one({"email": data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    temp_user = {
        "id": user_id,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "is_complete": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(temp_user)
    
    token = create_access_token({"sub": user_id, "email": data.email})
    
    return {
        "message": "Step 1 complete. Please provide additional details.",
        "token": token,
        "user_id": user_id
    }

@api_router.post("/auth/register-details")
async def register_step2(data: RegisterDetailsRequest, current_user: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "first_name": data.first_name,
            "surname": data.surname,
            "address": data.address,
            "city": data.city,
            "state": data.state,
            "zip_code": data.zip_code,
            "country": data.country,
            "phone_number": data.phone_number,
            "is_complete": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    wallet = {
        "user_id": current_user["id"],
        "balance": 0.0,
        "currency": "NGN",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.wallets.insert_one(wallet)
    
    return {"message": "Registration complete!", "success": True}

@api_router.post("/auth/login")
async def login(data: LoginRequest):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("is_complete", False):
        raise HTTPException(status_code=400, detail="Please complete your registration")
    
    token = create_access_token({"sub": user["id"], "email": user["email"]})
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "first_name": user.get("first_name"),
            "surname": user.get("surname")
        }
    }

@api_router.get("/auth/me")
async def get_current_user(current_user: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.get("/wallet")
async def get_wallet(current_user: dict = Depends(verify_token)):
    wallet = await db.wallets.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not wallet:
        wallet = {
            "user_id": current_user["id"],
            "balance": 0.0,
            "currency": "NGN",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.wallets.insert_one(wallet)
    
    transactions = await db.transactions.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(None)
    
    return {
        "balance": wallet["balance"],
        "currency": wallet.get("currency", "NGN"),
        "transactions": transactions
    }

@api_router.get("/transactions")
async def get_transactions(current_user: dict = Depends(verify_token)):
    transactions = await db.transactions.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(None)
    
    return {"transactions": transactions}

@api_router.post("/payments/initialize")
async def initialize_payment(data: InitializePaymentRequest, current_user: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    reference = f"SF_{uuid.uuid4().hex[:12].upper()}"
    amount_in_kobo = int(data.amount * 100)
    
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.post(
                f"{PAYSTACK_BASE_URL}/transaction/initialize",
                json={
                    "amount": amount_in_kobo,
                    "email": user["email"],
                    "reference": reference,
                    "callback_url": f"{os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000')}/payment-callback",
                    "metadata": {
                        "user_id": current_user["id"],
                        "description": data.description
                    }
                },
                headers={
                    "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to initialize payment")
            
            result = response.json()
            
            transaction = {
                "reference": reference,
                "user_id": current_user["id"],
                "amount": data.amount,
                "type": "deposit",
                "status": "pending",
                "description": data.description,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.transactions.insert_one(transaction)
            
            return {
                "authorization_url": result["data"]["authorization_url"],
                "reference": reference,
                "access_code": result["data"]["access_code"]
            }
        except httpx.RequestError as e:
            logger.error(f"Paystack API error: {str(e)}")
            raise HTTPException(status_code=500, detail="Payment service unavailable")

@api_router.get("/payments/verify/{reference}")
async def verify_payment(reference: str, current_user: dict = Depends(verify_token)):
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.get(
                f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
                headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="Transaction not found")
            
            result = response.json()
            
            if result["data"]["status"] == "success":
                transaction = await db.transactions.find_one({"reference": reference})
                
                if transaction and transaction["status"] != "success":
                    await db.transactions.update_one(
                        {"reference": reference},
                        {"$set": {"status": "success"}}
                    )
                    
                    await db.wallets.update_one(
                        {"user_id": current_user["id"]},
                        {"$inc": {"balance": transaction["amount"]}}
                    )
            
            return result
        except httpx.RequestError as e:
            logger.error(f"Paystack verification error: {str(e)}")
            raise HTTPException(status_code=500, detail="Verification service unavailable")

@api_router.post("/payments/send-money")
async def send_money(data: SendMoneyRequest, current_user: dict = Depends(verify_token)):
    recipient = await db.users.find_one({"email": data.recipient_email})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    if recipient["id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot send money to yourself")
    
    sender_wallet = await db.wallets.find_one({"user_id": current_user["id"]})
    if not sender_wallet or sender_wallet["balance"] < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    reference = f"TRF_{uuid.uuid4().hex[:12].upper()}"
    
    await db.wallets.update_one(
        {"user_id": current_user["id"]},
        {"$inc": {"balance": -data.amount}}
    )
    
    await db.wallets.update_one(
        {"user_id": recipient["id"]},
        {"$inc": {"balance": data.amount}}
    )
    
    sender_transaction = {
        "reference": reference,
        "user_id": current_user["id"],
        "amount": -data.amount,
        "type": "transfer_out",
        "status": "success",
        "description": f"Transfer to {data.recipient_email}",
        "recipient_email": data.recipient_email,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.transactions.insert_one(sender_transaction)
    
    recipient_transaction = {
        "reference": reference,
        "user_id": recipient["id"],
        "amount": data.amount,
        "type": "transfer_in",
        "status": "success",
        "description": f"Transfer from {current_user['email']}",
        "sender_email": current_user["email"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.transactions.insert_one(recipient_transaction)
    
    return {
        "message": "Transfer successful",
        "reference": reference,
        "amount": data.amount,
        "recipient": data.recipient_email
    }

@api_router.post("/payments/generate-qr")
async def generate_qr_payment(data: QRPaymentRequest, current_user: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    reference = f"QR_{uuid.uuid4().hex[:12].upper()}"
    amount_in_kobo = int(data.amount * 100)
    
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.post(
                f"{PAYSTACK_BASE_URL}/transaction/initialize",
                json={
                    "amount": amount_in_kobo,
                    "email": user["email"],
                    "reference": reference,
                    "metadata": {
                        "user_id": current_user["id"],
                        "type": "qr_payment"
                    }
                },
                headers={
                    "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to generate QR payment")
            
            result = response.json()
            
            transaction = {
                "reference": reference,
                "user_id": current_user["id"],
                "amount": data.amount,
                "type": "qr_payment",
                "status": "pending",
                "description": "QR Code Payment",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.transactions.insert_one(transaction)
            
            return {
                "payment_link": result["data"]["authorization_url"],
                "reference": reference,
                "amount": data.amount
            }
        except httpx.RequestError as e:
            logger.error(f"QR payment error: {str(e)}")
            raise HTTPException(status_code=500, detail="QR payment service unavailable")

@api_router.post("/invoices/create")
async def create_invoice(data: CreateInvoiceRequest, current_user: dict = Depends(verify_token)):
    invoice_id = f"INV_{uuid.uuid4().hex[:10].upper()}"
    reference = f"INV_PAY_{uuid.uuid4().hex[:12].upper()}"
    amount_in_kobo = int(data.amount * 100)
    
    async with httpx.AsyncClient() as http_client:
        try:
            response = await http_client.post(
                f"{PAYSTACK_BASE_URL}/transaction/initialize",
                json={
                    "amount": amount_in_kobo,
                    "email": data.customer_email,
                    "reference": reference,
                    "metadata": {
                        "invoice_id": invoice_id,
                        "issuer_id": current_user["id"],
                        "type": "invoice"
                    }
                },
                headers={
                    "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to create invoice")
            
            result = response.json()
            payment_link = result["data"]["authorization_url"]
            
            invoice = {
                "invoice_id": invoice_id,
                "issuer_id": current_user["id"],
                "customer_email": data.customer_email,
                "customer_name": data.customer_name,
                "description": data.description,
                "amount": data.amount,
                "status": "pending",
                "payment_reference": reference,
                "payment_link": payment_link,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.invoices.insert_one(invoice)
            
            email_html = generate_invoice_email(
                data.customer_name,
                invoice_id,
                data.amount,
                payment_link
            )
            await send_email(data.customer_email, f"Invoice {invoice_id} from SamaFlux", email_html)
            
            return {
                "invoice_id": invoice_id,
                "payment_link": payment_link,
                "amount": data.amount,
                "status": "pending"
            }
        except httpx.RequestError as e:
            logger.error(f"Invoice creation error: {str(e)}")
            raise HTTPException(status_code=500, detail="Invoice service unavailable")

@api_router.get("/invoices")
async def get_invoices(current_user: dict = Depends(verify_token)):
    invoices = await db.invoices.find(
        {"issuer_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(None)
    
    return {"invoices": invoices}

@api_router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"invoice_id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@api_router.get("/banks")
async def get_banks():
    try:
        result = await paystack_service.get_banks()
        if result.get("status"):
            return {"success": True, "banks": result.get("data", [])}
        else:
            raise HTTPException(status_code=400, detail="Failed to fetch banks")
    except Exception as e:
        logger.error(f"Error fetching banks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch banks")

@api_router.post("/withdrawals/verify-account")
async def verify_account(account_number: str, bank_code: str):
    try:
        result = await paystack_service.verify_account(account_number, bank_code)
        return result
    except Exception as e:
        logger.error(f"Error verifying account: {str(e)}")
        raise HTTPException(status_code=500, detail="Account verification failed")

@api_router.post("/withdrawals/add-bank-account")
async def add_bank_account(
    account_number: str,
    bank_code: str,
    account_name: str,
    current_user: dict = Depends(verify_token)
):
    try:
        verification = await paystack_service.verify_account(account_number, bank_code)
        if not verification.get("success"):
            raise HTTPException(status_code=400, detail=verification.get("error", "Account verification failed"))
        
        recipient_result = await paystack_service.create_transfer_recipient(
            account_number=account_number,
            bank_code=bank_code,
            account_name=account_name
        )
        
        if not recipient_result.get("success"):
            raise HTTPException(status_code=400, detail=recipient_result.get("error", "Failed to create transfer recipient"))
        
        banks_result = await paystack_service.get_banks()
        bank_name = None
        if banks_result.get("status"):
            for bank in banks_result.get("data", []):
                if bank["code"] == bank_code:
                    bank_name = bank["name"]
                    break
        
        user = await db.users.find_one({"id": current_user["id"]})
        existing_accounts = user.get("bank_accounts", [])
        
        for acc in existing_accounts:
            if acc["account_number"] == account_number and acc["bank_code"] == bank_code:
                raise HTTPException(status_code=400, detail="Bank account already added")
        
        new_account = {
            "recipient_code": recipient_result["recipient_code"],
            "bank_code": bank_code,
            "bank_name": bank_name or "Unknown Bank",
            "account_number": account_number,
            "account_name": account_name,
            "is_default": len(existing_accounts) == 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.users.update_one(
            {"id": current_user["id"]},
            {
                "$push": {"bank_accounts": new_account},
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        
        return {
            "success": True,
            "message": "Bank account added successfully",
            "recipient_code": recipient_result["recipient_code"]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding bank account: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add bank account")

@api_router.get("/withdrawals/bank-accounts")
async def get_bank_accounts(current_user: dict = Depends(verify_token)):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"bank_accounts": user.get("bank_accounts", [])}

@api_router.post("/withdrawals/initiate")
async def initiate_withdrawal(
    recipient_code: str,
    amount: float,
    current_user: dict = Depends(verify_token)
):
    try:
        user = await db.users.find_one({"id": current_user["id"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        wallet = await db.wallets.find_one({"user_id": current_user["id"]})
        if not wallet or wallet.get("balance", 0) < amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        bank_account = None
        for account in user.get("bank_accounts", []):
            if account["recipient_code"] == recipient_code:
                bank_account = account
                break
        
        if not bank_account:
            raise HTTPException(status_code=404, detail="Bank account not found")
        
        amount_in_kobo = int(amount * 100)
        transfer_result = await paystack_service.initiate_transfer(
            recipient_code=recipient_code,
            amount=amount_in_kobo,
            reason="Withdrawal to bank account"
        )
        
        if not transfer_result.get("success"):
            raise HTTPException(status_code=400, detail=transfer_result.get("error", "Transfer initiation failed"))
        
        withdrawal_doc = {
            "user_id": current_user["id"],
            "recipient_code": recipient_code,
            "amount": amount,
            "bank_code": bank_account["bank_code"],
            "bank_name": bank_account["bank_name"],
            "account_number": bank_account["account_number"],
            "transfer_reference": transfer_result["transfer_reference"],
            "paystack_transfer_code": transfer_result["transfer_code"],
            "status": transfer_result["status"],
            "error_message": None,
            "initiated_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None
        }
        
        result = await db.withdrawals.insert_one(withdrawal_doc)
        
        await db.wallets.update_one(
            {"user_id": current_user["id"]},
            {"$inc": {"balance": -amount}}
        )
        
        withdrawal_transaction = {
            "reference": transfer_result["transfer_reference"],
            "user_id": current_user["id"],
            "amount": -amount,
            "type": "withdrawal",
            "status": "pending",
            "description": f"Withdrawal to {bank_account['bank_name']} - {bank_account['account_number']}",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(withdrawal_transaction)
        
        return {
            "success": True,
            "transfer_code": transfer_result["transfer_code"],
            "transfer_id": str(result.inserted_id),
            "status": transfer_result["status"],
            "message": "Withdrawal initiated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initiating withdrawal: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate withdrawal")

@api_router.get("/withdrawals")
async def get_withdrawals(current_user: dict = Depends(verify_token)):
    withdrawals = await db.withdrawals.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("initiated_at", -1).to_list(None)
    
    return {"withdrawals": withdrawals}

@api_router.post("/webhooks/paystack")
async def paystack_webhook(request: Request):
    signature = request.headers.get('x-paystack-signature')
    if not signature:
        raise HTTPException(status_code=400, detail="No signature provided")
    
    body = await request.body()
    
    hash_signature = hmac.new(
        PAYSTACK_SECRET_KEY.encode('utf-8'),
        body,
        hashlib.sha512
    ).hexdigest()
    
    if hash_signature != signature:
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    try:
        import json
        event_data = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    event = event_data.get('event')
    data = event_data.get('data', {})
    
    if event == 'charge.success':
        reference = data.get('reference')
        amount = data.get('amount') / 100
        metadata = data.get('metadata', {})
        
        transaction = await db.transactions.find_one({"reference": reference})
        
        if transaction and transaction["status"] != "success":
            await db.transactions.update_one(
                {"reference": reference},
                {"$set": {"status": "success"}}
            )
            
            if transaction["type"] in ["deposit", "qr_payment"]:
                await db.wallets.update_one(
                    {"user_id": transaction["user_id"]},
                    {"$inc": {"balance": amount}}
                )
        
        if metadata.get('type') == 'invoice':
            invoice_id = metadata.get('invoice_id')
            if invoice_id:
                invoice = await db.invoices.find_one({"invoice_id": invoice_id})
                if invoice and invoice["status"] != "paid":
                    await db.invoices.update_one(
                        {"invoice_id": invoice_id},
                        {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    
                    await db.wallets.update_one(
                        {"user_id": invoice["issuer_id"]},
                        {"$inc": {"balance": amount}}
                    )
                    
                    issuer_transaction = {
                        "reference": reference,
                        "user_id": invoice["issuer_id"],
                        "amount": amount,
                        "type": "invoice_payment",
                        "status": "success",
                        "description": f"Invoice payment: {invoice_id}",
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.transactions.insert_one(issuer_transaction)
    
    elif event == 'transfer.success':
        transfer_code = data.get('transfer_code')
        if transfer_code:
            await db.withdrawals.update_one(
                {"paystack_transfer_code": transfer_code},
                {
                    "$set": {
                        "status": "completed",
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            await db.transactions.update_one(
                {"reference": data.get('reference')},
                {"$set": {"status": "success"}}
            )
    
    elif event == 'transfer.failed':
        transfer_code = data.get('transfer_code')
        if transfer_code:
            withdrawal = await db.withdrawals.find_one({"paystack_transfer_code": transfer_code})
            if withdrawal:
                await db.withdrawals.update_one(
                    {"paystack_transfer_code": transfer_code},
                    {
                        "$set": {
                            "status": "failed",
                            "error_message": "Transfer failed",
                            "completed_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                await db.wallets.update_one(
                    {"user_id": withdrawal["user_id"]},
                    {"$inc": {"balance": withdrawal["amount"]}}
                )
                
                await db.transactions.update_one(
                    {"reference": data.get('reference')},
                    {"$set": {"status": "failed"}}
                )
    
    elif event == 'transfer.reversed':
        transfer_code = data.get('transfer_code')
        if transfer_code:
            withdrawal = await db.withdrawals.find_one({"paystack_transfer_code": transfer_code})
            if withdrawal:
                await db.withdrawals.update_one(
                    {"paystack_transfer_code": transfer_code},
                    {
                        "$set": {
                            "status": "reversed",
                            "completed_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )
                
                await db.wallets.update_one(
                    {"user_id": withdrawal["user_id"]},
                    {"$inc": {"balance": withdrawal["amount"]}}
                )
                
                await db.transactions.update_one(
                    {"reference": data.get('reference')},
                    {"$set": {"status": "reversed"}}
                )
    
    return {"status": "ok"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()