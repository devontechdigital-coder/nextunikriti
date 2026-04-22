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

function buildUserPayload(body, authUser) {
  const instrumentIds = Array.isArray(body.instrumentIds)
    ? body.instrumentIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id))
    : [];

  const payload = {
    name: body.name?.trim(),
    email: body.email?.trim().toLowerCase(),
    phone: body.phone?.trim() || undefined,
    role: 'instructor',
    bio: body.bio ?? '',
    avatar: body.avatar ?? '',
    status: body.status || 'active',
    instrumentIds,
  };

  if (authUser.role === 'school_admin') {
    payload.schoolId = authUser.schoolId;
  } else if (body.schoolId) {
    payload.schoolId = body.schoolId;
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

function buildInstructorProfilePayload(body, userPayload, userId) {
  return {
    userId,
    fullName: body.fullName || userPayload.name,
    mobileNumber: body.mobileNumber || userPayload.phone || '',
    dateOfBirth: body.dateOfBirth || undefined,
    emailId: (body.emailId || userPayload.email || '').toLowerCase(),
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
    education: normalizeEducation(body.education),
    nameAsPerBankRecord: body.nameAsPerBankRecord,
    bankName: body.bankName,
    accountNumber: body.accountNumber,
    typeOfAccount: body.typeOfAccount,
    ifscCode: body.ifscCode,
    latestPhotograph: body.latestPhotograph || userPayload.avatar || '',
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

function findExistingUsers({ email, phone, userId }) {
  const conditions = [];
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    conditions.push({ _id: userId });
  }
  if (email) {
    conditions.push({ email });
  }
  if (phone) {
    conditions.push({ phone });
  }

  if (conditions.length === 0) return null;
  return User.find({ $or: conditions });
}

export async function GET(req) {
  try {
    const user = getUserFromCookie();
    if (!isAuthorized(user)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    await connectDB();

    const baseQuery = { role: 'instructor' };
    if (user.role === 'school_admin') {
      baseQuery.schoolId = user.schoolId;
    }

    if (search) {
      baseQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const totalDocs = await User.countDocuments(baseQuery);
    const instructors = await User.find(baseQuery)
      .populate('instrumentIds', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const userIds = instructors.map((item) => item._id);
    const profiles = await InstructorProfile.find({ userId: { $in: userIds } }).lean();
    const profileMap = new Map(profiles.map((profile) => [profile.userId.toString(), profile]));

    const data = instructors.map((item) => ({
      ...item,
      instructorProfile: profileMap.get(item._id.toString()) || null,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: {
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  let session = null;

  try {
    const authUser = getUserFromCookie();
    if (!isAuthorized(authUser)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    session = await mongoose.startSession();
    const body = await req.json();

    if (!body.name || !body.email) {
      return NextResponse.json({ success: false, error: 'Name and email are required' }, { status: 400 });
    }

    const normalizedEmail = body.email.trim().toLowerCase();
    const normalizedPhone = body.phone?.trim() || '';
    const userPayload = buildUserPayload({ ...body, email: normalizedEmail, phone: normalizedPhone }, authUser);

    let targetUserId = null;
    let created = false;

    await session.withTransaction(async () => {
      const existingUsersQuery = findExistingUsers({
        email: normalizedEmail,
        phone: normalizedPhone,
        userId: body.userId,
      });
      const matches = existingUsersQuery ? await existingUsersQuery.session(session) : [];

      let existingUser = null;
      if (matches.length > 0) {
        existingUser = matches[0];
        const hasConflict = matches.some((item) => item._id.toString() !== existingUser._id.toString());
        if (hasConflict) {
          throw new Error('Email or phone is already linked to another user');
        }
      }

      if (authUser.role === 'school_admin' && existingUser?.schoolId && existingUser.schoolId.toString() !== authUser.schoolId) {
        throw new Error('Unauthorized for this school');
      }

      let userDoc = existingUser;

      if (!userDoc) {
        if (!body.password) {
          throw new Error('Password is required for a new instructor');
        }

        const hashedPassword = await bcrypt.hash(body.password, 10);
        const createdUsers = await User.create(
          [{ ...userPayload, password: hashedPassword }],
          { session }
        );
        userDoc = createdUsers[0];
        created = true;
      } else {
        userDoc.name = userPayload.name;
        userDoc.email = userPayload.email;
        userDoc.phone = userPayload.phone;
        userDoc.role = 'instructor';
        userDoc.bio = userPayload.bio;
        userDoc.avatar = userPayload.avatar;
        userDoc.status = userPayload.status;

        if (Object.prototype.hasOwnProperty.call(userPayload, 'schoolId')) {
          userDoc.schoolId = userPayload.schoolId;
        }

        if (body.password) {
          userDoc.password = await bcrypt.hash(body.password, 10);
        }

        await userDoc.save({ session });
      }

      const profilePayload = buildInstructorProfilePayload(body, userPayload, userDoc._id);
      const existingProfile = await InstructorProfile.findOne({ userId: userDoc._id }).session(session);

      if (existingProfile) {
        Object.assign(existingProfile, profilePayload);
        await existingProfile.save({ session });
      } else {
        await InstructorProfile.create([profilePayload], { session });
      }

      targetUserId = userDoc._id;
    });

    const response = await populateInstructor(targetUserId);

    return NextResponse.json(
      {
        success: true,
        message: created ? 'Instructor created successfully' : 'Instructor linked and updated successfully',
        data: response.instructor,
        user: response.user,
        instructorProfile: response.profile,
      },
      { status: created ? 201 : 200 }
    );
  } catch (error) {
    const status =
      error.message?.includes('required')
        ? 400
        : error.message?.includes('already linked') || error.message?.includes('already exists')
          ? 409
          : error.message?.includes('Unauthorized')
            ? 403
            : 500;

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save instructor' },
      { status }
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
