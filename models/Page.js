import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  // SEO Fields
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: { type: String },
  imageUrl: { type: String, default: '' },
  showEnquiryForm: { type: Boolean, default: false },
  customScripts: { type: String },
  customCSS: { type: String },
  customContent: { type: String },
  isRawHTML: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Page || mongoose.model('Page', pageSchema);
