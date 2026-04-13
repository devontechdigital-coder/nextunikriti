import mongoose from 'mongoose';
import { createDefaultSchoolSchedule } from '@/lib/schoolSchedule';

const schoolScheduleSchema = new mongoose.Schema({
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  isOpen: { type: Boolean, default: false },
  slots: [{
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
  }],
}, { _id: false });

const schoolSchema = new mongoose.Schema({
  schoolName: { type: String, required: true },
  schoolCode: { type: String, unique: true },
  board: { type: String, default: '' },
  contactPerson: { type: String, default: '' },
  contactPhone: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pinCode: { type: String, default: '' },
  weeklySchedule: {
    type: [schoolScheduleSchema],
    default: createDefaultSchoolSchedule,
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  }
}, { timestamps: true });

if (mongoose.models.School) {
  delete mongoose.models.School;
}
export default mongoose.model('School', schoolSchema);
