import Student from '@/models/Student';
import User from '@/models/User';

const normalizeString = (value) => {
  if (value === undefined || value === null) return undefined;
  const next = String(value).trim();
  return next;
};

export function buildStudentPayload(body = {}) {
  const payload = {};

  const mappings = {
    joiningYear: body.joiningYear,
    dob: body.dateOfBirth ?? body.dob,
    joiningDate: body.dateOfJoining ?? body.joiningDate,
    leavingDate: body.dateOfLeaving ?? body.leavingDate,
    studentName: body.studentName ?? body.name,
    onBoard: body.onBoard,
    time: body.time,
    enrolledFor: body.enrolledFor,
    location: body.location,
    gender: body.gender,
    bloodGroup: body.bloodGroup,
    nationality: body.nationality,
    addressLine1: body.address1 ?? body.addressLine1,
    addressLine2: body.address2 ?? body.addressLine2,
    street: body.street,
    city: body.cityDistrict ?? body.city,
    state: body.state,
    pinCode: body.pinCode,
    motherName: body.motherName,
    motherMobile: body.motherMobile,
    motherEmail: body.motherEmail,
    fatherName: body.fatherName,
    fatherMobile: body.fatherMobile,
    fatherEmail: body.fatherEmail,
    homePhone: body.homePhone,
    emergencyDetails: body.emergencyDetails,
    relationship: body.relationship,
    emergencyPhoneNo: body.emergencyPhoneNo,
    allergies: body.allergies,
    medicalCondition: body.medicalCondition,
    status: body.status,
    profilePhoto: body.profilePhoto,
  };

  Object.entries(mappings).forEach(([key, value]) => {
    if (value === undefined) return;
    payload[key] = typeof value === 'string' ? normalizeString(value) : value;
  });

  if (!payload.studentName && body.name) {
    payload.studentName = normalizeString(body.name);
  }

  return payload;
}

export async function upsertStudentProfile({
  userId,
  userFields = {},
  studentFields = {},
  schoolId,
}) {
  if (!userId) {
    throw new Error('User ID is required to upsert student profile');
  }

  const normalizedUserFields = {};
  if (userFields.name !== undefined) normalizedUserFields.name = normalizeString(userFields.name);
  if (userFields.email !== undefined) normalizedUserFields.email = normalizeString(userFields.email)?.toLowerCase() || '';
  if (userFields.phone !== undefined) normalizedUserFields.phone = normalizeString(userFields.phone);

  if (Object.keys(normalizedUserFields).length > 0) {
    await User.findByIdAndUpdate(userId, normalizedUserFields, { new: false });
  }

  const studentPayload = buildStudentPayload({
    ...studentFields,
    name: studentFields?.name ?? normalizedUserFields.name,
  });

  let student = await Student.findOne({ userId });
  if (!student) {
    student = new Student({
      userId,
      ...(schoolId ? { schoolId } : {}),
    });
  } else if (schoolId) {
    student.schoolId = schoolId;
  }

  Object.assign(student, studentPayload);
  await student.save();

  return student;
}
