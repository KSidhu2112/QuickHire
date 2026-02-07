# Job Posting Troubleshooting Guide

## Current Issue
Getting 400 Bad Request when posting a job.

## Debugging Steps Added
✅ Added detailed logging to `backend/controllers/jobController.js`

The backend will now show:
- 📝 Request body received
- 👤 User making the request  
- ✅ Data being sent to database
- ❌ Detailed validation errors

## How to Debug

1. **Try posting a job** from the UI
2. **Check the backend terminal** - it will show detailed error logs
3. The logs will tell us exactly which field is failing validation

## Common Issues & Solutions

### Part-Time Jobs
**Required Fields:**
- `workingHours` (e.g., "4pm - 9pm") ✅
- `daysPerWeek` (number 1-7) ✅  
- `salaryType` should be "DAILY" or "MONTHLY"

### Full-Time Jobs
**Required Fields:**
- `shift` (DAY, NIGHT, ROTATIONAL, FLEXIBLE) ✅
- `salaryType` should be "MONTHLY"

### Daily Jobs  
**Required Fields:**
- `workDate` (future date) ✅
- `startTime` (HH:MM format) ✅
- `endTime` (HH:MM format) ✅
- `salaryType` should be "DAILY" or "FIXED"

## All Jobs Require:
- `title` (3-100 characters)
- `description` (min 20 characters)
- `company` name
- `jobType` (PART_TIME, FULL_TIME, or DAILY)
- `salaryMin` (positive number)
- `salaryType` (HOURLY, DAILY, MONTHLY, or FIXED)
- `location.city`

## Next Steps
After you try posting a job, check the backend terminal and share the error message. The new logging will show exactly what's wrong!

---
*Last Updated: 2026-02-01 14:23*
