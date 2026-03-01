import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_EMAIL = os.environ.get('SMTP_EMAIL', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')

async def send_email(to_email: str, subject: str, html_content: str):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. Email not sent.")
        return False
    
    try:
        message = MIMEMultipart('alternative')
        message['From'] = f"SamaFlux <{SMTP_EMAIL}>"
        message['To'] = to_email
        message['Subject'] = subject
        
        html_part = MIMEText(html_content, 'html')
        message.attach(html_part)
        
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_EMAIL,
            password=SMTP_PASSWORD,
        )
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False

def generate_invoice_email(customer_name: str, invoice_id: str, total_amount: float, payment_link: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #065F46; color: white; padding: 20px; text-align: center; }}
            .content {{ background-color: #f9f9f9; padding: 30px; }}
            .button {{ background-color: #065F46; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>SamaFlux Invoice</h1>
            </div>
            <div class="content">
                <p>Hello {customer_name},</p>
                <p>You have received an invoice from SamaFlux.</p>
                <p><strong>Invoice ID:</strong> {invoice_id}</p>
                <p><strong>Amount Due:</strong> ₦{total_amount:,.2f}</p>
                <p>Please click the button below to view and pay your invoice:</p>
                <a href="{payment_link}" class="button">Pay Invoice</a>
            </div>
            <div class="footer">
                <p>This is an automated email from SamaFlux. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """