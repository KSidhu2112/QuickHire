const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { sendOTPEmail } = require('./utils/emailService');

// Load environment variables
dotenv.config();

console.log('🧪 Testing Send OTP Functionality\n');

// Test MongoDB Connection
console.log('1️⃣ Testing MongoDB Connection...');
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('   ✅ MongoDB Connected\n');

        // Test Email Service
        console.log('2️⃣ Testing Email Service...');
        console.log('   📧 SMTP Host:', process.env.SMTP_HOST);
        console.log('   📧 SMTP Port:', process.env.SMTP_PORT);
        console.log('   📧 SMTP User:', process.env.SMTP_USER);
        console.log('   📧 Sender Email:', process.env.SENDER_EMAIL);
        console.log('');

        // Test sending OTP email
        console.log('3️⃣ Attempting to send test OTP email...');
        const testOTP = '123456';
        const testEmail = process.env.SENDER_EMAIL; // Send to yourself for testing

        try {
            await sendOTPEmail(testEmail, testOTP, 'registration');
            console.log('   ✅ OTP Email sent successfully!');
            console.log('   ✉️  Check your inbox:', testEmail);
            console.log('\n✨ All tests passed!\n');
        } catch (error) {
            console.error('   ❌ Failed to send email:', error.message);
            console.error('   Error details:', error);
        }

        // Close connection
        await mongoose.connection.close();
        process.exit(0);
    })
    .catch((error) => {
        console.error('   ❌ MongoDB Connection Failed:', error.message);
        process.exit(1);
    });
