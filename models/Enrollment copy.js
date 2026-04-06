import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'free'], default: 'paid' },
  status: { type: String, enum: ['active', 'pending_payment', 'suspended'], default: 'active' },
  progress: { type: Number, default: 0 }, // percentage 0-100
  completed: { type: Boolean, default: false },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  lastLessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }
}, { timestamps: true });

// Prevent duplicate enrollments
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Always delete cached model to pick up schema changes on hot-reload
delete mongoose.models['Enrollment'];
export default mongoose.model('Enrollment', enrollmentSchema);
