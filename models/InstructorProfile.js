import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['school', 'diploma', 'graduation', 'post_graduation', 'masters', 'phd', 'other'],
      required: true,
      trim: true,
    },
    courseName: {
      type: String,
      trim: true,
      default: '',
    },
    instituteName: {
      type: String,
      trim: true,
      default: '',
    },
    boardOrUniversity: {
      type: String,
      trim: true,
      default: '',
    },
    yearOfPassing: {
      type: String,
      trim: true,
      default: '',
    },
    percentageOrGPA: {
      type: String,
      trim: true,
      default: '',
    },
    stream: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const instructorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Personal details
    fullName: { type: String, trim: true, required: true },
    mobileNumber: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    emailId: { type: String, trim: true, lowercase: true, required: true },
    landlineOrAlternateNumber: { type: String, trim: true, default: '' },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say',
    },
    nationality: { type: String, trim: true, default: '' },

    // Address details
    addressLine1: { type: String, trim: true, default: '' },
    addressLine2: { type: String, trim: true, default: '' },
    landmark: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    pinCode: { type: String, trim: true, default: '' },
    permanentAddress: { type: String, trim: true, default: '' },

    // Family details
    fatherFullName: { type: String, trim: true, default: '' },
    fatherContactNumber: { type: String, trim: true, default: '' },
    fatherOccupation: { type: String, trim: true, default: '' },
    motherFullName: { type: String, trim: true, default: '' },
    motherContactNumber: { type: String, trim: true, default: '' },
    motherOccupation: { type: String, trim: true, default: '' },

    // Education
    education: {
      type: [educationSchema],
      default: [],
    },

    // Bank details
    nameAsPerBankRecord: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    accountNumber: { type: String, trim: true, default: '' },
    typeOfAccount: { type: String, trim: true, default: '' },
    ifscCode: { type: String, trim: true, uppercase: true, default: '' },

    // Documents
    latestPhotograph: { type: String, trim: true, default: '' },
    aadhaarCard: { type: String, trim: true, default: '' },
    panCard: { type: String, trim: true, default: '' },
    votersIdCard: { type: String, trim: true, default: '' },
    drivingLicense: { type: String, trim: true, default: '' },
    otherPhotoIdCard: { type: String, trim: true, default: '' },
    chequeImage: { type: String, trim: true, default: '' },
    educationExperienceTestimonials: { type: String, trim: true, default: '' },

    // Declarations
    declarationAccuracy: { type: Boolean, default: false },
    declarationVerificationConsent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.InstructorProfile || mongoose.model('InstructorProfile', instructorProfileSchema);
