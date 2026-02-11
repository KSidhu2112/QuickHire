const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Get wallet balance and transaction history
exports.getWallet = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const transactions = await Transaction.find({ user: req.user.id }).sort('-createdAt');

        res.status(200).json({
            success: true,
            balance: user.walletBalance,
            transactions,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Deposit funds (Simulation)
exports.deposit = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        const user = await User.findById(req.user.id);
        user.walletBalance += Number(amount);
        await user.save();

        await Transaction.create({
            user: req.user.id,
            type: 'DEPOSIT',
            amount,
            status: 'COMPLETED',
            description: 'Deposit to wallet',
        });

        res.status(200).json({ success: true, balance: user.walletBalance, message: 'Deposit successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Withdraw funds
exports.withdraw = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        const user = await User.findById(req.user.id);
        if (user.walletBalance < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient funds' });
        }

        user.walletBalance -= Number(amount);
        await user.save();

        await Transaction.create({
            user: req.user.id,
            type: 'WITHDRAWAL',
            amount,
            status: 'PENDING', // Needs admin approval or gateway processing
            description: 'Withdrawal request',
        });

        res.status(200).json({ success: true, balance: user.walletBalance, message: 'Withdrawal request submitted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
