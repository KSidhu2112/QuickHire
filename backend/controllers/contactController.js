const ContactMessage = require('../models/ContactMessage');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
exports.submitContactMessage = async (req, res) => {
    try {
        const { fullName, email, phone, subject, message } = req.body;

        // Validate required fields
        if (!fullName || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields (fullName, email, subject, message)'
            });
        }

        // Generate unique ticket ID
        const ticketId = await ContactMessage.generateTicketId();

        // Create contact message
        const contactMessage = await ContactMessage.create({
            fullName,
            email,
            phone: phone || '',
            subject,
            message,
            ticketId,
            status: 'Pending'
        });

        res.status(201).json({
            success: true,
            message: 'Your request has been submitted successfully.',
            ticketId: contactMessage.ticketId,
            data: contactMessage
        });
    } catch (error) {
        console.error('Contact Submit Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit contact message. Please try again.',
            error: error.message
        });
    }
};

// @desc    Get platform statistics (public)
// @route   GET /api/contact/stats
// @access  Public
exports.getPlatformStats = async (req, res) => {
    try {
        const [employees, employers, jobs, applications] = await Promise.all([
            User.countDocuments({ role: 'jobseeker' }),
            User.countDocuments({ role: 'employer' }),
            Job.countDocuments(),
            Application.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            stats: {
                employees,
                employers,
                jobs,
                applications
            }
        });
    } catch (error) {
        console.error('Platform Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch platform stats',
            error: error.message
        });
    }
};

// @desc    Get all contact messages (Admin)
// @route   GET /api/contact/admin/messages
// @access  Admin
exports.getAllContactMessages = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;

        let filter = {};

        if (status && status !== 'All') {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { ticketId: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [messages, total] = await Promise.all([
            ContactMessage.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            ContactMessage.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            messages,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Get Contact Messages Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch contact messages',
            error: error.message
        });
    }
};

// @desc    Update contact message status (Admin)
// @route   PATCH /api/contact/admin/messages/:id/status
// @access  Admin
exports.updateMessageStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be Pending, In Progress, or Resolved'
            });
        }

        const message = await ContactMessage.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            data: message
        });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update message status',
            error: error.message
        });
    }
};

// @desc    Delete contact message (Admin)
// @route   DELETE /api/contact/admin/messages/:id
// @access  Admin
exports.deleteContactMessage = async (req, res) => {
    try {
        const message = await ContactMessage.findByIdAndDelete(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Delete Message Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete message',
            error: error.message
        });
    }
};

// @desc    Get single contact message (Admin)
// @route   GET /api/contact/admin/messages/:id
// @access  Admin
exports.getContactMessageById = async (req, res) => {
    try {
        const message = await ContactMessage.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error('Get Message Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch message',
            error: error.message
        });
    }
};
