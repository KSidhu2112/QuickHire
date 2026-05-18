const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const c = mongoose.connection.db.collection('payments');

  const total = await c.countDocuments();
  const withName = await c.countDocuments({ name: { $exists: true, $ne: '' } });
  const withUserRole = await c.countDocuments({ userRole: { $exists: true } });
  const withOldRole = await c.countDocuments({ role: { $exists: true } });
  const withPaymentType = await c.countDocuments({ paymentType: { $exists: true } });
  const withPaymentMethod = await c.countDocuments({ paymentMethod: { $exists: true } });

  const result = {
    total,
    withName,
    withUserRole,
    withOldRole,
    withPaymentType,
    withPaymentMethod
  };

  require('fs').writeFileSync(
    require('path').join(__dirname, 'dbcheck2.json'),
    JSON.stringify(result, null, 2)
  );

  console.log('DONE');
  await mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
