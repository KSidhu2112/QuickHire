const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
}

async function run() {
    await mongoose.connect(uri);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("collections:", collections.map(c => c.name));
    process.exit(0);
}
run();
