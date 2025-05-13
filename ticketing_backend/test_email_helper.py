# test_email_helper.py

from email_helper import send_email

if __name__ == "__main__":
    send_email(
        to="zzeller@msistaff.com",  # ← change this
        subject="Email helper test",
        html="<h1>🚀 It works!</h1><p>Your helper sent this via Outlook SMTP.</p>"
    )
    print("Helper ran—check your inbox!")
