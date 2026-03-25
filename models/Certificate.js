import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  certificateUrl: { type: String, required: true },
  issueDate: { type: Date, default: Date.now },
  certificateId: { type: String, required: true, unique: true }
}, { timestamps: true });

export default mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);
