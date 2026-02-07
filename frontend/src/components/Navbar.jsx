import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';
import userIcon from '../assets/user_icon.png';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import { authAPI } from '../services/api';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [activeLink, setActiveLink] = useState('home');
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest('.profile-menu-container')) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // Check if user is logged in
        const loggedIn = authAPI.isLoggedIn();
        setIsLoggedIn(loggedIn);
        if (loggedIn) {
            const storedUser = authAPI.getStoredUser();
            setUser(storedUser);
        }
    }, []);

    const handleLogout = () => {
        authAPI.logout();
        setIsLoggedIn(false);
        setUser(null);
        navigate('/');
    };

    const handleDashboard = () => {
        console.log('Navigating to dashboard. User:', user);
        if (user?.role === 'jobseeker') {
            navigate('/dashboard');
        } else if (user?.role === 'employer') {
            navigate('/employer/dashboard');
        } else {
            console.error('Unknown role or not logged in:', user?.role);
        }
    };

    return (
        <>
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="navbar-container">
                    {/* Left Side - Logo */}
                    <div className="navbar-left">
                        <div
                            className="navbar-logo"
                            onClick={() => navigate('/')}
                            style={{ cursor: 'pointer' }}
                        >
                            <img src={logo} alt="QuickHire Logo" />
                        </div>
                    </div>

                    {/* Center - Navigation Links */}
                    <ul className="navbar-menu">
                        <li>
                            <a
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveLink('home');
                                    navigate('/');
                                }}
                                style={{ cursor: 'pointer' }}
                                className={activeLink === 'home' ? 'active' : ''}
                            >
                                Home
                            </a>
                        </li>
                        <li>
                            <a
                                href="#about"
                                className={activeLink === 'about' ? 'active' : ''}
                                onClick={() => setActiveLink('about')}
                            >
                                About Us
                            </a>
                        </li>
                        <li>
                            <a
                                href="#contact"
                                className={activeLink === 'contact' ? 'active' : ''}
                                onClick={() => setActiveLink('contact')}
                            >
                                Contact Us
                            </a>
                        </li>
                    </ul>

                    {/* Right Side - Auth Buttons */}
                    <div className="navbar-right">
                        <div className="navbar-auth">
                            {isLoggedIn ? (
                                <>
                                    <NotificationBell />
                                    <button className="btn-dashboard" onClick={handleDashboard}>
                                        Dashboard
                                    </button>
                                    {/* <button className="btn-dashboard" onClick={handleDashboard}>
                                        Dashboard
                                    </button> */}

                                    <div className="profile-menu-container">
                                        <div
                                            className="navbar-profile-icon"
                                            onClick={() => setShowDropdown(!showDropdown)}
                                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                        >
                                            <img
                                                src={userIcon}
                                                alt="Profile"
                                                className="profile-avatar-img"
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        </div>

                                        {showDropdown && (
                                            <div className="profile-dropdown-menu">
                                                <div className="dropdown-user-info">
                                                    <p className="dropdown-greeting">Hi, {user?.name}</p>
                                                    <p className="dropdown-email">{user?.email}</p>
                                                </div>
                                                <div className="dropdown-divider"></div>
                                                <div
                                                    className="dropdown-item"
                                                    onClick={() => {
                                                        setShowDropdown(false);
                                                        if (user?.role === 'employer') {
                                                            navigate('/employer/profile');
                                                        } else {
                                                            navigate('/employee/profile');
                                                        }
                                                    }}
                                                >
                                                    Account Details
                                                </div>
                                                <div
                                                    className="dropdown-item"
                                                    onClick={() => {
                                                        setShowDropdown(false);
                                                        // For now, settings goes to profile as well
                                                        if (user?.role === 'employer') {
                                                            navigate('/employer/profile');
                                                        } else {
                                                            navigate('/employee/profile');
                                                        }
                                                    }}
                                                >
                                                    Settings
                                                </div>
                                                <div className="dropdown-divider"></div>
                                                <div
                                                    className="dropdown-item logout-item"
                                                    onClick={() => {
                                                        setShowDropdown(false);
                                                        handleLogout();
                                                    }}
                                                >
                                                    Logout
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <button className="btn-login" onClick={() => setShowLogin(true)}>
                                        Login
                                    </button>
                                    <button className="btn-signup" onClick={() => setShowSignup(true)}>
                                        Sign Up
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Login Modal */}
            {showLogin && (
                <Login
                    onClose={() => setShowLogin(false)}
                    onSwitchToSignup={() => {
                        setShowLogin(false);
                        setShowSignup(true);
                    }}
                />
            )}

            {/* Signup Modal */}
            {showSignup && (
                <Signup
                    onClose={() => setShowSignup(false)}
                    onSwitchToLogin={() => {
                        setShowSignup(false);
                        setShowLogin(true);
                    }}
                />
            )}
        </>
    );
};

export default Navbar;

