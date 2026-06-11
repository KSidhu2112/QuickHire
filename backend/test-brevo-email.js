/**
 * Quick test: verify Brevo API email sending works.
 * Run:  node test-brevo-email.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  console.log('\n🧪 ========== BREVO API EMAIL TEST ==========\n');

  // 1. Check env vars
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL;
  console.log(`BREVO_API_KEY: ${apiKey ? '✅ Set (' + apiKey.substring(0, 15) + '...)' : '❌ MISSING'}`);
  console.log(`SENDER_EMAIL:  ${senderEmail || '❌ MISSING'}`);

  if (!apiKey || !senderEmail) {
    console.error('\n❌ Missing env vars. Cannot proceed.\n');
    process.exit(1);
  }

  // 2. Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected\n');

  // 3. Fetch employees
  const User = require('./models/User');
  const employees = await User.find({ role: 'jobseeker', status: 'active' }).select('_id email name');
  console.log(`📋 Found ${employees.length} active jobseekers:`);
  employees.forEach(e => console.log(`   • ${e.name} <${e.email}>`));

  // 4. Create a mock job object
  const mockJob = {
    _id: new mongoose.Types.ObjectId(),
    title: 'Test Job — Brevo API Verification',
    category: 'TESTING',
    location: { city: 'Bangalore', state: 'Karnataka' },
    salaryMin: 15000,
    salaryMax: 25000,
  };

  console.log(`\n📧 Sending test emails for job: "${mockJob.title}"\n`);

  // 5. Send
  const { sendJobAlertEmails } = require('./services/emailService');
  await sendJobAlertEmails(employees, mockJob);

  console.log('\n🧪 ========== TEST COMPLETE ==========\n');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
