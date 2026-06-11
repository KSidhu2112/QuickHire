const { syncEmployeesToVectors, queryCandidateRAG } = require('../services/ragService');
const RagConversation = require('../models/RagConversation');

// Sync candidates mapping endpoint
exports.syncVectors = async (req, res) => {
    try {
        await syncEmployeesToVectors();
        res.status(200).json({ success: true, message: 'All employees/candidates synced successfully to the vector database.' });
    } catch (error) {
        console.error("Vector sync error details:", error);
        res.status(500).json({ success: false, message: error.message || 'Server Error during vector sync.' });
    }
};

// Handle RAG Chatbot query
exports.chatWithRAG = async (req, res) => {
    const { query, conversationId } = req.body;

    if (!query) {
        return res.status(400).json({ success: false, message: "Query string is required." });
    }

    try {
        let conversation = null;
        if (conversationId) {
            conversation = await RagConversation.findOne({ _id: conversationId, employerId: req.user._id });
        }

        if (!conversation) {
            conversation = new RagConversation({
                employerId: req.user._id,
                title: query.length > 30 ? query.substring(0, 30) + '...' : query,
                messages: []
            });
        }

        // Add user message to conversation array
        conversation.messages.push({
            sender: 'user',
            text: query,
        });

        // Query AI
        const result = await queryCandidateRAG(query);

        // Add bot message
        conversation.messages.push({
            sender: 'bot',
            text: result.answer,
            candidates: result.retrievedCandidates || []
        });

        await conversation.save();

        res.status(200).json({ success: true, data: { ...result, conversationId: conversation._id } });
    } catch (error) {
        console.error("Chat RAG API error details:", error.message, error.stack);
        let msg = error.message;
        if (msg.includes("GROQ_API_KEY") || msg.includes("API keys")) {
            msg = "The Chatbot is currently unavailable. Administrator has not configured the Groq AI API key.";
        }
        res.status(500).json({ success: false, message: msg });
    }
};

// Fetch list of conversations (sidebar)
exports.getConversations = async (req, res) => {
    try {
        const conversations = await RagConversation.find({ employerId: req.user._id })
            .select('title updatedAt')
            .sort({ updatedAt: -1 });
        res.status(200).json({ success: true, count: conversations.length, data: conversations });
    } catch (error) {
        console.error("Fetch conversations error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch conversations." });
    }
};

// Fetch specific conversation details
exports.getConversationById = async (req, res) => {
    try {
        const conversation = await RagConversation.findOne({ _id: req.params.id, employerId: req.user._id });
        if (!conversation) {
            return res.status(404).json({ success: false, message: "Conversation not found." });
        }
        res.status(200).json({ success: true, data: conversation });
    } catch (error) {
        console.error("Fetch single conversation error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch the conversation." });
    }
};

// Delete conversation
exports.deleteConversation = async (req, res) => {
    try {
        const conversation = await RagConversation.findOneAndDelete({ _id: req.params.id, employerId: req.user._id });
        if (!conversation) {
            return res.status(404).json({ success: false, message: "Conversation not found." });
        }
        res.status(200).json({ success: true, message: "Conversation deleted successfully." });
    } catch (error) {
        console.error("Delete conversation error:", error);
        res.status(500).json({ success: false, message: "Failed to delete conversation." });
    }
};
