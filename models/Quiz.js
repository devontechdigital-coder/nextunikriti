import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  title: { type: String, required: true },
  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true },
    explanation: { type: String }
  }],
  passingScore: { type: Number, default: 50 } // percentage
}, { timestamps: true });

export default mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
