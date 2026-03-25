import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
}, { timestamps: true });

// Prevent duplicate bookmarks for the same lesson by the same user
bookmarkSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export default mongoose.models.Bookmark || mongoose.model('Bookmark', bookmarkSchema);
