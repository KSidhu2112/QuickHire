# 🚀 QuickHire — Complete Project Explanation for Placement Interviews

---

## 📌 1. Project Objective

**QuickHire** is a **full-stack job marketplace platform** designed to connect **blue-collar/gig workers** (drivers, helpers, delivery executives, cooks, electricians, etc.) with **employers** who need quick, reliable hiring.

> **In simple words:** "QuickHire is an on-demand hiring platform — think of it as an Uber for hiring daily-wage and part-time workers. Employers post jobs, workers apply, and the platform handles everything from application tracking, payment verification, trust scoring, dispute resolution, to AI-powered candidate matching."

### Why I Built This:
- India has **450M+ unorganized workers** who rely on word-of-mouth for jobs.
- There is no dedicated, tech-driven platform for **part-time, daily, and event-based** hiring.
- QuickHire solves this by digitizing the hiring pipeline with features like **OTP authentication, AI candidate search (RAG), escrow payments, trust scoring, and automated penalty systems**.

---

## 📌 2. Architecture Overview

QuickHire follows a **3-tier monorepo architecture** with three independently deployable applications:

```
┌──────────────────────────────────────────────────────────────────────┐
│                        QUICKHIRE PLATFORM                          │
├──────────────┬───────────────────────┬───────────────────────────────┤
│   FRONTEND   │     ADMIN PANEL       │         BACKEND (API)        │
│  (React+Vite)│    (React+Vite)       │      (Node.js+Express)       │
│  Port: 5173  │    Port: 5174         │       Port: 5000             │
│  Netlify     │    Netlify            │       Render                 │
├──────────────┴───────────────────────┴───────────────────────────────┤
│                          MongoDB Atlas (Cloud DB)                   │
│                     + Atlas Vector Search (AI/RAG)                  │
├──────────────────────────────────────────────────────────────────────┤
│                     External Services                               │
│  Razorpay (Payments) │ Brevo (Email/OTP) │ Groq LLM (AI Chatbot)  │
└──────────────────────────────────────────────────────────────────────┘
```

### Architecture Pattern: **MVC + Services Layer**
```
Client (React) → API Request → Routes → Middleware (Auth/Role) → Controller → Service → Model (MongoDB)
                                                                                          ↓
                                                                                    Response (JSON)
```

---

## 📌 3. Technologies Used

### Backend
| Technology       | Purpose                                         |
|------------------|-------------------------------------------------|
| **Node.js**      | Server-side JavaScript runtime                  |
| **Express.js 5** | Web framework for REST API                      |
| **MongoDB**      | NoSQL database (document-based)                 |
| **Mongoose 9**   | ODM (Object Document Mapping) for MongoDB       |
| **JWT**          | JSON Web Token for stateless authentication     |
| **bcryptjs**     | Password hashing with salt                      |
| **Razorpay SDK** | Payment gateway integration                     |
| **Groq SDK**     | AI/LLM integration (Llama 3.3 70B model)        |
| **Multer**       | File upload handling (resumes, proofs)           |
| **Nodemailer**   | Email sending (OTP, notifications)              |
| **node-cron**    | Cron job scheduler (penalties, auto-publish)     |
| **Axios**        | HTTP client for external API calls              |

### Frontend (User-Facing App)
| Technology          | Purpose                                       |
|---------------------|-----------------------------------------------|
| **React 19**        | UI library (component-based)                  |
| **Vite 7**          | Fast build tool and dev server                |
| **React Router v7** | Client-side routing/navigation                |
| **Axios**           | HTTP client for API calls                     |
| **Framer Motion**   | Animations and transitions                    |
| **React Toastify**  | Toast notification system                     |
| **React Icons**     | Icon library                                  |
| **Leaflet**         | Interactive map for nearby jobs (geospatial)  |
| **React Leaflet**   | React wrapper for Leaflet maps                |

### Admin Dashboard
| Technology        | Purpose                                         |
|-------------------|-------------------------------------------------|
| **React 19**      | UI library                                      |
| **Vite 7**        | Build tool                                      |
| **Chart.js**      | Data visualization (charts, graphs)             |
| **react-chartjs-2**| React wrapper for Chart.js                     |
| **react-hot-toast**| Toast notifications                            |
| **React Router v6**| Routing with nested layout                     |

### Cloud & Deployment
| Service              | Purpose                                      |
|----------------------|----------------------------------------------|
| **MongoDB Atlas**    | Cloud-hosted database                        |
| **Atlas Vector Search** | AI-powered semantic search (AutoEmbed)    |
| **Render**           | Backend hosting (Node.js)                    |
| **Netlify**          | Frontend and admin hosting (static)          |
| **Brevo (Sendinblue)** | Email/SMTP service for OTP & notifications|
| **Razorpay**         | Payment gateway (India-focused)              |
| **Groq Cloud**       | LLM API (Llama 3.3 70B Versatile)           |

---

## 📌 4. Features (Module-Wise)

### 👷 Employee (Job Seeker) Features
1. **OTP-Based Registration & Login** — Secure signup with email OTP verification
2. **Profile Completion System** — Multi-step profile with completeness percentage (60%+ required)
3. **Job Search & Filters** — Filter by job type, salary range, location, category
4. **Nearby Jobs (Geospatial)** — Location-based job discovery using Leaflet maps + MongoDB 2dsphere
5. **Job Application** — Apply with cover letter, resume, and availability details
6. **Application Tracking** — Track status (Applied → Under Review → Accepted/Rejected)
7. **Work Verification** — Start work → Submit work → Confirm payment received
8. **Dual Confirmation System** — Both parties must confirm work completion
9. **Rating & Review** — Rate employers after job completion (double-blind)
10. **Dispute Resolution** — Raise disputes for payment/work issues
11. **Trust Score** — Dynamic score (0–100) based on ratings, attendance, completions
12. **In-App Notifications** — Real-time notifications with bell badge count
13. **Razorpay Payment Checkout** — Pay application fees through secure gateway

### 🏢 Employer Features
1. **Job Posting** — Create jobs (Part-time, Full-time, Daily, Event-based, Shift-based)
2. **Job Management** — Edit, close, delete posted jobs
3. **Application Review** — View, shortlist, accept, or reject applicants
4. **Hired Employees Dashboard** — Track all hired workers and their status
5. **Dual Work Confirmation** — Confirm employee's work and release payment
6. **Escrow Payment System** — Lock salary amount before work begins
7. **AI Candidate Search (RAG Chatbot)** — Ask natural language queries to find best candidates
8. **Direct Hire** — Directly hire AI-matched candidates
9. **Job Alert Notifications** — AI-matched candidates receive automatic email alerts
10. **Employer Ratings** — Rate employees after work completion
11. **Payment History** — View all transaction records

### 🛡️ Admin Dashboard Features
1. **Analytics Dashboard** — Charts for users, jobs, applications, revenue
2. **User Management** — View, block, unblock users
3. **Employer Management** — Detailed employer profiles and activity
4. **Employee Management** — Detailed worker profiles and stats
5. **Job Oversight** — Monitor all posted jobs
6. **Application Tracking** — Monitor all applications across the platform
7. **Payment Monitoring** — View all transactions with CSV export
8. **Dispute/Report Management** — Review and resolve disputes
9. **Support Requests** — Handle contact form submissions
10. **Activity Monitor** — Real-time activity logs
11. **Communication Logs** — Track system notifications

---

## 📌 5. Folder Structure

```
QuickHire/
├── backend/                          # Node.js + Express API Server
│   ├── server.js                     # Entry point — Express app, routes, MongoDB, cron
│   ├── package.json                  # Dependencies & scripts
│   ├── controllers/                  # Business logic (15 controllers)
│   │   ├── authController.js         # Register, Login, OTP, Forgot Password
│   │   ├── jobController.js          # CRUD for jobs, search, filters
│   │   ├── applicationController.js  # Apply, accept, reject, hire, confirm
│   │   ├── paymentController.js      # Razorpay order, verify, history
│   │   ├── verificationController.js # Dual confirmation, escrow, penalties
│   │   ├── ragController.js          # AI chatbot queries
│   │   ├── ratingController.js       # Submit & manage ratings
│   │   ├── reviewController.js       # Create & fetch reviews
│   │   ├── disputeController.js      # Raise & resolve disputes
│   │   ├── adminController.js        # Admin data endpoints
│   │   ├── employerController.js     # Employer-specific operations
│   │   ├── employeeProfileController.js # Profile CRUD, trust score
│   │   ├── contactController.js      # Contact form & support
│   │   ├── notificationController.js # Fetch, read, clear notifications
│   │   └── jobNotificationController.js # AI job match notifications
│   ├── models/                       # Mongoose schemas (21 models)
│   │   ├── User.js                   # Users (jobseeker/employer/admin)
│   │   ├── Job.js                    # Job listings with GeoJSON
│   │   ├── Application.js            # Applications with escrow & timeline
│   │   ├── EmployeeProfile.js        # Detailed worker profiles + trust
│   │   ├── Payment.js                # Razorpay payment records
│   │   ├── Notification.js           # In-app notifications
│   │   ├── Dispute.js                # Disputes with admin actions
│   │   ├── Review.js                 # Double-blind reviews
│   │   ├── OTP.js                    # OTP storage with auto-delete
│   │   ├── QuickhireRagData.js       # Vector search data for RAG
│   │   └── ... (11 more)
│   ├── routes/                       # Express route definitions (15 files)
│   ├── middleware/                    # Auth, Role, Upload middleware
│   │   ├── authMiddleware.js         # JWT token verification
│   │   ├── roleMiddleware.js         # Role-based access control
│   │   └── uploadMiddleware.js       # Multer file upload config
│   ├── services/                     # Business services layer (7 files)
│   │   ├── ragService.js             # AI/RAG with Groq + Atlas Vector
│   │   ├── penaltyService.js         # Auto-penalty cron logic
│   │   ├── ratingService.js          # Rating stats + trust calculation
│   │   ├── reviewService.js          # Auto-publish reviews
│   │   ├── notificationService.js    # Create & send notifications
│   │   ├── emailService.js           # Email templates via Brevo
│   │   └── jobMatchingService.js     # AI job-candidate matching
│   ├── utils/                        # Utility functions
│   │   └── emailService.js           # OTP & welcome email sender
│   └── scripts/                      # DB seed/check scripts
│
├── frontend/                         # React + Vite (User-Facing App)
│   ├── src/
│   │   ├── App.jsx                   # Main app with routing
│   │   ├── main.jsx                  # React entry point
│   │   ├── components/               # Reusable UI components (21 files)
│   │   │   ├── Navbar.jsx            # Navigation bar with role-based menus
│   │   │   ├── Footer.jsx            # Footer with links
│   │   │   ├── JobCard.jsx           # Job listing card component
│   │   │   ├── JobFilters.jsx        # Search/filter sidebar
│   │   │   ├── PaymentModal.jsx      # Razorpay checkout modal
│   │   │   ├── RatingModal.jsx       # Star rating modal
│   │   │   ├── TrustApplyModal.jsx   # Trust-based application modal
│   │   │   ├── NotificationBell.jsx  # Bell icon with unread count
│   │   │   ├── ProtectedRoute.jsx    # Role-based route guard
│   │   │   └── ...
│   │   ├── pages/                    # Page components
│   │   │   ├── Home.jsx              # Landing page
│   │   │   ├── Login.jsx             # Login page
│   │   │   ├── Signup.jsx            # Multi-step registration
│   │   │   ├── JobDetails.jsx        # Detailed job view
│   │   │   ├── AboutUs.jsx           # About page
│   │   │   ├── ContactUs.jsx         # Contact page
│   │   │   ├── employee/             # Employee-specific pages
│   │   │   │   ├── EmployeeDashboard.jsx
│   │   │   │   ├── CompleteProfile.jsx
│   │   │   │   ├── MyApplications.jsx
│   │   │   │   ├── NearbyJobs.jsx
│   │   │   │   ├── Checkout.jsx
│   │   │   │   └── ...
│   │   │   └── employer/             # Employer-specific pages
│   │   │       ├── EmployerDashboard.jsx
│   │   │       ├── AddJob.jsx
│   │   │       ├── ManageJobs.jsx
│   │   │       ├── Applications.jsx
│   │   │       ├── HiredEmployees.jsx
│   │   │       ├── EmployerChatbot.jsx  # AI RAG chatbot UI
│   │   │       ├── AiSearch.jsx         # AI candidate search
│   │   │       └── ...
│   │   ├── services/
│   │   │   └── api.js                # Centralized Axios API layer
│   │   └── utils/                    # Frontend utilities
│   └── vite.config.js
│
├── admin/                            # React + Vite (Admin Dashboard)
│   ├── src/
│   │   ├── App.jsx                   # Admin routing with nested layout
│   │   ├── components/               # Sidebar, Navbar, AdminLayout
│   │   └── pages/
│   │       ├── dashboard/            # Admin pages
│   │       │   ├── Dashboard.jsx
│   │       │   ├── ManageEmployers.jsx
│   │       │   ├── ManageEmployees.jsx
│   │       │   ├── ApplicationTracking.jsx
│   │       │   ├── PaymentMonitoring.jsx
│   │       │   ├── AnalyticsDashboard.jsx
│   │       │   ├── SupportRequests.jsx
│   │       │   └── ...
│   │       └── auth/                 # Admin auth pages
│
└── README.md
```

---

## 📌 6. Database Design (MongoDB Collections)

### Entity Relationship Diagram
```
┌──────────┐     1:N     ┌──────────┐     1:N     ┌──────────────┐
│   User   │────────────▶│   Job    │────────────▶│ Application  │
│(jobseeker│             │(employer │             │(job+jobseeker│
│/employer/│             │ posts)   │             │ +employer)   │
│ admin)   │             └──────────┘             └──────────────┘
└──────────┘                                            │
     │                                                  │
     │ 1:1                                         1:1  │
     ▼                                                  ▼
┌────────────────┐                             ┌──────────────┐
│EmployeeProfile │                             │   Dispute    │
│(detailed worker│                             │(raised for   │
│ profile + trust│                             │ conflict)    │
│ score)         │                             └──────────────┘
└────────────────┘
     │                    ┌──────────┐
     │                    │  Review  │◄──── double-blind ratings
     │                    └──────────┘
     ▼
┌────────────────┐       ┌──────────────┐      ┌────────────┐
│QuickhireRagData│       │ Notification │      │  Payment   │
│(vector search  │       │(in-app alerts│      │(Razorpay   │
│ embeddings)    │       │ 90-day TTL)  │      │ records)   │
└────────────────┘       └──────────────┘      └────────────┘
```

### Key Models Explained

#### **User Model** — Core entity for all users
```javascript
{
  name, email, password (hashed),
  role: 'jobseeker' | 'employer' | 'admin',
  status: 'active' | 'blocked' | 'suspended',
  isEmailVerified, isProfileComplete,
  profile: { skills, experience, education, company, ... },
  trustScore: 0–100,        // Dynamic trust score
  badges: ['VERIFIED', 'TOP_RATED', 'RISKY'],
  stats: {
    jobsCompleted, avgRating, reliabilityScore,
    noShows, latePayments, ...
  },
  walletBalance,
  blacklisted: { isBlacklisted, reason, bannedAt }
}
```

#### **Job Model** — Job listings with geospatial support
```javascript
{
  employer: ObjectId(User),
  title, description, company,
  jobType: 'PART_TIME' | 'FULL_TIME' | 'DAILY' | 'EVENT_BASED' | 'SHIFT_BASED',
  salaryType: 'HOURLY' | 'DAILY' | 'MONTHLY' | 'FIXED',
  salaryMin, salaryMax,
  location: { city, state, address, zipCode },
  coordinates: { type: 'Point', coordinates: [lng, lat] },  // GeoJSON
  workDate, startTime, endTime,
  workersRequired, workersHired,
  skills, experience, status: 'ACTIVE' | 'CLOSED' | 'EXPIRED',
  views, applicants,
  isUrgent, foodProvided, accommodation, immediateJoining
}
// Indexes: employer, jobType+status, location.city, coordinates(2dsphere)
```

#### **Application Model** — The most complex model (~235 fields)
```javascript
{
  job, jobseeker, employer,
  status: 'APPLIED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN',
  coverLetter, resumeUrl, availability,

  // ===== ESCROW SYSTEM =====
  paymentStatus: 'PENDING' | 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED',
  escrowAmount, escrowLockedAt, escrowReleasedAt,

  // ===== DUAL CONFIRMATION =====
  employerConfirmation: { confirmed, status, rating, feedback, proof, timestamp },
  employeeConfirmation: { confirmed, status, rating, feedback, proof, timestamp },

  // ===== LEGAL EVIDENCE TIMELINE =====
  timeline: {
    jobAcceptedAt, workStartedAt, workCompletedAt,
    paymentConfirmedAt, employerConfirmedAt, employeeConfirmedAt,
    disputeRaisedAt, disputeResolvedAt
  },

  // ===== PENALTY TRACKING =====
  penalty: { applied, percentage, amount, reason, appliedAt },

  // ===== DOUBLE-BLIND RATING =====
  employerRated, employeeRated, ratingPublished,

  // ===== TRUST FEATURES =====
  trustDetails: { contactMobile, paymentMethod, paymentValue }
}
```

#### **EmployeeProfile Model** — Detailed worker profile for AI/RAG
```javascript
{
  user: ObjectId(User),
  profilePhoto, currentLocation: { city, state, pincode },
  languages: ['Hindi', 'English'],
  preferredCategories: ['Driver', 'Delivery', 'Cook', ...],
  preferredWorkType: ['Full-Time', 'Daily Wage'],
  expectedSalary: { min, max, type_period },
  skills, yearsOfExperience,
  previousWorkExperience: [{ jobTitle, company, duration }],
  certifications,
  candidateSummary: String,  // Auto-generated text for RAG
  profileCompleteness: 0–100,
  trustScore: 0–100,
  ratings: {
    workQuality: { total, count },
    punctuality: { total, count },
    reliability: { total, count },
    behavior: { total, count },
    communication: { total, count }
  },
  attendanceHistory: { totalAssigned, totalAttended, noShows },
  rehireCount, isVerified
}
```

---

## 📌 7. API Flow (Request Lifecycle)

### Example: Job Application Flow
```
1. Employee clicks "Apply" on a job
        ↓
2. Frontend sends POST /api/applications/:jobId
   Headers: { Authorization: "Bearer <JWT_TOKEN>" }
   Body: { coverLetter, availability }
        ↓
3. Express Router → applicationRoutes.js matches route
        ↓
4. authMiddleware.js (protect) — extracts & verifies JWT token
   → Finds user in DB, attaches to req.user
        ↓
5. roleMiddleware.js (checkRole(['jobseeker'])) — verifies role
        ↓
6. applicationController.js → applyForJob()
   → Validates: user hasn't already applied
   → Validates: job exists and is ACTIVE
   → Validates: payment completed (for paid jobs)
   → Creates Application document
   → Increments job.applicants count
   → Sends notification to employer
   → Returns success response
        ↓
7. Frontend receives JSON → updates UI → shows toast
```

### Complete API Routes Map
```
Auth Routes:         POST /api/auth/send-otp
                     POST /api/auth/register
                     POST /api/auth/login
                     GET  /api/auth/me
                     POST /api/auth/forgot-password
                     POST /api/auth/reset-password

Job Routes:          GET  /api/jobs                    (list with filters)
                     GET  /api/jobs/:id                (single job)
                     POST /api/jobs                    (create — employer)
                     PUT  /api/jobs/:id                (update — employer)
                     DELETE /api/jobs/:id              (delete — employer)
                     GET  /api/jobs/employer/my-jobs

Application Routes:  POST /api/applications/:jobId     (apply)
                     GET  /api/applications             (my applications)
                     GET  /api/applications/stats       (stats)
                     PUT  /api/applications/:id/status  (accept/reject)
                     DELETE /api/applications/:id       (withdraw)
                     POST /api/applications/direct-hire (AI direct hire)

Verification Routes: POST /api/verification/:id/start-work
                     POST /api/verification/:id/submit-work
                     POST /api/verification/:id/employer-confirm
                     POST /api/verification/:id/employee-confirm
                     POST /api/verification/:id/lock-escrow
                     GET  /api/verification/:id/timeline

Payment Routes:      POST /api/payments/create-order
                     POST /api/payments/verify-payment
                     GET  /api/payments/history

RAG Routes:          POST /api/rag/query               (AI chatbot)
                     POST /api/rag/sync                 (sync vectors)

Rating Routes:       POST /api/rating/submit
Notification Routes: GET  /api/notifications
                     PUT  /api/notifications/mark-all-read
```

---

## 📌 8. Authentication & Authorization

### Authentication (Who are you?)
```
Registration Flow:
1. User enters email → POST /api/auth/send-otp
2. Backend generates 6-digit OTP → stores in OTP collection (TTL: 10 min)
3. Sends OTP to email via Brevo SMTP
4. User enters OTP + details → POST /api/auth/register
5. Backend verifies OTP → hashes password (bcrypt, 10 rounds) → creates User
6. Generates JWT token (payload: { id: userId }, secret: JWT_SECRET)
7. Returns { token, user } → Frontend stores in localStorage

Login Flow:
1. POST /api/auth/login with { email, password }
2. Backend finds user → bcrypt.compare(password, hashedPassword)
3. If match → generates new JWT → returns { token, user }
```

### Authorization (What can you do?)
```
Three-Layer Authorization:

Layer 1: authMiddleware.js (protect)
  → Extracts token from "Bearer <token>" header
  → jwt.verify(token, JWT_SECRET) → gets userId
  → Finds user in DB → attaches to req.user

Layer 2: roleMiddleware.js (checkRole)
  → checkRole(['employer']) ensures only employers can post jobs
  → checkRole(['jobseeker']) ensures only jobseekers can apply
  → checkRole(['admin']) ensures only admins can access admin routes

Layer 3: Resource Ownership (checkResourceOwner)
  → Ensures an employer can only edit THEIR OWN jobs
  → Ensures a jobseeker can only withdraw THEIR OWN applications
```

### Frontend Route Protection
```jsx
<ProtectedRoute allowedRoles={['employer']}>
  <EmployerDashboard />
</ProtectedRoute>
// If user is not logged in → redirects to /login
// If user role doesn't match → redirects to home
```

---

## 📌 9. Key Modules — Deep Dive

### 🤖 Module 1: AI-Powered Candidate Search (RAG System)

**What it does:** Employers can ask natural language questions like *"Find me an experienced driver in Mumbai who is available immediately"* and get AI-generated answers with matched candidates.

**How it works (RAG = Retrieval-Augmented Generation):**
```
Step 1: DATA SYNC
  - Employee profiles are converted to text summaries
  - Text is stored in QuickhireRagData collection
  - MongoDB Atlas AutoEmbed automatically generates vector embeddings

Step 2: QUERY PROCESSING (when employer asks a question)
  - Employer query → MongoDB Atlas Vector Search ($vectorSearch)
  - Uses "autoembed_index" on "candidateSummary" field
  - Returns top 5 most semantically similar candidates

Step 3: ANSWER GENERATION
  - Retrieved candidate profiles become the "context"
  - Context + query → sent to Groq API (Llama 3.3 70B model)
  - LLM generates a human-readable answer

Step 4: PRIVACY GUARDRAILS
  - System prompt strictly prevents revealing emails, phone numbers,
    Aadhaar, PAN, or any personal contact info
  - Only job-relevant info (skills, ratings, trust score) is shared
```

**Key Code (ragService.js):**
```javascript
const pipeline = [
  {
    "$vectorSearch": {
      "index": "autoembed_index",
      "path": "candidateSummary",
      "query": query,           // Natural language query
      "numCandidates": 100,
      "limit": 5
    }
  }
];
const searchResults = await QuickhireRagData.aggregate(pipeline);
// → Send results + query to Groq LLM for answer generation
```

---

### 💰 Module 2: Escrow Payment & Verification System

**What it does:** Protects both parties — employer locks salary before work starts, money is released only after dual confirmation.

**Flow:**
```
1. Employer posts job → Worker applies → Employer accepts
2. Employer locks salary in ESCROW → paymentStatus: 'HELD_IN_ESCROW'
3. Worker starts work → workStatus: 'IN_PROGRESS'
4. Worker submits work proof → workStatus: 'SUBMITTED'
5. Employer confirms work → employerConfirmation.confirmed = true
6. Worker confirms payment → employeeConfirmation.confirmed = true
7. BOTH confirmed? → escrow released → stats updated → review unlocked
```

**Dual Confirmation Logic (verificationController.js):**
```javascript
async function handleDualConfirmation(application) {
  if (application.employerConfirmation.confirmed &&
      application.employeeConfirmation.confirmed) {
    // Both confirmed → release escrow
    await releaseEscrow(application);
    // Update completion stats for both users
    await updateCompletionStats(application);
    // Unlock reviews (double-blind)
    application.workStatus = 'COMPLETED';
    await application.save();
  }
}
```

---

### ⚠️ Module 3: Auto-Penalty System (Cron Job)

**What it does:** Automatically sends reminders and applies penalties for late confirmations.

**How it works:**
```
Cron runs every hour: cron.schedule('0 * * * *', runPenaltyCheck)

Check 1: Employee confirmed, Employer hasn't
  → 24 hours → Send reminder notification
  → 48 hours → Apply 5% penalty + reduce employer trust score by 5

Check 2: Employer confirmed, Employee hasn't
  → 24 hours → Send reminder to employee
```

**Key Logic:**
```javascript
const hoursSinceConfirmation = (Date.now() - confirmationTime) / (1000 * 60 * 60);
if (hoursSinceConfirmation >= 48 && !app.penalty?.applied) {
  app.penalty = {
    applied: true,
    percentage: 5,
    amount: escrowAmount * 0.05,
    reason: 'Late confirmation (48+ hours)'
  };
  employer.trustScore = Math.max(0, employer.trustScore - 5);
}
```

---

### ⭐ Module 4: Trust Score & Rating System

**Trust Score Calculation (0–100):**
```
Base Score:           50 points
+ Employer Ratings:   up to +20 (overallRating/5 × 20)
+ Completed Jobs:     up to +15 (1.5 per job, capped at 15)
+ Profile Completeness: up to +10 (completeness% × 0.1)
+ Attendance History:  up to +10 (attendance rate × 10)
  - No-Show Penalty:  -2 per no-show
+ Rehire Rate:        up to +5
+ Verification Bonus: +5 if verified
```

**Double-Blind Rating System:**
- Both employer and employee can rate each other
- Reviews are hidden (`isPublished: false`) initially
- After 48 hours OR both parties rated → reviews published
- This prevents retaliation bias in ratings

**Badge System:**
```
VERIFIED  → email verified
TOP_RATED → avgRating ≥ 4.5 AND 5+ reviews
MODERATE  → trustScore between 50–80
RISKY     → trustScore below 50
```

---

### 📧 Module 5: AI Job Matching & Email Notifications

**When a new job is posted:**
```
1. Job → converted to text description (title, skills, location, category)
2. Text → MongoDB Atlas Vector Search against all candidate summaries
3. Candidates with score ≥ 0.7 threshold → selected
4. Job notifications stored in DB for tracking
5. Email alerts sent to matched candidates via Brevo SMTP
6. Runs asynchronously (setImmediate) to avoid blocking
```

---

## 📌 10. Important Code Logic

### Password Hashing (User Model Pre-Save Hook)
```javascript
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;  // Only hash if password changed
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
```
**Why this matters:** The `isModified` check prevents re-hashing on every save.

### JWT Token Auto-Injection (Frontend Axios Interceptor)
```javascript
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('quickhire_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
**Why this matters:** Every API call automatically includes the auth token.

### 401 Auto-Logout (Frontend Response Interceptor)
```javascript
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('quickhire_token');
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);
```
**Why this matters:** If token expires, user is automatically logged out.

### Job Auto-Expiry (Job Model Pre-Save Hook)
```javascript
jobSchema.pre('save', async function () {
  if (['DAILY', 'EVENT_BASED'].includes(this.jobType) && this.workDate) {
    if (new Date(this.workDate) < new Date() && this.status === 'ACTIVE') {
      this.status = 'EXPIRED';  // Auto-expire past jobs
    }
  }
});
```

### Notification Auto-Delete (TTL Index)
```javascript
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
```
**Why this matters:** MongoDB automatically cleans up old notifications.

---

## 📌 11. Challenges Faced & Solutions

| # | Challenge | Solution |
|---|-----------|----------|
| 1 | **Preventing bias in reviews** — If employer sees employee's bad review first, they give a retaliatory bad review | Implemented **double-blind rating** — reviews stay hidden until both parties rate OR 48 hours pass. Managed through `isPublished` flag and `autoPublishReviews` cron |
| 2 | **Protecting worker personal data in AI chatbot** — RAG could expose emails, phone numbers | Added strict **privacy guardrails** in the LLM system prompt + never store email/phone in RAG data collection + only share job-relevant info |
| 3 | **Handling payment disputes fairly** — Employer says work not done, worker says it was | Built **Dual Confirmation System** with proof uploads + legal evidence timeline + admin arbitration through Dispute model with priority levels |
| 4 | **Ensuring employers pay on time** — No accountability for late payments | Created **Auto-Penalty Cron System** — 24hr reminder, 48hr automatic 5% penalty, trust score reduction, admin alerting |
| 5 | **Finding relevant candidates from free-text queries** — Traditional keyword search fails for "I need a good cook in Delhi" | Integrated **MongoDB Atlas Vector Search (AutoEmbed)** with **Groq LLM (Llama 3.3 70B)** for semantic RAG search with fallback to regex text search |
| 6 | **Managing complex application state** — Application goes through 15+ state changes | Designed detailed **Application model** with nested objects (employerConfirmation, employeeConfirmation, timeline, penalty) + pre-save hooks for state transitions |
| 7 | **Geospatial job search** — Workers need to find jobs near their location | Used **MongoDB 2dsphere index** on GeoJSON coordinates + **Leaflet maps** on the frontend for visual nearby job discovery |
| 8 | **Token expiry handling** — Users get stuck on pages when token expires | Implemented **Axios response interceptor** that auto-clears localStorage and redirects to login on any 401 response |
| 9 | **Scaling email notifications for AI-matched jobs** — Sending emails to 100+ candidates blocks the main thread | Used `setImmediate()` for **non-blocking background email delivery** + bulk insert job notifications for state tracking |
| 10 | **Profile completeness enforcement** — Workers with empty profiles provide no value | Built **percentage-based completeness calculator** (10 weighted fields) — profile must be ≥60% complete to be considered "ready" |

---

## 📌 12. Possible Interviewer Questions & Answers

### Architecture & Design

**Q1: Why did you choose MongoDB over SQL (MySQL/PostgreSQL)?**
> MongoDB was the ideal choice because:
> - Our data is **semi-structured** — job listings, user profiles, and applications have varying fields depending on job type (daily, part-time, event-based)
> - MongoDB supports **nested documents** natively — we embed employer/employee confirmations, timeline, and proof uploads directly within the Application document
> - **Atlas Vector Search** is built-in — we needed semantic AI search for our RAG chatbot, and MongoDB Atlas provides AutoEmbed indexing without needing a separate vector database
> - **2dsphere indexes** for geospatial "nearby jobs" are first-class in MongoDB
> - The **flexible schema** allowed rapid prototyping — we iterated quickly on 21 models

**Q2: Explain the difference between your frontend and admin panel. Why are they separate apps?**
> They serve different user bases with different needs:
> - **Frontend** is for jobseekers and employers — focuses on job discovery, application flow, payments, and AI search
> - **Admin panel** is for platform administrators — focuses on analytics, user management, dispute resolution, and monitoring
> - Separating them provides **security** (admin routes are isolated), **independent deployment** (deploy admin without affecting users), and **different UI patterns** (admin uses sidebar layout with Chart.js dashboards, frontend uses traditional navbar)
> - Both share the **same backend API** via different route groups

**Q3: How does your application handle scalability?**
> Several architectural decisions support scalability:
> - **Stateless JWT Authentication** — no server-side sessions, any backend instance can handle any request
> - **MongoDB indexes** on frequently queried fields (employer+createdAt, status+createdAt, 2dsphere for geo)
> - **Cron-based background processing** for penalties and review publishing (doesn't block API requests)
> - **setImmediate()** for non-blocking email notifications
> - **Separate read/write patterns** — admin reads from same DB but different endpoints
> - Ready for **horizontal scaling** on Render with MongoDB Atlas handling DB scaling

---

### Authentication & Security

**Q4: Why OTP-based registration instead of just email+password?**
> OTP-based registration provides:
> - **Email verification built-in** — we know the email is real and owned by the user
> - **Prevents fake accounts** — spammers can't mass-register with disposable emails
> - **Better UX for blue-collar workers** — remembering passwords is harder, OTP is simpler
> - We store OTPs with **10-minute auto-expiry** (MongoDB TTL index), so expired OTPs are automatically cleaned up

**Q5: How do you handle JWT token expiry and security?**
> - JWT tokens contain only the `userId` — minimal payload, no sensitive data
> - Frontend Axios interceptor **auto-detects 401 responses** → clears localStorage → redirects to login
> - Password field has `select: false` in Mongoose schema — **never returned** in any API response unless explicitly selected
> - We use **bcrypt with salt factor 10** — each password gets a unique salt, making rainbow table attacks impossible
> - Token verification in middleware uses `try-catch` — expired/malformed tokens are caught and returned as 401

**Q6: Explain Role-Based Access Control in your project.**
> Three roles: `jobseeker`, `employer`, `admin`.
> - **Route-level protection** using `protect` middleware (checks JWT) + `checkRole(['employer'])` (checks role)
> - **Resource ownership** using `checkResourceOwner` middleware — e.g., employer can only edit their own jobs
> - **Frontend protection** using `ProtectedRoute` component with `allowedRoles` prop
> - Example: `POST /api/jobs` → `protect` → `checkRole(['employer'])` → `createJob()`
> Even if someone gets a valid JWT for a jobseeker account, they **cannot** post jobs because the role check will fail with a 403

---

### Technical Deep-Dive

**Q7: Explain the RAG (Retrieval-Augmented Generation) system.**
> It's a 3-step AI system:
> 1. **Data Preparation** — Employee profiles are converted to rich text summaries containing skills, experience, location, ratings, trust score. These are stored in `QuickhireRagData` collection. MongoDB Atlas AutoEmbed automatically generates vector embeddings.
> 2. **Retrieval** — When an employer asks a query, we use MongoDB `$vectorSearch` with the AutoEmbed index to find the top 5 semantically similar candidates. It's like a smart Google — "find good drivers in Delhi" would match profiles even if they say "cab operator" or "chauffeur".
> 3. **Generation** — The retrieved profiles + original query are sent to Groq API (Llama 3.3 70B model). The LLM generates a natural language answer summarizing the best candidates.
> 4. **Fallback** — If vector search returns 0 results (e.g., index not available), we fall back to regex text search.
> 5. **Privacy** — A strict system prompt prevents the LLM from revealing personal contact information.

**Q8: What is the Escrow system and why did you build it?**
> The escrow system protects both parties in the payment cycle:
> - **Problem:** In gig work, employers might not pay after work is done, or workers might not show up after getting advance payment
> - **Solution:** Employer "locks" the salary amount before work begins (`paymentStatus: 'HELD_IN_ESCROW'`). The money sits in a virtual hold.
> - After work completion, **both parties must confirm** (dual confirmation). Only when both say "yes" does the escrow get released.
> - If there's a disagreement → Dispute is raised → Admin arbitrates
> - The entire flow is tracked through a **legal evidence timeline** with timestamps for every action

**Q9: Explain the Trust Score algorithm.**
> Trust Score is a composite metric (0–100) calculated from:
> - **Base:** 50 points (every new worker starts here)
> - **Ratings:** Up to +20 (based on overall rating out of 5)
> - **Completed Jobs:** Up to +15 (1.5 per completed job)
> - **Profile Completeness:** Up to +10 (proportional to % filled)
> - **Attendance:** Up to +10 (presence rate), minus 2 per no-show
> - **Rehire Rate:** Up to +5 (how often employers re-hire this worker)
> - **Verification:** +5 if email verified
> - It's recalculated dynamically on profile updates and new ratings
> - Badges (VERIFIED, TOP_RATED, MODERATE, RISKY) are auto-assigned based on score thresholds

**Q10: How does the auto-penalty system work?**
> It's a cron job that runs every hour:
> - Finds all applications where one party confirmed but the other hasn't
> - **24 hours delay** → sends a reminder notification
> - **48 hours delay** → applies a 5% penalty on the escrow amount, reduces the defaulter's trust score by 5, and alerts admins
> - This creates **accountability** — both parties are incentivized to confirm promptly
> - Penalties are tracked in the Application model with `penalty.applied`, `penalty.amount`, and `penalty.reason`

---

### Frontend & UX

**Q11: How do you manage state in the frontend without Redux/Context API?**
> We keep it practical:
> - **Local component state** (`useState`) for form data, modals, loading states
> - **localStorage** for authentication persistence (`quickhire_token`, `quickhire_user`)
> - **Centralized API layer** (`services/api.js`) with Axios instance — handles token injection and 401 auto-logout
> - Each page fetches its own data on mount using `useEffect` — keeps components independent
> - For simple projects, this approach avoids the complexity overhead of Redux while maintaining clean separation

**Q12: What is ProtectedRoute and how does it work?**
> It's a wrapper component that:
> 1. Checks if user is logged in (checks localStorage for token)
> 2. Checks if user's role matches `allowedRoles` prop
> 3. If valid → renders children
> 4. If not logged in → redirects to `/login`
> 5. If role mismatch → redirects to home page
> Used like: `<ProtectedRoute allowedRoles={['employer']}><AddJob/></ProtectedRoute>`

**Q13: How did you integrate the Razorpay payment gateway?**
> Two-step payment flow:
> 1. **Create Order** — Frontend calls `POST /api/payments/create-order` → Backend creates a Razorpay order using the SDK → returns `orderId` to frontend
> 2. **Payment Modal** — Frontend opens the Razorpay Checkout modal with the `orderId`. User completes payment.
> 3. **Verify Payment** — After payment, Razorpay sends `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature` to frontend. Frontend sends these to `POST /api/payments/verify-payment`.
> 4. **Backend Verification** — Backend generates HMAC SHA256 signature using `RAZ_SECRET_KEY` and compares with Razorpay's signature. If they match → payment is genuine → store in DB.
> 5. **Security** — Signature verification ensures no one tampered with the payment amount or order ID in transit.

---

### Database & Data

**Q14: What indexes have you created and why?**
> Key indexes for performance:
> - `{ employer: 1, createdAt: -1 }` on Jobs — fast lookup of "my recent jobs"
> - `{ jobType: 1, status: 1 }` on Jobs — efficient filtering
> - `{ coordinates: '2dsphere' }` on Jobs — geospatial "nearby" queries
> - `{ job: 1, jobseeker: 1 }` unique on Applications — prevents duplicate applications
> - `{ recipient: 1, read: 1, createdAt: -1 }` on Notifications — fast unread count
> - `{ createdAt: 1, expireAfterSeconds: 7776000 }` on Notifications — 90-day TTL auto-cleanup
> - `{ email: 1, otp: 1 }` on OTP — fast OTP verification lookup
> Without these indexes, queries on collections with 10K+ documents would be orders of magnitude slower

**Q15: How do you handle data consistency in MongoDB (which doesn't have SQL-like transactions)?**
> Several strategies:
> - **Compound unique indexes** — `{ job: 1, jobseeker: 1 }` on Applications prevents race conditions where a user applies twice
> - **Pre-save hooks** — Automatic state changes (e.g., auto-expire jobs) happen within the save operation
> - **Atomic operations** — Use `findOneAndUpdate` with conditions to prevent stale writes
> - For critical operations like dual confirmation, we check conditions inside a single function and save once — avoiding partial state
> - In the penalty system, we use `app.save()` after setting all penalty fields together

---

### Deployment & DevOps

**Q16: How is the project deployed?**
> - **Backend** → Render (Node.js web service), auto-deploys from GitHub
> - **Frontend** → Netlify (static build), CI/CD from GitHub
> - **Admin Dashboard** → Netlify (separate static build)
> - **Database** → MongoDB Atlas (M0 free tier, cloud-hosted)
> - **Environment Variables** → managed separately on each platform
> - CORS is configured to only allow requests from known frontend domains

**Q17: How do you handle CORS?**
> We whitelist specific origins:
> ```javascript
> const corsOptions = {
>   origin: [
>     'http://localhost:5173',              // local frontend
>     'http://localhost:5174',              // local admin
>     'https://quickhirecareer.netlify.app', // production frontend
>     'https://quickhire-1-k5vh.onrender.com' // production backend
>   ],
>   credentials: true
> };
> ```
> This prevents unauthorized websites from making API requests.

---

### Problem-Solving & Decision-Making

**Q18: If you had to redesign this project, what would you change?**
> - Add **WebSocket (Socket.io)** for real-time notifications instead of polling
> - Use **Redis** for session caching and rate limiting
> - Implement **proper unit tests** with Jest/Mocha
> - Move to **TypeScript** for type safety across the full stack
> - Use **Docker** containers for consistent dev/prod environments
> - Add **CI/CD pipelines** with automated testing
> - Consider **microservices** for RAG and notification services to scale independently

**Q19: What's the most complex piece of code in your project?**
> The **Application model and its verification controller**. The Application model has ~235 fields tracking the entire lifecycle — from initial application through escrow, dual confirmation, penalties, disputes, ratings, and payment. The `verificationController.js` (728 lines) orchestrates the complex state machine where every action (start work, submit work, employer confirm, employee confirm) triggers cascading updates across multiple models (User stats, trust scores, notifications, reviews). Getting the dual confirmation logic right — where the order of confirmations doesn't matter but both must happen — was the trickiest part.

**Q20: How would you add real-time chat between employer and employee?**
> I would:
> 1. Add **Socket.io** to the Express server
> 2. Create a `Message` model (sender, receiver, content, timestamps)
> 3. On connection, authenticate using JWT token
> 4. Create rooms based on application ID (employer-employee pair)
> 5. Emit messages in real-time, store in MongoDB for history
> 6. Add typing indicators and read receipts
> 7. On the frontend, create a ChatWindow component with message list and input
> The `Message` model already exists in our codebase — it just needs the real-time transport layer

---

## 📌 13. Quick Stats & Numbers

| Metric | Count |
|--------|-------|
| Backend Controllers | 15 |
| Mongoose Models | 21 |
| API Route Files | 15 |
| Backend Services | 7 |
| Frontend Components | 21 |
| Frontend Pages | 30+ |
| Admin Pages | 15+ |
| Total API Endpoints | 60+ |
| Cron Jobs | 2 (penalties, auto-publish reviews) |
| External Integrations | 4 (Razorpay, Brevo, Groq AI, MongoDB Atlas Vector Search) |
| Lines of Backend Code | ~8,000+ |
| Lines of Frontend Code | ~12,000+ |

---

## 📌 14. One-Liner Project Summary (for Resume/Introduction)

> *"QuickHire is a full-stack AI-powered job marketplace platform built with React, Node.js, Express, and MongoDB that connects blue-collar workers with employers. It features OTP-based authentication, AI-powered candidate search using RAG (Retrieval-Augmented Generation) with MongoDB Atlas Vector Search and Groq LLM, Razorpay payment integration with escrow system, dual confirmation work verification, automated penalty enforcement via cron jobs, a dynamic trust scoring algorithm, role-based access control, geospatial job search, and a dedicated admin dashboard with analytics — all deployed on Render and Netlify with MongoDB Atlas as the cloud database."*

---

> **Prepared for placement interviews. Practice explaining each section in your own words. Focus on WHY you made each decision, not just WHAT you built. Interviewers value problem-solving mindset over technical jargon.**

---
*Document generated for QuickHire Project — Last updated: October 2026*
