'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge, Row, Col } from 'react-bootstrap';
import { 
  useGetAdminStudentsQuery,
  useGetAdminSchoolsQuery,
  useCreateAdminStudentMutation, 
  useDeleteAdminStudentMutation 
} from '@/redux/api/apiSlice';
import { FaEdit, FaTrash, FaPlus, FaCheckCircle, FaUserGraduate, FaSearch, FaFilter } from 'react-icons/fa';
import Link from 'next/link';
import { useSelector } from 'react-redux';

const createInitialFormData = (schoolId = '') => ({
  name: '',
  email: '',
  phone: '',
  password: '',
  schoolId,
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
  status: 'lead',
  profilePhoto: '',
});

export default function StudentsPage() {
  const pathname = usePathname();
  const isSchoolAdminPath = pathname.startsWith('/school');

  const { user } = useSelector((state) => state.auth);
  const isSchoolAdmin = user?.role === 'school_admin' || isSchoolAdminPath;
  const schoolId = user?.schoolId || user?._id; // Use schoolId or the user ID if the admin is the school

  const [filters, setFilters] = useState({ 
    schoolId: (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('auth_user') || '{}')?.role === 'school_admin') 
      ? (JSON.parse(localStorage.getItem('auth_user') || '{}')?.schoolId || JSON.parse(localStorage.getItem('auth_user') || '{}')?._id)
      : '', 
    status: '', 
    gender: '', 
    search: '' 
  });
  const { data, isLoading, isError, error } = useGetAdminStudentsQuery(filters);
  const { data: schoolData } = useGetAdminSchoolsQuery();
  
  const [createStudent, { isLoading: isCreating }] = useCreateAdminStudentMutation();
  const [deleteStudent, { isLoading: isDeleting }] = useDeleteAdminStudentMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  
  const [formData, setFormData] = useState(createInitialFormData());
  const [successMsg, setSuccessMsg] = useState('');

  const students = data?.students || [];
  const schools = schoolData?.schools || [];

  const handleOpenModal = () => {
    setFormData(createInitialFormData(isSchoolAdmin ? schoolId : ''));
    setShowModal(true);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createStudent(formData).unwrap();
      setSuccessMsg('Student created successfully!');
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to create student.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStudent(studentToDelete._id).unwrap();
      setSuccessMsg('Student deleted successfully!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to delete student.');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-primary fw-bold">Loading student records...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark">Student CRM</h2>
          <p className="text-muted">Manage enrolment, leads, and student profiles</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={handleOpenModal}>
          <FaPlus /> Add New Student
        </Button>
      </div>

      <div className="bg-white p-4 rounded shadow-sm mb-4 border">
        <Row className="g-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaSearch size={12} /> Search Name/ID
              </Form.Label>
              <Form.Control 
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </Form.Group>
          </Col>
          {!isSchoolAdminPath && (
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                  <FaFilter size={12} /> School
                </Form.Label>
                <Form.Select 
                  value={filters.schoolId}
                  onChange={(e) => setFilters({...filters, schoolId: e.target.value})}
                >
                  <option value="">All Schools</option>
                  {schools.map(s => (
                    <option key={s._id} value={s._id}>{s.schoolName}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          )}
          <Col md={isSchoolAdminPath ? 4 : 3}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaFilter size={12} /> Status
              </Form.Label>
              <Form.Select 
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Status</option>
                <option value="lead">Lead</option>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="left">Left</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaFilter size={12} /> Gender
              </Form.Label>
              <Form.Select 
                value={filters.gender}
                onChange={(e) => setFilters({...filters, gender: e.target.value})}
              >
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {successMsg && (
        <Alert variant="success" className="d-flex align-items-center gap-2 shadow-sm border-0 mb-4 animate__animated animate__fadeIn">
          <FaCheckCircle /> {successMsg}
        </Alert>
      )}

      {isError && (
        <Alert variant="danger" className="border-0 shadow-sm mb-4">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error?.data?.error || 'Failed to load student records'}</p>
        </Alert>
      )}

      <div className="bg-white rounded shadow-sm overflow-hidden mb-4 border">
        <Table hover responsive className="mb-0">
          <thead className="bg-light text-secondary text-uppercase small fw-bold">
            <tr>
              <th className="ps-4 py-3">Student Details</th>
              <th className="py-3">Enrolment ID</th>
              {isSchoolAdminPath ? null : <th>School</th>}
              <th className="py-3">Status</th>
              <th className="text-end pe-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const statusColors = {
                lead: 'warning',
                trial: 'info',
                active: 'success',
                inactive: 'secondary',
                left: 'danger'
              };
              
              return (
              <tr key={student._id} className="align-middle">
                <td className="ps-4">
                  <div className="d-flex align-items-center gap-3 py-2">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary">
                      <FaUserGraduate size={20} />
                    </div>
                    <div>
                      <div className="fw-bold">{student.userId?.name || 'Unknown'}</div>
                      <small className="text-muted d-block">{student.userId?.email || student.userId?.phone}</small>
                    </div>
                  </div>
                </td>
                <td><code className="text-dark bg-light px-2 py-1 rounded small">{student.enrolmentNumber}</code></td>
                {isSchoolAdminPath ? null : <td>{student.schoolId?.schoolName || <em className="text-muted">Unassigned</em>}</td>}
                <td>
                  <Badge pill bg={statusColors[student.status] || 'secondary'} className="px-3">
                    {student.status?.toUpperCase()}
                  </Badge>
                </td>
                <td className="text-end pe-4">
                  <Link href={`/admin/students/${student._id}`} passHref>
                    <Button variant="outline-primary" size="sm" className="me-2 rounded-pill px-3 shadow-xs">
                      View Profile
                    </Button>
                  </Link>
                  <Button variant="outline-danger" size="sm" className="rounded-circle shadow-xs" onClick={() => { setStudentToDelete(student); setShowDeleteModal(true); }}>
                    <FaTrash size={12} />
                  </Button>
                </td>
              </tr>
            )})}
            {students.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-5">
                  <div className="text-muted mb-2">No student records found.</div>
                  <Button variant="link" className="text-decoration-none" onClick={() => setFilters({ schoolId: '', status: '', gender: '', search: '' })}>
                    Clear all filters
                  </Button>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Create Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl" scrollable>
        <Modal.Header closeButton className="bg-light py-3">
          <Modal.Title className="fw-bold fs-5">Add New Student Profile</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4" style={{ backgroundColor: '#f9fafb', maxHeight: '70vh', overflowY: 'auto' }}>
            <h6 className="fw-bold mb-4 text-primary border-bottom pb-2">User Account (Login Credentials)</h6>
            <Row className="g-3 mb-4">
              <Col md={4}>
                <Form.Label className="small fw-bold">Full Name</Form.Label>
                <Form.Control required value={formData.name} onChange={(e) => handleFieldChange('name', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Email Address</Form.Label>
                <Form.Control type="email" required value={formData.email} onChange={(e) => handleFieldChange('email', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Phone Number</Form.Label>
                <Form.Control value={formData.phone} onChange={(e) => handleFieldChange('phone', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Default Password</Form.Label>
                <Form.Control placeholder="Default: Student@123" value={formData.password} onChange={(e) => handleFieldChange('password', e.target.value)} />
              </Col>
            </Row>

            <h6 className="fw-bold mb-4 text-primary border-bottom pb-2">Academic & CRM Info</h6>
            <Row className="g-3 mb-4">
              {!isSchoolAdminPath && (
                <Col md={4}>
                  <Form.Label className="small fw-bold">School</Form.Label>
                  <Form.Select required value={formData.schoolId} onChange={(e) => handleFieldChange('schoolId', e.target.value)}>
                    <option value="">Select School</option>
                    {schools.map(s => <option key={s._id} value={s._id}>{s.schoolName}</option>)}
                  </Form.Select>
                </Col>
              )}
              <Col md={isSchoolAdminPath ? 4 : 4}>
                <Form.Label className="small fw-bold">Enrolment Number</Form.Label>
                <Form.Control placeholder="Auto-generated if left blank" value={formData.enrolmentNumber} onChange={(e) => handleFieldChange('enrolmentNumber', e.target.value)} />
              </Col>
              <Col md={isSchoolAdminPath ? 4 : 4}>
                <Form.Label className="small fw-bold">Student Name</Form.Label>
                <Form.Control value={formData.studentName} onChange={(e) => handleFieldChange('studentName', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Status</Form.Label>
                <Form.Select value={formData.status} onChange={(e) => handleFieldChange('status', e.target.value)}>
                  <option value="lead">Lead</option>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="left">Left</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Joining Year</Form.Label>
                <Form.Control value={formData.joiningYear} onChange={(e) => handleFieldChange('joiningYear', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Date of Joining</Form.Label>
                <Form.Control type="date" value={formData.dateOfJoining} onChange={(e) => handleFieldChange('dateOfJoining', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Date of Leaving</Form.Label>
                <Form.Control type="date" value={formData.dateOfLeaving} onChange={(e) => handleFieldChange('dateOfLeaving', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">On Board</Form.Label>
                <Form.Select value={formData.onBoard ? 'yes' : 'no'} onChange={(e) => handleFieldChange('onBoard', e.target.value === 'yes')}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Time</Form.Label>
                <Form.Control value={formData.time} onChange={(e) => handleFieldChange('time', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Enrolled For</Form.Label>
                <Form.Control value={formData.enrolledFor} onChange={(e) => handleFieldChange('enrolledFor', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Location</Form.Label>
                <Form.Control value={formData.location} onChange={(e) => handleFieldChange('location', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Gender</Form.Label>
                <Form.Select value={formData.gender} onChange={(e) => handleFieldChange('gender', e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Date of Birth</Form.Label>
                <Form.Control type="date" value={formData.dateOfBirth} onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Blood Group</Form.Label>
                <Form.Control value={formData.bloodGroup} onChange={(e) => handleFieldChange('bloodGroup', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Nationality</Form.Label>
                <Form.Control value={formData.nationality} onChange={(e) => handleFieldChange('nationality', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Profile Photo URL</Form.Label>
                <Form.Control value={formData.profilePhoto} onChange={(e) => handleFieldChange('profilePhoto', e.target.value)} />
              </Col>
            </Row>

            <h6 className="fw-bold mb-4 text-primary border-bottom pb-2">Address Details</h6>
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Form.Label className="small fw-bold">Address 1 (House Number)</Form.Label>
                <Form.Control value={formData.address1} onChange={(e) => handleFieldChange('address1', e.target.value)} />
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold">Address 2 (Locality / Apartment)</Form.Label>
                <Form.Control value={formData.address2} onChange={(e) => handleFieldChange('address2', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Street / Sector / Area</Form.Label>
                <Form.Control value={formData.street} onChange={(e) => handleFieldChange('street', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">City / District</Form.Label>
                <Form.Control value={formData.cityDistrict} onChange={(e) => handleFieldChange('cityDistrict', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">State</Form.Label>
                <Form.Control value={formData.state} onChange={(e) => handleFieldChange('state', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">PIN Code</Form.Label>
                <Form.Control value={formData.pinCode} onChange={(e) => handleFieldChange('pinCode', e.target.value)} />
              </Col>
            </Row>

            <h6 className="fw-bold mb-4 text-primary border-bottom pb-2">Parent & Contact Details</h6>
            <Row className="g-3 mb-4">
              <Col md={4}>
                <Form.Label className="small fw-bold">Mother Name</Form.Label>
                <Form.Control value={formData.motherName} onChange={(e) => handleFieldChange('motherName', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Mother Mobile</Form.Label>
                <Form.Control value={formData.motherMobile} onChange={(e) => handleFieldChange('motherMobile', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Mother Email</Form.Label>
                <Form.Control type="email" value={formData.motherEmail} onChange={(e) => handleFieldChange('motherEmail', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Father Name</Form.Label>
                <Form.Control value={formData.fatherName} onChange={(e) => handleFieldChange('fatherName', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Father Mobile</Form.Label>
                <Form.Control value={formData.fatherMobile} onChange={(e) => handleFieldChange('fatherMobile', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Father Email</Form.Label>
                <Form.Control type="email" value={formData.fatherEmail} onChange={(e) => handleFieldChange('fatherEmail', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Home Phone</Form.Label>
                <Form.Control value={formData.homePhone} onChange={(e) => handleFieldChange('homePhone', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Emergency Details</Form.Label>
                <Form.Control value={formData.emergencyDetails} onChange={(e) => handleFieldChange('emergencyDetails', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Relationship</Form.Label>
                <Form.Control value={formData.relationship} onChange={(e) => handleFieldChange('relationship', e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Emergency Phone No</Form.Label>
                <Form.Control value={formData.emergencyPhoneNo} onChange={(e) => handleFieldChange('emergencyPhoneNo', e.target.value)} />
              </Col>
            </Row>

            <h6 className="fw-bold mb-4 text-primary border-bottom pb-2">Medical Details</h6>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label className="small fw-bold">Allergies</Form.Label>
                <Form.Control as="textarea" rows={2} value={formData.allergies} onChange={(e) => handleFieldChange('allergies', e.target.value)} />
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold">Medical Condition</Form.Label>
                <Form.Control as="textarea" rows={2} value={formData.medicalCondition} onChange={(e) => handleFieldChange('medicalCondition', e.target.value)} />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="link" onClick={() => setShowModal(false)} className="text-secondary text-decoration-none">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating} className="px-5 shadow-sm">
              {isCreating ? <Spinner size="sm" /> : 'Create Student Profile'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="mb-0">Are you sure you want to delete student <strong>{studentToDelete?.userId?.name}</strong>?</p>
          <p className="text-danger small mt-2 fw-bold">This will also delete the linked user account and parent details.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Spinner size="sm" /> : 'Delete Permanently'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
