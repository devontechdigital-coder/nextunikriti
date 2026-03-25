import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  category: { type: String }, // Keep for legacy compatibility during migration
  course_creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  instrument_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Instrument' },
  level_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Level' },
  thumbnail: { type: String, default: '' },
  level: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'], 
    default: 'All Levels' 
  },
  language: { type: String, default: 'English' },
  isPublished: { type: Boolean, default: false },
  moderationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'approved' 
  },
  slug: { type: String, unique: true, sparse: true },
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: { type: String },
  // Marketing / informational fields
  shortDescription: { type: String },
  mode: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
  duration: { type: String },
  certification: { type: Boolean, default: false },
  faq: [{ question: { type: String }, answer: { type: String } }]
}, { timestamps: true });

// Ensure only one active course exists per instrument + level mapping
courseSchema.index({ instrument_id: 1, level_id: 1 }, { 
  unique: true, 
  partialFilterExpression: { 
    instrument_id: { $type: 'objectId' }, 
    level_id: { $type: 'objectId' } 
  } 
});

if (mongoose.models.Course) {
  const model = mongoose.models.Course;
  // If the cached model doesn't have the new fields, delete it to force reload
  if (!model.schema.paths.shortDescription || !model.schema.paths.course_creator || !model.schema.paths.instrument_id || !model.schema.paths.level_id) {
    delete mongoose.models.Course;
  }
}

export default mongoose.models.Course || mongoose.model('Course', courseSchema);
