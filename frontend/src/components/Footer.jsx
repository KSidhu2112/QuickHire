import React from 'react';
import './Footer.css';
import logo from '../assets/logo.png';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const Footer = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = React.useState(null);
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);

    React.useEffect(() => {
        const loggedIn = authAPI.isLoggedIn();
        setIsLoggedIn(loggedIn);
        if (loggedIn) {
            setUser(authAPI.getStoredUser());
        } else {
            setUser(null);
        }
    }, [location.pathname]);

    const userRole = user?.role; // 'jobseeker' or 'employer'

    const handleProtectedLinkClick = (e, path, allowedRole = null) => {
        if (!isLoggedIn) {
            e.preventDefault();
            toast.info('Please log in to access this feature');
            return;
        }

        if (allowedRole && userRole !== allowedRole) {
            e.preventDefault();
            toast.warning(`This feature is restricted to ${allowedRole === 'employer' ? 'Employers' : 'Job Seekers'}`);
            return;
        }
    };

    // Determine which columns to show based on URL path and logged-in state
    const isEmployerRoute = location.pathname.startsWith('/employer');
    const isEmployeeRoute = location.pathname.startsWith('/employee') || location.pathname === '/dashboard';
    const isPublicRoute = !isEmployerRoute && !isEmployeeRoute;

    const showJobSeekerLinks = isEmployeeRoute || (isPublicRoute && (!isLoggedIn || userRole === 'jobseeker'));
    const showEmployerLinks = isEmployerRoute || (isPublicRoute && (!isLoggedIn || userRole === 'employer'));

    return (
        <footer className="footer">
            <div className="footer-container">
                {/* Footer Top Section */}
                <div className="footer-top">
                    {/* Company Info */}
                    <div className="footer-column">
                        <div className="footer-logo">
                            <img src={logo} alt="QuickHire Logo" />
                            <h3>QuickHire</h3>
                        </div>
                        <p className="footer-description">
                            AI-powered job platform connecting talented professionals with their dream careers.
                            Find your perfect match today!
                        </p>
                        <div className="footer-social">
                            <a href="#" aria-label="Facebook">
                                <i className="social-icon">📘</i>
                            </a>
                            <a href="#" aria-label="Twitter">
                                <i className="social-icon">🐦</i>
                            </a>
                            <a href="#" aria-label="LinkedIn">
                                <i className="social-icon">💼</i>
                            </a>
                            <a href="#" aria-label="Instagram">
                                <i className="social-icon">📸</i>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-column">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li>
                                <a 
                                    href="#about" 
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        if (location.pathname !== '/') {
                                            navigate('/');
                                            setTimeout(() => {
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }, 100);
                                        } else {
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                >
                                    About Us
                                </a>
                            </li>
                            <li>
                                {isLoggedIn && userRole === 'jobseeker' && (
                                    <Link to="/dashboard">Browse Jobs</Link>
                                )}
                                {isLoggedIn && userRole === 'employer' && (
                                    <Link to="/employer/dashboard">Employer Dashboard</Link>
                                )}
                                {!isLoggedIn && (
                                    <a 
                                        href="#jobs" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (location.pathname !== '/') {
                                                navigate('/');
                                                setTimeout(() => {
                                                    document.querySelector('.features-section')?.scrollIntoView({ behavior: 'smooth' });
                                                }, 100);
                                            } else {
                                                document.querySelector('.features-section')?.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }}
                                    >
                                        Browse Jobs
                                    </a>
                                )}
                            </li>
                            <li>
                                {isLoggedIn && userRole === 'employer' && (
                                    <Link to="/employer/add-job">Post a Job</Link>
                                )}
                                {isLoggedIn && userRole === 'jobseeker' && (
                                    <a 
                                        href="#" 
                                        onClick={(e) => handleProtectedLinkClick(e, '/employer/add-job', 'employer')}
                                    >
                                        For Employers
                                    </a>
                                )}
                                {!isLoggedIn && (
                                    <a 
                                        href="#" 
                                        onClick={(e) => handleProtectedLinkClick(e, '/employer/dashboard', 'employer')}
                                    >
                                        For Employers
                                    </a>
                                )}
                            </li>
                            <li>
                                <a 
                                    href="#contact" 
                                    onClick={(e) => { 
                                        e.preventDefault(); 
                                        document.querySelector('.footer-contact')?.scrollIntoView({ behavior: 'smooth' }); 
                                    }}
                                >
                                    Contact Us
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* For Job Seekers - Show dynamically based on path & logged-in role */}
                    {showJobSeekerLinks && (
                        <div className="footer-column">
                            <h4>For Job Seekers</h4>
                            <ul>
                                <li>
                                    {isLoggedIn && userRole === 'jobseeker' ? (
                                        <Link to="/dashboard">Browse Jobs</Link>
                                    ) : (
                                        <a 
                                            href="#browse" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (location.pathname !== '/') {
                                                    navigate('/');
                                                    setTimeout(() => {
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }, 100);
                                                } else {
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}
                                        >
                                            Browse Jobs
                                        </a>
                                    )}
                                </li>
                                <li>
                                    <Link 
                                        to="/employee/profile" 
                                        onClick={(e) => handleProtectedLinkClick(e, '/employee/profile', 'jobseeker')}
                                    >
                                        My Profile
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/employee/shortlisted" 
                                        onClick={(e) => handleProtectedLinkClick(e, '/employee/shortlisted', 'jobseeker')}
                                    >
                                        Shortlisted Jobs
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/employee/applications" 
                                        onClick={(e) => handleProtectedLinkClick(e, '/employee/applications', 'jobseeker')}
                                    >
                                        My Applications
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/notifications" 
                                        onClick={(e) => handleProtectedLinkClick(e, '/notifications', 'jobseeker')}
                                    >
                                        Notifications
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* For Employers - Show dynamically based on path & logged-in role */}
                    {showEmployerLinks && (
                        <div className="footer-column">
                            <h4>For Employers</h4>
                            <ul>
                                <li>
                                    <Link 
                                        to="/employer/dashboard" 
                                        onClick={(e) => handleProtectedLinkClick(e, '/employer/dashboard', 'employer')}
                                    >
                                        Employer Dashboard
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/employer/add-job" 
                                        onClick={(e) => handleProtectedLinkClick(e, '/employer/add-job', 'employer')}
                                    >
                                        Post a Job
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/employer/manage-jobs" 
                                        onClick={(e) => handleProtectedLinkClick(e, '/employer/manage-jobs', 'employer')}
                                    >
                                        Manage Jobs
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/employer/applications" 
                                        onClick={(e) => handleProtectedLinkClick(e, '/employer/applications', 'employer')}
                                    >
                                        Review Applications
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/employer/hired-employees" 
                                        onClick={(e) => handleProtectedLinkClick(e, '/employer/hired-employees', 'employer')}
                                    >
                                        Hired Employees
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/employer/payments" 
                                        onClick={(e) => handleProtectedLinkClick(e, '/employer/payments', 'employer')}
                                    >
                                        Payment History
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    )}

                    {/* Contact Info */}
                    <div className="footer-column">
                        <h4>Contact Us</h4>
                        <ul className="footer-contact">
                            <li>
                                <span className="contact-icon">📧</span>
                                <a href="mailto:support@quickhire.com">support@quickhire.com</a>
                            </li>
                            <li>
                                <span className="contact-icon">📞</span>
                                <a href="tel:+1234567890">+1 (234) 567-890</a>
                            </li>
                            <li>
                                <span className="contact-icon">📍</span>
                                <span>123 Business St, Tech City, TC 12345</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom Section */}
                <div className="footer-bottom">
                    <div className="footer-bottom-content">
                        <p className="copyright">
                            © {new Date().getFullYear()} QuickHire. All rights reserved.
                        </p>
                        <div className="footer-legal">
                            <a href="#privacy">Privacy Policy</a>
                            <span className="separator">|</span>
                            <a href="#terms">Terms of Service</a>
                            <span className="separator">|</span>
                            <a href="#cookies">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
