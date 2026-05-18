import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/dashboard/Dashboard';
import ManageEmployers from './pages/dashboard/ManageEmployers';
import EmployerDetails from './pages/dashboard/EmployerDetails';
import ManageEmployees from './pages/dashboard/ManageEmployees';
import EmployeeDetails from './pages/dashboard/EmployeeDetails';
import ManageJobs from './pages/dashboard/ManageJobs';
import UserManagement from './pages/dashboard/UserManagement';
import ActivityMonitor from './pages/dashboard/ActivityMonitor';
import ApplicationTracking from './pages/dashboard/ApplicationTracking';
import PaymentMonitoring from './pages/dashboard/PaymentMonitoring';
import ReportManagement from './pages/dashboard/ReportManagement';
import AnalyticsDashboard from './pages/dashboard/AnalyticsDashboard';
import CommunicationLogs from './pages/dashboard/CommunicationLogs';
import AccountDetails from './pages/AccountDetails';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import AdminLayout from './components/AdminLayout';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Dashboard Routes with AdminLayout */}
            <Route path="/dashboard" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="employers" element={<ManageEmployers />} />
              <Route path="employers/:id" element={<EmployerDetails />} />
              <Route path="employees" element={<ManageEmployees />} />
              <Route path="employees/:id" element={<EmployeeDetails />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="activity-monitor" element={<ActivityMonitor />} />
              <Route path="applications" element={<ApplicationTracking />} />
              <Route path="payments" element={<PaymentMonitoring />} />
              <Route path="reports" element={<ReportManagement />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="messages" element={<CommunicationLogs />} />
              <Route path="jobs" element={<ManageJobs />} />
            </Route>

            <Route path="/account-details" element={<AccountDetails />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <Footer />
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
