import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School', 
    required: true 
  },
  enrolmentNumber: { type: String, required: true, unique: true },
  dob: { type: Date },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'],
    required: true 
  },
  bloodGroup: { type: String },
  nationality: { type: String, default: 'Indian' },
  addressLine1: { type: String },
  addressLine2: { type: String },
  city: { type: String },
  state: { type: String },
  pinCode: { type: String },
  status: { 
    type: String, 
    enum: ['lead', 'trial', 'active', 'inactive', 'left'], 
    default: 'lead' 
  },
  joiningDate: { type: Date },
  leavingDate: { type: Date },
  profilePhoto: { type: String, default: '' }
}, { timestamps: true });

if (mongoose.models.Student) {
  delete mongoose.models.Student;
}
export default mongoose.model('Student', studentSchema);
