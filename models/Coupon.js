import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountPercentage: { type: Number, required: true, min: 0, max: 100 },
  expiryDate: { type: Date, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // Optional: specific course only
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  maxUsage: { type: Number, default: 100 }
}, { timestamps: true });

export default mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
