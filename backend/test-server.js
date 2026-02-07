const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('========================================');
console.log('🔍 Quick Server Test (No MongoDB)');
console.log('========================================\n');

// Initialize Express app
const app = express();

// CORS Configuration
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5000'],
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

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'QuickHire Backend is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000
    });
});

// Test route
app.get('/test', (req, res) => {
    res.json({
        message: 'Test route working!',
        env_check: {
            port: process.env.PORT ? '✅' : '❌',
            mongodb_uri: process.env.MONGODB_URI ? '✅' : '❌',
            jwt_secret: process.env.JWT_SECRET ? '✅' : '❌',
            smtp_host: process.env.SMTP_HOST ? '✅' : '❌',
        }
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`✅ Server started successfully!`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
    console.log(`\n📍 Test the server:`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Test:   http://localhost:${PORT}/test`);
    console.log(`\n⚠️  Note: This is a test server without MongoDB connection`);
    console.log(`   Use 'npm start' for full server with database\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
