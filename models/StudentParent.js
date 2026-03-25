import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relation: { 
    type: String, 
    enum: ['mother', 'father', 'guardian'],
    required: true 
  },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  occupation: { type: String },
}, { timestamps: true });

if (mongoose.models.StudentParent) {
  delete mongoose.models.StudentParent;
}
export default mongoose.model('StudentParent', parentSchema);
