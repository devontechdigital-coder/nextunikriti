import mongoose from 'mongoose';

const classProgressSchema = new mongoose.Schema({
  batchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Batch', 
    required: true 
  },
  classSessionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ClassSession'
  },
  lessonId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lesson',
    required: true 
  },
  completedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure a lesson is only marked complete once per batch session? 
// Actually, it's once per batch for the entire course duration.
classProgressSchema.index({ batchId: 1, lessonId: 1 }, { unique: true });

export default mongoose.models.ClassProgress || mongoose.model('ClassProgress', classProgressSchema);
