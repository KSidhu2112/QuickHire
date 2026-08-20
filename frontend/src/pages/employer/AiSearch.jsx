import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './AiSearch.css';

const AiSearch = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [searchHistory, setSearchHistory] = useState([]);
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResults(null);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/rag/search`,
                { query },
                { withCredentials: true }
            );

            setResults(response.data);
            if (!searchHistory.includes(query)) {
                setSearchHistory(prev => [query, ...prev].slice(0, 5));
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to perform AI candidate search.');
        } finally {
            setLoading(false);
        }
    };

    const handleHistoryClick = (historyQuery) => {
        setQuery(historyQuery);
    }; // Wait, we need to manually trigger search on click or let them press enter? Let's just set query and let them press search.

    return (
        <div className="ai-search-container">
            <div className="ai-search-header">
                <h1>AI Candidate Search</h1>
                <p>Find the perfect candidates using natural language.</p>
            </div>

            <div className="ai-search-content">
                <div className="ai-search-sidebar">
                    <h3>Recent Searches</h3>
                    {searchHistory.length === 0 ? (
                        <p className="no-history">No recent searches</p>
                    ) : (
                        <ul className="history-list">
                            {searchHistory.map((h, index) => (
                                <li key={index} onClick={() => handleHistoryClick(h)}>
                                    {h}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="ai-search-main">
                    <form className="ai-search-form" onSubmit={handleSearch}>
                        <input
                            type="text"
                            placeholder="E.g., Find backend developers with Node.js in Hyderabad"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !query.trim()}>
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>

                    {loading && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Analyzing profiles with AI...</p>
                        </div>
                    )}

                    {results && !loading && (
                        <div className="results-container">
                            <div className="ai-explanation">
                                <h3>AI Insights</h3>
                                <p>{results.answer}</p>
                            </div>

                            <div className="candidates-list">
                                <h3>Top Matches ({results.candidates?.length || 0})</h3>
                                {results.candidates && results.candidates.length > 0 ? (
                                    <div className="cards-grid">
                                        {results.candidates.map((candidate, idx) => (
                                            <div key={idx} className="candidate-card">
                                                <h4>{candidate.name}</h4>
                                                <p className="role">{candidate.preferredRole}</p>
                                                <div className="card-details">
                                                    <p><strong>Skills:</strong> {candidate.skills?.join(', ')}</p>
                                                    <p><strong>Experience:</strong> {candidate.experience}</p>
                                                    <p><strong>Education:</strong> {candidate.education}</p>
                                                    <p><strong>Location:</strong> {candidate.location}</p>
                                                </div>
                                                <button className="view-profile-btn" onClick={() => toast.info('View Profile feature coming soon.')}>
                                                    View Profile
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-results">No exact candidates found. Try broadening your criteria.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiSearch;
