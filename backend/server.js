const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const employerRoutes = require('./routes/employerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// Initialize Express app
const app = express();

// Middleware
// CORS Configuration
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));

console.log('✅ Service: Loading Review Routes');
app.use('/api/reviews', reviewRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'QuickHire Backend is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 Handler - Must be after all routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

// Start Server FIRST (before MongoDB connection)
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
    console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
});

// MongoDB Connection (non-blocking - server continues if this fails)
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB Connected Successfully!');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`🔗 MongoDB Status: CONNECTED\n`);
    })
    .catch((error) => {
        console.error('⚠️  MongoDB Connection Error:', error.message);
        console.error('⚠️  SERVER IS RUNNING but database features won\'t work');
        console.error('⚠️  Fix: Whitelist your IP in MongoDB Atlas');
        console.error('⚠️  URL: https://cloud.mongodb.com/v2#/security/network/accessList\n');
        // Don't exit - let server continue running
    });

// Handle MongoDB connection after initial connection
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB runtime error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        server.close(() => {
            console.log('✅ Server shut down gracefully');
            process.exit(0);
        });
    } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
        process.exit(1);
    }
});
