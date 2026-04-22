import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';
import InstructorProfile from '@/models/InstructorProfile';
import '@/models/Instrument';
import { getUserFromCookie } from '@/utils/auth';

const POPULATE_USER_FIELDS = 'name email phone role status schoolId avatar bio instrumentIds';

function isAuthorized(user) {
  return ['admin', 'school_admin'].includes(user?.role);
}

function buildUserUpdate(body, authUser) {
  const payload = {};
  const fields = ['name', 'bio', 'avatar', 'status'];

  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'email')) {
    payload.email = body.email?.trim().toLowerCase();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'phone')) {
    payload.phone = body.phone?.trim() || undefined;
  }

  payload.role = 'instructor';

  if (Object.prototype.hasOwnProperty.call(body, 'instrumentIds')) {
    payload.instrumentIds = Array.isArray(body.instrumentIds)
      ? body.instrumentIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id))
      : [];
  }

  if (authUser.role === 'school_admin') {
    payload.schoolId = authUser.schoolId;
  } else if (Object.prototype.hasOwnProperty.call(body, 'schoolId')) {
    payload.schoolId = body.schoolId || undefined;
  }

  return payload;
}

function normalizeYearOfPassing(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  const stringValue = String(value).trim();
  const yearMatch = stringValue.match(/(19|20)\d{2}/);
  return yearMatch ? yearMatch[0] : stringValue;
}

function normalizeEducation(education) {
  if (!Array.isArray(education)) {
    return [];
  }

  return education.map((item) => ({
    ...item,
    yearOfPassing: normalizeYearOfPassing(item?.yearOfPassing),
  }));
}

function buildProfileUpdate(body, userPayload, userId) {
  const payload = {
    userId,
    fullName: body.fullName ?? userPayload.name,
    mobileNumber: body.mobileNumber ?? userPayload.phone ?? '',
    emailId: body.emailId ?? userPayload.email ?? '',
  };

  const optionalFields = [
    'dateOfBirth',
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
  ];

  for (const field of optionalFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'education')) {
    payload.education = normalizeEducation(body.education);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'declarationAccuracy')) {
    payload.declarationAccuracy = Boolean(body.declarationAccuracy);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'declarationVerificationConsent')) {
    payload.declarationVerificationConsent = Boolean(body.declarationVerificationConsent);
  }

  if (payload.emailId) {
    payload.emailId = payload.emailId.toLowerCase();
  }

  return payload;
}

async function populateInstructor(userId) {
  const user = await User.findById(userId).select(POPULATE_USER_FIELDS).populate('instrumentIds', 'name');
  const profile = await InstructorProfile.findOne({ userId }).populate({
    path: 'userId',
    select: POPULATE_USER_FIELDS,
    populate: { path: 'instrumentIds', select: 'name' },
  });

  return {
    user,
    profile,
    instructor: {
      ...user?.toObject(),
      instructorProfile: profile,
    },
  };
}

export async function GET(req, { params }) {
  try {
    const authUser = getUserFromCookie();
    if (!isAuthorized(authUser)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const userDoc = await User.findById(params.id).select(POPULATE_USER_FIELDS).populate('instrumentIds', 'name').lean();
    if (!userDoc || userDoc.role !== 'instructor') {
      return NextResponse.json({ success: false, error: 'Instructor not found' }, { status: 404 });
    }

    if (authUser.role === 'school_admin' && userDoc.schoolId?.toString() !== authUser.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized for this instructor' }, { status: 403 });
    }

    const profile = await InstructorProfile.findOne({ userId: userDoc._id }).populate({
      path: 'userId',
      select: POPULATE_USER_FIELDS,
      populate: { path: 'instrumentIds', select: 'name' },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...userDoc,
        instructorProfile: profile,
      },
      user: userDoc,
      instructorProfile: profile,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  let session = null;

  try {
    const authUser = getUserFromCookie();
    if (!isAuthorized(authUser)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    session = await mongoose.startSession();
    const body = await req.json();
    const userPayload = buildUserUpdate(body, authUser);

    await session.withTransaction(async () => {
      const userDoc = await User.findById(params.id).session(session);
      if (!userDoc || userDoc.role !== 'instructor') {
        throw new Error('Instructor not found');
      }

      if (authUser.role === 'school_admin' && userDoc.schoolId?.toString() !== authUser.schoolId) {
        throw new Error('Unauthorized for this instructor');
      }

      if (userPayload.email) {
        const emailOwner = await User.findOne({ email: userPayload.email, _id: { $ne: userDoc._id } }).session(session);
        if (emailOwner) {
          throw new Error('Email already exists');
        }
      }

      if (userPayload.phone) {
        const phoneOwner = await User.findOne({ phone: userPayload.phone, _id: { $ne: userDoc._id } }).session(session);
        if (phoneOwner) {
          throw new Error('Phone number already exists');
        }
      }

      Object.assign(userDoc, userPayload);

      if (body.password) {
        userDoc.password = await bcrypt.hash(body.password, 10);
      }

      await userDoc.save({ session });

      const profilePayload = buildProfileUpdate(body, userPayload, userDoc._id);
      const existingProfile = await InstructorProfile.findOne({ userId: userDoc._id }).session(session);

      if (existingProfile) {
        Object.assign(existingProfile, profilePayload);
        await existingProfile.save({ session });
      } else {
        await InstructorProfile.create([profilePayload], { session });
      }
    });

    const response = await populateInstructor(params.id);

    return NextResponse.json({
      success: true,
      message: 'Instructor updated successfully',
      data: response.instructor,
      user: response.user,
      instructorProfile: response.profile,
    });
  } catch (error) {
    const status =
      error.message === 'Instructor not found'
        ? 404
        : error.message.includes('Unauthorized')
          ? 403
          : error.message.includes('exists')
            ? 409
            : 500;

    return NextResponse.json({ success: false, error: error.message }, { status });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
