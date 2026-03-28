'use client';

import { useEffect, useState } from 'react';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge, Row, Col, Card } from 'react-bootstrap';
import { 
  useGetAdminUsersQuery, 
  useUpdateAdminUserMutation, 
  useCreateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetAdminSchoolsQuery,
  useGetAdminStudentsQuery,
  useGetAdminInstructorByIdQuery,
  useCreateAdminInstructorMutation,
  useUpdateAdminInstructorMutation,
  useGetAdminStudentByIdQuery,
  useCreateAdminStudentMutation,
  useUpdateAdminStudentMutation
} from '@/redux/api/apiSlice';
import { FaEdit, FaTrash, FaPlus, FaCheckCircle } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const createEducationEntry = () => ({
  level: 'graduation',
  courseName: '',
  instituteName: '',
  boardOrUniversity: '',
  yearOfPassing: '',
  percentageOrGPA: '',
  stream: '',
});

const createStudentFields = () => ({
  enrolmentNumber: '',
  joiningYear: '',
  dateOfJoining: '',
  studentName: '',
  onBoard: false,
  time: '',
  enrolledFor: '',
  location: '',
  dateOfBirth: '',
  gender: 'male',
  address1: '',
  address2: '',
  street: '',
  pinCode: '',
  cityDistrict: '',
  state: '',
  nationality: 'Indian',
  motherName: '',
  motherMobile: '',
  motherEmail: '',
  fatherName: '',
  fatherMobile: '',
  fatherEmail: '',
  homePhone: '',
  emergencyDetails: '',
  relationship: '',
  emergencyPhoneNo: '',
  bloodGroup: '',
  allergies: '',
  medicalCondition: '',
  dateOfLeaving: '',
  profilePhoto: '',
});

const createInstructorFields = () => ({
  bio: '',
  avatar: '',
  fullName: '',
  mobileNumber: '',
  dateOfBirth: '',
  emailId: '',
  landlineOrAlternateNumber: '',
  gender: 'prefer_not_to_say',
  nationality: 'Indian',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  state: '',
  pinCode: '',
  permanentAddress: '',
  fatherFullName: '',
  fatherContactNumber: '',
  fatherOccupation: '',
  motherFullName: '',
  motherContactNumber: '',
  motherOccupation: '',
  education: [createEducationEntry()],
  nameAsPerBankRecord: '',
  bankName: '',
  accountNumber: '',
  typeOfAccount: '',
  ifscCode: '',
  latestPhotograph: '',
  aadhaarCard: '',
  panCard: '',
  votersIdCard: '',
  drivingLicense: '',
  otherPhotoIdCard: '',
  chequeImage: '',
  educationExperienceTestimonials: '',
  declarationAccuracy: false,
  declarationVerificationConsent: false,
});

const createInitialFormData = (defaultRole = 'student') => ({
  studentProfileId: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  role: defaultRole,
  schoolId: '',
  status: 'active',
  ...createStudentFields(),
  ...createInstructorFields(),
});

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState(''); // Debounced search term

  const { data, isLoading, isError, error } = useGetAdminUsersQuery({
    page,
    search: searchTerm,
    role: roleFilter
  });
  
  const { data: schoolData } = useGetAdminSchoolsQuery();
  const schools = schoolData?.schools || [];
  
  const { userInfo } = useSelector((state) => state.auth);
  const isSchoolAdmin = userInfo?.role === 'school_admin';
  
  const [updateUser, { isLoading: isUpdating }] = useUpdateAdminUserMutation();
  const [createUser, { isLoading: isCreating }] = useCreateAdminUserMutation();
  const [createInstructor, { isLoading: isCreatingInstructor }] = useCreateAdminInstructorMutation();
  const [updateInstructor, { isLoading: isUpdatingInstructor }] = useUpdateAdminInstructorMutation();
  const [createStudent, { isLoading: isCreatingStudent }] = useCreateAdminStudentMutation();
  const [updateStudent, { isLoading: isUpdatingStudent }] = useUpdateAdminStudentMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteAdminUserMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState(createInitialFormData());
  const [successMsg, setSuccessMsg] = useState('');
  const isInstructorForm = formData.role === 'instructor';
  const isStudentForm = formData.role === 'student';
  const modalTitle = editingUser
    ? isInstructorForm
      ? 'Edit Instructor'
      : isStudentForm
        ? 'Edit Student'
        : 'Edit User'
    : isInstructorForm
      ? 'Add New Instructor'
      : isStudentForm
        ? 'Add New Student'
        : 'Add New User';
  const submitLabel = editingUser
    ? isInstructorForm
      ? 'Update Instructor'
      : isStudentForm
        ? 'Update Student'
        : 'Update User'
    : isInstructorForm
      ? 'Create Instructor'
      : isStudentForm
        ? 'Create Student'
        : 'Create User';
  const { data: instructorDetailData, isFetching: isFetchingInstructorDetail } = useGetAdminInstructorByIdQuery(editingUser?._id, {
    skip: !showModal || !editingUser || editingUser.role !== 'instructor',
  });
  const { data: studentListDetailData, isFetching: isFetchingStudentDetail } = useGetAdminStudentsQuery({
    userId: editingUser?._id,
    schoolId: '',
    status: '',
    gender: '',
    search: '',
  }, {
    skip: !showModal || !editingUser || editingUser.role !== 'student',
  });
  const isRoleDetailLoading =
    (editingUser?.role === 'instructor' && isFetchingInstructorDetail) ||
    (editingUser?.role === 'student' && isFetchingStudentDetail);

  useEffect(() => {
    if (!instructorDetailData?.data || !editingUser || editingUser.role !== 'instructor') {
      return;
    }

    const instructor = instructorDetailData.data;
    const profile = instructor.instructorProfile || {};
    setFormData((prev) => ({
      ...prev,
      name: instructor.name || '',
      email: instructor.email || '',
      phone: instructor.phone || '',
      role: 'instructor',
      schoolId: instructor.schoolId || '',
      password: '',
      bio: instructor.bio || '',
      avatar: instructor.avatar || '',
      status: instructor.status || 'active',
      fullName: profile.fullName || instructor.name || '',
      mobileNumber: profile.mobileNumber || instructor.phone || '',
      dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : '',
      emailId: profile.emailId || instructor.email || '',
      landlineOrAlternateNumber: profile.landlineOrAlternateNumber || '',
      gender: profile.gender || 'prefer_not_to_say',
      nationality: profile.nationality || 'Indian',
      addressLine1: profile.addressLine1 || '',
      addressLine2: profile.addressLine2 || '',
      landmark: profile.landmark || '',
      state: profile.state || '',
      pinCode: profile.pinCode || '',
      permanentAddress: profile.permanentAddress || '',
      fatherFullName: profile.fatherFullName || '',
      fatherContactNumber: profile.fatherContactNumber || '',
      fatherOccupation: profile.fatherOccupation || '',
      motherFullName: profile.motherFullName || '',
      motherContactNumber: profile.motherContactNumber || '',
      motherOccupation: profile.motherOccupation || '',
      education: Array.isArray(profile.education) && profile.education.length > 0 ? profile.education : [createEducationEntry()],
      nameAsPerBankRecord: profile.nameAsPerBankRecord || '',
      bankName: profile.bankName || '',
      accountNumber: profile.accountNumber || '',
      typeOfAccount: profile.typeOfAccount || '',
      ifscCode: profile.ifscCode || '',
      latestPhotograph: profile.latestPhotograph || '',
      aadhaarCard: profile.aadhaarCard || '',
      panCard: profile.panCard || '',
      votersIdCard: profile.votersIdCard || '',
      drivingLicense: profile.drivingLicense || '',
      otherPhotoIdCard: profile.otherPhotoIdCard || '',
      chequeImage: profile.chequeImage || '',
      educationExperienceTestimonials: profile.educationExperienceTestimonials || '',
      declarationAccuracy: Boolean(profile.declarationAccuracy),
      declarationVerificationConsent: Boolean(profile.declarationVerificationConsent),
    }));
  }, [instructorDetailData, editingUser]);

  useEffect(() => {
    const student = studentListDetailData?.students?.[0];
    if (!student || !editingUser || editingUser.role !== 'student') {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      studentProfileId: student._id || '',
      name: student.userId?.name || '',
      email: student.userId?.email || '',
      phone: student.userId?.phone || '',
      password: '',
      role: 'student',
      schoolId: student.schoolId?._id || student.schoolId || '',
      status: student.status || 'active',
      enrolmentNumber: student.enrolmentNumber || '',
      joiningYear: student.joiningYear || '',
      dateOfJoining: student.dateOfJoining ? String(student.dateOfJoining).slice(0, 10) : student.joiningDate ? String(student.joiningDate).slice(0, 10) : '',
      studentName: student.studentName || student.userId?.name || '',
      onBoard: Boolean(student.onBoard),
      time: student.time || '',
      enrolledFor: student.enrolledFor || '',
      location: student.location || '',
      dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth).slice(0, 10) : student.dob ? String(student.dob).slice(0, 10) : '',
      gender: student.gender || 'male',
      address1: student.address1 || student.addressLine1 || '',
      address2: student.address2 || student.addressLine2 || '',
      street: student.street || '',
      pinCode: student.pinCode || '',
      cityDistrict: student.cityDistrict || student.city || '',
      state: student.state || '',
      nationality: student.nationality || 'Indian',
      motherName: student.motherName || '',
      motherMobile: student.motherMobile || '',
      motherEmail: student.motherEmail || '',
      fatherName: student.fatherName || '',
      fatherMobile: student.fatherMobile || '',
      fatherEmail: student.fatherEmail || '',
      homePhone: student.homePhone || '',
      emergencyDetails: student.emergencyDetails || '',
      relationship: student.relationship || '',
      emergencyPhoneNo: student.emergencyPhoneNo || '',
      bloodGroup: student.bloodGroup || '',
      allergies: student.allergies || '',
      medicalCondition: student.medicalCondition || '',
      dateOfLeaving: student.dateOfLeaving ? String(student.dateOfLeaving).slice(0, 10) : student.leavingDate ? String(student.leavingDate).slice(0, 10) : '',
      profilePhoto: student.profilePhoto || '',
    }));
  }, [studentListDetailData, editingUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(search);
    setPage(1); // Reset to first page on search
  };

  const handleRoleChange = (role) => {
    setRoleFilter(role);
    setPage(1);
  };

  const handleBlockUnblock = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      await updateUser({ userId: user._id, status: newStatus }).unwrap();
      setSuccessMsg(`User ${newStatus === 'active' ? 'unblocked' : 'blocked'} successfully!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to update user status.');
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        ...createInitialFormData(user.role),
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        schoolId: user.schoolId || '',
        password: '',
        status: user.status || 'active',
      });
    } else {
      setEditingUser(null);
      setFormData(createInitialFormData(isSchoolAdmin ? 'instructor' : 'student'));
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const applyRoleSpecificTemplate = (role) => {
    setFormData((prev) => {
      const common = {
        name: prev.name,
        email: prev.email,
        phone: prev.phone,
        password: prev.password,
        schoolId: prev.schoolId,
        status: prev.status,
        role,
      };

      if (role === 'instructor') {
        return {
          ...createInitialFormData(role),
          ...common,
          fullName: prev.fullName || prev.name,
          emailId: prev.emailId || prev.email,
          mobileNumber: prev.mobileNumber || prev.phone,
        };
      }

      if (role === 'student') {
        return {
          ...createInitialFormData(role),
          ...common,
          studentName: prev.studentName || prev.name,
          dateOfBirth: prev.dateOfBirth,
          gender: prev.gender === 'prefer_not_to_say' ? 'male' : prev.gender,
          nationality: prev.nationality || 'Indian',
        };
      }

      return {
        ...createInitialFormData(role),
        ...common,
      };
    });
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEducationChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, createEducationEntry()],
    }));
  };

  const handleRemoveEducation = (index) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.length === 1
        ? [createEducationEntry()]
        : prev.education.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        education: formData.education.filter((item) =>
          item.level || item.courseName || item.instituteName || item.boardOrUniversity || item.yearOfPassing || item.percentageOrGPA || item.stream
        ),
      };

      if (editingUser && formData.role === 'instructor') {
        await updateInstructor({ id: editingUser._id, ...payload }).unwrap();
        setSuccessMsg('Instructor updated successfully!');
      } else if (editingUser && formData.role === 'student') {
        await updateStudent({ id: formData.studentProfileId || editingUser._id, ...payload }).unwrap();
        setSuccessMsg('Student updated successfully!');
      } else if (editingUser) {
        await updateUser({ userId: editingUser._id, ...payload }).unwrap();
        setSuccessMsg('User updated successfully!');
      } else if (formData.role === 'instructor') {
        await createInstructor(payload).unwrap();
        setSuccessMsg('Instructor created successfully!');
      } else if (formData.role === 'student') {
        await createStudent(payload).unwrap();
        setSuccessMsg('Student created successfully!');
      } else {
        await createUser(payload).unwrap();
        setSuccessMsg('User created successfully!');
      }
      handleCloseModal();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to save user.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(userToDelete._id).unwrap();
      setSuccessMsg('User deleted successfully!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading users...</p>
      </Container>
    );
  }

  const users = data?.data || [];
  const meta = data?.meta || { totalPages: 1, currentPage: 1 };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">User Management</h2>
        <Button variant="primary" className="d-flex align-items-center gap-2" onClick={() => handleOpenModal()}>
          <FaPlus /> Add User
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-3 rounded shadow-sm mb-4 d-flex flex-wrap gap-3 align-items-center">
        <Form onSubmit={handleSearch} className="d-flex gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
          <Form.Control 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="secondary" type="submit">Search</Button>
        </Form>
        {!isSchoolAdmin && (
          <div className="d-flex align-items-center gap-2 ms-auto">
            <span className="text-muted small fw-bold">Role:</span>
            <Form.Select 
              style={{ width: '150px' }}
              value={roleFilter}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </Form.Select>
          </div>
        )}
      </div>

      {successMsg && (
        <Alert variant="success" className="d-flex align-items-center gap-2">
          <FaCheckCircle /> {successMsg}
        </Alert>
      )}

      {isError && (
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>Failed to load data: {error?.data?.error || 'Unknown error'}</p>
        </Alert>
      )}

      <div className="bg-white rounded shadow-sm overflow-hidden mb-4">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="ps-4">Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="ps-4 fw-bold">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone || <em className="text-muted">N/A</em>}</td>
                <td>
                  <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'instructor' ? 'primary' : 'info'}>
                    {user.role}
                  </Badge>
                </td>
                <td>
                   <Badge pill bg={user.status === 'active' ? 'success' : 'secondary'}>
                     {user.status}
                   </Badge>
                </td>
                <td className="text-end pe-4">
                  <Button 
                    variant={user.status === 'active' ? 'outline-warning' : 'outline-success'} 
                    size="sm" 
                    className="me-2"
                    onClick={() => handleBlockUnblock(user)}
                    title={user.status === 'active' ? 'Block User' : 'Unblock User'}
                  >
                    {user.status === 'active' ? 'Block' : 'Unblock'}
                  </Button>
                  <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenModal(user)}>
                    <FaEdit />
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => { setUserToDelete(user); setShowDeleteModal(true); }}>
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {users.length === 0 && <div className="p-5 text-center text-muted">No users found</div>}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2">
          <Button 
            variant="light" 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          {[...Array(meta.totalPages)].map((_, i) => (
            <Button 
              key={i + 1}
              variant={page === i + 1 ? 'primary' : 'light'}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button 
            variant="light" 
            disabled={page === meta.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size={isInstructorForm || isStudentForm ? 'xl' : undefined} scrollable={isInstructorForm || isStudentForm}>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={isInstructorForm || isStudentForm ? { maxHeight: '70vh', overflowY: 'auto' } : undefined}>
            {isRoleDetailLoading ? (
              <div className="py-5 text-center" style={{ minHeight: '320px' }}>
                <div className="d-inline-flex flex-column align-items-center justify-content-center bg-light rounded-4 px-5 py-4 border">
                  <Spinner animation="border" variant="primary" />
                  <div className="mt-3 fw-semibold">Loading {editingUser?.role} details...</div>
                  <div className="small text-muted">Preparing the correct fields for this profile.</div>
                </div>
              </div>
            ) : (
              <>
            {!isSchoolAdmin && (
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select 
                  value={formData.role}
                  onChange={(e) => applyRoleSpecificTemplate(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                  <option value="school_admin">School Admin</option>
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control 
                type="text" 
                required 
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control 
                type="email" 
                required 
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Optional"
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
              />
            </Form.Group>
            {isInstructorForm && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Bio</Form.Label>
                  <Form.Control as="textarea" rows={2} value={formData.bio} onChange={(e) => handleFieldChange('bio', e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Avatar URL</Form.Label>
                  <Form.Control value={formData.avatar} onChange={(e) => handleFieldChange('avatar', e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={formData.status} onChange={(e) => handleFieldChange('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="suspended">Suspended</option>
                  </Form.Select>
                </Form.Group>
              </>
            )}
            <Form.Group className="mb-3">
              <Form.Label>{editingUser ? 'Reset Password (Optional)' : 'Password'}</Form.Label>
              <Form.Control 
                type="password" 
                required={!editingUser}
                placeholder={editingUser ? 'Enter new password to reset' : 'Enter password'}
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
              />
            </Form.Group>
            
            {!isSchoolAdmin && formData.role === 'school_admin' && (
              <Form.Group className="mb-3">
                <Form.Label>Assign School (Required for School Admin)</Form.Label>
                <Form.Select 
                  required
                  value={formData.schoolId}
                  onChange={(e) => handleFieldChange('schoolId', e.target.value)}
                >
                  <option value="">Select School</option>
                  {schools.map(s => <option key={s._id} value={s._id}>{s.schoolName}</option>)}
                </Form.Select>
              </Form.Group>
            )}
            {isInstructorForm && (
              <>
                <hr />
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold mb-0">Instructor Profile</h6>
                  <Badge bg="primary-subtle" text="dark">Responsive Edit Form</Badge>
                </div>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h6 className="fw-semibold mb-3">Personal Details</h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Profile Full Name</Form.Label>
                          <Form.Control value={formData.fullName} onChange={(e) => handleFieldChange('fullName', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Mobile Number</Form.Label>
                          <Form.Control value={formData.mobileNumber} onChange={(e) => handleFieldChange('mobileNumber', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Date of Birth</Form.Label>
                          <Form.Control type="date" value={formData.dateOfBirth} onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Profile Email</Form.Label>
                          <Form.Control type="email" value={formData.emailId} onChange={(e) => handleFieldChange('emailId', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Alternate Number</Form.Label>
                          <Form.Control value={formData.landlineOrAlternateNumber} onChange={(e) => handleFieldChange('landlineOrAlternateNumber', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Gender</Form.Label>
                          <Form.Select value={formData.gender} onChange={(e) => handleFieldChange('gender', e.target.value)}>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Nationality</Form.Label>
                          <Form.Control value={formData.nationality} onChange={(e) => handleFieldChange('nationality', e.target.value)} />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h6 className="fw-semibold mb-3">Address Details</h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Address Line 1</Form.Label>
                          <Form.Control value={formData.addressLine1} onChange={(e) => handleFieldChange('addressLine1', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Address Line 2</Form.Label>
                          <Form.Control value={formData.addressLine2} onChange={(e) => handleFieldChange('addressLine2', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Landmark</Form.Label>
                          <Form.Control value={formData.landmark} onChange={(e) => handleFieldChange('landmark', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>State</Form.Label>
                          <Form.Control value={formData.state} onChange={(e) => handleFieldChange('state', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>PIN Code</Form.Label>
                          <Form.Control value={formData.pinCode} onChange={(e) => handleFieldChange('pinCode', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Permanent Address</Form.Label>
                          <Form.Control as="textarea" rows={2} value={formData.permanentAddress} onChange={(e) => handleFieldChange('permanentAddress', e.target.value)} />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h6 className="fw-semibold mb-3">Family Details</h6>
                    <Row className="g-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Father Full Name</Form.Label>
                          <Form.Control value={formData.fatherFullName} onChange={(e) => handleFieldChange('fatherFullName', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Father Contact Number</Form.Label>
                          <Form.Control value={formData.fatherContactNumber} onChange={(e) => handleFieldChange('fatherContactNumber', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Father Occupation</Form.Label>
                          <Form.Control value={formData.fatherOccupation} onChange={(e) => handleFieldChange('fatherOccupation', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Mother Full Name</Form.Label>
                          <Form.Control value={formData.motherFullName} onChange={(e) => handleFieldChange('motherFullName', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Mother Contact Number</Form.Label>
                          <Form.Control value={formData.motherContactNumber} onChange={(e) => handleFieldChange('motherContactNumber', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Mother Occupation</Form.Label>
                          <Form.Control value={formData.motherOccupation} onChange={(e) => handleFieldChange('motherOccupation', e.target.value)} />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-semibold mb-0">Education</h6>
                      <Button type="button" size="sm" variant="outline-primary" onClick={handleAddEducation}>Add Education</Button>
                    </div>
                    {formData.education.map((item, index) => (
                      <div key={index} className="border rounded p-3 mb-3">
                        <Row className="g-3">
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Level</Form.Label>
                              <Form.Select value={item.level} onChange={(e) => handleEducationChange(index, 'level', e.target.value)}>
                                <option value="school">School</option>
                                <option value="diploma">Diploma</option>
                                <option value="graduation">Graduation</option>
                                <option value="post_graduation">Post Graduation</option>
                                <option value="masters">Masters</option>
                                <option value="phd">PhD</option>
                                <option value="other">Other</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Course Name</Form.Label>
                              <Form.Control value={item.courseName} onChange={(e) => handleEducationChange(index, 'courseName', e.target.value)} />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Institute Name</Form.Label>
                              <Form.Control value={item.instituteName} onChange={(e) => handleEducationChange(index, 'instituteName', e.target.value)} />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Board / University</Form.Label>
                              <Form.Control value={item.boardOrUniversity} onChange={(e) => handleEducationChange(index, 'boardOrUniversity', e.target.value)} />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Year of Passing</Form.Label>
                              <Form.Control value={item.yearOfPassing} onChange={(e) => handleEducationChange(index, 'yearOfPassing', e.target.value)} />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Percentage / GPA</Form.Label>
                              <Form.Control value={item.percentageOrGPA} onChange={(e) => handleEducationChange(index, 'percentageOrGPA', e.target.value)} />
                            </Form.Group>
                          </Col>
                          <Col md={8}>
                            <Form.Group>
                              <Form.Label>Stream</Form.Label>
                              <Form.Control value={item.stream} onChange={(e) => handleEducationChange(index, 'stream', e.target.value)} />
                            </Form.Group>
                          </Col>
                          <Col md={4} className="d-flex align-items-end">
                            <Button type="button" size="sm" variant="outline-danger" onClick={() => handleRemoveEducation(index)}>Remove</Button>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h6 className="fw-semibold mb-3">Bank Details</h6>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Name as Per Bank Record</Form.Label>
                          <Form.Control value={formData.nameAsPerBankRecord} onChange={(e) => handleFieldChange('nameAsPerBankRecord', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Bank Name</Form.Label>
                          <Form.Control value={formData.bankName} onChange={(e) => handleFieldChange('bankName', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Account Number</Form.Label>
                          <Form.Control value={formData.accountNumber} onChange={(e) => handleFieldChange('accountNumber', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>Type of Account</Form.Label>
                          <Form.Control value={formData.typeOfAccount} onChange={(e) => handleFieldChange('typeOfAccount', e.target.value)} />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label>IFSC Code</Form.Label>
                          <Form.Control value={formData.ifscCode} onChange={(e) => handleFieldChange('ifscCode', e.target.value)} />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h6 className="fw-semibold mb-3">Documents</h6>
                    <Row className="g-3">
                      <Col md={6}><Form.Group><Form.Label>Latest Photograph</Form.Label><Form.Control value={formData.latestPhotograph} onChange={(e) => handleFieldChange('latestPhotograph', e.target.value)} /></Form.Group></Col>
                      <Col md={6}><Form.Group><Form.Label>Aadhaar Card</Form.Label><Form.Control value={formData.aadhaarCard} onChange={(e) => handleFieldChange('aadhaarCard', e.target.value)} /></Form.Group></Col>
                      <Col md={6}><Form.Group><Form.Label>PAN Card</Form.Label><Form.Control value={formData.panCard} onChange={(e) => handleFieldChange('panCard', e.target.value)} /></Form.Group></Col>
                      <Col md={6}><Form.Group><Form.Label>Voter&apos;s ID Card</Form.Label><Form.Control value={formData.votersIdCard} onChange={(e) => handleFieldChange('votersIdCard', e.target.value)} /></Form.Group></Col>
                      <Col md={6}><Form.Group><Form.Label>Driving License</Form.Label><Form.Control value={formData.drivingLicense} onChange={(e) => handleFieldChange('drivingLicense', e.target.value)} /></Form.Group></Col>
                      <Col md={6}><Form.Group><Form.Label>Other Photo ID Card</Form.Label><Form.Control value={formData.otherPhotoIdCard} onChange={(e) => handleFieldChange('otherPhotoIdCard', e.target.value)} /></Form.Group></Col>
                      <Col md={6}><Form.Group><Form.Label>Cheque Image</Form.Label><Form.Control value={formData.chequeImage} onChange={(e) => handleFieldChange('chequeImage', e.target.value)} /></Form.Group></Col>
                      <Col md={6}><Form.Group><Form.Label>Education / Experience Testimonials</Form.Label><Form.Control value={formData.educationExperienceTestimonials} onChange={(e) => handleFieldChange('educationExperienceTestimonials', e.target.value)} /></Form.Group></Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <h6 className="fw-semibold mb-3">Declarations</h6>
                    <Form.Check className="mb-2" type="checkbox" label="Declaration Accuracy" checked={formData.declarationAccuracy} onChange={(e) => handleFieldChange('declarationAccuracy', e.target.checked)} />
                    <Form.Check type="checkbox" label="Declaration Verification Consent" checked={formData.declarationVerificationConsent} onChange={(e) => handleFieldChange('declarationVerificationConsent', e.target.checked)} />
                  </Card.Body>
                </Card>
              </>
            )}
            {isStudentForm && (
              <>
                <hr />
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold mb-0">Student Profile</h6>
                  <Badge bg="info-subtle" text="dark">Role-based Form</Badge>
                </div>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h6 className="fw-semibold mb-3">Academic & CRM Info</h6>
                    <Row className="g-3">
                      <Col md={4}><Form.Group><Form.Label>Enrolment Number</Form.Label><Form.Control placeholder="Auto-generated if blank" value={formData.enrolmentNumber} onChange={(e) => handleFieldChange('enrolmentNumber', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Student Name</Form.Label><Form.Control value={formData.studentName} onChange={(e) => handleFieldChange('studentName', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Status</Form.Label><Form.Select value={formData.status} onChange={(e) => handleFieldChange('status', e.target.value)}><option value="lead">Lead</option><option value="trial">Trial</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="left">Left</option></Form.Select></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Joining Year</Form.Label><Form.Control value={formData.joiningYear} onChange={(e) => handleFieldChange('joiningYear', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Date of Joining</Form.Label><Form.Control type="date" value={formData.dateOfJoining} onChange={(e) => handleFieldChange('dateOfJoining', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Date of Leaving</Form.Label><Form.Control type="date" value={formData.dateOfLeaving} onChange={(e) => handleFieldChange('dateOfLeaving', e.target.value)} /></Form.Group></Col>
                      <Col md={3}><Form.Group><Form.Label>On Board</Form.Label><Form.Select value={formData.onBoard ? 'yes' : 'no'} onChange={(e) => handleFieldChange('onBoard', e.target.value === 'yes')}><option value="no">No</option><option value="yes">Yes</option></Form.Select></Form.Group></Col>
                      <Col md={3}><Form.Group><Form.Label>Time</Form.Label><Form.Control value={formData.time} onChange={(e) => handleFieldChange('time', e.target.value)} /></Form.Group></Col>
                      <Col md={3}><Form.Group><Form.Label>Enrolled For</Form.Label><Form.Control value={formData.enrolledFor} onChange={(e) => handleFieldChange('enrolledFor', e.target.value)} /></Form.Group></Col>
                      <Col md={3}><Form.Group><Form.Label>Location</Form.Label><Form.Control value={formData.location} onChange={(e) => handleFieldChange('location', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Date of Birth</Form.Label><Form.Control type="date" value={formData.dateOfBirth} onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Gender</Form.Label><Form.Select value={formData.gender} onChange={(e) => handleFieldChange('gender', e.target.value)}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Form.Select></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Blood Group</Form.Label><Form.Control value={formData.bloodGroup} onChange={(e) => handleFieldChange('bloodGroup', e.target.value)} /></Form.Group></Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h6 className="fw-semibold mb-3">Address Details</h6>
                    <Row className="g-3">
                      <Col md={6}><Form.Group><Form.Label>Address 1</Form.Label><Form.Control value={formData.address1} onChange={(e) => handleFieldChange('address1', e.target.value)} /></Form.Group></Col>
                      <Col md={6}><Form.Group><Form.Label>Address 2</Form.Label><Form.Control value={formData.address2} onChange={(e) => handleFieldChange('address2', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Street</Form.Label><Form.Control value={formData.street} onChange={(e) => handleFieldChange('street', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>City / District</Form.Label><Form.Control value={formData.cityDistrict} onChange={(e) => handleFieldChange('cityDistrict', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>State</Form.Label><Form.Control value={formData.state} onChange={(e) => handleFieldChange('state', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>PIN Code</Form.Label><Form.Control value={formData.pinCode} onChange={(e) => handleFieldChange('pinCode', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Nationality</Form.Label><Form.Control value={formData.nationality} onChange={(e) => handleFieldChange('nationality', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Profile Photo URL</Form.Label><Form.Control value={formData.profilePhoto} onChange={(e) => handleFieldChange('profilePhoto', e.target.value)} /></Form.Group></Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h6 className="fw-semibold mb-3">Parent & Emergency Details</h6>
                    <Row className="g-3">
                      <Col md={4}><Form.Group><Form.Label>Mother Name</Form.Label><Form.Control value={formData.motherName} onChange={(e) => handleFieldChange('motherName', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Mother Mobile</Form.Label><Form.Control value={formData.motherMobile} onChange={(e) => handleFieldChange('motherMobile', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Mother Email</Form.Label><Form.Control type="email" value={formData.motherEmail} onChange={(e) => handleFieldChange('motherEmail', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Father Name</Form.Label><Form.Control value={formData.fatherName} onChange={(e) => handleFieldChange('fatherName', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Father Mobile</Form.Label><Form.Control value={formData.fatherMobile} onChange={(e) => handleFieldChange('fatherMobile', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Father Email</Form.Label><Form.Control type="email" value={formData.fatherEmail} onChange={(e) => handleFieldChange('fatherEmail', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Home Phone</Form.Label><Form.Control value={formData.homePhone} onChange={(e) => handleFieldChange('homePhone', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Emergency Details</Form.Label><Form.Control value={formData.emergencyDetails} onChange={(e) => handleFieldChange('emergencyDetails', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Relationship</Form.Label><Form.Control value={formData.relationship} onChange={(e) => handleFieldChange('relationship', e.target.value)} /></Form.Group></Col>
                      <Col md={4}><Form.Group><Form.Label>Emergency Phone No</Form.Label><Form.Control value={formData.emergencyPhoneNo} onChange={(e) => handleFieldChange('emergencyPhoneNo', e.target.value)} /></Form.Group></Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <h6 className="fw-semibold mb-3">Medical Details</h6>
                    <Row className="g-3">
                      <Col md={6}><Form.Group><Form.Label>Allergies</Form.Label><Form.Control as="textarea" rows={2} value={formData.allergies} onChange={(e) => handleFieldChange('allergies', e.target.value)} /></Form.Group></Col>
                      <Col md={6}><Form.Group><Form.Label>Medical Condition</Form.Label><Form.Control as="textarea" rows={2} value={formData.medicalCondition} onChange={(e) => handleFieldChange('medicalCondition', e.target.value)} /></Form.Group></Col>
                    </Row>
                  </Card.Body>
                </Card>
              </>
            )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating || isCreatingInstructor || isUpdatingInstructor || isCreatingStudent || isUpdatingStudent || isRoleDetailLoading}>
              {isCreating || isUpdating || isCreatingInstructor || isUpdatingInstructor || isCreatingStudent || isUpdatingStudent ? <Spinner size="sm" /> : submitLabel}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete user <strong>{userToDelete?.name}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Spinner size="sm" /> : 'Delete User'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
