'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { Container, Row, Col, Card, Nav, Tab, Form, Button, Spinner, Alert, ListGroup, Badge, Modal, Table } from 'react-bootstrap';
import { 
  useGetAdminBatchByIdQuery, 
  useUpdateAdminBatchMutation,
  useGetAdminBatchStudentsQuery,
  useEnrollStudentInBatchMutation,
  useRemoveStudentFromBatchMutation,
  useGetAdminSchoolsQuery,
  useGetAdminUsersQuery,
  useGetAdminStudentsQuery,
  useGetAdminInstrumentsQuery,
  useGetAdminLevelsQuery
} from '@/redux/api/apiSlice';
import { 
  FaUserGraduate, FaCalendarAlt, FaUserTie, FaCheckCircle, 
  FaInfoCircle, FaSave, FaPlus, FaTrash, FaSearch, FaLayerGroup 
} from 'react-icons/fa';
import { useSelector } from 'react-redux';

export default function BatchDetailPage() {
  const { id } = useParams();
  const { data: batchData, isLoading: isLoadingBatch, refetch: refetchBatch } = useGetAdminBatchByIdQuery(id);
  const { data: enrollmentData, isLoading: isLoadingEnrollment, refetch: refetchEnrollment } = useGetAdminBatchStudentsQuery(id);
  const { data: schoolData } = useGetAdminSchoolsQuery();
  const { data: userData } = useGetAdminUsersQuery({ role: 'instructor' });
  const { data: instrumentData } = useGetAdminInstrumentsQuery({ status: 'active' });
  
  // Student search for enrollment
  const [studentSearch, setStudentSearch] = useState('');
  const { data: studentData } = useGetAdminStudentsQuery({ search: studentSearch }, { skip: !studentSearch });

  const [updateBatch, { isLoading: isUpdating }] = useUpdateAdminBatchMutation();
  const [enrollStudent, { isLoading: isEnrolling }] = useEnrollStudentInBatchMutation();
  const [removeStudent, { isLoading: isRemoving }] = useRemoveStudentFromBatchMutation();

  const pathname = usePathname();
  const isSchoolAdminPath = pathname.startsWith('/school');

  const { user } = useSelector((state) => state.auth);
  const isSchoolAdmin = user?.role === 'school_admin' || isSchoolAdminPath;

  const [formData, setFormData] = useState({});
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const batch = batchData?.batch;
  const enrolledStudents = enrollmentData?.students || [];
  const schools = schoolData?.schools || [];
  const teachers = userData?.data || [];
  const foundStudents = studentData?.students || [];
  const activeInstruments = instrumentData?.instruments || [];

  // Fetch levels for the selected instrument in the settings form
  const selectedInstrument = activeInstruments.find(i => i.name === formData.instrument);
  const { data: levelData } = useGetAdminLevelsQuery(
    { instrumentId: selectedInstrument?._id, status: 'active' }, 
    { skip: !selectedInstrument }
  );
  const availableLevels = levelData?.levels || [];

  // Initialize form
  useEffect(() => {
    if (batch) {
      setFormData({
        batchName: batch.batchName,
        schoolId: batch.schoolId?._id,
        programType: batch.programType,
        instrument: batch.instrument,
        level: batch.level,
        teacherId: batch.teacherId?._id,
        maxStrength: batch.maxStrength,
        startDate: batch.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '',
        endDate: batch.endDate ? new Date(batch.endDate).toISOString().split('T')[0] : '',
        status: batch.status
      });
    }
  }, [batch]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateBatch({ id, ...formData }).unwrap();
      setSuccessMsg('Batch settings updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
      refetchBatch();
    } catch (err) {
      alert(err?.data?.error || 'Failed to update batch.');
    }
  };

  const handleEnroll = async (studentId) => {
    try {
      await enrollStudent({ batchId: id, studentId }).unwrap();
      setShowEnrollModal(false);
      setStudentSearch('');
      refetchEnrollment();
      refetchBatch();
    } catch (err) {
      alert(err?.data?.error || 'Failed to enroll student.');
    }
  };

  const handleRemove = async (studentId) => {
    if (!confirm('Are you sure you want to remove this student from the batch?')) return;
    try {
      await removeStudent({ batchId: id, studentId }).unwrap();
      refetchEnrollment();
      refetchBatch();
    } catch (err) {
      alert('Failed to remove student.');
    }
  };

  if (isLoadingBatch) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (!batch) return <Container className="py-5"><Alert variant="danger">Batch not found.</Alert></Container>;

  return (
    <Container className="py-5">
      <Row className="mb-4 align-items-center">
        <Col>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 p-4 rounded-3 text-primary">
              <FaLayerGroup size={40} />
            </div>
            <div>
              <h2 className="fw-bold mb-1">{batch.batchName}</h2>
              <p className="text-muted mb-0">
                <Badge bg="light" text="dark" className="border me-2 px-3 py-2">
                  {batch.instrument} • {batch.level}
                </Badge>
                <Badge bg={batch.status === 'active' ? 'success' : 'secondary'} className="px-3 py-2">
                  {batch.status?.toUpperCase()}
                </Badge>
              </p>
            </div>
          </div>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={handleUpdate} disabled={isUpdating} className="px-4 shadow-sm rounded-pill">
            {isUpdating ? <Spinner size="sm" /> : <><FaSave className="me-2" /> Save Changes</>}
          </Button>
        </Col>
      </Row>

      {successMsg && <Alert variant="success" className="mb-4 shadow-sm border-0"><FaCheckCircle className="me-2" /> {successMsg}</Alert>}

      <Row>
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white py-3 fw-bold border-bottom">Batch Settings</Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleUpdate}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Batch Name</Form.Label>
                  <Form.Control value={formData.batchName} onChange={(e) => setFormData({...formData, batchName: e.target.value})} />
                </Form.Group>
                {!isSchoolAdminPath && (
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold">School</Form.Label>
                    <Form.Select value={formData.schoolId} onChange={(e) => setFormData({...formData, schoolId: e.target.value})}>
                      {schools.map(s => <option key={s._id} value={s._id}>{s.schoolName}</option>)}
                    </Form.Select>
                  </Form.Group>
                )}
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Instrument</Form.Label>
                  <Form.Select 
                    value={formData.instrument} 
                    onChange={(e) => setFormData({...formData, instrument: e.target.value, level: ''})}
                  >
                    <option value="">Select Instrument</option>
                    {activeInstruments.map(i => <option key={i._id} value={i.name}>{i.name}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Level</Form.Label>
                  <Form.Select 
                    value={formData.level} 
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    disabled={!formData.instrument}
                  >
                    <option value="">Select Level</option>
                    {availableLevels.map(l => <option key={l._id} value={l.levelName}>{l.levelName}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Teacher</Form.Label>
                  <Form.Select value={formData.teacherId} onChange={(e) => setFormData({...formData, teacherId: e.target.value})}>
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </Form.Select>
                </Form.Group>
                <Row>
                   <Col md={6} className="mb-3">
                      <Form.Label className="small fw-bold">Max Strength</Form.Label>
                      <Form.Control type="number" value={formData.maxStrength} onChange={(e) => setFormData({...formData, maxStrength: e.target.value})} />
                   </Col>
                   <Col md={6} className="mb-3">
                      <Form.Label className="small fw-bold">Status</Form.Label>
                      <Form.Select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Form.Select>
                   </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm bg-primary text-white mb-4">
            <Card.Body className="p-4 text-center">
              <h6 className="opacity-75 mb-1 small text-uppercase fw-bold">Enrollment Stats</h6>
              <div className="display-4 fw-bold">{enrolledStudents.length} / {batch.maxStrength}</div>
              <p className="mb-0 opacity-75 small">Total Students Matched</p>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center border-bottom">
              <span className="fw-bold">Enrolled Students</span>
              <Button variant="primary" size="sm" onClick={() => setShowEnrollModal(true)} disabled={enrolledStudents.length >= batch.maxStrength}>
                <FaPlus className="me-1" /> Enroll Student
              </Button>
            </Card.Header>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light text-secondary text-uppercase small fw-bold">
                  <tr>
                    <th className="ps-4">Student</th>
                    <th>Enrolment ID</th>
                    <th>Joined</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((es) => (
                    <tr key={es._id} className="align-middle">
                      <td className="ps-4">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-light p-2 rounded text-primary small fw-bold">
                            {es.studentId?.userId?.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="fw-bold small">{es.studentId?.userId?.name}</div>
                            <div className="text-muted extra-small">{es.studentId?.userId?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><code className="bg-light px-1 rounded small">{es.studentId?.enrolmentNumber}</code></td>
                      <td className="small text-muted">{new Date(es.joinedOn).toLocaleDateString()}</td>
                      <td className="text-end pe-4">
                        <Button variant="link" className="text-danger p-0" onClick={() => handleRemove(es.studentId._id)}>
                          <FaTrash size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {enrolledStudents.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-muted">
                        No students enrolled in this batch yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Enroll Modal */}
      <Modal show={showEnrollModal} onHide={() => setShowEnrollModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">Enroll Student in Batch</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form.Group className="mb-4">
            <Form.Label className="small fw-bold">Search Student (Name or ID)</Form.Label>
            <div className="position-relative">
              <Form.Control 
                placeholder="Type to search..." 
                value={studentSearch} 
                onChange={(e) => setStudentSearch(e.target.value)} 
              />
              <FaSearch className="position-absolute text-muted" style={{ right: '12px', top: '12px' }} />
            </div>
          </Form.Group>

          <h6 className="small fw-bold text-muted mb-3">Search Results</h6>
          <ListGroup variant="flush" className="border rounded">
            {foundStudents.map(student => (
              <ListGroup.Item 
                key={student._id} 
                className="d-flex justify-content-between align-items-center py-3"
                disabled={enrolledStudents.some(es => es.studentId._id === student._id)}
              >
                <div>
                  <div className="fw-bold small">{student.userId?.name}</div>
                  <div className="text-muted extra-small">{student.enrolmentNumber} • {student.schoolId?.schoolName}</div>
                </div>
                <Button 
                  variant={enrolledStudents.some(es => es.studentId._id === student._id) ? "outline-secondary" : "primary"} 
                  size="sm" 
                  className="rounded-pill px-3"
                  onClick={() => handleEnroll(student._id)}
                  disabled={enrolledStudents.some(es => es.studentId._id === student._id) || isEnrolling}
                >
                  {enrolledStudents.some(es => es.studentId._id === student._id) ? 'Enrolled' : 'Add'}
                </Button>
              </ListGroup.Item>
            ))}
            {studentSearch && foundStudents.length === 0 && (
              <ListGroup.Item className="text-center py-4 text-muted small">No students found.</ListGroup.Item>
            )}
            {!studentSearch && (
              <ListGroup.Item className="text-center py-4 text-muted small">Enter search term to find students.</ListGroup.Item>
            )}
          </ListGroup>
        </Modal.Body>
      </Modal>

      <style jsx>{`
        .extra-small { font-size: 0.75rem; }
      `}</style>
    </Container>
  );
}
