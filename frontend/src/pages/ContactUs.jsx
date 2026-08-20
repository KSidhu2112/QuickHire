import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock, FaUser, FaPaperPlane, FaCheckCircle, FaTimesCircle, FaChevronDown, FaChevronUp, FaWhatsapp, FaLinkedin, FaGithub, FaTwitter, FaSpinner, FaHeadset, FaQuestionCircle, FaTicketAlt } from 'react-icons/fa';
import './ContactUs.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.15 }
    }
};

const scaleUp = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } }
};

const ContactUs = () => {
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [expandedFaq, setExpandedFaq] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const faqs = [
        {
            q: 'How do I apply for a job?',
            a: 'Register as an employee, complete your profile, and apply directly from available jobs.'
        },
        {
            q: 'How can employers post jobs?',
            a: 'Employers can create an account and post jobs through their dashboard.'
        },
        {
            q: 'Is QuickHire free for job seekers?',
            a: 'Yes, QuickHire is completely free for job seekers.'
        },
        {
            q: 'How can I track my applications?',
            a: 'Employees can track application status through their dashboard.'
        }
    ];

    const contactInfo = [
        { icon: <FaEnvelope />, label: 'Email', value: 'support@quickhire.com', href: 'mailto:support@quickhire.com', color: '#3B82F6' },
        { icon: <FaPhone />, label: 'Phone', value: '+91 XXXXX XXXXX', href: 'tel:+91XXXXXXXXXX', color: '#10B981' },
        { icon: <FaMapMarkerAlt />, label: 'Location', value: 'Vijayawada, Andhra Pradesh, India', href: null, color: '#F59E0B' },
        { icon: <FaClock />, label: 'Support Hours', value: 'Mon - Sat, 9:00 AM - 6:00 PM', href: null, color: '#8B5CF6' }
    ];

    const validate = () => {
        const newErrors = {};
        if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!form.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(form.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (form.phone && !/^[+]?[\d\s-]{7,15}$/.test(form.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }
        if (!form.subject.trim()) newErrors.subject = 'Subject is required';
        if (!form.message.trim()) {
            newErrors.message = 'Message is required';
        } else if (form.message.trim().length < 10) {
            newErrors.message = 'Message must be at least 10 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();

            if (data.success) {
                setSuccessData({
                    ticketId: data.ticketId,
                    message: data.message
                });
                setForm({ fullName: '', email: '', phone: '', subject: '', message: '' });
            } else {
                setErrors({ submit: data.message || 'Failed to submit. Please try again.' });
            }
        } catch (err) {
            console.error('Contact form error:', err);
            setErrors({ submit: 'Network error. Please check your connection and try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-page">
            {/* Hero Section */}
            <section className="contact-hero">
                <div className="contact-hero-bg">
                    <div className="c-hero-orb c-hero-orb-1"></div>
                    <div className="c-hero-orb c-hero-orb-2"></div>
                </div>
                <motion.div
                    className="contact-hero-content"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <motion.span className="contact-badge" variants={fadeInUp}>
                        <FaHeadset /> Get In Touch
                    </motion.span>
                    <motion.h1 variants={fadeInUp}>
                        Contact <span className="gradient-text-c">QuickHire</span>
                    </motion.h1>
                    <motion.p className="contact-hero-desc" variants={fadeInUp}>
                        Need help? Have questions? We're here to assist you.
                    </motion.p>
                </motion.div>
            </section>

            {/* Contact Info Cards */}
            <section className="contact-info-section">
                <motion.div
                    className="contact-container"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                >
                    <div className="contact-info-grid">
                        {contactInfo.map((info, i) => (
                            <motion.div
                                key={i}
                                className="contact-info-card"
                                variants={scaleUp}
                                whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(59, 130, 246, 0.12)' }}
                            >
                                <div className="ci-icon" style={{ background: `${info.color}15`, color: info.color }}>
                                    {info.icon}
                                </div>
                                <h4>{info.label}</h4>
                                {info.href ? (
                                    <a href={info.href} className="ci-value">{info.value}</a>
                                ) : (
                                    <p className="ci-value">{info.value}</p>
                                )}
                                <div className="ci-glow" style={{ background: info.color }}></div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Contact Form + FAQ */}
            <section className="contact-form-section">
                <motion.div
                    className="contact-container"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                >
                    <div className="contact-main-grid">
                        {/* Form */}
                        <motion.div className="contact-form-wrapper" variants={fadeInUp}>
                            <div className="form-header">
                                <FaPaperPlane className="form-header-icon" />
                                <h3>Send Us a Message</h3>
                            </div>

                            <AnimatePresence mode="wait">
                                {successData ? (
                                    <motion.div
                                        className="success-popup"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <div className="success-icon"><FaCheckCircle /></div>
                                        <h3>Request Submitted!</h3>
                                        <p>{successData.message}</p>
                                        <div className="ticket-display">
                                            <FaTicketAlt />
                                            <span>Ticket ID: <strong>{successData.ticketId}</strong></span>
                                        </div>
                                        <button
                                            className="btn-new-message"
                                            onClick={() => setSuccessData(null)}
                                        >
                                            Send Another Message
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.form
                                        onSubmit={handleSubmit}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="contact-fullName">Full Name *</label>
                                                <div className={`input-wrap ${errors.fullName ? 'error' : ''}`}>
                                                    <FaUser className="input-icon" />
                                                    <input
                                                        id="contact-fullName"
                                                        type="text"
                                                        name="fullName"
                                                        placeholder="Enter your full name"
                                                        value={form.fullName}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                {errors.fullName && <span className="error-msg">{errors.fullName}</span>}
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="contact-email">Email Address *</label>
                                                <div className={`input-wrap ${errors.email ? 'error' : ''}`}>
                                                    <FaEnvelope className="input-icon" />
                                                    <input
                                                        id="contact-email"
                                                        type="email"
                                                        name="email"
                                                        placeholder="Enter your email"
                                                        value={form.email}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                {errors.email && <span className="error-msg">{errors.email}</span>}
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="contact-phone">Phone Number</label>
                                                <div className={`input-wrap ${errors.phone ? 'error' : ''}`}>
                                                    <FaPhone className="input-icon" />
                                                    <input
                                                        id="contact-phone"
                                                        type="tel"
                                                        name="phone"
                                                        placeholder="Enter your phone number"
                                                        value={form.phone}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                {errors.phone && <span className="error-msg">{errors.phone}</span>}
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="contact-subject">Subject *</label>
                                                <div className={`input-wrap ${errors.subject ? 'error' : ''}`}>
                                                    <FaQuestionCircle className="input-icon" />
                                                    <input
                                                        id="contact-subject"
                                                        type="text"
                                                        name="subject"
                                                        placeholder="Enter subject"
                                                        value={form.subject}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                {errors.subject && <span className="error-msg">{errors.subject}</span>}
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="contact-message">Message *</label>
                                            <div className={`input-wrap textarea-wrap ${errors.message ? 'error' : ''}`}>
                                                <textarea
                                                    id="contact-message"
                                                    name="message"
                                                    rows="5"
                                                    placeholder="Describe your issue or question..."
                                                    value={form.message}
                                                    onChange={handleChange}
                                                ></textarea>
                                            </div>
                                            {errors.message && <span className="error-msg">{errors.message}</span>}
                                        </div>

                                        {errors.submit && (
                                            <div className="submit-error">
                                                <FaTimesCircle /> {errors.submit}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            className="btn-submit"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <><FaSpinner className="spin" /> Submitting...</>
                                            ) : (
                                                <><FaPaperPlane /> Submit Message</>
                                            )}
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* FAQ */}
                        <motion.div className="faq-wrapper" variants={fadeInUp}>
                            <div className="faq-header">
                                <FaQuestionCircle className="faq-header-icon" />
                                <h3>Frequently Asked Questions</h3>
                            </div>
                            <div className="faq-list">
                                {faqs.map((faq, i) => (
                                    <motion.div
                                        key={i}
                                        className={`faq-item ${expandedFaq === i ? 'expanded' : ''}`}
                                        onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                                        initial={false}
                                    >
                                        <div className="faq-question">
                                            <span>{faq.q}</span>
                                            {expandedFaq === i ? <FaChevronUp /> : <FaChevronDown />}
                                        </div>
                                        <AnimatePresence>
                                            {expandedFaq === i && (
                                                <motion.div
                                                    className="faq-answer"
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <p>{faq.a}</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Social Links */}
                            <div className="social-section">
                                <h4>Connect With Us</h4>
                                <div className="social-links">
                                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-btn linkedin" aria-label="LinkedIn">
                                        <FaLinkedin />
                                    </a>
                                    <a href="https://github.com/KSidhu2112/QuickHire" target="_blank" rel="noopener noreferrer" className="social-btn github" aria-label="GitHub">
                                        <FaGithub />
                                    </a>
                                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-btn twitter" aria-label="Twitter">
                                        <FaTwitter />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* Floating Support Buttons */}
            <div className="floating-support">
                <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="float-btn whatsapp" aria-label="WhatsApp Support">
                    <FaWhatsapp />
                </a>
                <a href="mailto:support@quickhire.com" className="float-btn email-float" aria-label="Email Support">
                    <FaEnvelope />
                </a>
                <a href="tel:+91XXXXXXXXXX" className="float-btn call-float" aria-label="Call Support">
                    <FaPhone />
                </a>
            </div>
        </div>
    );
};

export default ContactUs;
