# 🔧 Error Fix: 403 Forbidden on Shortlisted Jobs

## ❌ Error Description
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
Error fetching shortlisted jobs: AxiosError: Request failed with status code 403
```

## 🔍 Root Cause
The **403 Forbidden** error occurs when trying to access `/api/applications?status=ACCEPTED` because:

1. **Role Mismatch**: The route `/api/applications` requires the user to have the `jobseeker` role
2. **Possible Causes**:
   - User is logged in as an `employer` instead of `jobseeker`
   - Token is invalid or expired
   - User data in localStorage doesn't match the actual user role in the database

## ✅ Solution

### Fix 1: Add Better Error Handling in ShortlistedJobs.jsx

Update the component to handle 403 errors gracefully and redirect to login if needed.

</ Code>
```javascript
// In ShortlistedJobs.jsx, update the fetchShortlistedJobs function:

const fetchShortlistedJobs = async () => {
    setLoading(true);
    try {
        const response = await applicationAPI.getUserApplications({ status: 'ACCEPTED' });
        setApplications(response.applications || []);
    } catch (error) {
        console.error('Error fetching shortlisted jobs:', error);
        
        // Handle 403 Forbidden - user might be logged in with wrong role
        if (error.response?.status === 403) {
            toast.error('Access denied. Please log in as a job seeker.');
            authAPI.logout();
            navigate('/');
        } else if (error.response?.status === 401) {
            toast.error('Session expired. Please log in again.');
            authAPI.logout();
            navigate('/');
        } else {
            toast.error('Failed to load shortlisted jobs');
        }
    } finally {
        setLoading(false);
    }
};
```

### Fix 2: Verify User Role on Page Load

Add a more robust role check in the useEffect:

```javascript
useEffect(() => {
    const storedUser = authAPI.getStoredUser();
    const token = localStorage.getItem('quickhire_token');
    
    // Check if user is logged in
    if (!token || !storedUser) {
        toast.error('Please log in to continue');
        navigate('/');
        return;
    }
    
    // Check if user is a jobseeker
    if (storedUser.role !== 'jobseeker') {
        toast.error('This page is only accessible to job seekers');
        navigate('/employer/dashboard'); // Redirect employers to their dashboard
        return;
    }
    
    fetchShortlistedJobs();
}, [navigate]);
```

## 🧪 How to Test

### Step 1: Check Your Current Login
1. Open browser console (F12)
2. Run: `JSON.parse(localStorage.getItem('quickhire_user'))`
3. Check the `role` field - it should be `"jobseeker"`

### Step 2: If Role is Wrong
1. Log out completely
2. Log back in as a **job seeker** (not employer)
3. Try accessing the Shortlisted Jobs page again

### Step 3: Clear Cache if Needed
```javascript
// Run in browser console:
localStorage.clear();
// Then log in again
```

## 📝 Implementation

I'll update the ShortlistedJobs.jsx file with better error handling now.
