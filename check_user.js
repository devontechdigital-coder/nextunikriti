const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      email: String,
      role: String
    }, { strict: false }));

    const user = await User.findOne({ email: 'instructor@gmail.com' });
    if (user) {
      console.log('User found:', JSON.stringify(user, null, 2));
    } else {
      console.log('User instructor@gmail.com not found');
      const allUsers = await User.find({}, 'email role');
      console.log('All Users:', JSON.stringify(allUsers, null, 2));
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
