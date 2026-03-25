import mongoose from 'mongoose';

const batchCourseSchema = new mongoose.Schema({
  batchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Batch', 
    required: true,
    unique: true // One active course per batch
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.BatchCourse || mongoose.model('BatchCourse', batchCourseSchema);
