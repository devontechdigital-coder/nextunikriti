import mongoose from 'mongoose';

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
