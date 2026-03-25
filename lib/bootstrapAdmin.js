import User from '@/models/User';
import bcrypt from 'bcryptjs';

let isBootstrapped = false;

export async function ensureAdminExists() {
  if (isBootstrapped) return;
  
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const email = process.env.ADMIN_EMAIL || 'admin@example.com';
      const password = process.env.ADMIN_PASSWORD || 'Admin@123';
      const name = process.env.ADMIN_NAME || 'Platform Admin';
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Default admin created');
    }
    isBootstrapped = true;
  } catch (error) {
    console.error('❌ Error bootstrapping admin account:', error.message);
  }
}
