const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function diagnose() {
  console.log('Starting diagnosis...');
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('Testing models...');
    const Banner = require('./models/Banner').default || require('./models/Banner');
    const Section = require('./models/Section').default || require('./models/Section');
    const Course = require('./models/Course').default || require('./models/Course');
    const User = require('./models/User').default || require('./models/User');

    console.log('✅ Models loaded successfully');

    const bannerCount = await Banner.countDocuments();
    console.log(`Banner count: ${bannerCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    process.exit(1);
  }
}

diagnose();
