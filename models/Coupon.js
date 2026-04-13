import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  title: { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: Number, required: true, min: 0 },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  minOrderAmount: { type: Number, default: 0, min: 0 },
  maxDiscountAmount: { type: Number, default: null, min: 0 },
  startDate: { type: Date, default: null },
  expiryDate: { type: Date, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // Optional: specific course only
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  maxUsage: { type: Number, default: 100 }
}, { timestamps: true });

couponSchema.pre('validate', function syncLegacyDiscountFields() {
  if (this.discountType === 'percentage') {
    if (!this.discountValue && this.discountPercentage) {
      this.discountValue = this.discountPercentage;
    }
    this.discountPercentage = this.discountValue;
  } else if (this.discountType === 'fixed' && this.discountPercentage) {
    this.discountPercentage = 0;
  }
});

if (mongoose.models.Coupon) {
  delete mongoose.models.Coupon;
}

export default mongoose.model('Coupon', couponSchema);
