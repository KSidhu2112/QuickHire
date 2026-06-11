require('dotenv').config();
const { sendJobAlertEmails } = require('./services/emailService');
const mongoose = require('mongoose');

async function testEmail() {
    try {
        process.env.BREVO_API_KEY = ''; // Force nodemailer
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        const job = {
            _id: new mongoose.Types.ObjectId(),
            title: 'Test Job for Email',
            category: 'IT',
            location: { city: 'Bangalore', state: 'Karnataka' },
            salaryMin: 50000,
            salaryMax: 100000
        };
        
        const employees = [
            { email: 'kurvasidhu2112@gmail.com', name: 'Sidhu' }
        ];
        
        console.log('Sending email...');
        await sendJobAlertEmails(employees, job);
        console.log('Done');
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

testEmail();
