import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaSignInAlt, FaUserPlus, FaHome, FaBars, FaTimes, FaUserCircle, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import adminLogo from '../assets/admin-logo.png';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const toggleMenu = () => setIsOpen(!isOpen);
    const toggleProfileDropdown = () => setShowProfileDropdown(!showProfileDropdown);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setShowProfileDropdown(false);
        navigate('/login');
    };

    const handleAccountDetails = () => {
        setShowProfileDropdown(false);
        navigate('/account-details');
    };

    const handleSettings = () => {
        setShowProfileDropdown(false);
        navigate('/settings');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container container">
                <NavLink to="/" className="navbar-brand" onClick={() => setIsOpen(false)}>
                    <img src={adminLogo} alt="Admin Logo" className="brand-logo-img" />
                    QuickHire <span style={{ color: 'var(--text-primary)', fontWeight: '400' }}>Admin</span>
                </NavLink>

                <div className="navbar-toggle" onClick={toggleMenu}>
                    {isOpen ? <FaTimes /> : <FaBars />}
                </div>

                <ul className={`navbar-nav ${isOpen ? 'active' : ''}`}>
                    <li>
                        <NavLink
                            to="/"
                            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                            onClick={() => setIsOpen(false)}
                        >
                            <FaHome style={{ marginRight: '0.5rem' }} />
                            Overview
                        </NavLink>
                    </li>
                    {/* Simulated Auth Check - Replace with Context in production */}
                    {localStorage.getItem('adminToken') && (
                        <>
                            <li>
                                <NavLink
                                    to="/dashboard"
                                    className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                                    onClick={() => setIsOpen(false)}
                                >
                                    Dashboard
                                </NavLink>
                            </li>
                        </>
                    )}

                    <div className="nav-actions">
                        {localStorage.getItem('adminToken') ? (
                            <div className="profile-dropdown-container" ref={dropdownRef}>
                                <button
                                    className="profile-icon-btn"
                                    onClick={toggleProfileDropdown}
                                    aria-label="Profile menu"
                                >
                                    <FaUserCircle />
                                </button>

                                {showProfileDropdown && (
                                    <div className="profile-dropdown">
                                        <button
                                            className="dropdown-item"
                                            onClick={handleAccountDetails}
                                        >
                                            <FaUser className="dropdown-icon" />
                                            <span>Account Details</span>
                                        </button>
                                        <button
                                            className="dropdown-item"
                                            onClick={handleSettings}
                                        >
                                            <FaCog className="dropdown-icon" />
                                            <span>Settings</span>
                                        </button>
                                        <div className="dropdown-divider"></div>
                                        <button
                                            className="dropdown-item logout-item"
                                            onClick={handleLogout}
                                        >
                                            <FaSignOutAlt className="dropdown-icon" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <NavLink to="/login" className="btn btn-outline" onClick={() => setIsOpen(false)}>
                                    <FaSignInAlt style={{ marginRight: '0.5rem' }} />
                                    Login
                                </NavLink>
                                <NavLink to="/signup" className="btn btn-primary" onClick={() => setIsOpen(false)}>
                                    <FaUserPlus style={{ marginRight: '0.5rem' }} />
                                    Sign Up
                                </NavLink>
                            </>
                        )}
                    </div>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
