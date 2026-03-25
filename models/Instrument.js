import mongoose from 'mongoose';

const instrumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide an instrument name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

export default mongoose.models.Instrument || mongoose.model('Instrument', instrumentSchema);
