/**
 * Seed script: Populate the database with sample payment records.
 * Run: node scripts/seed-payments.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Payment = require('../models/Payment');
const User = require('../models/User');

const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Ananya', 'Diya', 'Ishaan', 'Kavya', 'Rohan', 'Priya', 'Arjun',
  'Sneha', 'Rahul', 'Meera', 'Vikram', 'Pooja', 'Siddharth', 'Neha', 'Karthik', 'Tanvi', 'Amit'];
const lastNames = ['Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Verma', 'Reddy', 'Nair', 'Joshi', 'Malhotra'];
const statuses = ['Success', 'Success', 'Success', 'Success', 'Pending', 'Failed']; // weighted toward success
const methods = ['Razorpay', 'UPI', 'Card', 'Net Banking', 'PhonePe', 'Paytm'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTxnId() {
  return 'pay_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 5);
}

function randomDate(daysBack = 90) {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function seedPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get some real users if possible
    const users = await User.find().select('_id name email role').limit(30).lean();
    console.log(`Found ${users.length} existing users`);

    const samplePayments = [];
    const count = 75; // number of payments to seed

    for (let i = 0; i < count; i++) {
      const isEmployer = Math.random() > 0.55;
      const role = isEmployer ? 'Employer' : 'Employee';
      const amount = isEmployer ? 20 : 10;
      const paymentType = isEmployer ? 'Job Post' : 'Job Apply';
      const action = isEmployer ? 'post_job' : 'apply';
      const status = randomItem(statuses);

      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@gmail.com`;

      // Try to use a real user, otherwise generate fake
      let userId;
      if (users.length > 0 && Math.random() > 0.5) {
        const user = randomItem(users);
        userId = user._id;
      } else {
        userId = new mongoose.Types.ObjectId();
      }

      const createdDate = randomDate();
      const txnId = generateTxnId();
      const orderId = `order_${Date.now()}_${i}`;

      samplePayments.push({
        userId,
        userRole: role,
        name,
        email,
        amount,
        paymentType,
        paymentMethod: randomItem(methods),
        transactionId: txnId,
        orderId,
        action,
        status,
        paymentStatus: status === 'Success' ? 'completed' : (status === 'Failed' ? 'failed' : 'pending'),
        used: status === 'Success' ? Math.random() > 0.3 : false,
        createdAt: createdDate,
        updatedAt: createdDate,
        timestamp: createdDate
      });
    }

    // Clear any existing seed data (optional, remove if you want to append)
    // await Payment.deleteMany({});
    // console.log('Cleared existing payments');

    const result = await Payment.insertMany(samplePayments, { ordered: false });
    console.log(`✅ Seeded ${result.length} payment records!`);

    // Print summary
    const successCount = samplePayments.filter(p => p.status === 'Success').length;
    const pendingCount = samplePayments.filter(p => p.status === 'Pending').length;
    const failedCount = samplePayments.filter(p => p.status === 'Failed').length;
    const employeeCount = samplePayments.filter(p => p.userRole === 'Employee').length;
    const employerCount = samplePayments.filter(p => p.userRole === 'Employer').length;

    console.log('\n📊 Seed Summary:');
    console.log(`   Total: ${count}`);
    console.log(`   Success: ${successCount} | Pending: ${pendingCount} | Failed: ${failedCount}`);
    console.log(`   Employees: ${employeeCount} | Employers: ${employerCount}`);
    console.log(`   Total Revenue: ₹${samplePayments.filter(p => p.status === 'Success').reduce((s, p) => s + p.amount, 0)}`);

    await mongoose.disconnect();
    console.log('\n✅ Done! Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
}

seedPayments();
