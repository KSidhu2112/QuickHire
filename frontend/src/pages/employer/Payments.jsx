import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Payments.css';

const Payments = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('ALL');

    const transactions = [
        { id: 'TXN1001', date: '2024-02-01', description: 'Job Posting - Senior Developer', amount: 499, status: 'Completed', method: 'Visa •••• 4242' },
        { id: 'TXN1002', date: '2024-01-28', description: 'Featured Listing Boost', amount: 199, status: 'Completed', method: 'Visa •••• 4242' },
        { id: 'TXN1003', date: '2024-01-25', description: 'Monthly Subscription', amount: 999, status: 'Completed', method: 'Mastercard •••• 8888' },
        { id: 'TXN1004', date: '2024-01-15', description: 'Job Posting - Marketing Manager', amount: 499, status: 'Pending', method: 'Paypal' },
        { id: 'TXN1005', date: '2024-01-10', description: 'Refund - Cancelled Posting', amount: -499, status: 'Refunded', method: 'Visa •••• 4242' },
    ];

    const filteredTransactions = filter === 'ALL'
        ? transactions
        : transactions.filter(t => t.status.toUpperCase() === filter);

    return (
        <div className="payments-page">
            <div className="payments-container">
                <div className="page-header">
                    <button className="back-button" onClick={() => navigate('/employer/dashboard')}>
                        ← Back to Dashboard
                    </button>
                    <div className="header-content">
                        <h1>Billing & Payments</h1>
                        <p>Manage your payment methods and view transaction history</p>
                    </div>
                </div>

                <div className="payments-grid">
                    {/* Payment Methods Card */}
                    <div className="payment-card method-card">
                        <div className="card-header">
                            <h2>Payment Method</h2>
                            <button className="add-btn">+ Add New</button>
                        </div>
                        <div className="credit-card">
                            <div className="card-chip"></div>
                            <div className="card-number">
                                <span>••••</span> <span>••••</span> <span>••••</span> <span>4242</span>
                            </div>
                            <div className="card-info">
                                <div className="card-holder">
                                    <span>Card Holder</span>
                                    <strong>John Doe</strong>
                                </div>
                                <div className="card-exp">
                                    <span>Expires</span>
                                    <strong>12/26</strong>
                                </div>
                            </div>
                            <div className="card-brand">VISA</div>
                        </div>
                        <div className="secondary-method">
                            <div className="method-icon">🅿️</div>
                            <div className="method-details">
                                <strong>PayPal</strong>
                                <span>john.doe@example.com</span>
                            </div>
                            <button className="manage-btn">Manage</button>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="payment-card summary-card">
                        <h2>Billing Summary</h2>
                        <div className="summary-list">
                            <div className="summary-item">
                                <span>Current Plan</span>
                                <span className="highlight">Premium Enterprise</span>
                            </div>
                            <div className="summary-item">
                                <span>Next Billing Date</span>
                                <span>Feb 25, 2024</span>
                            </div>
                            <div className="summary-item">
                                <span>Total Spent (This Month)</span>
                                <span className="amount">₹1,697.00</span>
                            </div>
                        </div>
                        <button className="upgrade-btn">Upgrade Plan</button>
                    </div>
                </div>

                {/* Transactions Section */}
                <div className="transactions-section">
                    <div className="transactions-header">
                        <h2>Transaction History</h2>
                        <div className="filter-tabs">
                            {['ALL', 'COMPLETED', 'PENDING', 'REFUNDED'].map(f => (
                                <button
                                    key={f}
                                    className={`filter-tab ${filter === f ? 'active' : ''}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f.charAt(0) + f.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="transactions-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Method</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                    <th>Invoice</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((txn) => (
                                    <tr key={txn.id}>
                                        <td>{new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                        <td>
                                            <div className="txn-desc">
                                                <strong>{txn.description}</strong>
                                                <span className="txn-id">{txn.id}</span>
                                            </div>
                                        </td>
                                        <td>{txn.method}</td>
                                        <td>
                                            <span className={`status-badge ${txn.status.toLowerCase()}`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className={txn.amount < 0 ? 'negative' : ''}>
                                            {txn.amount < 0 ? '-' : ''}₹{Math.abs(txn.amount).toFixed(2)}
                                        </td>
                                        <td>
                                            <button className="download-btn">⬇️ PDF</button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="no-data">No transactions found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payments;
