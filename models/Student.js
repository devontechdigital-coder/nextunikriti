import mongoose from 'mongoose';
import Counter from './Counter';

const STUDENT_COUNTER_KEY = 'student_enrolment_number';
const ENROLMENT_PREFIX = 'STU';

const studentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School', 
    required: true 
  },
  enrolmentNumber: {
    type: String,
    unique: true,
    immutable: true,
    index: true,
    match: [/^STU-\d{5}$/, 'Enrolment number must be in STU-00001 format']
  },
  joiningYear: {
    type: String,
    trim: true,
    default: ''
  },
  // Legacy storage key preserved; `dateOfBirth` is the preferred alias.
  dob: {
    type: Date,
    alias: 'dateOfBirth'
  },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'],
    required: true 
  },
  studentName: {
    type: String,
    trim: true,
    default: ''
  },
  onBoard: {
    type: Boolean,
    default: false
  },
  time: {
    type: String,
    trim: true,
    default: ''
  },
  enrolledFor: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  bloodGroup: { type: String },
  nationality: { type: String, default: 'Indian' },
  // Legacy storage keys preserved; new names exposed via aliases.
  addressLine1: { type: String, trim: true, default: '', alias: 'address1' },
  addressLine2: { type: String, trim: true, default: '', alias: 'address2' },
  street: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '', alias: 'cityDistrict' },
  state: { type: String, trim: true, default: '' },
  pinCode: { type: String, trim: true, default: '' },
  motherName: { type: String, trim: true, default: '' },
  motherMobile: { type: String, trim: true, default: '' },
  motherEmail: { type: String, trim: true, lowercase: true, default: '' },
  fatherName: { type: String, trim: true, default: '' },
  fatherMobile: { type: String, trim: true, default: '' },
  fatherEmail: { type: String, trim: true, lowercase: true, default: '' },
  homePhone: { type: String, trim: true, default: '' },
  emergencyDetails: { type: String, trim: true, default: '' },
  relationship: { type: String, trim: true, default: '' },
  emergencyPhoneNo: { type: String, trim: true, default: '' },
  allergies: { type: String, trim: true, default: '' },
  medicalCondition: { type: String, trim: true, default: '' },
  status: { 
    type: String, 
    enum: ['lead', 'trial', 'active', 'inactive', 'left'], 
    default: 'lead' 
  },
  // Legacy storage keys preserved; new names exposed via aliases.
  joiningDate: { type: Date, alias: 'dateOfJoining' },
  leavingDate: { type: Date, alias: 'dateOfLeaving' },
  profilePhoto: { type: String, default: '' }
}, { timestamps: true });

studentSchema.pre('save', async function generateEnrolmentNumber(next) {
  if (!this.isNew || this.enrolmentNumber) {
    return next();
  }

  try {
    const counter = await Counter.findOneAndUpdate(
      { name: STUDENT_COUNTER_KEY },
      {
        $inc: { seq: 1 },
        $setOnInsert: { name: STUDENT_COUNTER_KEY }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    this.enrolmentNumber = `${ENROLMENT_PREFIX}-${String(counter.seq).padStart(5, '0')}`;
    return next();
  } catch (error) {
    return next(error);
  }
});

export default mongoose.models.Student || mongoose.model('Student', studentSchema);
