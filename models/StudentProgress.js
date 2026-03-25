import mongoose from 'mongoose';

const studentProgressSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  lessonId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lesson', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed'], 
    default: 'completed' // Usually auto-marked when teacher completes class
  },
  completionDate: { type: Date, default: Date.now }
}, { timestamps: true });

studentProgressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });

export default mongoose.models.StudentProgress || mongoose.model('StudentProgress', studentProgressSchema);
