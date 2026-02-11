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
import ManageJobs from './pages/dashboard/ManageJobs';
import AccountDetails from './pages/AccountDetails';
import Settings from './pages/Settings';
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/employers" element={<ManageEmployers />} />
            <Route path="/dashboard/employers/:id" element={<EmployerDetails />} />
            <Route path="/dashboard/employees" element={<ManageEmployees />} />
            <Route path="/dashboard/jobs" element={<ManageJobs />} />
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
