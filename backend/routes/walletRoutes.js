const express = require('express');
const router = express.Router();
const { getWallet, deposit, withdraw } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWallet);
router.post('/deposit', protect, deposit);
router.post('/withdraw', protect, withdraw);

module.exports = router;
