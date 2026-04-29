import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  title: { type: String, required: true },
  content: { type: String }, // Rich text description 
  videoUrl: { type: String }, // HLS manifest URL, tokenized URL, or default MP4 URL
  videoQualities: [{
    label: {
      type: String,
      enum: ['240p', '360p', '480p', '720p', '1080p']
    },
    url: { type: String }
  }],
  duration: { type: Number, default: 0 }, // in seconds
  resources: [{
    title: String,
    url: String
  }],
  lessonPlan: { type: String, default: '' },
  lessonPlanStatus: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  lessonPlanSubmittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lessonPlanReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lessonPlanReviewedAt: { type: Date },
  lessonPlanReviewNote: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);
