import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  enquiryType: {
    type: String,
    enum: ['trial_class', 'general'],
    default: 'trial_class',
    index: true,
  },
  source: { type: String, default: 'dynamic_page' },
  pageSlug: { type: String, trim: true, default: '' },
  pageTitle: { type: String, trim: true, default: '' },
  subject: { type: String, trim: true, default: '' },
  message: { type: String, trim: true, default: '' },
  name: { type: String, required: true, trim: true },
  age: { type: String, trim: true, default: '' },
  gender: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  center: { type: String, trim: true, default: '' },
  instrument: { type: String, trim: true, default: '' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolName: { type: String, trim: true, default: '' },
  preferredDay: { type: String, trim: true, default: '' },
  preferredTimeSlot: { type: String, trim: true, default: '' },
  preferredDays: [{ type: String, trim: true }],
  preferredTimeSlots: [{ type: String, trim: true }],
  status: {
    type: String,
    enum: ['new', 'contacted', 'scheduled', 'closed'],
    default: 'new',
    index: true,
  },
  notes: { type: String, trim: true, default: '' },
}, { timestamps: true });

export default mongoose.models.Enquiry || mongoose.model('Enquiry', enquirySchema);
