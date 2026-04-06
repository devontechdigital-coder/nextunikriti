import mongoose from 'mongoose';

const pricingOptionSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  label: { type: String, required: true, trim: true },

  paymentType: {
    type: String,
    required: true,
    enum: ['quarterly', 'annual']
  },

  basePrice: { type: Number, required: true, min: 0 },
  discountAmount: { type: Number, default: 0, min: 0 },
  adminFee: { type: Number, default: 0, min: 0 },

  durationDays: { type: Number, required: true, min: 1 }, // 90 or 365

  adminFeePolicy: {
    type: String,
    enum: ['every_annual', 'first_quarter_of_year'],
    default: 'first_quarter_of_year'
  },

  isActive: { type: Boolean, default: true }
}, { _id: true });

const packageSchema = new mongoose.Schema({
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  mode: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  features: [{ type: String }],
  pricingOptions: [pricingOptionSchema],
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

delete mongoose.models.Package;
export default mongoose.model('Package', packageSchema);
