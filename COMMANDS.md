# 🚀 QuickHire - Quick Start Commands

## 📦 Installation (One-time setup)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install
```

---

## 🎬 Running the Application

### Start Backend Server
```bash
cd backend
npm start
```
**Runs on:** http://localhost:5000

### Start Frontend Server
```bash
cd frontend
npm run dev
```
**Runs on:** http://localhost:5173

### Run Both (Two Terminals)
```bash
# Terminal 1 - Backend
cd c:\Users\siddu\OneDrive\Desktop\QuickHire\backend
npm start

# Terminal 2 - Frontend
cd c:\Users\siddu\OneDrive\Desktop\QuickHire\frontend
npm run dev
```

---

## 🧪 Testing

### Test Server (No Database)
```bash
cd backend
node test-server.js
```

### Verify Backend Configuration
```bash
cd backend
npm run verify
```

### Test MongoDB Connection
```bash
cd backend
node test-connection.js
```

### Health Check (Browser)
```
http://localhost:5000/api/health
```

---

## 🔧 Development

### Backend Development Script
```bash
cd backend
npm run dev
```

### Build Frontend
```bash
cd frontend
npm run build
```

### Preview Frontend Production Build
```bash
cd frontend
npm run preview
```

---

## 📋 Common Tasks

### Check All Environment Variables
```bash
cd backend
type .env
```

### View Server Logs
Backend logs appear in the terminal where you ran `npm start`

### Restart Server
1. Press `Ctrl+C` in terminal
2. Run `npm start` again

### Clear Previous Data (Development)
```bash
# Stop server first (Ctrl+C)
# Then manually delete data in MongoDB Atlas
# Or use MongoDB Compass to clear collections
```

---

## 🗄️ MongoDB Atlas

### Access Database
1. Visit: https://cloud.mongodb.com
2. Login with your credentials
3. Navigate to Clusters → QuickHire database

### View Collections
- **users** - All registered users
- **otps** - Active OTP codes (auto-expire after 10 min)

---

## 📧 Brevo Email Service

### Access Dashboard
1. Visit: https://www.brevo.com
2. Login with: kurvasidhu2112@gmail.com
3. Check sent emails in Campaigns → Email

---

## 🐛 Debugging

### Check Port Usage (Windows)
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### View All Running Node Processes
```powershell
Get-Process node
```

### Kill All Node Processes
```powershell
Stop-Process -Name node -Force
```

---

## 🔑 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:5000/api | Main API endpoint |
| Health Check | http://localhost:5000/api/health | Server status |
| Frontend | http://localhost:5173 | React app |
| MongoDB Atlas | https://cloud.mongodb.com | Database management |
| Brevo Dashboard | https://www.brevo.com | Email service |

---

## 📂 Directory Navigation

```bash
# Main project
cd c:\Users\siddu\OneDrive\Desktop\QuickHire

# Backend
cd c:\Users\siddu\OneDrive\Desktop\QuickHire\backend

# Frontend
cd c:\Users\siddu\OneDrive\Desktop\QuickHire\frontend
```

---

## 📡 API Testing

### Using PowerShell

**Health Check:**
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health
```

**Send OTP:**
```powershell
$body = @{
    email = "test@example.com"
    name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/auth/send-otp `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**Login:**
```powershell
$body = @{
    email = "test@example.com"
    password = "test1234"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/auth/login `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

### Using Postman
1. Import: `backend/QuickHire_API.postman_collection.json`
2. Set `base_url` to `http://localhost:5000`
3. Test each endpoint

---

## 🎯 Development Workflow

### Starting Your Day
```bash
# 1. Navigate to project
cd c:\Users\siddu\OneDrive\Desktop\QuickHire

# 2. Start backend (Terminal 1)
cd backend
npm start

# 3. Start frontend (Terminal 2)
cd frontend
npm run dev

# 4. Open browser
# Frontend: http://localhost:5173
# Backend: http://localhost:5000/api/health
```

### After Code Changes

**Backend Changes:**
- Stop server (Ctrl+C)
- Restart: `npm start`

**Frontend Changes:**
- Vite auto-reloads, no restart needed

**Environment Variable Changes:**
- Stop backend
- Restart: `npm start`

---

## 📝 Git Commands (If using version control)

```bash
# Check status
git status

# Add all files (except .env - protected by .gitignore)
git add .

# Commit
git commit -m "Your message"

# Push
git push origin main
```

**Note:** `.env` file is protected by `.gitignore` and won't be committed.

---

## 🆘 Quick Help

### Server won't start?
```bash
npm run verify
```

### Database connection issues?
```bash
node test-connection.js
```

### Email not working?
Check Brevo dashboard and SMTP credentials in `.env`

### Port already in use?
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## 💡 Pro Tips

1. **Keep two terminals open** - One for backend, one for frontend
2. **Use Postman** - Test API independently from frontend
3. **Check MongoDB Atlas** - Verify data is saving correctly
4. **Monitor logs** - Backend terminal shows all requests
5. **Clear browser cache** - If frontend behaves oddly

---

## 📚 Documentation Quick Access

- 📖 Setup Guide: `SETUP_GUIDE.md`
- 📖 Backend Status: `BACKEND_STATUS.md`
- 📖 Backend README: `backend/README.md`
- 📖 Troubleshooting: `backend/TROUBLESHOOTING.md`
- 📖 This File: `COMMANDS.md`

---

**Ready to code! 🎉**

Start with: `npm start` in backend, then `npm run dev` in frontend!
