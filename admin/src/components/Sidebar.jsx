import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    FaTachometerAlt,
    FaUsers,
    FaBriefcase,
    FaFileAlt,
    FaCreditCard,
    FaComments,
    FaExclamationTriangle,
    FaChartBar,
    FaSignOutAlt,
    FaBolt,
    FaUserShield
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('adminToken');
            window.location.href = '/login';
        }
    };

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <Link to="/" className="sidebar-logo">
                    <h2>QuickHire <span>Admin</span></h2>
                </Link>
            </div>
            <div className="sidebar-nav-container">
                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <FaTachometerAlt /> <span className="nav-text">Overview</span>
                    </NavLink>
                    
                    <NavLink to="/dashboard/activity-monitor" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <FaBolt /> <span className="nav-text">Live Monitor</span>
                    </NavLink>

                    <div className="nav-group-label">Management</div>
                    
                    <NavLink to="/dashboard/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <FaUserShield /> <span className="nav-text">User Control</span>
                    </NavLink>

                    <NavLink to="/dashboard/jobs" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <FaBriefcase /> <span className="nav-text">Manage Jobs</span>
                    </NavLink>

                    <NavLink to="/dashboard/applications" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <FaFileAlt /> <span className="nav-text">Tracking</span>
                    </NavLink>

                    <div className="nav-group-label">Financials</div>

                    <NavLink to="/dashboard/payments" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <FaCreditCard /> <span className="nav-text">Payments</span>
                    </NavLink>

                    <div className="nav-group-label">Safety</div>

                    <NavLink to="/dashboard/messages" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <FaComments /> <span className="nav-text">Logs</span>
                    </NavLink>

                    <NavLink to="/dashboard/reports" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <FaExclamationTriangle /> <span className="nav-text">Reports</span>
                    </NavLink>

                    <NavLink to="/dashboard/analytics" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <FaChartBar /> <span className="nav-text">Analytics</span>
                    </NavLink>
                </nav>
            </div>
            
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn">
                    <FaSignOutAlt /> <span className="nav-text">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
