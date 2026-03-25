const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const userSchema = new mongoose.Schema({
      email: String,
      password: { type: String, select: true },
      role: String
    }, { strict: false });
    
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    const email = 'admin@gmail.com';
    const password = 'admin123';
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found');
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Login match for ${email}: ${isMatch}`);
    console.log(`User role: ${user.role}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();
