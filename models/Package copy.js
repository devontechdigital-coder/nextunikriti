import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  name: { type: String, required: true },
  mode: { type: String, required: true, trim: true, default: 'Online' },
  price: { type: Number, required: true, min: 0 },
  days: { type: Number, default: 0 },
  annualPrice: { type: Number, default: null, min: 0 },
  quarterlyPrice: { type: Number, default: null, min: 0 },
  pricingOptions: [
    {
      key: { type: String, required: true, trim: true },
      label: { type: String, required: true, trim: true },
      price: { type: Number, required: true, min: 0 },
      days: { type: Number, default: 0, min: 0 },
      isDefault: { type: Boolean, default: false },
    },
  ],
  description: { type: String },
  features: [{ type: String }],
  is_active: { type: Boolean, default: true }
}, { timestamps: true });

const Package = mongoose.models.Package || mongoose.model('Package', packageSchema);
export default Package;
