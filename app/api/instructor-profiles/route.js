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

async function findInstructorUser(userId) {
  return User.findById(userId).select('role schoolId name email phone status avatar bio');
}

function buildProfilePayload(body) {
  return {
    userId: body.userId,
    fullName: body.fullName,
    mobileNumber: body.mobileNumber,
    dateOfBirth: body.dateOfBirth || undefined,
    emailId: body.emailId,
    landlineOrAlternateNumber: body.landlineOrAlternateNumber,
    gender: body.gender,
    nationality: body.nationality,
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2,
    landmark: body.landmark,
    state: body.state,
    pinCode: body.pinCode,
    permanentAddress: body.permanentAddress,
    fatherFullName: body.fatherFullName,
    fatherContactNumber: body.fatherContactNumber,
    fatherOccupation: body.fatherOccupation,
    motherFullName: body.motherFullName,
    motherContactNumber: body.motherContactNumber,
    motherOccupation: body.motherOccupation,
    education: Array.isArray(body.education) ? body.education : [],
    nameAsPerBankRecord: body.nameAsPerBankRecord,
    bankName: body.bankName,
    accountNumber: body.accountNumber,
    typeOfAccount: body.typeOfAccount,
    ifscCode: body.ifscCode,
    latestPhotograph: body.latestPhotograph,
    aadhaarCard: body.aadhaarCard,
    panCard: body.panCard,
    votersIdCard: body.votersIdCard,
    drivingLicense: body.drivingLicense,
    otherPhotoIdCard: body.otherPhotoIdCard,
    chequeImage: body.chequeImage,
    educationExperienceTestimonials: body.educationExperienceTestimonials,
    declarationAccuracy: Boolean(body.declarationAccuracy),
    declarationVerificationConsent: Boolean(body.declarationVerificationConsent),
  };
}

export async function GET(req) {
  try {
    const authUser = getUserFromCookie();
    if (!authUser || (!canManageAllProfiles(authUser) && !canManageOwnProfile(authUser))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const search = searchParams.get('search')?.trim() || '';

    const query = {};

    if (canManageOwnProfile(authUser)) {
      query.userId = authUser.id;
    } else if (userId) {
      query.userId = userId;
    }

    let profiles = await InstructorProfile.find(query)
      .populate('userId', POPULATE_USER_FIELDS)
      .sort({ createdAt: -1 });

    if (authUser.role === 'school_admin') {
      profiles = profiles.filter((profile) => profile.userId?.schoolId?.toString() === authUser.schoolId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      profiles = profiles.filter((profile) => {
        const fullName = profile.fullName?.toLowerCase() || '';
        const emailId = profile.emailId?.toLowerCase() || '';
        const userName = profile.userId?.name?.toLowerCase() || '';
        const userEmail = profile.userId?.email?.toLowerCase() || '';
        return (
          fullName.includes(searchLower) ||
          emailId.includes(searchLower) ||
          userName.includes(searchLower) ||
          userEmail.includes(searchLower)
        );
      });
    }

    return NextResponse.json({ success: true, data: profiles });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authUser = getUserFromCookie();
    if (!authUser || (!canManageAllProfiles(authUser) && !canManageOwnProfile(authUser))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const requestedUserId = body.userId || authUser.id;
    if (!requestedUserId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    if (canManageOwnProfile(authUser) && requestedUserId !== authUser.id) {
      return NextResponse.json({ success: false, error: 'You can only create your own profile' }, { status: 403 });
    }

    const instructorUser = await findInstructorUser(requestedUserId);
    if (!instructorUser) {
      return NextResponse.json({ success: false, error: 'Instructor user not found' }, { status: 404 });
    }

    if (instructorUser.role !== 'instructor') {
      return NextResponse.json({ success: false, error: 'Selected user is not an instructor' }, { status: 400 });
    }

    if (authUser.role === 'school_admin' && instructorUser.schoolId?.toString() !== authUser.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized for this instructor' }, { status: 403 });
    }

    const existingProfile = await InstructorProfile.findOne({ userId: requestedUserId });
    if (existingProfile) {
      return NextResponse.json({ success: false, error: 'Instructor profile already exists for this user' }, { status: 409 });
    }

    const profile = await InstructorProfile.create({
      ...buildProfilePayload({ ...body, userId: requestedUserId }),
    });

    const populatedProfile = await InstructorProfile.findById(profile._id).populate('userId', POPULATE_USER_FIELDS);

    return NextResponse.json({ success: true, data: populatedProfile }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ success: false, error: 'Instructor profile already exists for this user' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
