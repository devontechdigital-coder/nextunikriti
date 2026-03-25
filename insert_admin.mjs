import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  await db.collection('users').updateOne(
    { email: 'admin2@gmail.com' },
    { $set: { 
        name: 'Super Admin 2',
        email: 'admin2@gmail.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      } 
    },
    { upsert: true }
  );
  console.log('Admin2 created or updated successfully.');
  process.exit(0);
}
run().catch(console.error);
