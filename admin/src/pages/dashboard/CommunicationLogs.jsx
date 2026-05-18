import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSearch, FaComments, FaCalendarAlt, FaBriefcase } from 'react-icons/fa';
import './CommunicationLogs.css';

const CommunicationLogs = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get('http://localhost:5000/api/admin/messages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setMessages(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredMessages = messages.filter(msg =>
        msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.sender?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.job?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="communication-logs-container">
            <header className="page-header">
                <h1 className="page-title">Communication Logs</h1>
                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search conversation content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="msg-log-wrapper card">
                {loading ? (
                    <div className="table-loader">Loading communication history...</div>
                ) : filteredMessages.length === 0 ? (
                    <div className="empty-state">No conversation logs found.</div>
                ) : (
                    <div className="msg-log-content">
                        {filteredMessages.map(msg => (
                            <div key={msg._id} className="msg-log-item">
                                <div className="msg-log-header">
                                    <div className="msg-parties">
                                        <span className="party sender">{msg.sender?.name} ({msg.sender?.role})</span>
                                        <span className="msg-arrow">➔</span>
                                        <span className="party receiver">{msg.receiver?.name} ({msg.receiver?.role})</span>
                                    </div>
                                    <div className="msg-meta">
                                        <span><FaBriefcase /> {msg.job?.title || 'No Job Reference'}</span>
                                        <span><FaCalendarAlt /> {new Date(msg.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="msg-body">
                                    <FaComments className="quote-icon" />
                                    <p className="msg-text">{msg.content}</p>
                                    {msg.type === 'FILE' && <span className="attachment-badge">📎 File Attachment</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunicationLogs;
