import mongoose from 'mongoose';

const batchStudentSchema = new mongoose.Schema({
  batchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Batch', 
    required: true 
  },
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  joinedOn: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'left'], 
    default: 'active' 
  }
}, { timestamps: true });

// Ensure a student is unique within a batch
batchStudentSchema.index({ batchId: 1, studentId: 1 }, { unique: true });

if (mongoose.models.BatchStudent) {
  delete mongoose.models.BatchStudent;
}
export default mongoose.model('BatchStudent', batchStudentSchema);
