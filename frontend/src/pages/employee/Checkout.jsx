import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { jobAPI, applicationAPI, authAPI, paymentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FaShieldAlt, FaBriefcase, FaMoneyBillWave, FaClock, FaCheckCircle } from 'react-icons/fa';
import { loadScript } from '../../utils/loadScript';
import './Checkout.css';

const Checkout = () => {
    const { jobId, type } = useParams(); // type can be 'apply' or 'post'
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [jobData, setJobData] = useState(null); // For job post
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = authAPI.getStoredUser();
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setUser(storedUser);
        
        if (type === 'post') {
            const savedData = localStorage.getItem('pending_job_data');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                setJobData(parsed);
                // Create a mock job object for display
                setJob({
                    title: parsed.title,
                    company: parsed.company,
                    location: { city: parsed.location?.city || 'Selected Location' },
                    salaryMin: parsed.salaryMin,
                    salaryMax: parsed.salaryMax
                });
                setLoading(false);
            } else {
                toast.error('No job data found');
                navigate('/employer/dashboard');
            }
        } else {
            fetchJobDetails();
        }
    }, [jobId, type]);

    const fetchJobDetails = async () => {
        try {
            const response = await jobAPI.getJobById(jobId);
            if (response.success) {
                setJob(response.job);
            } else {
                toast.error('Job not found');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error fetching job details:', error);
            toast.error('Failed to load job details');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        setProcessing(true);
        try {
            const isPost = type === 'post';
            const action = isPost ? 'post_job' : 'apply';
            const amount = isPost ? 20 : 10;

            // 1. Create order
            const orderData = await paymentAPI.createOrder({
                action: action,
                jobId: isPost ? null : jobId,
                amount: amount
            });

            if (!orderData.success) {
                throw new Error(orderData.message);
            }

            // 2. Open Razorpay
            const options = {
                key: orderData.key,
                amount: orderData.order.amount,
                currency: "INR",
                name: "QuickHire",
                description: `Application Fee for ${job.title}`,
                order_id: orderData.order.id,
                handler: async function (response) {
                    try {
                        // 3. Verify payment
                        await paymentAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        toast.success('Payment successful!');
                        
                        if (isPost) {
                            // 4. Post job
                            await jobAPI.createJob(jobData);
                            localStorage.removeItem('pending_job_data');
                            toast.success('Job posted successfully!');
                            navigate('/employer/dashboard');
                        } else {
                            // 4. Apply for job
                            await applicationAPI.applyForJob(job._id, {
                                coverLetter: 'Applied through checkout flow',
                                availability: 'Immediate',
                            });
                            toast.success('Application submitted successfully!');
                            navigate('/employee/applications');
                        }
                    } catch (err) {
                        console.error('Verification Error:', err);
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone || ""
                },
                theme: {
                    color: "#2563eb"
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                        toast.info('Payment cancelled');
                    }
                }
            };

            const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

            if (!res) {
                toast.error('Razorpay SDK failed to load. Are you online?');
                setProcessing(false);
                return;
            }

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            console.error('Payment Error:', error);
            toast.error(error.message || 'Failed to initiate payment');
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="checkout-page">
                <div className="loader-container">
                    <div className="spinner"></div>
                    <p>Preparing your application...</p>
                </div>
            </div>
        );
    }

    if (!job) return null;

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <div className="checkout-header">
                    <h1>{type === 'post' ? 'Finalize Job Posting' : 'Finalize Application'}</h1>
                    <p>{type === 'post' ? 'Reach thousands of jobseekers' : 'Secure your spot for this position'}</p>
                </div>

                <div className="checkout-grid">
                    <div className="checkout-main">
                        <div className="job-summary-card">
                            <div className="job-icon">
                                <FaBriefcase />
                            </div>
                            <div className="job-info">
                                <h3>{job.title}</h3>
                                <p>{job.company}</p>
                                <div className="job-tags">
                                    <span>📍 {job.location?.city}</span>
                                    <span>💰 ₹{job.salaryMin} - ₹{job.salaryMax}</span>
                                </div>
                            </div>
                        </div>

                        <div className="checkout-benefits">
                            <h3>Why pay a small fee?</h3>
                            <ul className="benefits-list">
                                <li>
                                    <FaShieldAlt className="benefit-icon" />
                                    <div>
                                        <strong>Trusted Platform</strong>
                                        <p>Fees help us verify legitimate jobs and employers.</p>
                                    </div>
                                </li>
                                <li>
                                    <FaClock className="benefit-icon" />
                                    <div>
                                        <strong>{type === 'post' ? 'Instant Visibility' : 'Priority Processing'}</strong>
                                        <p>{type === 'post' ? 'Your job is published immediately after payment.' : 'Paid applications are highlighted to employers.'}</p>
                                    </div>
                                </li>
                                <li>
                                    <FaCheckCircle className="benefit-icon" />
                                    <div>
                                        <strong>Refund Guarantee</strong>
                                        <p>{type === 'post' ? 'If your post is rejected by admin, fee is credited back.' : 'If the job is cancelled, your fee is credited back.'}</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="checkout-sidebar">
                        <div className="order-summary">
                            <h3>Order Summary</h3>
                            <div className="summary-row">
                                <span>{type === 'post' ? 'Listing Fee' : 'Application Fee'}</span>
                                <span>₹{type === 'post' ? '20.00' : '10.00'}</span>
                            </div>
                            <div className="summary-row">
                                <span>Processing Fee</span>
                                <span>₹0.00</span>
                            </div>
                            <div className="summary-divider"></div>
                            <div className="summary-row total">
                                <span>Total Amount</span>
                                <span>₹{type === 'post' ? '20.00' : '10.00'}</span>
                            </div>

                            <button 
                                className={`btn-checkout ${processing ? 'loading' : ''}`}
                                onClick={handlePayment}
                                disabled={processing}
                            >
                                {processing ? 'Processing...' : (type === 'post' ? 'Pay & Post Job' : 'Pay & Join Job')}
                            </button>
                            
                            <p className="secure-text">
                                <FaShieldAlt /> Secure 256-bit SSL Encrypted Payment
                            </p>
                        </div>

                        <button className="btn-cancel" onClick={() => navigate(-1)}>
                            Cancel and Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
