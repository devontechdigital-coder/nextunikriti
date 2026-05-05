import User from '@/models/User';
import bcrypt from 'bcryptjs';

let bootstrapPromise = null;

export async function ensureAdminExists() {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = ensureAdminExistsInternal().finally(() => {
    bootstrapPromise = null;
  });

  return bootstrapPromise;
}

async function ensureAdminExistsInternal() {
  try {
    const adminExists = await User.exists({ role: 'admin' });
    if (adminExists) return;

    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    const name = process.env.ADMIN_NAME || 'Platform Admin';
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await User.findOne({ email }).select('+password');
    if (existingUser) {
      existingUser.name = existingUser.name || name;
      existingUser.password = hashedPassword;
      existingUser.role = 'admin';
      existingUser.status = 'active';
      await existingUser.save();
      console.log('Default admin restored');
      return;
    }

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    });
    console.log('Default admin created');
  } catch (error) {
    console.error('Error bootstrapping admin account:', error.message);
  }
}
