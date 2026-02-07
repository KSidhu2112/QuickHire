# 🔧 Backend Troubleshooting Guide

## Common Issues & Solutions

### 1. ❌ MongoDB Connection Error

**Error:** "MongoNetworkError: connection refused" or "IP not whitelisted"

**Solutions:**
1. **Check MongoDB Atlas IP Whitelist:**
   - Go to MongoDB Atlas → Network Access
   - Add your current IP address
   - Or add `0.0.0.0/0` for development (allows all IPs)

2. **Verify MongoDB URI:**
   - Check `.env` file has correct `MONGODB_URI`
   - Ensure username and password are correct
   - Database name should be `QuickHire`

3. **Test Connection:**
   ```bash
   node test-connection.js
   ```

---

### 2. ❌ Email Not Sending

**Error:** "Unable to send email" or SMTP connection error

**Solutions:**
1. **Verify Brevo Credentials:**
   - Check `SMTP_USER` and `SMTP_PASSWORD` in `.env`
   - Login to Brevo dashboard to verify credentials
   - Ensure sender email is verified in Brevo

2. **Check SMTP Settings:**
   ```env
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   ```

3. **Test Email Service:**
   - The verify-backend script tests email configuration
   ```bash
   npm run verify
   ```

---

### 3. ❌ Server Won't Start

**Error:** "Port already in use" or server crashes immediately

**Solutions:**
1. **Port Already in Use:**
   - Kill processes on port 5000:
   ```powershell
   # Find process using port 5000
   netstat -ano | findstr :5000
   
   # Kill the process (replace PID)
   taskkill /PID <PID> /F
   ```

2. **Change Port:**
   - Update `PORT` in `.env`:
   ```env
   PORT=5001
   ```

3. **Missing Dependencies:**
   ```bash
   npm install
   ```

---

### 4. ❌ OTP Not Working

**Error:** "Invalid OTP" or "OTP expired"

**Solutions:**
1. **OTP Expired:**
   - OTPs expire after 10 minutes
   - Request a new OTP using `/api/auth/resend-otp`

2. **Wrong Email:**
   - Ensure email in register matches email in send-otp

3. **Check OTP in Email:**
   - Check spam folder
   - Verify Brevo email service is working

4. **Manual Database Check:**
   - Check MongoDB Atlas → Collections → otps
   - Verify OTP exists and not expired

---

### 5. ❌ JWT Token Issues

**Error:** "Not authorized" or "Invalid token"

**Solutions:**
1. **Token Not Sent:**
   - Ensure frontend sends: `Authorization: Bearer <token>`
   - Check localStorage has `quickhire_token`

2. **Token Expired:**
   - Tokens expire after 30 days
   - Login again to get new token

3. **Wrong JWT Secret:**
   - Ensure `JWT_SECRET` in `.env` hasn't changed
   - Tokens generated with old secret won't work

---

### 6. ❌ CORS Errors

**Error:** "CORS policy blocked" in browser console

**Solutions:**
1. **Add Frontend URL:**
   - Update `server.js` CORS configuration:
   ```javascript
   const corsOptions = {
       origin: ['http://localhost:5173', 'http://localhost:3000'],
       credentials: true,
   };
   ```

2. **Check Frontend URL:**
   - Verify frontend is running on port 5173 (Vite default)
   - Or 3000 (React default)

---

### 7. ❌ Password Not Matching

**Error:** "Invalid email or password" on login

**Solutions:**
1. **Check Password:**
   - Minimum 6 characters required
   - Case-sensitive

2. **Email Not Verified:**
   - User must verify email before login
   - Check `isEmailVerified` field in database

3. **User Doesn't Exist:**
   - Register first before login

---

### 8. ❌ Cannot Find Module

**Error:** "Cannot find module 'express'" or similar

**Solutions:**
1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Delete and Reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

### 9. ❌ Environment Variables Not Loading

**Error:** "undefined" for process.env variables

**Solutions:**
1. **Check .env File:**
   - File must be named exactly `.env`
   - Must be in `/backend` directory
   - No spaces around `=` sign

2. **Verify dotenv:**
   ```bash
   npm install dotenv
   ```

3. **Check File Contents:**
   ```env
   PORT=5000  # ✅ Correct
   PORT = 5000  # ❌ Wrong (spaces)
   ```

---

### 10. ❌ Database Model Errors

**Error:** "Model not found" or validation errors

**Solutions:**
1. **Check Model Import:**
   ```javascript
   const User = require('./models/User');
   ```

2. **Validation Errors:**
   - Ensure all required fields are provided
   - Check field types match schema

---

## Testing Checklist

Run these tests to ensure everything works:

### ✅ Basic Server Test
```bash
node test-server.js
# Visit: http://localhost:5000/test
```

### ✅ Full Backend Verification
```bash
npm run verify
```

### ✅ MongoDB Connection Test
```bash
node test-connection.js
```

### ✅ Health Check
```bash
# Start server:
npm start

# In another terminal:
curl http://localhost:5000/api/health
# Or visit in browser
```

### ✅ API Endpoints Test
Import `QuickHire_API.postman_collection.json` into Postman and test each endpoint.

---

## Debugging Tools

### 1. Check Server Logs
Look for error messages in terminal where `npm start` is running.

### 2. MongoDB Atlas Logs
- Go to MongoDB Atlas
- Check Monitoring → Logs
- Look for connection errors

### 3. Network Tab (Browser)
- Open browser DevTools → Network
- Check API requests/responses
- Look for failed requests

### 4. Postman/Thunder Client
- Test API endpoints independently
- Check request/response details

---

## Quick Fixes

### Reset Everything
```bash
# Stop server (Ctrl+C)
# Clear node_modules
rm -rf node_modules package-lock.json
# Reinstall
npm install
# Start fresh
npm start
```

### Clean Database (Development Only!)
```javascript
// In MongoDB Atlas, delete all documents:
// Collections → users → Delete All
// Collections → otps → Delete All
```

### Regenerate JWT Secret
```bash
# Generate new secret (Node.js):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Update JWT_SECRET in .env
```

---

## Still Having Issues?

### Check These Files:
1. `.env` - All environment variables set?
2. `package.json` - All dependencies installed?
3. `server.js` - Server configuration correct?
4. MongoDB Atlas - IP whitelisted?
5. Brevo Dashboard - SMTP credentials valid?

### Verify Configuration:
```bash
npm run verify
```

### Get Help:
- Review `backend/README.md`
- Check `SETUP_GUIDE.md`
- Test with Postman collection

---

## Pro Tips

1. **Always check logs first** - Most errors are logged
2. **Use Postman** - Test API without frontend
3. **Check MongoDB Atlas** - Verify data is being saved
4. **Test in isolation** - Use `test-server.js` to rule out MongoDB
5. **Restart server** - After changing .env or code
6. **Clear browser cache** - If CORS issues persist

---

**Remember:** The backend is fully configured and working. Most issues are environmental (IP whitelist, ports, etc.) rather than code issues.

If you've followed all steps and still have issues, verify:
1. ✅ `.env` file exists and has all variables
2. ✅ MongoDB Atlas IP is whitelisted
3. ✅ Brevo credentials are correct
4. ✅ Port 5000 is available
5. ✅ All dependencies are installed

Run `npm run verify` to check all components!
