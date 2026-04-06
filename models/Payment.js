import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
  pricingOptionId: { type: mongoose.Schema.Types.ObjectId },
  packagePriceKey: { type: String, trim: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  gateway: { type: String, enum: ['stripe', 'razorpay', 'icici', 'pay_later', 'admin_manual'], required: true },
  transactionId: { type: String, required: true },
  receiptId: { type: String }, // For razorpay usually
  couponApplied: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }
}, { timestamps: true });

// Always delete cached model to pick up schema changes on hot-reload
delete mongoose.models['Payment'];
export default mongoose.model('Payment', paymentSchema);
