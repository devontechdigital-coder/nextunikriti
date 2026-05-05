'use client';

import { useState } from 'react';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge, Card, Row, Col } from 'react-bootstrap';
import { 
  useGetAdminInstructorsQuery, 
  useUpdateAdminUserMutation, 
  useCreateAdminInstructorMutation,
  useGetInstructorStatsQuery,
  useGetInstructorCoursesQuery,
  useGetAdminSchoolsQuery,
  useGetAdminInstrumentsQuery
} from '@/redux/api/apiSlice';
import { FaCheck, FaTimes, FaBan, FaChartLine, FaCheckCircle, FaPlus, FaTrash } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import GooglePlaceSelect from '@/components/common/GooglePlaceSelect';

const createEducationEntry = () => ({
  level: 'graduation',
  courseName: '',
  instituteName: '',
  boardOrUniversity: '',
  yearOfPassing: '',
  percentageOrGPA: '',
  stream: '',
});

const createInitialFormData = (schoolId = '') => ({
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'instructor',
  schoolId,
  bio: '',
  avatar: '',
  instrumentIds: [],
  status: 'active',
  dateOfBirth: '',
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

export default function AdminInstructorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError, error } = useGetAdminInstructorsQuery({
    page,
    search: searchTerm
  });

  const [updateUser, { isLoading: isUpdating }] = useUpdateAdminUserMutation();
  const [createInstructor, { isLoading: isCreating }] = useCreateAdminInstructorMutation();
  const { data: schoolData } = useGetAdminSchoolsQuery();
  const { data: instrumentsData } = useGetAdminInstrumentsQuery({ status: 'active' });
  const schools = schoolData?.schools || [];
  const instruments = instrumentsData?.instruments || [];
  
  const { user } = useSelector((state) => state.auth);
  const isSchoolAdmin = user?.role === 'school_admin';
  const schoolId = user?.schoolId || user?._id;

  const [successMsg, setSuccessMsg] = useState('');

  // Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(createInitialFormData());

  // Stats Modal State
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(search);
    setPage(1);
  };

  const handleStatusUpdate = async (userId, status) => {
    try {
      await updateUser({ userId, status }).unwrap();
      setSuccessMsg(`Instructor status updated to ${status}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const openStats = (instructor) => {
    setSelectedInstructor(instructor);
    setShowStatsModal(true);
  };

  const handleOpenCreateModal = () => {
    setFormData(createInitialFormData(isSchoolAdmin ? schoolId : ''));
    setShowCreateModal(true);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressSelect = (place) => {
    if (!place) return;
    setFormData((prev) => ({
      ...prev,
      addressLine1: place.label || prev.addressLine1,
      state: place.state || prev.state,
      nationality: place.country || prev.nationality,
    }));
  };

  const toggleInstrument = (instrumentId) => {
    setFormData((prev) => {
      const currentIds = Array.isArray(prev.instrumentIds) ? prev.instrumentIds : [];
      return {
        ...prev,
        instrumentIds: currentIds.includes(instrumentId)
          ? currentIds.filter((id) => id !== instrumentId)
          : [...currentIds, instrumentId],
      };
    });
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

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        education: formData.education.filter((item) => item.level || item.courseName || item.instituteName || item.boardOrUniversity || item.yearOfPassing || item.percentageOrGPA || item.stream),
      };

      await createInstructor(payload).unwrap();
      setSuccessMsg('Instructor created successfully!');
      setShowCreateModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to create instructor.');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading instructors...</p>
      </Container>
    );
  }

  const instructors = data?.data || [];
  const meta = data?.meta || { totalPages: 1, currentPage: 1 };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Instructor Management</h2>
        {(user?.role === 'admin' || isSchoolAdmin) && (
          <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={handleOpenCreateModal}>
            <FaPlus /> Add New Instructor
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-3 rounded shadow-sm mb-4">
        <Form onSubmit={handleSearch} className="d-flex gap-2" style={{ maxWidth: '400px' }}>
          <Form.Control 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="secondary" type="submit">Search</Button>
        </Form>
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
              <th>Status</th>
              <th>Joined</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {instructors.map((ins) => (
              <tr key={ins._id}>
                <td className="ps-4 fw-bold">{ins.name}</td>
                <td>{ins.email}</td>
                <td>
                  <Badge bg={ins.status === 'active' ? 'success' : ins.status === 'suspended' ? 'danger' : 'warning'}>
                    {ins.status}
                  </Badge>
                </td>
                <td className="small">{new Date(ins.createdAt).toLocaleDateString()}</td>
                <td className="text-end pe-4">
                  <div className="d-flex justify-content-end gap-2">
                    {ins.status === 'pending_approval' && (
                      <>
                        <Button variant="success" size="sm" onClick={() => handleStatusUpdate(ins._id, 'active')} title="Approve">
                          <FaCheck />
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(ins._id, 'rejected')} title="Reject">
                          <FaTimes />
                        </Button>
                      </>
                    )}
                    {ins.status === 'active' && (
                      <Button variant="outline-danger" size="sm" onClick={() => handleStatusUpdate(ins._id, 'suspended')} title="Suspend">
                        <FaBan />
                      </Button>
                    )}
                    {ins.status === 'suspended' && (
                      <Button variant="outline-success" size="sm" onClick={() => handleStatusUpdate(ins._id, 'active')} title="Unsuspend">
                        <FaCheck />
                      </Button>
                    )}
                    <Button variant="outline-primary" size="sm" onClick={() => openStats(ins)} title="View Stats & Courses">
                      <FaChartLine />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {instructors.length === 0 && <div className="p-5 text-center text-muted">No instructors found</div>}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2">
          <Button variant="light" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="align-self-center mx-2">Page {page} of {meta.totalPages}</span>
          <Button variant="light" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Create Instructor Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="xl" centered scrollable dialogClassName="instructor-create-modal">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold fs-5">Add New Instructor</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="border rounded-3 p-3 mb-4 bg-light-subtle">
              <h6 className="fw-bold mb-3">User Account</h6>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Name</Form.Label>
                    <Form.Control
                      required
                      placeholder="Enter account name"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Phone Number</Form.Label>
                    <Form.Control
                      placeholder="10-digit phone"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Password</Form.Label>
                    <Form.Control
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Status</Form.Label>
                    <Form.Select
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="pending_approval">Pending Approval</option>
                      <option value="suspended">Suspended</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Avatar URL</Form.Label>
                    <Form.Control
                      placeholder="https://..."
                      value={formData.avatar}
                      onChange={(e) => handleFieldChange('avatar', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Bio</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Short bio"
                      value={formData.bio}
                      onChange={(e) => handleFieldChange('bio', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Choose Instruments</Form.Label>
                    <div className="border rounded-3 p-3 bg-white d-flex flex-wrap gap-3">
                      {instruments.length > 0 ? instruments.map((instrument) => (
                        <Form.Check
                          key={instrument._id}
                          type="checkbox"
                          id={`instructor-instrument-${instrument._id}`}
                          label={instrument.name}
                          checked={(formData.instrumentIds || []).includes(instrument._id)}
                          onChange={() => toggleInstrument(instrument._id)}
                        />
                      )) : (
                        <div className="text-muted small">No active instruments available.</div>
                      )}
                    </div>
                  </Form.Group>
                </Col>
                {!isSchoolAdmin && (
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Assign to School</Form.Label>
                      <Form.Select
                        value={formData.schoolId}
                        onChange={(e) => handleFieldChange('schoolId', e.target.value)}
                      >
                        <option value="">No School (Independent)</option>
                        {schools.map((s) => (
                          <option key={s._id} value={s._id}>{s.schoolName}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                )}
              </Row>
            </div>

            <div className="border rounded-3 p-3 mb-4">
              <h6 className="fw-bold mb-3">Personal Details</h6>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Date of Birth</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Alternate Number</Form.Label>
                    <Form.Control
                      value={formData.landlineOrAlternateNumber}
                      onChange={(e) => handleFieldChange('landlineOrAlternateNumber', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Gender</Form.Label>
                    <Form.Select
                      value={formData.gender}
                      onChange={(e) => handleFieldChange('gender', e.target.value)}
                    >
                      <option value="prefer_not_to_say">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Nationality</Form.Label>
                    <Form.Control
                      value={formData.nationality}
                      onChange={(e) => handleFieldChange('nationality', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="border rounded-3 p-3 mb-4">
              <h6 className="fw-bold mb-3">Address Details</h6>
              <Row className="g-3">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Search Address</Form.Label>
                    <GooglePlaceSelect
                      value={formData.addressLine1 ? { label: formData.addressLine1, value: formData.addressLine1 } : null}
                      onChange={handleAddressSelect}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Address Line 1</Form.Label>
                    <Form.Control value={formData.addressLine1} onChange={(e) => handleFieldChange('addressLine1', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Address Line 2</Form.Label>
                    <Form.Control value={formData.addressLine2} onChange={(e) => handleFieldChange('addressLine2', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Landmark</Form.Label>
                    <Form.Control value={formData.landmark} onChange={(e) => handleFieldChange('landmark', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">State</Form.Label>
                    <Form.Control value={formData.state} onChange={(e) => handleFieldChange('state', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">PIN Code</Form.Label>
                    <Form.Control value={formData.pinCode} onChange={(e) => handleFieldChange('pinCode', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Permanent Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={formData.permanentAddress}
                      onChange={(e) => handleFieldChange('permanentAddress', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="border rounded-3 p-3 mb-4">
              <h6 className="fw-bold mb-3">Family Details</h6>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Father Full Name</Form.Label>
                    <Form.Control value={formData.fatherFullName} onChange={(e) => handleFieldChange('fatherFullName', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Father Contact Number</Form.Label>
                    <Form.Control value={formData.fatherContactNumber} onChange={(e) => handleFieldChange('fatherContactNumber', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Father Occupation</Form.Label>
                    <Form.Control value={formData.fatherOccupation} onChange={(e) => handleFieldChange('fatherOccupation', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Mother Full Name</Form.Label>
                    <Form.Control value={formData.motherFullName} onChange={(e) => handleFieldChange('motherFullName', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Mother Contact Number</Form.Label>
                    <Form.Control value={formData.motherContactNumber} onChange={(e) => handleFieldChange('motherContactNumber', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Mother Occupation</Form.Label>
                    <Form.Control value={formData.motherOccupation} onChange={(e) => handleFieldChange('motherOccupation', e.target.value)} />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="border rounded-3 p-3 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Education</h6>
                <Button type="button" variant="outline-primary" size="sm" onClick={handleAddEducation}>
                  Add Education
                </Button>
              </div>
              {formData.education.map((item, index) => (
                <div key={index} className="border rounded-3 p-3 mb-3 bg-light-subtle">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-semibold">Education #{index + 1}</span>
                    <Button type="button" variant="outline-danger" size="sm" onClick={() => handleRemoveEducation(index)}>
                      <FaTrash />
                    </Button>
                  </div>
                  <Row className="g-3">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Level</Form.Label>
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
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Course Name</Form.Label>
                        <Form.Control value={item.courseName} onChange={(e) => handleEducationChange(index, 'courseName', e.target.value)} />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Institute Name</Form.Label>
                        <Form.Control value={item.instituteName} onChange={(e) => handleEducationChange(index, 'instituteName', e.target.value)} />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Board/University</Form.Label>
                        <Form.Control value={item.boardOrUniversity} onChange={(e) => handleEducationChange(index, 'boardOrUniversity', e.target.value)} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Year of Passing</Form.Label>
                        <Form.Control value={item.yearOfPassing} onChange={(e) => handleEducationChange(index, 'yearOfPassing', e.target.value)} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Percentage / GPA</Form.Label>
                        <Form.Control value={item.percentageOrGPA} onChange={(e) => handleEducationChange(index, 'percentageOrGPA', e.target.value)} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold">Stream</Form.Label>
                        <Form.Control value={item.stream} onChange={(e) => handleEducationChange(index, 'stream', e.target.value)} />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>

            <div className="border rounded-3 p-3 mb-4">
              <h6 className="fw-bold mb-3">Bank Details</h6>
              <Row className="g-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Name as Per Bank Record</Form.Label>
                    <Form.Control value={formData.nameAsPerBankRecord} onChange={(e) => handleFieldChange('nameAsPerBankRecord', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Bank Name</Form.Label>
                    <Form.Control value={formData.bankName} onChange={(e) => handleFieldChange('bankName', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Account Number</Form.Label>
                    <Form.Control value={formData.accountNumber} onChange={(e) => handleFieldChange('accountNumber', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Type of Account</Form.Label>
                    <Form.Control value={formData.typeOfAccount} onChange={(e) => handleFieldChange('typeOfAccount', e.target.value)} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">IFSC Code</Form.Label>
                    <Form.Control value={formData.ifscCode} onChange={(e) => handleFieldChange('ifscCode', e.target.value)} />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="border rounded-3 p-3 mb-4">
              <h6 className="fw-bold mb-3">Documents</h6>
              <Row className="g-3">
                <Col md={6}><Form.Group><Form.Label className="small fw-bold">Latest Photograph</Form.Label><Form.Control value={formData.latestPhotograph} onChange={(e) => handleFieldChange('latestPhotograph', e.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label className="small fw-bold">Aadhaar Card</Form.Label><Form.Control value={formData.aadhaarCard} onChange={(e) => handleFieldChange('aadhaarCard', e.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label className="small fw-bold">PAN Card</Form.Label><Form.Control value={formData.panCard} onChange={(e) => handleFieldChange('panCard', e.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label className="small fw-bold">Voter&apos;s ID Card</Form.Label><Form.Control value={formData.votersIdCard} onChange={(e) => handleFieldChange('votersIdCard', e.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label className="small fw-bold">Driving License</Form.Label><Form.Control value={formData.drivingLicense} onChange={(e) => handleFieldChange('drivingLicense', e.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label className="small fw-bold">Other Photo ID Card</Form.Label><Form.Control value={formData.otherPhotoIdCard} onChange={(e) => handleFieldChange('otherPhotoIdCard', e.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label className="small fw-bold">Cheque Image</Form.Label><Form.Control value={formData.chequeImage} onChange={(e) => handleFieldChange('chequeImage', e.target.value)} /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label className="small fw-bold">Education / Experience Testimonials</Form.Label><Form.Control value={formData.educationExperienceTestimonials} onChange={(e) => handleFieldChange('educationExperienceTestimonials', e.target.value)} /></Form.Group></Col>
              </Row>
            </div>

            <div className="border rounded-3 p-3">
              <h6 className="fw-bold mb-3">Declarations</h6>
              <Form.Check
                className="mb-2"
                type="checkbox"
                label="I confirm that the information provided is accurate."
                checked={formData.declarationAccuracy}
                onChange={(e) => handleFieldChange('declarationAccuracy', e.target.checked)}
              />
              <Form.Check
                type="checkbox"
                label="I consent to verification of the submitted information and documents."
                checked={formData.declarationVerificationConsent}
                onChange={(e) => handleFieldChange('declarationVerificationConsent', e.target.checked)}
              />
            </div>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="link" onClick={() => setShowCreateModal(false)} className="text-secondary text-decoration-none">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating} className="px-5 shadow-sm">
              {isCreating ? <Spinner size="sm" /> : 'Create Instructor'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Stats & Courses Modal */}
      {selectedInstructor && (
        <InstructorStatsModal 
          show={showStatsModal} 
          onHide={() => setShowStatsModal(false)} 
          instructor={selectedInstructor} 
        />
      )}
    </Container>
  );
}

function InstructorStatsModal({ show, onHide, instructor }) {
  const { data: stats, isLoading: statsLoading } = useGetInstructorStatsQuery(instructor._id);
  const { data: courses, isLoading: coursesLoading } = useGetInstructorCoursesQuery(instructor._id);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Performance: {instructor.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-light">
        <Row className="mb-4">
          <Col md={6}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small fw-bold text-uppercase mb-1">Total Earnings</div>
                <h3 className="fw-bold text-success">
                  {statsLoading ? <Spinner size="sm" /> : `$${stats?.data?.totalEarnings || 0}`}
                </h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small fw-bold text-uppercase mb-1">Total Courses</div>
                <h3 className="fw-bold text-primary">
                  {statsLoading ? <Spinner size="sm" /> : stats?.data?.courseCount || 0}
                </h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <h5 className="fw-bold mb-3">Course Portfolio</h5>
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <Table hover responsive className="mb-0 small">
            <thead className="bg-light">
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {coursesLoading ? (
                <tr><td colSpan="4" className="text-center p-3"><Spinner size="sm" /></td></tr>
              ) : (
                courses?.data?.map(c => (
                  <tr key={c._id}>
                    <td className="fw-bold">{c.title}</td>
                    <td>{c.category}</td>
                    <td>${c.price}</td>
                    <td>
                      <Badge bg={c.isPublished ? 'success' : 'secondary'}>
                        {c.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
              {!coursesLoading && courses?.data?.length === 0 && (
                <tr><td colSpan="4" className="text-center p-3 text-muted">No courses found</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
