import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  classSessionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ClassSession', 
    required: true 
  },
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late'], 
    required: true 
  },
  remarks: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

// One attendance record per student per session
attendanceSchema.index({ classSessionId: 1, studentId: 1 }, { unique: true });

if (mongoose.models.Attendance) {
  delete mongoose.models.Attendance;
}
export default mongoose.model('Attendance', attendanceSchema);
