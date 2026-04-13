import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  gradeName: { type: String, trim: true, default: '' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },

  pricingOptionId: { type: mongoose.Schema.Types.ObjectId },
  preferredDays: [{ type: String, trim: true }],
  preferredTimes: [{ type: String, trim: true }],

  paymentStatus: { type: String, enum: ['paid', 'pending', 'free'], default: 'paid' },
  status: { type: String, enum: ['active', 'pending_payment', 'suspended'], default: 'active' },

  // 👉 NEW IMPORTANT FIELDS
  startDate: { type: Date },
  endDate: { type: Date },

  billingCycleStart: { type: Date },
  billingCycleEnd: { type: Date },

  adminFeeChargedInCycle: { type: Boolean, default: false },

  renewalCount: { type: Number, default: 0 },

  // existing learning fields
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  lastLessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }

}, { timestamps: true });

// ❗ change this index (important)
enrollmentSchema.index({ userId: 1, courseId: 1, packageId: 1 }, { unique: true });

delete mongoose.models['Enrollment'];
export default mongoose.model('Enrollment', enrollmentSchema);
