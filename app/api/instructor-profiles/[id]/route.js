import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import InstructorProfile from '@/models/InstructorProfile';
import User from '@/models/User';
import { getUserFromCookie } from '@/utils/auth';

const POPULATE_USER_FIELDS = 'name email phone role status schoolId avatar bio';

function canManageAllProfiles(user) {
  return ['admin', 'school_admin'].includes(user?.role);
}

function canManageOwnProfile(user) {
  return user?.role === 'instructor';
}

function buildUpdatePayload(body) {
  const payload = {};
  const allowedFields = [
    'fullName',
    'mobileNumber',
    'dateOfBirth',
    'emailId',
    'landlineOrAlternateNumber',
    'gender',
    'nationality',
    'addressLine1',
    'addressLine2',
    'landmark',
    'state',
    'pinCode',
    'permanentAddress',
    'fatherFullName',
    'fatherContactNumber',
    'fatherOccupation',
    'motherFullName',
    'motherContactNumber',
    'motherOccupation',
    'education',
    'nameAsPerBankRecord',
    'bankName',
    'accountNumber',
    'typeOfAccount',
    'ifscCode',
    'latestPhotograph',
    'aadhaarCard',
    'panCard',
    'votersIdCard',
    'drivingLicense',
    'otherPhotoIdCard',
    'chequeImage',
    'educationExperienceTestimonials',
    'declarationAccuracy',
    'declarationVerificationConsent',
  ];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = field === 'education' ? (Array.isArray(body.education) ? body.education : []) : body[field];
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'declarationAccuracy')) {
    payload.declarationAccuracy = Boolean(payload.declarationAccuracy);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'declarationVerificationConsent')) {
    payload.declarationVerificationConsent = Boolean(payload.declarationVerificationConsent);
  }

  return payload;
}

async function getAuthorizedProfile(profileId, authUser) {
  const profile = await InstructorProfile.findById(profileId).populate('userId', POPULATE_USER_FIELDS);

  if (!profile) {
    return { error: NextResponse.json({ success: false, error: 'Instructor profile not found' }, { status: 404 }) };
  }

  if (authUser.role === 'school_admin' && profile.userId?.schoolId?.toString() !== authUser.schoolId) {
    return { error: NextResponse.json({ success: false, error: 'Unauthorized for this instructor' }, { status: 403 }) };
  }

  if (canManageOwnProfile(authUser) && profile.userId?._id?.toString() !== authUser.id) {
    return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 }) };
  }

  return { profile };
}

export async function GET(req, { params }) {
  try {
    const authUser = getUserFromCookie();
    if (!authUser || (!canManageAllProfiles(authUser) && !canManageOwnProfile(authUser))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { profile, error } = await getAuthorizedProfile(params.id, authUser);
    if (error) return error;

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const authUser = getUserFromCookie();
    if (!authUser || (!canManageAllProfiles(authUser) && !canManageOwnProfile(authUser))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { profile, error } = await getAuthorizedProfile(params.id, authUser);
    if (error) return error;

    const body = await req.json();

    if (body.userId && body.userId !== profile.userId?._id?.toString()) {
      return NextResponse.json({ success: false, error: 'userId cannot be changed' }, { status: 400 });
    }

    if (authUser.role === 'school_admin') {
      const instructorUser = await User.findById(profile.userId?._id).select('schoolId role');
      if (!instructorUser || instructorUser.role !== 'instructor' || instructorUser.schoolId?.toString() !== authUser.schoolId) {
        return NextResponse.json({ success: false, error: 'Unauthorized for this instructor' }, { status: 403 });
      }
    }

    const updatedProfile = await InstructorProfile.findByIdAndUpdate(
      params.id,
      { $set: buildUpdatePayload(body) },
      { new: true, runValidators: true }
    ).populate('userId', POPULATE_USER_FIELDS);

    return NextResponse.json({ success: true, data: updatedProfile });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const authUser = getUserFromCookie();
    if (!authUser || !canManageAllProfiles(authUser)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { profile, error } = await getAuthorizedProfile(params.id, authUser);
    if (error) return error;

    await InstructorProfile.findByIdAndDelete(profile._id);

    return NextResponse.json({ success: true, message: 'Instructor profile deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
