const mongoose = require('mongoose');
const db = 'mongodb://localhost:27017/unikritinext';

async function seed() {
  try {
    await mongoose.connect(db);
    console.log('Connected to DB');

    const courseSchema = new mongoose.Schema({ title: String });
    const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

    const packageSchema = new mongoose.Schema({
      course_id: mongoose.Schema.Types.ObjectId,
      name: String,
      price: Number,
      description: String,
      features: [String],
      is_active: { type: Boolean, default: true }
    });
    const Package = mongoose.models.Package || mongoose.model('Package', packageSchema);

    const course = await Course.findOne({ title: /Guitar Foundation/i });
    if (!course) {
      console.log('Course not found');
      process.exit();
    }

    // Clear existing packages for this course to avoid duplicates during test
    await Package.deleteMany({ course_id: course._id });

    await Package.create([
      {
        course_id: course._id,
        name: 'Standard Plan',
        price: 999,
        description: 'Perfect for beginners starting their journey.',
        features: ['8 HD Video Lessons', 'Downloadable PDF Guides', 'Basic Exercises'],
        is_active: true
      },
      {
        course_id: course._id,
        name: 'Pro Plan',
        price: 1999,
        description: 'Advanced features for serious learners.',
        features: ['Everything in Standard', 'Live Q&A Sessions', 'Personalized Feedback', 'Certificate of Completion'],
        is_active: true
      }
    ]);

    console.log('Packages seeded successfully for course:', course.title);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
