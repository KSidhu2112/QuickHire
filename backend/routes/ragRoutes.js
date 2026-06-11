const express = require('express');
const router = express.Router();
const { syncVectors, chatWithRAG, getConversations, getConversationById, deleteConversation } = require('../controllers/ragController');
const { protect } = require('../middleware/authMiddleware');

// Sync endpoints
router.post('/sync', protect, syncVectors);

// Conversational Chat endpoints
router.post('/chat', protect, chatWithRAG);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id', protect, getConversationById);
router.delete('/conversations/:id', protect, deleteConversation);

module.exports = router;
