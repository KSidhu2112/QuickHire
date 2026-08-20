const express = require('express');
const router = express.Router();
const ragController = require('../controllers/ragController');
const { protect } = require('../middleware/authMiddleware');

// Existing routes
router.post('/sync', protect, ragController.syncVectors);
router.post('/chat', protect, ragController.chatWithRAG);
router.get('/conversations', protect, ragController.getConversations);
router.get('/conversations/:id', protect, ragController.getConversationById);
router.delete('/conversations/:id', protect, ragController.deleteConversation);

// New search route for AiSearch page
router.post('/search', protect, ragController.searchRagCandidates);

module.exports = router;
