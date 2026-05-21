const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const employerRoutes = require('./routes/employerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Middleware
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'https://quickhirecareer.netlify.app',
        'https://quickhirecareerplatform.netlify.app'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/rating', ratingRoutes);
app.use('/api/ai', aiRoutes);

// Services
const { runPenaltyCheck } = require('./services/penaltyService');
const { autoPublishReviews } = require('./services/reviewService');

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        version: 3,
        message: 'QuickHire Backend with Payment System Ready!',
        timestamp: new Date().toISOString()
    });
});

// Debug Route (Public)
app.get('/api/payments/ping', (req, res) => {
    res.json({ success: true, message: 'Payment controller reached!' });
});

// 404 Handler
app.use((req, res) => {
    console.log(`🚫 404 Error: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    fs.appendFileSync('global_error.log', `[${new Date().toISOString()}] ❌ Global Error: ${err.stack}\n`);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

// MongoDB Connection & Server Start
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ MongoDB Connected');

        const server = app.listen(PORT, () => {
            console.log('\n=========================================');
            console.log(`🚀 Server running on port ${PORT}`);
            console.log('✅ VERSION 2.1: Payment system active');
            console.log('=========================================\n');
        });

        // Cron Jobs
        cron.schedule('0 * * * *', () => runPenaltyCheck().catch(err => console.error(err)));
        cron.schedule('5 * * * *', () => autoPublishReviews().catch(err => console.error(err)));

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            server.close(() => process.exit(0));
        });
    } catch (error) {
        console.error('⚠️ MongoDB Connection Error:', error.message);
        console.log('🔄 Retrying in 5 seconds...');
        setTimeout(startServer, 5000);
    }
};



app.get("/api/health",(req,res)=>{
   res.status(200).json({
      status:"OK"
   });
});

app.use("/", (req, res) => {
   res.status(200).send("QuickHire API Running");
});

startServer();
