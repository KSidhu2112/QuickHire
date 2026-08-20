const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        try {
            await mongoose.connection.db.dropCollection('ragdatas');
            console.log('Collection ragdatas dropped successfully.');
        } catch (err) {
            console.log('Error or already dropped:', err.message);
        }
        process.exit(0);
    })
    .catch(err => process.exit(1));
