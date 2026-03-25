import mongoose from 'mongoose';

const classSessionSchema = new mongoose.Schema({
  batchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Batch', 
    required: true 
  },
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School', 
    required: true 
  },
  teacherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  classDate: { 
    type: Date, 
    required: true 
  },
  timetableId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Timetable',
    required: false
  },
  topicTaught: { 
    type: String, 
    default: '' 
  },
  notes: { 
    type: String, 
    default: '' 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'cancelled'], 
    default: 'scheduled' 
  }
}, { timestamps: true });

// Ensure a teacher can't have two sessions for the same batch at the exact same date/time
classSessionSchema.index({ batchId: 1, classDate: 1 }, { unique: true });

if (mongoose.models.ClassSession) {
  delete mongoose.models.ClassSession;
}
export default mongoose.model('ClassSession', classSessionSchema);
