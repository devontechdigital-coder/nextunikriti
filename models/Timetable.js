import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Please select a batch']
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'School is required']
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  schedules: [{
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: [true, 'Please select a day']
    },
    startTime: {
      type: String,
      required: [true, 'Please provide start time (HH:mm)'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use correct time format (HH:mm)']
    },
    endTime: {
      type: String,
      required: [true, 'Please provide end time (HH:mm)'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please use correct time format (HH:mm)']
    }
  }],
  roomName: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Basic structural index
timetableSchema.index({ batchId: 1, 'schedules.dayOfWeek': 1 });
timetableSchema.index({ teacherId: 1, 'schedules.dayOfWeek': 1 });
timetableSchema.index({ schoolId: 1 });

const Timetable = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);
export default Timetable;
