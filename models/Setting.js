import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

// We will use this to store the active payment gateway
// { key: 'payment_gateway', value: 'stripe' | 'razorpay' }

export default mongoose.models.Setting || mongoose.model('Setting', settingSchema);
