const mongoose = require('mongoose');

const uri = "mongodb+srv://ksidhusidhu2112_db_user:itk33DZX8oa8ggyX@cluster0.kvkshtz.mongodb.net/QuickHire?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
    await mongoose.connect(uri);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("collections:", collections.map(c => c.name));
    process.exit(0);
}
run();
