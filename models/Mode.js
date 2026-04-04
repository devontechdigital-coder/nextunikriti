import mongoose from 'mongoose';

const modeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a mode name'],
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

export default mongoose.models.Mode || mongoose.model('Mode', modeSchema);
