import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './EmployerChatbot.css';
import { toast } from 'react-toastify';
import { FaPaperPlane, FaRobot, FaUser, FaSync, FaPlus, FaTrash } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || 'https://quickhire-9ous.onrender.com/api';

const EmployerChatbot = () => {
    const greetingMessage = {
        sender: 'bot',
        text: 'Hello! I am your AI HR Assistant. You can ask me to find candidates based on skills, experience, projects, or certifications (e.g., "Find candidates with React experience").'
    };

    const [cList, setCList] = useState([]);
    const [messages, setMessages] = useState([greetingMessage]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const messagesEndRef = useRef(null);

    const token = localStorage.getItem('quickhire_token');

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch conversation list on mount
    const fetchConversations = async () => {
        if (!token) return;
        try {
            const response = await axios.get(`${API_BASE}/rag/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setCList(response.data.data);
                if (response.data.data.length > 0 && !currentConversationId) {
                    // Load the latest conversation automatically
                    loadConversation(response.data.data[0]._id);
                }
            }
        } catch (err) {
            console.error("Failed to load conversations", err);
        }
    };

    useEffect(() => {
        fetchConversations();
        // eslint-disable-next-line
    }, [token]);

    const loadConversation = async (id) => {
        if (!token) return;
        try {
            const response = await axios.get(`${API_BASE}/rag/conversations/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const convo = response.data.data;
                const formattedHistory = convo.messages.map(msg => ({
                    sender: msg.sender,
                    text: msg.text,
                    candidates: msg.candidates
                }));
                setMessages(formattedHistory);
                setCurrentConversationId(convo._id);
            }
        } catch (err) {
            toast.error("Failed to load this conversation.");
        }
    };

    const handleNewChat = () => {
        setCurrentConversationId(null);
        setMessages([greetingMessage]);
    };

    const handleDeleteConversation = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this conversation?")) return;

        try {
            const response = await axios.delete(`${API_BASE}/rag/conversations/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success("Conversation deleted.");
                if (currentConversationId === id) {
                    handleNewChat();
                }
                fetchConversations();
            }
        } catch (err) {
            toast.error("Failed to delete conversation.");
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const payload = { query: userMsg };
            if (currentConversationId) {
                payload.conversationId = currentConversationId;
            }

            const response = await axios.post(
                `${API_BASE}/rag/chat`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setMessages(prev => [...prev, {
                    sender: 'bot',
                    text: response.data.data.answer,
                    candidates: response.data.data.retrievedCandidates
                }]);

                if (!currentConversationId && response.data.data.conversationId) {
                    setCurrentConversationId(response.data.data.conversationId);
                }

                // Refresh list to update titles/timestamps invisibly
                fetchConversations();
            } else {
                setMessages(prev => [...prev, { sender: 'bot', text: "Error: " + response.data.message }]);
            }
        } catch (error) {
            console.error(error);
            const errMsg = error.response?.data?.message || "Something went wrong.";
            setMessages(prev => [...prev, { sender: 'bot', text: `Sorry, I encountered an error: ${errMsg}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (window.confirm("This will re-index all user profiles into the vector database. Continue?")) {
            setIsSyncing(true);
            try {
                const response = await axios.post(
                    `${API_BASE}/rag/sync`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success(response.data.message || 'Synced successfully!');
            } catch (err) {
                toast.error(err.response?.data?.message || 'Sync failed.');
            } finally {
                setIsSyncing(false);
            }
        }
    };

    return (
        <div className="chatbot-container">
            {/* Sidebar */}
            <div className="chatbot-sidebar">
                <button className="new-chat-btn" onClick={handleNewChat}>
                    <FaPlus /> New Chat
                </button>
                <div className="conversation-list">
                    {cList.map(convo => (
                        <div
                            key={convo._id}
                            className={`conversation-item ${currentConversationId === convo._id ? 'active' : ''}`}
                            onClick={() => loadConversation(convo._id)}
                        >
                            <span className="title" title={convo.title}>{convo.title}</span>
                            <button
                                className="delete-chat-btn"
                                onClick={(e) => handleDeleteConversation(convo._id, e)}
                                title="Delete"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="chatbot-main">
                <div className="chatbot-header">
                    <div className="header-title">
                        <FaRobot className="robot-icon" />
                        <h2>AI Candidate Matcher</h2>
                    </div>
                    <button
                        onClick={handleSync}
                        className="sync-button"
                        disabled={isSyncing}
                        title="Sync Candidates to Vector DB"
                    >
                        <FaSync className={isSyncing ? "spin-icon" : ""} /> {isSyncing ? "Syncing..." : "Sync DB"}
                    </button>
                </div>

                <div className="chat-window">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message-wrapper ${msg.sender}`}>
                            <div className="message-avatar">
                                {msg.sender === 'bot' ? <FaRobot /> : <FaUser />}
                            </div>
                            <div className="message-content">
                                <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                                {msg.candidates && msg.candidates.length > 0 && (
                                    <div className="candidate-tags">
                                        <span className="info-badge">Relevant Candidate IDs retrieved: {msg.candidates.length}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="message-wrapper bot">
                            <div className="message-avatar"><FaRobot /></div>
                            <div className="message-content loading-dots">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="chat-input-area">
                    <input
                        type="text"
                        placeholder="E.g., Which employees have Machine Learning projects?"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" disabled={!input.trim() || loading}>
                        <FaPaperPlane />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EmployerChatbot;
