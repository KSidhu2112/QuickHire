# 🧪 EMPLOYER DASHBOARD - QUICK TESTING GUIDE

## 🚀 Getting Started

### 1. Start Both Servers
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Create Employer Account
1. Go to `http://localhost:5173`
2. Click "Sign Up"
3. Fill form with:
   - **Role:** Select "Employer"
   - Email: Any valid email
   - Password: At least 6 characters
4. Verify email with OTP
5. Login!

---

## 📋 Testing Checklist

### ✅ Dashboard Overview
**URL:** `/employer/dashboard`

**Test:**
1. View dashboard stats (should show 0s initially)
2. Click each quick action card:
   - ➕ Add New Job
   - 📝 Manage Jobs
   - 📥 View Applications
   - 👔 Hired Employees (backend ready)
   - 💰 Payments (backend ready)
   - ⚙️ Settings (backend ready)

**Expected:** All navigation should work smoothly

---

### ✅ Add Part-Time Job
**URL:** `/employer/add-job`

**Test:**
1. Click "Part-Time" button
2. Fill in:
   - Title: "Restaurant Waiter"
   - Company: "Taj Restaurant"
   - Category: "Restaurant"
   - Workers Required: 2
   - Description: "Need experienced waiters"
   - Working Hours: "6pm - 11pm"
   - Days Per Week: 6
   - Salary Type: "Daily"
   - Min Salary: 500
   - City: "Mumbai"
   - State: "Maharashtra"
   - Skills: "Customer Service, Communication"
   - Mark as Urgent: ✅
3. Click "Post Job"

**Expected:** Success message, redirect to Manage Jobs

---

### ✅ Add Full-Time Job
**URL:** `/employer/add-job`

**Test:**
1. Click "Full-Time" button
2. Fill in:
   - Title: "Office Assistant"
   - Company: "Tech Solutions"
   - Category: "Office"
   - Workers Required: 1
   - Description: "Need full-time office assistant"
   - Shift: "Day"
   - Joining Date: Select future date
   - Experience: "Entry"
   - Salary Type: "Monthly"
   - Min Salary: 15000
   - Max Salary: 18000
   - City: "Bangalore"
   - Education: "Graduate"
3. Click "Post Job"

**Expected:** Success message, redirect to Manage Jobs

---

### ✅ Add Daily Job (One-Day Event)
**URL:** `/employer/add-job`

**Test:**
1. Click "Daily / One-Day" button
2. Fill in:
   - Title: "Wedding Catering Helper"
   - Company: "Royal Caterers"
   - Category: "Catering"
   - Workers Required: 10
   - Description: "Need helpers for wedding event"
   - Work Date: Select tomorrow's date
   - Start Time: 10:00 AM
   - End Time: 11:00 PM
   - Food Provided: ✅
   - Salary Type: "Daily"
   - Payment: 1000
   - City: "Delhi"
   - Skills: "Hard Work, Team Work"
   - Mark as Urgent: ✅
3. Click "Post Job"

**Expected:** Success message, redirect to Manage Jobs

---

### ✅ Manage Jobs - Filters
**URL:** `/employer/manage-jobs`

**Test:**
1. View all posted jobs
2. Test filters:
   - Click "Active" - should show active jobs
   - Click "Urgent" - should show only urgent jobs
   - Click "Part-Time" - should show only part-time jobs
   - Click "Full-Time" - should show only full-time jobs
   - Click "Daily Jobs" - should show only daily jobs

**Expected:** Filter buttons work, job cards displayed correctly

---

### ✅ Manage Jobs - Actions
**Test each action:**

1. **View Applications**
   - Click "📥 Applications" on any job
   - Should navigate to applications page filtered by that job

2. **Toggle Urgent**
   - Click "🔥 Mark Urgent" on non-urgent job
   - Should toggle to urgent (badge appears)
   - Click "⭐ Remove Urgent"
   - Should remove urgent badge

3. **Close Job**
   - Click "🔒 Close Job" on active job
   - Confirm dialog
   - Job status should change to CLOSED
   - Badge should update

4. **Delete Job**
   - Click "🗑️ Delete" on a job
   - Confirm dialog
   - Job should disappear from list

**Expected:** All actions work smoothly with confirmations

---

### ✅ Applications Page
**URL:** `/employer/applications`

**Note:** You need to apply for jobs as a jobseeker first!

#### Step 1: Apply as Jobseeker
1. Logout from employer account
2. Create new jobseeker account OR login to existing
3. Go to employee dashboard
4. Apply for the jobs you created
5. Logout

#### Step 2: Test as Employer
1. Login back as employer
2. Go to `/employer/applications`

**Test Filters:**
- Click "All" - show all applications
- Click "New" - show APPLIED status
- Click "Shortlisted" - show UNDER_REVIEW status
- Click "Accepted" - show ACCEPTED status
- Click "Rejected" - show REJECTED status

**Test Actions:**
1. **View Details**
   - Click "👁️ View Details"
   - Modal should open with full candidate info
   - Test Call/WhatsApp buttons (should open phone/WhatsApp)
   - Click X or outside to close

2. **Shortlist Application**
   - Click "⭐ Shortlist" on any new application
   - Status should change to "UNDER_REVIEW"
   - Application moves to "Shortlisted" filter

3. **Accept Application**
   - Click "✅ Accept" on any application
   - Status should change to "ACCEPTED"
   - Application moves to "Accepted" filter
   - For daily jobs: workersHired should increment

4. **Reject Application**
   - Click "❌ Reject" on any application
   - Status should change to "REJECTED"
   - Application moves to "Rejected" filter

**Expected:** All filters and actions work correctly

---

## 🎨 Visual Testing

### Check Design Elements

1. **Animations**
   - Cards should slide up on page load
   - Buttons should have hover effects
   - Urgent badges should have pulse animation

2. **Responsiveness**
   - Test on different screen sizes
   - Cards should stack on mobile
   - Filters should wrap on smaller screens

3. **Colors & Gradients**
   - Purple-blue gradient background
   - Colorful stat cards
   - Status badges with appropriate colors
   - Smooth hover transitions

4. **Modal**
   - Should center properly
   - Semi-transparent overlay
   - Smooth fade-in animation
   - Close button works
   - Click outside to close

---

## 🔍 Backend Testing

### API Endpoints to Test

Use Postman or similar:

```bash
# Get Dashboard Stats
GET http://localhost:5000/api/employer/dashboard/stats
Headers: Authorization: Bearer <your_token>

# Get All Applications
GET http://localhost:5000/api/employer/applications
Headers: Authorization: Bearer <your_token>

# Shortlist Application
PUT http://localhost:5000/api/employer/applications/:id/shortlist
Headers: Authorization: Bearer <your_token>

# Get Hired Employees
GET http://localhost:5000/api/employer/hired-employees
Headers: Authorization: Bearer <your_token>

# Get Payment Summary
GET http://localhost:5000/api/employer/payments
Headers: Authorization: Bearer <your_token>

# Update Profile
PUT http://localhost:5000/api/employer/profile
Headers: Authorization: Bearer <your_token>
Body: { "company": "My Company", "businessType": "Restaurant" }
```

---

## 🐛 Common Issues & Fixes

### Issue 1: "Failed to fetch stats"
**Fix:** Check if backend is running and MongoDB is connected

### Issue 2: Jobs not showing
**Fix:** Make sure you're logged in as employer who created the jobs

### Issue 3: Can't see applications
**Fix:** Create jobseeker account and apply for jobs first

### Issue 4: API 403 Forbidden
**Fix:** Check if JWT token is valid and user has employer role

### Issue 5: Modal not opening
**Fix:** Check browser console for errors, refresh page

---

## ✅ Feature Verification

Mark as tested:

- [ ] Dashboard loads with stats
- [ ] Quick action cards navigate correctly
- [ ] Add Part-Time job works
- [ ] Add Full-Time job works
- [ ] Add Daily job works
- [ ] Urgent flag works
- [ ] All job filters work
- [ ] View applications button works
- [ ] Toggle urgent works
- [ ] Close job works
- [ ] Delete job works
- [ ] Application filters work
- [ ] View details modal works
- [ ] Shortlist works
- [ ] Accept works
- [ ] Reject works
- [ ] Call/WhatsApp buttons work
- [ ] Workers hired updates for daily jobs
- [ ] Mobile responsive design works
- [ ] All animations work smoothly

---

## 🎯 Production Readiness

### Before Deployment:

1. **Environment Variables**
   - Set proper MongoDB URI
   - Set JWT secret
   - Set email credentials

2. **Error Handling**
   - All API calls have try-catch
   - User-friendly error messages
   - Loading states everywhere

3. **Validation**
   - Form validation on frontend
   - Backend validation on all routes
   - Required field checks

4. **Security**
   - JWT authentication
   - Role-based access
   - Protected routes
   - Password hashing

---

## 🚀 Ready for Demo!

Your Employer Dashboard is **fully functional** and ready to demo for:
- Hackathons
- Interviews
- Portfolio showcase
- Client presentations

**Unique Selling Points:**
1. 🔥 Daily/One-Day Jobs feature
2. 💬 Direct WhatsApp/Call integration
3. 📊 Real-time analytics
4. 🎨 Premium modern design
5. ⚡ Smooth user experience

---

**Happy Testing! 🎉**
