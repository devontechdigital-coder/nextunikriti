'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Modal, Table, Badge, Spinner, Alert, ButtonGroup } from 'react-bootstrap';
import { 
  useGetAdminClassSessionsQuery, 
  useCreateAdminClassSessionMutation, 
  useGetAdminBatchesQuery, 
  useGetAdminSchoolsQuery,
  useGetAdminBatchStudentsQuery,
  useGetAdminAttendanceQuery,
  useMarkAttendanceMutation
} from '@/redux/api/apiSlice';
import { FaPlus, FaCheckCircle, FaExclamationTriangle, FaCalendarAlt, FaUserGraduate, FaClipboardList, FaClock } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { usePathname } from 'next/navigation';

export default function AttendanceManagement() {
  const pathname = usePathname();
  const isSchoolAdminPath = pathname.startsWith('/school');
  const { user } = useSelector((state) => state.auth);
  const isInstructor = user?.role === 'instructor';
  const isSchoolAdmin = user?.role === 'school_admin' || isSchoolAdminPath;
  const schoolId = user?.schoolId || user?._id;

  const [filters, setFilters] = useState({ 
    schoolId: isSchoolAdmin ? schoolId : '', 
    batchId: '', 
    status: '' 
  });

  const { data: sessionsData, isLoading: isLoadingSessions, refetch: refetchSessions } = useGetAdminClassSessionsQuery(filters);
  const { data: schoolsData } = useGetAdminSchoolsQuery({}, { skip: isSchoolAdmin || isInstructor });
  const { data: batchesData } = useGetAdminBatchesQuery(isSchoolAdmin ? { schoolId } : {});
  
  const [createSession, { isLoading: isCreatingSession }] = useCreateAdminClassSessionMutation();
  const [markAttendance, { isLoading: isMarking }] = useMarkAttendanceMutation();

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]); // Array of { studentId, status, remarks }
  
  const [sessionFormData, setSessionFormData] = useState({
    batchId: '', classDate: new Date().toISOString().split('T')[0], topicTaught: '', notes: '', status: 'scheduled'
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch students for the selected session's batch
  const { data: batchStudentsData, isLoading: isLoadingStudents } = useGetAdminBatchStudentsQuery(
    selectedSession?.batchId?._id || selectedSession?.batchId, 
    { skip: !selectedSession }
  );

  // Fetch existing attendance if any
  const { data: existingAttendanceData } = useGetAdminAttendanceQuery(
    { classSessionId: selectedSession?._id },
    { skip: !selectedSession }
  );

  const sessions = sessionsData?.sessions || [];
  const schools = schoolsData?.schools || [];
  const batches = batchesData?.batches || [];

  // Initialize attendance records when session is selected or students load
  useEffect(() => {
    if (selectedSession && batchStudentsData?.students) {
      const initialAttendance = batchStudentsData.students.map(bs => {
        const existing = existingAttendanceData?.attendance?.find(a => a.studentId?._id === bs.studentId?._id);
        return {
          studentId: bs.studentId?._id,
          studentName: bs.studentId?.userId?.name || 'Unknown',
          status: existing?.status || 'present',
          remarks: existing?.remarks || ''
        };
      });
      setAttendanceData(initialAttendance);
    }
  }, [selectedSession, batchStudentsData, existingAttendanceData]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await createSession(sessionFormData).unwrap();
      setSuccessMsg('Class session created successfully!');
      setShowSessionModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      refetchSessions();
    } catch (err) {
      setErrorMsg(err?.data?.error || 'Failed to create session');
    }
  };

  const handleUpdateStatus = (studentId, status) => {
    setAttendanceData(prev => prev.map(item => 
      item.studentId === studentId ? { ...item, status } : item
    ));
  };

  const handleSaveAttendance = async () => {
    try {
      await markAttendance({
        classSessionId: selectedSession._id,
        attendanceRecords: attendanceData
      }).unwrap();
      setSuccessMsg('Attendance saved successfully!');
      setShowMarkModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      refetchSessions();
    } catch (err) {
      alert(err?.data?.error || 'Failed to save attendance');
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark">Attendance Management</h2>
          <p className="text-muted">Track class sessions and student presence.</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={() => setShowSessionModal(true)}>
          <FaPlus /> Create Class Session
        </Button>
      </div>

      {successMsg && <Alert variant="success" className="shadow-sm border-0 mb-4 ls-tight"><FaCheckCircle className="me-2"/>{successMsg}</Alert>}
      {errorMsg && <Alert variant="danger" className="shadow-sm border-0 mb-4 ls-tight"><FaExclamationTriangle className="me-2"/>{errorMsg}</Alert>}

      {/* Filters */}
      <Card className="shadow-sm border-0 mb-4 bg-white border">
        <Card.Body>
          <Row className="g-3">
            {(!isSchoolAdminPath && !isInstructor) && (
              <Col md={3}>
                <Form.Label className="small fw-bold text-muted mb-1">School</Form.Label>
                <Form.Select value={filters.schoolId} onChange={(e) => setFilters({...filters, schoolId: e.target.value})}>
                  <option value="">All Schools</option>
                  {schools.map(s => <option key={s._id} value={s._id}>{s.schoolName}</option>)}
                </Form.Select>
              </Col>
            )}
            <Col md={(isSchoolAdminPath || isInstructor) ? 6 : 3}>
              <Form.Label className="small fw-bold text-muted mb-1">Batch</Form.Label>
              <Form.Select value={filters.batchId} onChange={(e) => setFilters({...filters, batchId: e.target.value})}>
                <option value="">All Batches</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
              </Form.Select>
            </Col>
            <Col md={(isSchoolAdminPath || isInstructor) ? 6 : 3}>
              <Form.Label className="small fw-bold text-muted mb-1">Status</Form.Label>
              <Form.Select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Col>
            {(!isSchoolAdminPath && !isInstructor) && (
              <Col md={3} className="d-flex align-items-end">
                <Button variant="outline-secondary" className="w-100" onClick={() => setFilters({ schoolId: '', batchId: '', status: '' })}>Clear</Button>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Sessions Table */}
      <Card className="shadow-sm border-0 overflow-hidden border">
        {isLoadingSessions ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2 text-muted">Loading sessions...</p></div>
        ) : (
          <Table hover responsive className="mb-0 align-middle">
            <thead className="bg-light text-secondary text-uppercase extra-small fw-bold">
              <tr>
                <th className="ps-4">Date & Session</th>
                <th>Batch</th>
                <th>Instructor</th>
                <th>Topic</th>
                <th>Status</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(session => (
                <tr key={session._id}>
                  <td className="ps-4">
                    <div className="fw-bold">{new Date(session.classDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <small className="text-muted"><FaClock size={10} className="me-1" /> {new Date(session.classDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                  </td>
                  <td>
                    <div className="fw-bold small">{session.batchId?.batchName}</div>
                    <div className="extra-small text-muted">{session.batchId?.programType} • {session.batchId?.instrument}</div>
                  </td>
                  <td><div className="small">{session.teacherId?.name}</div></td>
                  <td><div className="small text-truncate" style={{ maxWidth: '150px' }}>{session.topicTaught || '---'}</div></td>
                  <td>
                    <Badge bg={session.status === 'completed' ? 'success' : session.status === 'scheduled' ? 'primary' : 'danger'} pill className="px-3">
                      {session.status}
                    </Badge>
                  </td>
                  <td className="text-end pe-4">
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="rounded-pill px-3"
                      onClick={() => { setSelectedSession(session); setShowMarkModal(true); }}
                    >
                      {session.status === 'completed' ? 'View/Edit Attendance' : 'Mark Attendance'}
                    </Button>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && <tr><td colSpan={6} className="text-center py-5 text-muted">No sessions found.</td></tr>}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Create Session Modal */}
      <Modal show={showSessionModal} onHide={() => setShowSessionModal(false)} centered>
        <Modal.Header closeButton><Modal.Title className="fs-5 fw-bold">Create Class Session</Modal.Title></Modal.Header>
        <Form onSubmit={handleCreateSession}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Select Batch *</Form.Label>
              <Form.Select required value={sessionFormData.batchId} onChange={(e) => setSessionFormData({...sessionFormData, batchId: e.target.value})}>
                <option value="">-- Choose Batch --</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.batchName} ({b.teacherId?.name})</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Class Date & Time *</Form.Label>
              <Form.Control type="datetime-local" required value={sessionFormData.classDate} onChange={(e) => setSessionFormData({...sessionFormData, classDate: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Topic Taught</Form.Label>
              <Form.Control placeholder="e.g. Introduction to Major Scales" value={sessionFormData.topicTaught} onChange={(e) => setSessionFormData({...sessionFormData, topicTaught: e.target.value})} />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-bold">Internal Notes</Form.Label>
              <Form.Control as="textarea" rows={2} placeholder="Any specific observations..." value={sessionFormData.notes} onChange={(e) => setSessionFormData({...sessionFormData, notes: e.target.value})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="bg-light border-0 px-4">
             <Button variant="link" onClick={() => setShowSessionModal(false)} className="text-secondary text-decoration-none">Cancel</Button>
             <Button variant="primary" type="submit" disabled={isCreatingSession} className="px-4 shadow-sm rounded-pill">
                {isCreatingSession ? <Spinner size="sm" /> : 'Create Session'}
             </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Mark Attendance Modal */}
      <Modal show={showMarkModal} onHide={() => setShowMarkModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fs-5 fw-bold d-flex align-items-center gap-2">
            <FaClipboardList className="text-primary" /> Mark Attendance - {selectedSession?.batchId?.batchName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="p-3 bg-white border-bottom small d-flex justify-content-between">
             <span><strong>Date:</strong> {new Date(selectedSession?.classDate).toLocaleDateString()}</span>
             <span><strong>Topic:</strong> {selectedSession?.topicTaught || 'N/A'}</span>
          </div>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {isLoadingStudents ? (
              <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>
            ) : (
              <Table hover className="mb-0">
                <thead className="bg-light sticky-top" style={{ zIndex: 10 }}>
                  <tr className="extra-small text-muted text-uppercase fw-bold">
                    <th className="ps-4 py-2">Student</th>
                    <th className="py-2">Attendance Status</th>
                    <th className="py-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((record, idx) => (
                    <tr key={record.studentId} className="align-middle">
                      <td className="ps-4 py-3">
                        <div className="fw-bold small">{record.studentName}</div>
                      </td>
                      <td>
                        <ButtonGroup size="sm">
                          <Button 
                            variant={record.status === 'present' ? 'success' : 'outline-success'} 
                            onClick={() => handleUpdateStatus(record.studentId, 'present')}
                          >Present</Button>
                          <Button 
                            variant={record.status === 'absent' ? 'danger' : 'outline-danger'} 
                            onClick={() => handleUpdateStatus(record.studentId, 'absent')}
                          >Absent</Button>
                          <Button 
                            variant={record.status === 'late' ? 'warning' : 'outline-warning'} 
                            onClick={() => handleUpdateStatus(record.studentId, 'late')}
                          >Late</Button>
                        </ButtonGroup>
                      </td>
                      <td>
                        <Form.Control 
                          size="sm" 
                          placeholder="Note..." 
                          value={record.remarks} 
                          onChange={(e) => {
                            const newRecs = [...attendanceData];
                            newRecs[idx].remarks = e.target.value;
                            setAttendanceData(newRecs);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  {attendanceData.length === 0 && <tr><td colSpan={3} className="text-center py-4 text-muted small">No students enrolled in this batch.</td></tr>}
                </tbody>
              </Table>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light px-4 border-0">
          <Button variant="link" onClick={() => setShowMarkModal(false)} className="text-secondary text-decoration-none">Close</Button>
          <Button variant="primary" className="px-5 shadow-sm rounded-pill" onClick={handleSaveAttendance} disabled={isMarking || attendanceData.length === 0}>
            {isMarking ? <Spinner size="sm" /> : 'Save Attendance'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .extra-small { font-size: 0.7rem; }
        .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
      `}</style>
    </Container>
  );
}
