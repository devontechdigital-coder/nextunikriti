'use client';

import { useState } from 'react';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge, Row, Col } from 'react-bootstrap';
import { 
  useGetAdminStudentsQuery,
  useCreateAdminStudentMutation, 
  useDeleteAdminStudentMutation 
} from '@/redux/api/apiSlice';
import { FaTrash, FaPlus, FaCheckCircle, FaUserGraduate, FaSearch, FaFilter } from 'react-icons/fa';
import Link from 'next/link';
import { useSelector } from 'react-redux';

export default function SchoolStudentsPage() {
  const { user } = useSelector((state) => state.auth);
  const schoolId = user?.schoolId || user?._id;

  const [filters, setFilters] = useState({ 
    schoolId: schoolId,
    status: '', 
    gender: '', 
    search: '' 
  });
  
  const { data, isLoading, isError, error } = useGetAdminStudentsQuery(filters);
  const [createStudent, { isLoading: isCreating }] = useCreateAdminStudentMutation();
  const [deleteStudent, { isLoading: isDeleting }] = useDeleteAdminStudentMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', password: '',
    schoolId: schoolId, enrolmentNumber: '', dob: '', gender: 'male',
    bloodGroup: '', nationality: 'Indian', addressLine1: '',
    city: '', state: '', pinCode: '', status: 'lead'
  });
  const [successMsg, setSuccessMsg] = useState('');

  const students = data?.students || [];

  const handleOpenModal = () => {
    setFormData({ 
      name: '', email: '', phone: '', password: '',
      schoolId: schoolId, enrolmentNumber: '', dob: '', gender: 'male',
      bloodGroup: '', nationality: 'Indian', addressLine1: '',
      city: '', state: '', pinCode: '', status: 'lead'
    });
    setShowModal(true);
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
          <Col md={4}>
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
          <Col md={4}>
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
          <Col md={4}>
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
                <td>
                  <Badge pill bg={statusColors[student.status] || 'secondary'} className="px-3">
                    {student.status?.toUpperCase()}
                  </Badge>
                </td>
                <td className="text-end pe-4">
                  <Link href={`/school/students/${student._id}`} passHref>
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
                <td colSpan="4" className="text-center py-5">
                  <div className="text-muted mb-2">No student records found.</div>
                  <Button variant="link" className="text-decoration-none" onClick={() => setFilters({ schoolId: schoolId, status: '', gender: '', search: '' })}>
                    Clear all filters
                  </Button>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Create Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl">
        <Modal.Header closeButton className="bg-light py-3">
          <Modal.Title className="fw-bold fs-5">Add New Student Profile</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4" style={{ backgroundColor: '#f9fafb' }}>
            <h6 className="fw-bold mb-4 text-primary border-bottom pb-2">User Account (Login Credentials)</h6>
            <Row className="mb-4">
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Full Name</Form.Label>
                <Form.Control required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Email Address</Form.Label>
                <Form.Control type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Phone Number</Form.Label>
                <Form.Control value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Default Password</Form.Label>
                <Form.Control placeholder="Default: Student@123" onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </Col>
            </Row>

            <h6 className="fw-bold mb-4 text-primary border-bottom pb-2">Academic & CRM Info</h6>
            <Row className="mb-3">
              <Col md={6} className="mb-3">
                <Form.Label className="small fw-bold">Enrolment Number</Form.Label>
                <Form.Control required value={formData.enrolmentNumber} onChange={(e) => setFormData({...formData, enrolmentNumber: e.target.value})} />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label className="small fw-bold">Status</Form.Label>
                <Form.Select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="lead">Lead</option>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="left">Left</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Gender</Form.Label>
                <Form.Select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Date of Birth</Form.Label>
                <Form.Control type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">City</Form.Label>
                <Form.Control value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
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
