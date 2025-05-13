import smtplib, ssl
from email.message import EmailMessage

SMTP_HOST = "smtp.office365.com"
SMTP_PORT = 587
USERNAME  = "support@msistaff.com"
PASSWORD  = "MetroM$I2024!"   # ← put your real password here

msg = EmailMessage()
msg["Subject"] = "SMTP test from the ticket system"
msg["From"]    = USERNAME
msg["To"]      = "zzeller@msistaff.com"
msg.set_content("If you’re reading this, SMTP is good to go! 🎉")

ctx = ssl.create_default_context()
with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
    server.starttls(context=ctx)
    server.login(USERNAME, PASSWORD)
    server.send_message(msg)

print("Sent!")
