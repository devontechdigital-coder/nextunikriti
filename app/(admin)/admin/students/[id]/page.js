'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { Container, Row, Col, Card, Nav, Tab, Form, Button, Spinner, Alert, ListGroup, Badge, Modal } from 'react-bootstrap';
import { 
  useGetAdminStudentByIdQuery, 
  useUpdateAdminStudentMutation,
  useGetAdminStudentParentsQuery,
  useCreateAdminStudentParentMutation,
  useGetAdminSchoolsQuery
} from '@/redux/api/apiSlice';
import { 
  FaUser, FaHome, FaUsers, FaInfoCircle, FaCheckCircle, 
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaPlus, FaSave, FaUserGraduate 
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import GooglePlaceSelect from '@/components/common/GooglePlaceSelect';

export default function StudentProfilePage() {
  const { id } = useParams();
  const { data: studentData, isLoading: isLoadingStudent, refetch: refetchStudent } = useGetAdminStudentByIdQuery(id);
  const { data: parentData, isLoading: isLoadingParents, refetch: refetchParents } = useGetAdminStudentParentsQuery(id);
  const { data: schoolData } = useGetAdminSchoolsQuery();
  
  const [updateStudent, { isLoading: isUpdating }] = useUpdateAdminStudentMutation();
  const [createParent, { isLoading: isAddingParent }] = useCreateAdminStudentParentMutation();

  const pathname = usePathname();
  const isSchoolAdminPath = pathname.startsWith('/school');

  const { user } = useSelector((state) => state.auth);
  const isSchoolAdmin = user?.role === 'school_admin' || isSchoolAdminPath;

  const [formData, setFormData] = useState({});
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentFormData, setParentFormData] = useState({ relation: 'father', name: '', phone: '', email: '', occupation: '', password: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const student = studentData?.student;
  const parents = parentData?.parents || [];
  const schools = schoolData?.schools || [];

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.userId?.name || '',
        email: student.userId?.email || '',
        phone: student.userId?.phone || '',
        schoolId: student.schoolId?._id || '',
        enrolmentNumber: student.enrolmentNumber || '',
        joiningYear: student.joiningYear || '',
        studentName: student.studentName || student.userId?.name || '',
        onBoard: Boolean(student.onBoard),
        time: student.time || '',
        enrolledFor: student.enrolledFor || '',
        location: student.location || '',
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
        gender: student.gender || 'male',
        bloodGroup: student.bloodGroup || '',
        nationality: student.nationality || 'Indian',
        address1: student.address1 || student.addressLine1 || '',
        address2: student.address2 || student.addressLine2 || '',
        street: student.street || '',
        cityDistrict: student.cityDistrict || student.city || '',
        state: student.state || '',
        country: student.country || 'India',
        pinCode: student.pinCode || '',
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
        allergies: student.allergies || '',
        medicalCondition: student.medicalCondition || '',
        status: student.status || 'lead',
        dateOfJoining: student.dateOfJoining ? new Date(student.dateOfJoining).toISOString().split('T')[0] : student.joiningDate ? new Date(student.joiningDate).toISOString().split('T')[0] : '',
        dateOfLeaving: student.dateOfLeaving ? new Date(student.dateOfLeaving).toISOString().split('T')[0] : student.leavingDate ? new Date(student.leavingDate).toISOString().split('T')[0] : '',
        profilePhoto: student.profilePhoto || ''
      });
    }
  }, [student]);

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
      alert('Failed to add parent information.');
    }
  };

  if (isLoadingStudent) {
    return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  }

  if (!student) {
    return <Container className="py-5"><Alert variant="danger">Student record not found.</Alert></Container>;
  }

  const addressQuery = [
    formData.address1,
    formData.address2,
    formData.street,
    formData.cityDistrict,
    formData.state,
    formData.country,
    formData.pinCode,
  ].filter(Boolean).join(', ');
  const googleMapSrc = addressQuery ? `https://www.google.com/maps?q=${encodeURIComponent(addressQuery)}&output=embed` : '';
  const googleMapLink = addressQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}` : '';

  const handleAddressSelect = (place) => {
    if (!place) return;
    setFormData((prev) => ({
      ...prev,
      address1: place.label || prev.address1,
      cityDistrict: place.city || prev.cityDistrict,
      state: place.state || prev.state,
      country: place.country || prev.country,
      nationality: place.country || prev.nationality,
      location: place.label || prev.location,
    }));
  };

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
                      <FaUsers /> Parent & Contact
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="address" className="d-flex align-items-center gap-2 py-3">
                      <FaMapMarkerAlt /> Address & Location
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="medical" className="d-flex align-items-center gap-2 py-3">
                      <FaUser /> Medical Details
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

          </Col>

          <Col lg={9}>
            <Tab.Content>
              <Tab.Pane eventKey="basic">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white py-3 fw-bold border-bottom">Profile Information</Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-4">
                      <Col md={6}>
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
                      {!isSchoolAdminPath && (
                        <Col md={6}>
                          <Form.Label className="small fw-bold">School</Form.Label>
                          <Form.Select value={formData.schoolId} onChange={(e) => setFormData({...formData, schoolId: e.target.value})}>
                            <option value="">Select School</option>
                            {schools.map(s => <option key={s._id} value={s._id}>{s.schoolName}</option>)}
                          </Form.Select>
                        </Col>
                      )}
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Student Name</Form.Label>
                        <Form.Control value={formData.studentName} onChange={(e) => setFormData({...formData, studentName: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Joining Year</Form.Label>
                        <Form.Control value={formData.joiningYear} onChange={(e) => setFormData({...formData, joiningYear: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Date of Birth</Form.Label>
                        <Form.Control type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Date of Birth</Form.Label>
                        <Form.Select value={formData.onBoard ? 'yes' : 'no'} onChange={(e) => setFormData({...formData, onBoard: e.target.value === 'yes'})}>
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
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
                        <Form.Label className="small fw-bold">Blood Group</Form.Label>
                        <Form.Control value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Time</Form.Label>
                        <Form.Control value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Enrolled For</Form.Label>
                        <Form.Control value={formData.enrolledFor} onChange={(e) => setFormData({...formData, enrolledFor: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Location</Form.Label>
                        <Form.Control value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="parents">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
                    <span className="fw-bold">Parent, Guardian & Emergency Details</span>
                    <Button variant="primary" size="sm" onClick={() => setShowParentModal(true)}><FaPlus className="me-1" /> Add Parent</Button>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-3 mb-4">
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Mother Name</Form.Label>
                        <Form.Control value={formData.motherName} onChange={(e) => setFormData({...formData, motherName: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Mother Mobile</Form.Label>
                        <Form.Control value={formData.motherMobile} onChange={(e) => setFormData({...formData, motherMobile: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Mother Email</Form.Label>
                        <Form.Control type="email" value={formData.motherEmail} onChange={(e) => setFormData({...formData, motherEmail: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Father Name</Form.Label>
                        <Form.Control value={formData.fatherName} onChange={(e) => setFormData({...formData, fatherName: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Father Mobile</Form.Label>
                        <Form.Control value={formData.fatherMobile} onChange={(e) => setFormData({...formData, fatherMobile: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Father Email</Form.Label>
                        <Form.Control type="email" value={formData.fatherEmail} onChange={(e) => setFormData({...formData, fatherEmail: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Home Phone</Form.Label>
                        <Form.Control value={formData.homePhone} onChange={(e) => setFormData({...formData, homePhone: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Emergency Details</Form.Label>
                        <Form.Control value={formData.emergencyDetails} onChange={(e) => setFormData({...formData, emergencyDetails: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Relationship</Form.Label>
                        <Form.Control value={formData.relationship} onChange={(e) => setFormData({...formData, relationship: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Emergency Phone No</Form.Label>
                        <Form.Control value={formData.emergencyPhoneNo} onChange={(e) => setFormData({...formData, emergencyPhoneNo: e.target.value})} />
                      </Col>
                    </Row>
                    <hr className="my-4" />
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
                      <Col xs={12}>
                        <Form.Label className="small fw-bold">Search Address</Form.Label>
                        <GooglePlaceSelect
                          value={formData.address1 ? { label: formData.address1, value: formData.address1 } : null}
                          onChange={handleAddressSelect}
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold">Address 1</Form.Label>
                        <Form.Control value={formData.address1} onChange={(e) => setFormData({...formData, address1: e.target.value})} />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold">Address 2</Form.Label>
                        <Form.Control value={formData.address2} onChange={(e) => setFormData({...formData, address2: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Street / Sector / Area</Form.Label>
                        <Form.Control value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">City / District</Form.Label>
                        <Form.Control value={formData.cityDistrict} onChange={(e) => setFormData({...formData, cityDistrict: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">State</Form.Label>
                        <Form.Control value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Country</Form.Label>
                        <Form.Control value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} />
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold">Pin Code</Form.Label>
                        <Form.Control value={formData.pinCode} onChange={(e) => setFormData({...formData, pinCode: e.target.value})} />
                      </Col>
                      <Col md={12}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <Form.Label className="small fw-bold mb-0">Google Map Preview</Form.Label>
                          {googleMapLink && <a href={googleMapLink} target="_blank" rel="noopener noreferrer" className="small">Open in Google Maps</a>}
                        </div>
                        {googleMapSrc ? (
                          <iframe title="Student address map" src={googleMapSrc} width="100%" height="260" style={{ border: 0, borderRadius: 8 }} loading="lazy" />
                        ) : (
                          <div className="bg-light border rounded p-4 text-muted small">Enter address details to preview this location on Google Maps.</div>
                        )}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Tab.Pane>

              <Tab.Pane eventKey="medical">
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-white py-3 fw-bold border-bottom">Medical Details</Card.Header>
                  <Card.Body className="p-4">
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Label className="small fw-bold">Allergies</Form.Label>
                        <Form.Control as="textarea" rows={4} value={formData.allergies} onChange={(e) => setFormData({...formData, allergies: e.target.value})} />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold">Medical Condition</Form.Label>
                        <Form.Control as="textarea" rows={4} value={formData.medicalCondition} onChange={(e) => setFormData({...formData, medicalCondition: e.target.value})} />
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
                        <Form.Control type="date" value={formData.dateOfJoining} onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})} />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold">Leaving Date</Form.Label>
                        <Form.Control type="date" value={formData.dateOfLeaving} onChange={(e) => setFormData({...formData, dateOfLeaving: e.target.value})} />
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small fw-bold">Profile Photo URL</Form.Label>
                        <Form.Control value={formData.profilePhoto} onChange={(e) => setFormData({...formData, profilePhoto: e.target.value})} />
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
