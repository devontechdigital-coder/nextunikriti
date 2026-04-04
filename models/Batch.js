import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  batchName: { type: String, required: true },
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School', 
    required: true 
  },
  programType: { 
    type: String, 
    enum: ['in_school', 'after_school'], 
    required: true 
  },
  instrument: { 
    type: String, 
    trim: true,
    required: true 
  },
  instrument_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Instrument'
  },
  level: { 
    type: String, 
    trim: true,
    required: true 
  },
  level_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Level'
  },
  teacherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  maxStrength: { type: Number, required: true, min: 1 },
  startDate: { type: Date },
  endDate: { type: Date },
  course_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course',
    default: null
  },
  price: { type: Number, default: 0 },
  timetable: [{
    day: { type: String, required: true },
    time: { type: String, required: true }
  }],
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  }
}, { timestamps: true });

if (mongoose.models.Batch) {
  delete mongoose.models.Batch;
}
export default mongoose.model('Batch', batchSchema);
