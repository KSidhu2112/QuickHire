# 🔧 SendOTP Error Troubleshooting

## ✅ Current Status
- MongoDB: ✅ CONNECTED
- Backend: ✅ RUNNING
- Frontend: ✅ RUNNING

## ❌ Issue: SendOTP Still Failing

Possible causes and solutions:

---

## 🔍 **Check #1: Look at Backend Logs**

When you click "Send OTP", check your **backend terminal** for error messages.

**What to look for:**
```
📧 Attempting to send email to: user@example.com
❌ Error sending email: [ERROR MESSAGE HERE]
```

Common errors:

### Error 1: "Invalid login: 535 Authentication failed"
**Cause:** Brevo SMTP credentials are wrong
**Fix:**
1. Login to Brevo: https://app.brevo.com
2. Go to: SMTP & API → SMTP
3. Generate new SMTP key
4. Update `.env` file with new credentials

### Error 2: "Sender email not verified"
**Cause:** Sender email not verified in Brevo
**Fix:**
1. Login to Brevo
2. Go to Senders → Verify your sender email
3. Or use a verified email in `.env`

### Error 3: "Connection timeout"
**Cause:** Firewall blocking SMTP port 587
**Fix:**
1. Check if port 587 is open
2. Try port 465 with secure: true
3. Disable antivirus/firewall temporarily

### Error 4: "Rate limit exceeded"
**Cause:** Too many emails sent too quickly (Brevo free tier limit)
**Fix:**
- Wait a few minutes
- Upgrade Brevo plan
- Or use different SMTP provider

---

## 🔍 **Check #2: Verify .env Configuration**

Open `.env` file and verify:

```env
SMTP_HOST=smtp-relay.brevo.com  ← Must be exact
SMTP_PORT=587                    ← Port 587 or 465
SMTP_USER=YOUR_BREVO_LOGIN      ← From Brevo dashboard
SMTP_PASSWORD=YOUR_SMTP_KEY     ← API key from Brevo
SENDER_EMAIL=verified@email.com ← MUST be verified in Brevo
SENDER_NAME=QuickHire Team
```

**IMPORTANT:** If you change `.env`, you MUST restart the backend!

---

## 🔍 **Check #3: Test Email Service Independently**

Run this test command:

```bash
cd backend
node test-send-otp.js
```

This will:
- Connect to MongoDB ✅
- Attempt to send a test email
- Show detailed error if it fails

---

## 🔍 **Check #4: Brevo Account Status**

1. Login to Brevo: https://app.brevo.com
2. Check:
   - Account is active ✅
   - Sender email is verified ✅
   - SMTP is enabled ✅
   - Not exceeded free tier limits ✅

---

## 🔍 **Check #5: Network/Firewall**

SMTP might be blocked by:
- Windows Firewall
- Antivirus software
- Corporate network
- ISP blocking port 587

**Test:**
```powershell
Test-NetConnection smtp-relay.brevo.com -Port 587
```

Should show: `TcpTestSucceeded : True`

---

## 🛠️ **Quick Fixes**

### Fix 1: Use Port 465 Instead

Update `.env`:
```env
SMTP_PORT=465
```

Update `emailService.js`:
```javascript
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,  // Change to true for port 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});
```

### Fix 2: Regenerate Brevo SMTP Key

1. Go to: https://app.brevo.com/settings/keys/smtp
2. Delete old SMTP key
3. Create new SMTP key
4. Copy the new key
5. Update `SMTP_PASSWORD` in `.env`
6. Restart backend

### Fix 3: Use Gmail SMTP (Alternative)

If Brevo isn't working, use Gmail:

**Update `.env`:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.gmail@gmail.com
SMTP_PASSWORD=your_app_password  
SENDER_EMAIL=your.gmail@gmail.com
```

**Note:** You need to generate an App Password in Gmail settings

---

## 🧪 **Debug Steps**

### Step 1: Check Backend Terminal
Look for error messages when you click "Send OTP"

### Step 2: Check Frontend Console
Open DevTools → Console → Look for 500/503 errors

### Step 3: Check Network Tab
DevTools → Network → Click "Send OTP" → Check request/response

### Step 4: Run Test Script
```bash
node test-send-otp.js
```

### Step 5: Recent the specific error message

---

## 📧 **Brevo SMTP Credentials Location**

To find your Brevo SMTP credentials:

1. Login: https://app.brevo.com
2. Click your profile (top right)
3. Go to: **SMTP & API**
4. Click: **SMTP** tab
5. You'll see:
   - **SMTP Server:** smtp-relay.brevo.com
   - **Port:** 587
   - **Login:** Your email or generated login
   - **SMTP Key:** Click "Generate new SMTP key"

---

## 🔄 **After Making Changes**

**ALWAYS restart the backend:**
```bash
# In backend terminal:
# Press Ctrl+C
# Then:
node server.js
```

---

## 📸 **What I Need to Help You**

Please provide:

1. **Backend terminal output** when you click "Send OTP"
2. **Browser console error** (DevTools → Console)
3. **Network request details** (DevTools → Network → sendOTP request)
4. **Brevo account status** (is sender email verified?)

---

## ✅ **Most Common Solution**

**90% of email issues are:**
1. **Sender email not verified in Brevo**
2. **Wrong SMTP credentials in `.env`**
3. **Forgot to restart backend after changing `.env`**

**Quick check:**
- Is sender email verified in Brevo? ✅
- Are SMTP credentials correct? ✅
- Did you restart backend? ✅

---

**Share the error message and I'll help you fix it! 🚀**
