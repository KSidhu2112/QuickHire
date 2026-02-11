import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { FaLinkedin, FaTwitter, FaGithub } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-brand">
                    <h3>QuickHire Admin</h3>
                    <p>Manage your platform's employers and employees efficiently.</p>
                </div>

                <div className="footer-links">
                    <div className="footer-section">
                        <h4>Management</h4>
                        <ul>
                            <li><Link to="/dashboard/employers">Employers</Link></li>
                            <li><Link to="/dashboard/employees">Employees</Link></li>
                            <li><Link to="/dashboard/jobs">Jobs</Link></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Admin</h4>
                        <ul>
                            <li><Link to="/dashboard">Dashboard</Link></li>
                            <li><Link to="/settings">Settings</Link></li>
                            <li><Link to="/account-details">Profile</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-social">
                    <a href="#" className="social-icon"><FaLinkedin /></a>
                    <a href="#" className="social-icon"><FaTwitter /></a>
                    <a href="#" className="social-icon"><FaGithub /></a>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} QuickHire Admin Panel. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
