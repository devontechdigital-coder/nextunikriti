import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  title: { type: String, required: true },
  instructions: { type: String, required: true },
  totalMarks: { type: Number, default: 100 },
  dueDate: { type: Date }
}, { timestamps: true });

export default mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);
