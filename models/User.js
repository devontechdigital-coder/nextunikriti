import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, sparse: true, unique: true },
  email: { type: String, sparse: true, unique: true },
  password: { type: String, select: false },
  role: { 
    type: String, 
    enum: ['student', 'instructor', 'admin', 'sub_admin', 'school_admin', 'parent', 'staff'], 
    default: 'student' 
  },
  adminPermissions: [{
    key: { type: String, trim: true },
    view: { type: Boolean, default: true },
    edit: { type: Boolean, default: false },
  }],
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    sparse: true
  },
  instrumentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Instrument' }],
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['active', 'suspended', 'pending_approval'], 
    default: 'active' 
  }
}, { timestamps: true });

delete mongoose.models.User;
export default mongoose.model('User', userSchema);
