const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = "mongodb+srv://developerseotowebdesign:dIdEytyWNIZApQns@cluster0.qp5ewpv.mongodb.net/unikriti?retryWrites=true&w=majority&appName=Cluster0";

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const users = await mongoose.connection.db.collection('users').find({
      role: { $in: ['admin', 'school_admin'] }
    }).project({ name: 1, email: 1, role: 1, schoolId: 1 }).toArray();
    
    const schools = await mongoose.connection.db.collection('schools').find().project({ schoolName: 1 }).toArray();
    
    fs.writeFileSync('user_diag_results.json', JSON.stringify({ users, schools }, null, 2));
    process.exit(0);
  } catch (err) {
    fs.writeFileSync('user_diag_error.txt', err.stack);
    process.exit(1);
  }
}

checkUsers();
