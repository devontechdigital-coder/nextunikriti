import mongoose from 'mongoose';

const courseMappingSchema = new mongoose.Schema({
  instrument: { type: String, required: true },
  level: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
}, { timestamps: true });

courseMappingSchema.index({ instrument: 1, level: 1 }, { unique: true });

export default mongoose.models.CourseMapping || mongoose.model('CourseMapping', courseMappingSchema);
