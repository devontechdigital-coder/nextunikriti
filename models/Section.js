import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  order: { type: Number, required: true, default: 0 }
}, { timestamps: true });

export default mongoose.models.Section || mongoose.model('Section', sectionSchema);
