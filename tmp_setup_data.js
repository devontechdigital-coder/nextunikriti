const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGO_URI = process.env.MONGODB_URI;

const InstrumentSchema = new mongoose.Schema({ name: String });
const CourseSchema = new mongoose.Schema({ title: String, slug: String, instrument_id: mongoose.Schema.Types.ObjectId });
const BatchSchema = new mongoose.Schema({
  batchName: String,
  course_id: mongoose.Schema.Types.ObjectId,
  schoolId: mongoose.Schema.Types.ObjectId,
  programType: String,
  instrument: String,
  level: String,
  teacherId: mongoose.Schema.Types.ObjectId,
  maxStrength: Number,
  price: Number,
  startDate: Date,
  timetable: [{ day: String, time: String }],
  status: { type: String, default: 'active' }
});
const UserSchema = new mongoose.Schema({ name: String, role: String });

async function setup() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const Instrument = mongoose.models.Instrument || mongoose.model('Instrument', InstrumentSchema);
  const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);
  const Batch = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  let guitar = await Instrument.findOne({ name: /Guitar/i });
  if (!guitar) {
    guitar = await Instrument.create({ name: 'Guitar' });
    console.log('Created Guitar Instrument:', guitar._id);
  } else {
    console.log('Found Guitar Instrument:', guitar._id);
  }

  const course = await Course.findOne({ slug: 'guitar-foundation' }) || await Course.findOne({ title: /Guitar/i });
  if (!course) {
    console.log('Course guitar-foundation not found');
    process.exit(1);
  }
  
  // Fix course instrument
  course.instrument_id = guitar._id;
  await course.save();
  console.log('Updated Course Instrument to Guitar for:', course.title);

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.log('Admin user not found');
    process.exit(1);
  }
  
  await Batch.deleteMany({ course_id: course._id });
  
  const batches = [
    {
      batchName: 'Morning Riffs',
      course_id: course._id,
      schoolId: admin._id,
      programType: 'after_school',
      instrument: 'Guitar',
      level: 'Foundation',
      teacherId: admin._id,
      maxStrength: 10,
      price: 2999,
      startDate: new Date('2026-04-01'),
      timetable: [{ day: 'Monday', time: '10:00 AM' }, { day: 'Wednesday', time: '10:00 AM' }],
      status: 'active'
    },
    {
      batchName: 'Evening Chords',
      course_id: course._id,
      schoolId: admin._id,
      programType: 'after_school',
      instrument: 'Guitar',
      level: 'Foundation',
      teacherId: admin._id,
      maxStrength: 15,
      price: 3499,
      startDate: new Date('2026-04-05'),
      timetable: [{ day: 'Tuesday', time: '06:00 PM' }, { day: 'Thursday', time: '06:00 PM' }],
      status: 'active'
    }
  ];

  await Batch.create(batches);
  console.log('Created batches for:', course.title);

  process.exit(0);
}

setup().catch(err => {
  console.error(err);
  process.exit(1);
});
