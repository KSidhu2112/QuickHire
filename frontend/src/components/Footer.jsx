import React from 'react';
import './Footer.css';
import logo from '../assets/logo.png';
import { useLocation } from 'react-router-dom';

const Footer = () => {
    const location = useLocation();
    const isEmployerPage = location.pathname.startsWith('/employer');
    const isEmployeePage = location.pathname.startsWith('/employee') || location.pathname === '/dashboard';
    const isPublicPage = !isEmployerPage && !isEmployeePage;

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
                            <li><a href="#home">Home</a></li>
                            <li><a href="#about">About Us</a></li>
                            <li><a href="#jobs">Browse Jobs</a></li>
                            <li><a href="#employers">For Employers</a></li>
                            <li><a href="#contact">Contact Us</a></li>
                        </ul>
                    </div>

                    {/* For Job Seekers - Show on Public & Employee Pages */}
                    {(isPublicPage || isEmployeePage) && (
                        <div className="footer-column">
                            <h4>For Job Seekers</h4>
                            <ul>
                                <li><a href="#browse">Browse Jobs</a></li>
                                <li><a href="#profile">Create Profile</a></li>
                                <li><a href="#resume">Upload Resume</a></li>
                                <li><a href="#alerts">Job Alerts</a></li>
                                <li><a href="#career">Career Advice</a></li>
                            </ul>
                        </div>
                    )}

                    {/* For Employers - Show on Public & Employer Pages */}
                    {(isPublicPage || isEmployerPage) && (
                        <div className="footer-column">
                            <h4>For Employers</h4>
                            <ul>
                                <li><a href="#post">Post a Job</a></li>
                                <li><a href="#candidates">Find Candidates</a></li>
                                <li><a href="#pricing">Pricing</a></li>
                                <li><a href="#solutions">Enterprise Solutions</a></li>
                                <li><a href="#support">Support</a></li>
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
