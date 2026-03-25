import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  days: { type: Number, default: 0 },
  description: { type: String },
  features: [{ type: String }],
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

const Package = mongoose.models.Package || mongoose.model('Package', packageSchema);
export default Package;
