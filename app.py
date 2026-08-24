from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import os
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.utils import formataddr

# =====================================================
# LOAD ENVIRONMENT VARIABLES
# =====================================================
load_dotenv()

app = Flask(__name__)

# =====================================================
# PARTNERS LIST (filenames must match static/images/partners/)
# =====================================================
partners_list = [
    ("swiss-med.png",      "Swiss Mediterranean"),
    ("lenars.png",         "Lenars Medical"),
    ("inaya.png",          "Inaya"),
    ("svast.png",          "Svast"),
    ("sigma.png",          "Sigma"),
    ("tepsa.png",          "TEPSA Lab"),
    ("meeting-stores.png", "Meeting Stores"),
    ("extrene.png",        "Extrene"),
    ("metra.png",          "Metra Lab"),
    ("ataya.png",          "عطايا"),
    ("nour-el-ouyoun.png", "نور العيون"),
    ("george-halim.png",   "Dr. George Halim"),
]

# =====================================================
# EMAIL CONFIGURATION FROM .env
# =====================================================
SMTP_SERVER     = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT       = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME   = os.getenv('SMTP_USERNAME')
SMTP_PASSWORD   = os.getenv('SMTP_PASSWORD')
SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL', 'treatbridge1@gmail.com')
SMTP_TO_EMAIL   = os.getenv('SMTP_TO_EMAIL', 'treatbridge1@gmail.com')
SMTP_FROM_NAME  = os.getenv('SMTP_FROM_NAME', 'Treat International')

EMAIL_REGEX = re.compile(r'^[\w\.\+\-]+@[\w\-]+\.[\w\.\-]+$')


@app.route("/")
def index():
    """Render the main homepage."""
    return render_template("index.html", partners=partners_list)


@app.route("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok", "message": "Treat Healthcare website is running"}


def build_email(name, email, subject, message):
    """Build the MIME multipart email (plain text + HTML)."""
    msg = MIMEMultipart('alternative')
    msg['From'] = formataddr((str(Header(SMTP_FROM_NAME, 'utf-8')), SMTP_FROM_EMAIL))
    msg['To'] = SMTP_TO_EMAIL
    msg['Subject'] = Header(f"New Contact Form: {subject}", 'utf-8')
    msg['Reply-To'] = email

    plain_text = f"""\
=====================================================
NEW MESSAGE FROM TREAT INTERNATIONAL WEBSITE
=====================================================

Name:    {name}
Email:   {email}
Subject: {subject}

-----------------------------------------------------
MESSAGE
-----------------------------------------------------
{message}

-----------------------------------------------------
Sent from Treat International Healthcare Solutions
=====================================================
"""

    # Escape user input to prevent HTML injection in the email body
    esc = lambda s: s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

    html_text = f"""
<!DOCTYPE html>
<html>
<head><style>
    body {{ font-family: Arial, sans-serif; color: #333; }}
    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
    .header {{ background: #0052a5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
    .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }}
    .field {{ margin-bottom: 15px; }}
    .label {{ font-weight: bold; color: #0052a5; display: block; }}
    .value {{ display: block; padding: 8px 12px; background: white; border-radius: 4px; border: 1px solid #dee2e6; }}
    .message-box {{ background: white; padding: 15px; border-radius: 4px; border: 1px solid #dee2e6; margin-top: 5px; }}
    .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #868e96; }}
</style></head>
<body>
<div class="container">
    <div class="header"><h2>📩 New Contact Form Message</h2></div>
    <div class="content">
        <div class="field"><span class="label">👤 Name</span><span class="value">{esc(name)}</span></div>
        <div class="field"><span class="label">📧 Email</span><span class="value">{esc(email)}</span></div>
        <div class="field"><span class="label">📝 Subject</span><span class="value">{esc(subject)}</span></div>
        <div class="field"><span class="label">💬 Message</span><div class="message-box">{esc(message).replace(chr(10), '<br>')}</div></div>
        <p style="color:#6c757d;font-size:14px;">Sent from the <strong>Treat International Healthcare Solutions</strong> website.</p>
    </div>
    <div class="footer">&copy; 2026 Treat International. All rights reserved.</div>
</div>
</body>
</html>
"""

    msg.attach(MIMEText(plain_text, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_text, 'html', 'utf-8'))
    return msg


@app.route("/send-message", methods=["POST"])
def send_message():
    """Handle contact form submission and send email."""
    try:
        name    = request.form.get('name', '').strip()
        email   = request.form.get('email', '').strip()
        subject = request.form.get('subject', '').strip()
        message = request.form.get('message', '').strip()

        # --- Validation ---
        if not all([name, email, subject, message]):
            return jsonify({
                'success': False,
                'message': 'الرجاء ملء جميع الحقول المطلوبة | Please fill in all required fields.'
            }), 400

        if not EMAIL_REGEX.match(email):
            return jsonify({
                'success': False,
                'message': 'الرجاء إدخال بريد إلكتروني صحيح | Please enter a valid email address.'
            }), 400

        if len(message) > 5000 or len(subject) > 200:
            return jsonify({
                'success': False,
                'message': 'الرسالة طويلة جداً | Message is too long.'
            }), 400

        # --- Send ---
        msg = build_email(name, email, subject, message)
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        return jsonify({
            'success': True,
            'message': 'تم إرسال رسالتك بنجاح! سوف نتواصل معك قريباً | Your message has been sent successfully! We will get back to you soon.'
        })

    except smtplib.SMTPAuthenticationError:
        print("ERROR: SMTP Authentication Failed. Check your email credentials.")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في المصادقة. يرجى التحقق من إعدادات البريد الإلكتروني | Authentication error. Please check email settings.'
        }), 500

    except smtplib.SMTPException as e:
        print(f"ERROR: SMTP Exception - {e}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في إرسال البريد. يرجى المحاولة مرة أخرى | Email sending error. Please try again.'
        }), 500

    except Exception as e:
        print(f"ERROR: General Exception - {e}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى | An unexpected error occurred. Please try again.'
        }), 500


# =====================================================
# ERROR HANDLERS (FIXED — no more TypeError crash)
# =====================================================

@app.errorhandler(404)
def page_not_found(e):
    if request.path.startswith("/api") or request.path.startswith("/static"):
        return jsonify({'error': 'Not found'}), 404
    return render_template("index.html"), 404


@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
