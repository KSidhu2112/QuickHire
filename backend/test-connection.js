const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB Connection...');
console.log('Connection String (masked):',
    process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')
);

mongoose
    .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // 10 second timeout
    })
    .then(() => {
        console.log('✅ SUCCESS! MongoDB Connected!');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ CONNECTION FAILED!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);

        if (error.message.includes('IP')) {
            console.log('\n🔧 FIX: Add 0.0.0.0/0 to Network Access in MongoDB Atlas');
        }
        if (error.message.includes('authentication')) {
            console.log('\n🔧 FIX: Check username and password in connection string');
        }

        process.exit(1);
    });
