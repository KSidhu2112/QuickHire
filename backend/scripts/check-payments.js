const mongoose = require('mongoose');
require('dotenv').config();
const Payment = require('../models/Payment');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const count = await Payment.countDocuments();
  console.log('Total payments:', count);

  // Check one record's fields
  const p = await Payment.findOne().lean();
  if (p) {
    console.log('Fields:', Object.keys(p).join(', '));
    console.log('Has name:', p.name || 'MISSING');
    console.log('Has email:', p.email || 'MISSING');
    console.log('Has userRole:', p.userRole || 'MISSING (has role:', p.role, ')');
    console.log('Status:', p.status || 'MISSING (paymentStatus:', p.paymentStatus, ')');
    console.log('PaymentType:', p.paymentType || 'MISSING (action:', p.action, ')');
    console.log('PaymentMethod:', p.paymentMethod || 'MISSING');
    console.log('Amount:', p.amount);
  }

  // Count by old vs new schema
  const withName = await Payment.countDocuments({ name: { $exists: true, $ne: '' } });
  const withUserRole = await Payment.countDocuments({ userRole: { $exists: true } });
  const withRole = await Payment.countDocuments({ role: { $exists: true } });
  const withNewStatus = await Payment.countDocuments({ status: { $in: ['Success', 'Failed', 'Pending'] } });
  const withOldStatus = await Payment.countDocuments({ paymentStatus: { $exists: true } });

  console.log('\n--- Schema Analysis ---');
  console.log('With name:', withName);
  console.log('With userRole:', withUserRole);
  console.log('With role (old):', withRole);
  console.log('With new status:', withNewStatus);
  console.log('With old paymentStatus:', withOldStatus);

  await mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
