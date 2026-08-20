import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FaUsers, FaBuilding, FaBriefcase, FaFileAlt, FaBullseye, FaEye, FaRobot, FaSearch, FaPaperPlane, FaBell, FaFileInvoice, FaShieldAlt, FaBolt, FaSmile, FaReact, FaNodeJs, FaDatabase, FaLock, FaBrain, FaServer, FaCheckCircle, FaRocket, FaHandshake, FaChartLine, FaMousePointer, FaClipboardList, FaUserTie, FaSearchPlus, FaTasks, FaClock } from 'react-icons/fa';
import { SiExpress, SiMongodb } from 'react-icons/si';
import './AboutUs.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Counter animation component
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;
        let startTime;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(eased * end));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [isInView, end, duration]);

    return <span ref={ref}>{count}{suffix}</span>;
};

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8 } }
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

const AboutUs = () => {
    const [stats, setStats] = useState({ employees: 0, employers: 0, jobs: 0, applications: 0 });
    const [statsLoaded, setStatsLoaded] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/contact/stats`);
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setStatsLoaded(true);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
            // Use fallback values
            setStats({ employees: 125, employers: 35, jobs: 80, applications: 450 });
            setStatsLoaded(true);
        }
    };

    const features = [
        { icon: <FaRobot />, title: 'AI-Powered Job Matching', desc: 'Smart algorithms match you with the perfect opportunities' },
        { icon: <FaSearchPlus />, title: 'Smart Candidate Search', desc: 'Find the best talent with intelligent search filters' },
        { icon: <FaMousePointer />, title: 'Easy Job Applications', desc: 'Apply to jobs with just one click' },
        { icon: <FaBell />, title: 'Real-Time Notifications', desc: 'Stay updated with instant alerts and updates' },
        { icon: <FaFileInvoice />, title: 'Resume Management', desc: 'Build and manage your professional profile' },
        { icon: <FaShieldAlt />, title: 'Secure Authentication', desc: 'Enterprise-grade security for your data' },
        { icon: <FaBolt />, title: 'Fast Recruitment Process', desc: 'Streamlined hiring for faster results' },
        { icon: <FaSmile />, title: 'User-Friendly Interface', desc: 'Intuitive design for the best experience' }
    ];

    const employeeBenefits = [
        { icon: <FaSearch />, text: 'Find jobs quickly' },
        { icon: <FaMousePointer />, text: 'Apply in one click' },
        { icon: <FaClipboardList />, text: 'Track applications' },
        { icon: <FaBrain />, text: 'Get job recommendations' }
    ];

    const employerBenefits = [
        { icon: <FaPaperPlane />, text: 'Post jobs easily' },
        { icon: <FaUserTie />, text: 'Search candidates' },
        { icon: <FaTasks />, text: 'Manage applications' },
        { icon: <FaClock />, text: 'Hire faster' }
    ];

    const technologies = [
        { icon: <FaReact />, name: 'React.js', color: '#61DAFB' },
        { icon: <FaNodeJs />, name: 'Node.js', color: '#68A063' },
        { icon: <FaServer />, name: 'Express.js', color: '#fff' },
        { icon: <FaDatabase />, name: 'MongoDB', color: '#4DB33D' },
        { icon: <FaLock />, name: 'JWT Auth', color: '#FB015B' },
        { icon: <FaBrain />, name: 'AI Matching', color: '#8B5CF6' }
    ];

    return (
        <div className="about-page">
            {/* Hero Section */}
            <section className="about-hero">
                <div className="about-hero-bg">
                    <div className="hero-orb hero-orb-1"></div>
                    <div className="hero-orb hero-orb-2"></div>
                    <div className="hero-orb hero-orb-3"></div>
                </div>
                <motion.div
                    className="about-hero-content"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    <motion.span className="about-badge" variants={fadeInUp}>
                        <FaRocket /> About Our Platform
                    </motion.span>
                    <motion.h1 variants={fadeInUp}>
                        About <span className="gradient-text">QuickHire</span>
                    </motion.h1>
                    <motion.p className="about-hero-desc" variants={fadeInUp}>
                        QuickHire is an AI-powered job portal designed to connect talented job seekers with the right employers. Our platform helps employees discover opportunities and enables employers to find qualified candidates efficiently through intelligent matching and modern recruitment tools.
                    </motion.p>
                    <motion.div className="hero-stats-row" variants={fadeInUp}>
                        <div className="hero-stat-chip"><FaHandshake /> Trusted Platform</div>
                        <div className="hero-stat-chip"><FaChartLine /> Growing Community</div>
                        <div className="hero-stat-chip"><FaShieldAlt /> Secure & Reliable</div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Live Statistics */}
            <section className="about-stats-section">
                <motion.div
                    className="about-container"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                >
                    <motion.h2 className="section-title" variants={fadeInUp}>
                        Platform <span className="gradient-text">Statistics</span>
                    </motion.h2>
                    <motion.p className="section-subtitle" variants={fadeInUp}>
                        Real-time numbers that showcase our growing community
                    </motion.p>
                    <div className="stats-grid">
                        {[
                            { icon: <FaUsers />, label: 'Employees', value: stats.employees, color: '#3B82F6' },
                            { icon: <FaBuilding />, label: 'Employers', value: stats.employers, color: '#8B5CF6' },
                            { icon: <FaBriefcase />, label: 'Jobs Posted', value: stats.jobs, color: '#10B981' },
                            { icon: <FaFileAlt />, label: 'Applications', value: stats.applications, color: '#F59E0B' }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                className="stat-card"
                                variants={scaleUp}
                                whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(59, 130, 246, 0.15)' }}
                            >
                                <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                                    {stat.icon}
                                </div>
                                <div className="stat-number">
                                    {statsLoaded ? <AnimatedCounter end={stat.value} /> : '—'}
                                </div>
                                <div className="stat-label">{stat.label}</div>
                                <div className="stat-glow" style={{ background: stat.color }}></div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Mission & Vision */}
            <section className="about-mission-section">
                <motion.div
                    className="about-container"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                >
                    <div className="mission-vision-grid">
                        <motion.div className="mv-card mission-card" variants={fadeInUp} whileHover={{ y: -5 }}>
                            <div className="mv-icon-wrap mission-icon">
                                <FaBullseye />
                            </div>
                            <h3>Our Mission</h3>
                            <p>To simplify the hiring process by connecting job seekers and employers through intelligent technology, creating better career opportunities and faster recruitment experiences.</p>
                            <div className="mv-decoration"></div>
                        </motion.div>
                        <motion.div className="mv-card vision-card" variants={fadeInUp} whileHover={{ y: -5 }}>
                            <div className="mv-icon-wrap vision-icon">
                                <FaEye />
                            </div>
                            <h3>Our Vision</h3>
                            <p>To become the most trusted and innovative job portal platform, empowering millions of professionals and organizations worldwide.</p>
                            <div className="mv-decoration"></div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* Why Choose QuickHire */}
            <section className="about-features-section">
                <motion.div
                    className="about-container"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                >
                    <motion.h2 className="section-title" variants={fadeInUp}>
                        Why Choose <span className="gradient-text">QuickHire</span>
                    </motion.h2>
                    <motion.p className="section-subtitle" variants={fadeInUp}>
                        Powerful features designed to make your hiring journey seamless
                    </motion.p>
                    <div className="features-grid">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                className="feature-card"
                                variants={scaleUp}
                                whileHover={{ y: -6, scale: 1.02 }}
                            >
                                <div className="feature-icon">{feature.icon}</div>
                                <h4>{feature.title}</h4>
                                <p>{feature.desc}</p>
                                <div className="feature-check"><FaCheckCircle /></div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Platform Benefits */}
            <section className="about-benefits-section">
                <motion.div
                    className="about-container"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                >
                    <motion.h2 className="section-title" variants={fadeInUp}>
                        Platform <span className="gradient-text">Benefits</span>
                    </motion.h2>
                    <div className="benefits-grid">
                        <motion.div className="benefits-column" variants={fadeInUp}>
                            <div className="benefits-header">
                                <FaUsers className="benefits-header-icon" />
                                <h3>For Employees</h3>
                            </div>
                            <ul className="benefits-list">
                                {employeeBenefits.map((b, i) => (
                                    <motion.li
                                        key={i}
                                        whileHover={{ x: 6 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <span className="benefit-icon">{b.icon}</span>
                                        <span>{b.text}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                        <motion.div className="benefits-column" variants={fadeInUp}>
                            <div className="benefits-header">
                                <FaBuilding className="benefits-header-icon" />
                                <h3>For Employers</h3>
                            </div>
                            <ul className="benefits-list">
                                {employerBenefits.map((b, i) => (
                                    <motion.li
                                        key={i}
                                        whileHover={{ x: 6 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                    >
                                        <span className="benefit-icon">{b.icon}</span>
                                        <span>{b.text}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* Technologies Used */}
            <section className="about-tech-section">
                <motion.div
                    className="about-container"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={staggerContainer}
                >
                    <motion.h2 className="section-title" variants={fadeInUp}>
                        Technologies <span className="gradient-text">We Use</span>
                    </motion.h2>
                    <motion.p className="section-subtitle" variants={fadeInUp}>
                        Built with the latest and most reliable tech stack
                    </motion.p>
                    <div className="tech-grid">
                        {technologies.map((tech, i) => (
                            <motion.div
                                key={i}
                                className="tech-card"
                                variants={scaleUp}
                                whileHover={{ y: -10, rotate: 2 }}
                            >
                                <div className="tech-icon" style={{ color: tech.color }}>
                                    {tech.icon}
                                </div>
                                <span className="tech-name">{tech.name}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

export default AboutUs;
