import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || 'https://quickhire-9ous.onrender.com/api';
import { FaExclamationTriangle, FaCheckCircle, FaBan, FaTimes, FaSearch } from 'react-icons/fa';
import './ReportManagement.css';

const ReportManagement = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${API_BASE}/admin/reports`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setReports(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateReport = async (reportId, status, remarks) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.patch(`${API_BASE}/admin/reports/${reportId}/status`, { status, adminRemarks: remarks }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setReports(reports.map(r => r._id === reportId ? { ...r, status, adminRemarks: remarks } : r));
                alert(`Report marked as ${status}`);
            }
        } catch (err) {
            alert('Status update failed');
        }
    };

    const filteredReports = reports.filter(r =>
        r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reporter?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="report-mgmt-container">
            <header className="page-header">
                <h1 className="page-title">Fraud Detection & Reports</h1>
                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="report-list">
                {loading ? (
                    <div className="table-loader">Loading report data...</div>
                ) : filteredReports.length === 0 ? (
                    <div className="empty-state">No active reports found.</div>
                ) : (
                    <div className="report-grid">
                        {filteredReports.map(report => (
                            <div key={report._id} className={`report-card card ${report.status.toLowerCase()}`}>
                                <div className="report-badge">
                                    <FaExclamationTriangle /> {report.reason}
                                </div>
                                <div className="report-info">
                                    <p className="report-desc">{report.description}</p>
                                    <div className="report-meta">
                                        <span>Reported by: <strong>{report.reporter?.name}</strong></span>
                                        <span>Types: <strong>{report.reportedType}</strong></span>
                                        <span>Date: <strong>{new Date(report.createdAt).toLocaleDateString()}</strong></span>
                                    </div>
                                </div>
                                {report.status === 'PENDING' ? (
                                    <div className="report-actions">
                                        <button className="report-btn action" onClick={() => handleUpdateReport(report._id, 'RESOLVED', 'Issue investigated and resolved.')}>
                                            <FaCheckCircle /> Resolve
                                        </button>
                                        <button className="report-btn dismiss" onClick={() => handleUpdateReport(report._id, 'DISMISSED', 'No evidence found.')}>
                                            <FaTimes /> Dismiss
                                        </button>
                                    </div>
                                ) : (
                                    <div className="report-resolution">
                                        <p><strong>Resolved:</strong> {report.status}</p>
                                        <p className="remarks">{report.adminRemarks}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportManagement;
