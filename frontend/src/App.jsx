import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import ShortlistedJobs from './pages/employee/ShortlistedJobs';
import MyApplications from './pages/employee/MyApplications';
import EmployerDashboard from './pages/employer/EmployerDashboard';
import AddJob from './pages/employer/AddJob';
import ManageJobs from './pages/employer/ManageJobs';
import Applications from './pages/employer/Applications';
import EmployerProfile from './pages/employer/EmployerProfile';
import HiredEmployees from './pages/employer/HiredEmployees';
import Payments from './pages/employer/Payments';
import Notifications from './pages/Notifications';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />

          {/* Employee Routes (Protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/shortlisted"
            element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <ShortlistedJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/profile"
            element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <EmployeeProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/applications"
            element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <MyApplications />
              </ProtectedRoute>
            }
          />

          {/* Shared Protected Routes - Notifications */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['jobseeker', 'employer']}>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Employer Routes (Protected) */}
          <Route
            path="/employer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EmployerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/add-job"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <AddJob />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/manage-jobs"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <ManageJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/applications"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <Applications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/hired-employees"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <HiredEmployees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/payments"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employer/profile"
            element={
              <ProtectedRoute allowedRoles={['employer']}>
                <EmployerProfile />
              </ProtectedRoute>
            }
          />
          {/* Add more routes as we build them */}
        </Routes>
        <Footer />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  );
}

export default App;
