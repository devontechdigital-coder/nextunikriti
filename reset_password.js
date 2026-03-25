const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Minimal User schema for password reset
    const userSchema = new mongoose.Schema({
      email: String,
      password: String
    }, { strict: false });
    
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    const email = 'instructor@gmail.com';
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await User.updateOne({ email }, { $set: { password: hashedPassword } });
    
    if (result.matchedCount > 0) {
      console.log(`Password reset for ${email} successful.`);
    } else {
      console.log(`User ${email} not found.`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetPassword();
