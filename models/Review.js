import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String }
}, { timestamps: true });

// A user can review a course only once
reviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);
