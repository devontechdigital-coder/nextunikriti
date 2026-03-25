import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String }, // e.g., bootstrap icon name
  image: { type: String },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  
  // New Landing Page Fields
  description: { type: String },
  shortDescription: { type: String },
  highlights: [{ type: String }],
  faq: [
    {
      question: { type: String },
      answer: { type: String }
    }
  ],
  
  // SEO Fields
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: { type: String }
}, { timestamps: true, strict: false });

// Force clear model to handle Next.js hot reloading schema changes
if (mongoose.models.Category) {
  delete mongoose.models.Category;
}

export default mongoose.model('Category', categorySchema);
