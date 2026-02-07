# 🏗️ QuickHire - System Architecture

## 📋 Overview
QuickHire is a comprehensive job provider platform connecting employees with employers for part-time, full-time, and daily-wage jobs.

---

## 🎯 Core Features

### **For Employees (Job Seekers)**
- View jobs by type (Part-time, Full-time, Daily)
- Apply for jobs
- Track application status
- Filter jobs by location, type, date
- View application history

### **For Employers**
- Post jobs (Part-time, Full-time, Daily)
- Manage job listings
- Review applications
- Accept/Reject applicants
- Track workers for daily jobs

---

## 🗂️ Database Schema Design

### **1. User Schema** (Already Implemented ✅)
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['jobseeker', 'employer', 'admin'],
  isEmailVerified: Boolean,
  phone: String,
  profile: {
    avatar: String,
    bio: String,
    skills: [String],
    experience: String,
    education: String,
    resume: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### **2. Job Schema** (New)
```javascript
{
  employer: ObjectId (ref: User),
  title: String,
  description: String,
  company: String,
  jobType: Enum ['PART_TIME', 'FULL_TIME', 'DAILY'],
  
  // Salary
  salaryType: Enum ['HOURLY', 'DAILY', 'MONTHLY', 'FIXED'],
  salaryMin: Number,
  salaryMax: Number,
  
  // Location
  location: {
    city: String,
    state: String,
    address: String,
    zipCode: String
  },
  
  // For DAILY jobs
  workDate: Date,
  startTime: String,
  endTime: String,
  workersRequired: Number,
  workersHired: Number (default: 0),
  
  // Requirements
  skills: [String],
  experience: String,
  education: String,
  
  // Status
  status: Enum ['ACTIVE', 'CLOSED', 'EXPIRED'],
  deadline: Date,
  
  // Analytics
  views: Number (default: 0),
  applicants: Number (default: 0),
  
  createdAt: Date,
  updatedAt: Date
}
```

### **3. Application Schema** (New)
```javascript
{
  job: ObjectId (ref: Job),
  jobseeker: ObjectId (ref: User),
  employer: ObjectId (ref: User),
  
  status: Enum ['APPLIED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
  
  // Application details
  coverLetter: String,
  resumeUrl: String,
  availability: String,
  
  // Employer feedback
  employerNotes: String,
  reviewedAt: Date,
  reviewedBy: ObjectId (ref: User),
  
  createdAt: Date,
  updatedAt: Date
}

// Compound unique index: job + jobseeker (one application per job per user)
```

---

## 🛣️ API Endpoints

### **Authentication** (Already Implemented ✅)
```
POST   /api/auth/send-otp         - Send OTP for registration
POST   /api/auth/register         - Register user
POST   /api/auth/login            - Login user
GET    /api/auth/me               - Get current user (Protected)
```

### **Jobs**
```
GET    /api/jobs                  - Get all jobs (with filters)
GET    /api/jobs/:id              - Get single job
POST   /api/jobs                  - Create job (Employer only)
PUT    /api/jobs/:id              - Update job (Employer only)
DELETE /api/jobs/:id              - Delete job (Employer only)
GET    /api/jobs/my-jobs          - Get employer's jobs (Employer only)

// Filters: ?jobType=PART_TIME&location=Mumbai&date=2024-01-31
```

### **Applications**
```
GET    /api/applications           - Get user's applications (Job Seeker)
GET    /api/applications/:jobId    - Get applications for a job (Employer)
POST   /api/applications/:jobId    - Apply for job (Job Seeker)
PUT    /api/applications/:id       - Update application status (Employer)
DELETE /api/applications/:id       - Withdraw application (Job Seeker)
```

---

## 📁 Project Structure

```
QuickHire/
│
├── backend/
│   ├── controllers/
│   │   ├── authController.js       ✅ (Already implemented)
│   │   ├── jobController.js        🆕 (To implement)
│   │   └── applicationController.js 🆕 (To implement)
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js       ✅ (protect)
│   │   ├── roleMiddleware.js       🆕 (checkRole)
│   │   └── validationMiddleware.js 🆕 (validateJob, validateApplication)
│   │
│   ├── models/
│   │   ├── User.js                 ✅
│   │   ├── OTP.js                  ✅
│   │   ├── Job.js                  🆕
│   │   └── Application.js          🆕
│   │
│   ├── routes/
│   │   ├── authRoutes.js           ✅
│   │   ├── jobRoutes.js            🆕
│   │   └── applicationRoutes.js    🆕
│   │
│   ├── utils/
│   │   ├── emailService.js         ✅
│   │   └── helpers.js              🆕 (date formatting, etc.)
│   │
│   ├── .env                        ✅
│   ├── server.js                   ✅
│   └── package.json                ✅
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          ✅
│   │   │   ├── Footer.jsx          ✅
│   │   │   ├── JobCard.jsx         🆕
│   │   │   ├── JobFilters.jsx      🆕
│   │   │   ├── ApplicationCard.jsx 🆕
│   │   │   └── ProtectedRoute.jsx  🆕
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx            ✅
│   │   │   ├── Login.jsx           ✅
│   │   │   ├── Signup.jsx          ✅
│   │   │   │
│   │   │   ├── employee/
│   │   │   │   ├── Dashboard.jsx   🆕
│   │   │   │   ├── PartTimeJobs.jsx 🆕
│   │   │   │   ├── FullTimeJobs.jsx 🆕
│   │   │   │   ├── DailyJobs.jsx   🆕
│   │   │   │   ├── MyApplications.jsx 🆕
│   │   │   │   └── JobDetails.jsx  🆕
│   │   │   │
│   │   │   └── employer/
│   │   │       ├── Dashboard.jsx   🆕
│   │   │       ├── PostJob.jsx     🆕
│   │   │       ├── MyJobs.jsx      🆕
│   │   │       ├── EditJob.jsx     🆕
│   │   │       └── Applications.jsx 🆕
│   │   │
│   │   ├── services/
│   │   │   ├── api.js              ✅ (Extended with job/application APIs)
│   │   │   └── helpers.js          🆕
│   │   │
│   │   ├── App.jsx                 ✅ (Updated with routes)
│   │   └── main.jsx                ✅
│   │
│   └── package.json                ✅
│
└── Documentation/
    ├── ARCHITECTURE.md             🆕 (This file)
    ├── API_DOCS.md                 🆕
    └── DEPLOYMENT.md               🆕
```

---

## 🔐 Security & Authorization

### **Role-Based Access Control**
- **Job Seekers** can:
  - View all jobs
  - Apply for jobs
  - View their applications
  - Withdraw applications

- **Employers** can:
  - Create/update/delete their own jobs
  - View applications for their jobs
  - Accept/reject applications
  - View job analytics

- **Admin** can:
  - All of the above
  - Moderate jobs and applications

### **Middleware Stack**
```javascript
// Protected route
router.get('/jobs', protect, getJobs);

// Employer-only route
router.post('/jobs', protect, checkRole(['employer']), createJob);

// Job owner only
router.put('/jobs/:id', protect, checkRole(['employer']), checkJobOwner, updateJob);
```

---

## 🎨 Frontend Architecture

### **Routing**
```javascript
/                       - Home page (public)
/login                  - Login (public)
/signup                 - Signup (public)

// Job Seeker Routes (Protected, role: jobseeker)
/dashboard              - Job Seeker Dashboard
/jobs/part-time         - Part-time jobs
/jobs/full-time         - Full-time jobs
/jobs/daily             - Daily jobs
/jobs/:id               - Job details
/applications           - My applications

// Employer Routes (Protected, role: employer)
/employer/dashboard     - Employer Dashboard
/employer/post-job      - Post new job
/employer/jobs          - My job listings
/employer/jobs/:id/edit - Edit job
/employer/jobs/:id/applications - Job applications
```

### **State Management**
- **Context API** for:
  - Auth state (user, token, isLoggedIn)
  - Theme/UI preferences
  
- **Local state** (useState) for:
  - Form inputs
  - Loading states
  - Modal visibility

---

## 📊 Data Flow

### **Job Application Flow**
```
1. Job Seeker browses jobs
   ↓
2. Clicks "Apply" on a job
   ↓
3. Frontend calls: POST /api/applications/:jobId
   ↓
4. Backend validates:
   - User is authenticated
   - User hasn't applied before
   - Job is still active
   ↓
5. Creates application record
   ↓
6. Increments job.applicants count
   ↓
7. Returns success response
   ↓
8. Frontend updates UI (Applied ✅)
```

### **Application Review Flow**
```
1. Employer views applications
   ↓
2. Reviews each application
   ↓
3. Clicks "Accept" or "Reject"
   ↓
4. Frontend calls: PUT /api/applications/:id
   ↓
5. Backend updates status
   ↓
6. For daily jobs: increments workersHired
   ↓
7. Sends notification email (optional)
   ↓
8. Returns updated application
   ↓
9. Frontend updates UI
```

---

## 🚀 Deployment Architecture

### **Backend (Node.js)**
- Platform: Render / Railway / Heroku
- Database: MongoDB Atlas
- Environment: Node 18+
- Process: PM2 for production

### **Frontend (React)**
- Platform: Vercel / Netlify
- Build: Vite
- Environment: Production mode

---

## 📈 Future Enhancements

1. **Real-time Notifications**
   - Socket.io for instant updates
   - Application status changes
   - New job alerts

2. **Advanced Search**
   - Elasticsearch integration
   - Full-text search
   - Salary range filters
   - Skills matching

3. **Analytics Dashboard**
   - Application conversion rates
   - Popular job types
   - Location-based insights

4. **Reviews & Ratings**
   - Employer reviews by employees
   - Employee ratings
   - Job completion feedback

5. **Payment Integration**
   - Featured job listings
   - Premium employer accounts
   - Direct payment for daily jobs

---

## ✅ Implementation Priority

### **Phase 1** (Week 1)
- ✅ Authentication system (DONE)
- 🆕 Job model & APIs
- 🆕 Application model & APIs
- 🆕 Role-based middleware

### **Phase 2** (Week 2)
- 🆕 Employee Dashboard
- 🆕 Job listing pages
- 🆕 Application system
- 🆕 Job filters

### **Phase 3** (Week 3)
- 🆕 Employer Dashboard
- 🆕 Post/Edit job forms
- 🆕 Application management
- 🆕 Job analytics

### **Phase 4** (Week 4)
- 🆕 UI/UX polish
- 🆕 Testing & bug fixes
- 🆕 Deployment
- 🆕 Documentation

---

**This architecture provides a solid foundation for a production-ready job platform! Ready to implement? 🚀**
