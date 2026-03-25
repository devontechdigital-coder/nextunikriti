'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Container, Row, Col, Card, Nav, Tab, Form, Button, Spinner, Alert, ListGroup, Badge, Modal } from 'react-bootstrap';
import { 
  useGetAdminStudentByIdQuery, 
  useUpdateAdminStudentMutation,
  useGetAdminStudentParentsQuery,
  useCreateAdminStudentParentMutation
} from '@/redux/api/apiSlice';
import { 
  FaUser, FaHome, FaUsers, FaInfoCircle, FaCheckCircle, 
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaPlus, FaSave, FaUserGraduate 
} from 'react-icons/fa';
import { useSelector } from 'react-redux';

export default function SchoolStudentProfilePage() {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const schoolId = user?.schoolId || user?._id;

  const { data: studentData, isLoading: isLoadingStudent, refetch: refetchStudent } = useGetAdminStudentByIdQuery(id);
  const { data: parentData, isLoading: isLoadingParents, refetch: refetchParents } = useGetAdminStudentParentsQuery(id);
  
  const [updateStudent, { isLoading: isUpdating }] = useUpdateAdminStudentMutation();
  const [createParent, { isLoading: isAddingParent }] = useCreateAdminStudentParentMutation();

  const [formData, setFormData] = useState({});
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentFormData, setParentFormData] = useState({ relation: 'father', name: '', phone: '', email: '', occupation: '', password: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const student = studentData?.student;
  const parents = parentData?.parents || [];

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.userId?.name || '',
        email: student.userId?.email || '',
        phone: student.userId?.phone || '',
        schoolId: schoolId,
        enrolmentNumber: student.enrolmentNumber || '',
        dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
        gender: student.gender || 'male',
        bloodGroup: student.bloodGroup || '',
        nationality: student.nationality || 'Indian',
        addressLine1: student.addressLine1 || '',
        addressLine2: student.addressLine2 || '',
        city: student.city || '',
        state: student.state || '',
        pinCode: student.pinCode || '',
        status: student.status || 'lead',
        joiningDate: student.joiningDate ? new Date(student.joiningDate).toISOString().split('T')[0] : '',
        leavingDate: student.leavingDate ? new Date(student.leavingDate).toISOString().split('T')[0] : ''
      });
    }
  }, [student, schoolId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateStudent({ id, ...formData }).unwrap();
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      refetchStudent();
    } catch (err) {
      alert('Failed to update profile.');
    }
  };

  const handleAddParent = async (e) => {
    e.preventDefault();
    try {
      await createParent({ studentId: id, ...parentFormData }).unwrap();
      setShowParentModal(false);
      setParentFormData({ relation: 'father', name: '', phone: '', email: '', occupation: '', password: '' });
      refetchParents();
    } catch (err) {
      alert(err?.data?.error || 'Failed to add parent information.');
    }
  };

  if (isLoadingStudent) {
    return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  }

  if (!student) {
    return <Container className="py-5"><Alert variant="danger">Student record not found.</Alert></Container>;
  }

  return (
    <Container className="py-5">
      <Row className="mb-4 align-items-center">
        <Col>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 p-4 rounded-3 text-primary">
              <FaUserGraduate size={40} />
            </div>
            <div>
              <h2 className="fw-bold mb-1">{student.userId?.name}</h2>
              <p className="text-muted mb-0">
                <Badge bg="light" text="dark" className="border me-2 px-3 py-2">
                  ID: {student.enrolmentNumber}
                </Badge>
                <Badge bg={student.status === 'active' ? 'success' : 'warning'} className="px-3 py-2">
                  {student.status?.toUpperCase()}
                </Badge>
              </p>
            </div>
          </div>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={handleUpdate} disabled={isUpdating} className="px-4 shadow-sm">
            {isUpdating ? <Spinner size="sm" /> : <><FaSave className="me-2" /> Save Changes</>}
          </Button>
        </Col>
      </Row>

      {successMsg && <Alert variant="success" className="mb-4 shadow-sm border-0 animate__animated animate__fadeIn"><FaCheckCircle className="me-2" /> {successMsg}</Alert>}

      <Tab.Container id="profile-tabs" defaultActiveKey="basic">
        <Row>
          <Col lg={3}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-0">
                <Nav variant="pills" className="flex-column p-2">
                  <Nav.Item>
                    <Nav.Link eventKey="basic" className="d-flex align-items-center gap-2 py-3">
                      <FaInfoCircle /> Basic Information
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="parents" className="d-flex align-items-center gap-2 py-3">
                      <FaUsers /> Parent Details
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="address" className="d-flex align-items-center gap-2 py-3">
                      <FaMapMarkerAlt /> Address & Location
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="status" className="d-flex align-items-center gap-2 py-3">
                      <FaCheckCircle /> Status & Records
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm bg-light">
              <Card.Body>
                <h6 className="fw-bold mb-3 small text-uppercase text-muted">Quick Contact</h6>
                <div className="d-flex align-items-center gap-2 mb-2 small">
                  <FaEnvelope className="text-muted" /> {student.userId?.email || 'N/A'}
                </div>
                <div className="d-flex align-items-center gap-2 small">
                  <FaPhone className="text-muted" /> {student.userId?.phone || 'N/A'}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={9}>
            <Tab.Content>
              <Tab.Pane eventKey="basic">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white py-3 fw-bold border-bottom">Profile Information</Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-4">
                      <Col md={12}>
                        <Form.Label className="small fw-bold">Full Name</Form.Label>
                        <Form.Control value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold">Email Address</Form.Label>
                        <Form.Control type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold">Phone Number</Form.Label>
                        <Form.Control value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Date of Birth</Form.Label>
                        <Form.Control type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
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
                        <Form.Label className="small fw-bold">Blood Group</Form.Label>
                        <Form.Control value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="parents">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                    <span className="fw-bold">Parents/Guardians</span>
                    <Button variant="primary" size="sm" onClick={() => setShowParentModal(true)}><FaPlus className="me-1" /> Add Parent</Button>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-3">
                      {parents.map((p, idx) => (
                        <Col md={6} key={idx}>
                          <Card className="bg-light border-0">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="fw-bold mb-0">{p.name}</h6>
                                <Badge bg="primary">{p.relation?.toUpperCase()}</Badge>
                              </div>
                              <div className="small text-muted mb-1"><FaPhone size={12} className="me-1" /> {p.phone}</div>
                              {p.email && <div className="small text-muted mb-1"><FaEnvelope size={12} className="me-1" /> {p.email}</div>}
                              {p.occupation && <div className="small text-muted"><FaInfoCircle size={12} className="me-1" /> {p.occupation}</div>}
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                      {parents.length === 0 && <Alert variant="light" className="text-center border-dashed py-5">No parent information added yet.</Alert>}
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="address">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white py-3 fw-bold border-bottom">Address Details</Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-3">
                      <Col md={12}>
                        <Form.Label className="small fw-bold">Address Line 1</Form.Label>
                        <Form.Control value={formData.addressLine1} onChange={(e) => setFormData({...formData, addressLine1: e.target.value})} />
                      </Col>
                      <Col md={12}>
                        <Form.Label className="small fw-bold">Address Line 2 (Optional)</Form.Label>
                        <Form.Control value={formData.addressLine2} onChange={(e) => setFormData({...formData, addressLine2: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">City</Form.Label>
                        <Form.Control value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">State</Form.Label>
                        <Form.Control value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Pin Code</Form.Label>
                        <Form.Control value={formData.pinCode} onChange={(e) => setFormData({...formData, pinCode: e.target.value})} />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="status">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white py-3 fw-bold border-bottom">Status & Enrollment Tracking</Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Label className="small fw-bold">Current Status</Form.Label>
                        <Form.Select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                          <option value="lead">Lead</option>
                          <option value="trial">Trial</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="left">Left</option>
                        </Form.Select>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold">Enrolment Number</Form.Label>
                        <Form.Control value={formData.enrolmentNumber} onChange={(e) => setFormData({...formData, enrolmentNumber: e.target.value})} />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold">Joining Date</Form.Label>
                        <Form.Control type="date" value={formData.joiningDate} onChange={(e) => setFormData({...formData, joiningDate: e.target.value})} />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold">Leaving Date</Form.Label>
                        <Form.Control type="date" value={formData.leavingDate} onChange={(e) => setFormData({...formData, leavingDate: e.target.value})} />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>

      {/* Add Parent Modal */}
      <Modal show={showParentModal} onHide={() => setShowParentModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fs-6 fw-bold">Add Parent/Guardian</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddParent}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Relation</Form.Label>
              <Form.Select value={parentFormData.relation} onChange={(e) => setParentFormData({...parentFormData, relation: e.target.value})}>
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Full Name</Form.Label>
              <Form.Control required value={parentFormData.name} onChange={(e) => setParentFormData({...parentFormData, name: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Phone Number</Form.Label>
              <Form.Control required value={parentFormData.phone} onChange={(e) => setParentFormData({...parentFormData, phone: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Email (Required for account creation)</Form.Label>
              <Form.Control type="email" required value={parentFormData.email} onChange={(e) => setParentFormData({...parentFormData, email: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Portal Password</Form.Label>
              <Form.Control 
                type="password" 
                required 
                placeholder="Set password for parent login"
                value={parentFormData.password} 
                onChange={(e) => setParentFormData({...parentFormData, password: e.target.value})} 
              />
            </Form.Group>
            <Form.Group className="mb-0">
              <Form.Label className="small fw-bold">Occupation</Form.Label>
              <Form.Control value={parentFormData.occupation} onChange={(e) => setParentFormData({...parentFormData, occupation: e.target.value})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="link" onClick={() => setShowParentModal(false)} className="text-secondary text-decoration-none small">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isAddingParent} className="px-5 shadow-sm small fw-bold">
              {isAddingParent ? <Spinner size="sm" /> : 'Add Parent Details'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
