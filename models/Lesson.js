import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  title: { type: String, required: true },
  content: { type: String }, // Rich text description 
  videoUrl: { type: String }, // HLS manifest URL or tokenized URL
  duration: { type: Number, default: 0 }, // in seconds
  resources: [{
    title: String,
    url: String
  }],
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);
