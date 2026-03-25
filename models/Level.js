import mongoose from 'mongoose';

const levelSchema = new mongoose.Schema({
  instrumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Instrument',
    required: true
  },
  levelName: {
    type: String,
    required: [true, 'Please provide a level name'],
    trim: true
  },
  orderNo: {
    type: Number,
    required: true,
    default: 0
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

// Compound index to ensure level names are unique per instrument (optional but good)
levelSchema.index({ instrumentId: 1, levelName: 1 }, { unique: true });

export default mongoose.models.Level || mongoose.model('Level', levelSchema);
