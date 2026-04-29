'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Card, Col, Container, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardList,
  FaClock,
  FaExclamationTriangle,
  FaListUl,
  FaPlus,
} from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  useCreateAdminClassSessionMutation,
  useGetAdminAttendanceQuery,
  useGetAdminBatchesQuery,
  useGetAdminBatchStudentsQuery,
  useGetAdminClassSessionsQuery,
  useGetAdminSchoolsQuery,
  useMarkAttendanceMutation,
} from '@/redux/api/apiSlice';

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
    status: '',
  });
  const [viewMode, setViewMode] = useState('calendar');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showDateSessionsModal, setShowDateSessionsModal] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [calendarDate, setCalendarDate] = useState(() => formatDateKey(new Date()));
  const [calendarFormData, setCalendarFormData] = useState({
    schoolId: isSchoolAdmin ? schoolId : '',
    batchId: '',
  });
  const [sessionFormData, setSessionFormData] = useState({
    batchId: '',
    classDate: formatDateTimeInput(new Date()),
    topicTaught: '',
    notes: '',
    status: 'scheduled',
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: sessionsData, isLoading: isLoadingSessions, refetch: refetchSessions } = useGetAdminClassSessionsQuery(filters);
  const { data: schoolsData } = useGetAdminSchoolsQuery({}, { skip: isSchoolAdmin || isInstructor });
  const { data: batchesData } = useGetAdminBatchesQuery(isSchoolAdmin ? { schoolId } : {});
  const [createSession, { isLoading: isCreatingSession }] = useCreateAdminClassSessionMutation();
  const [markAttendance, { isLoading: isMarking }] = useMarkAttendanceMutation();

  const { data: batchStudentsData, isLoading: isLoadingStudents } = useGetAdminBatchStudentsQuery(
    selectedSession?.batchId?._id || selectedSession?.batchId,
    { skip: !selectedSession }
  );
  const { data: existingAttendanceData } = useGetAdminAttendanceQuery(
    { classSessionId: selectedSession?._id },
    { skip: !selectedSession }
  );

  const sessions = useMemo(() => sessionsData?.sessions || [], [sessionsData?.sessions]);
  const schools = schoolsData?.schools || [];
  const batches = useMemo(() => batchesData?.batches || [], [batchesData?.batches]);
  const todayKey = formatDateKey(new Date());
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const calendarMonthLabel = calendarMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const sessionsByDate = useMemo(() => {
    return sessions.reduce((acc, session) => {
      const dateKey = formatDateKey(session.classDate);
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(session);
      return acc;
    }, {});
  }, [sessions]);
  const selectedDateSessions = useMemo(() => {
    return sessions.filter((session) => formatDateKey(session.classDate) === calendarDate);
  }, [calendarDate, sessions]);
  const selectedPastAttendanceSessions = useMemo(() => {
    return selectedDateSessions.filter((session) => session.status === 'completed');
  }, [selectedDateSessions]);
  const calendarBatches = useMemo(() => {
    if (isSchoolAdmin || isInstructor || !calendarFormData.schoolId) return batches;
    return batches.filter((batch) => (batch.schoolId?._id || batch.schoolId || '').toString() === calendarFormData.schoolId);
  }, [batches, calendarFormData.schoolId, isInstructor, isSchoolAdmin]);

  useEffect(() => {
    if (selectedSession && batchStudentsData?.students) {
      const initialAttendance = batchStudentsData.students.map((batchStudent) => {
        const existing = existingAttendanceData?.attendance?.find(
          (record) => record.studentId?._id === batchStudent.studentId?._id
        );
        return {
          studentId: batchStudent.studentId?._id,
          studentName: batchStudent.studentId?.userId?.name || 'Unknown',
          status: existing?.status || '',
          remarks: existing?.remarks || '',
        };
      });
      setAttendanceData(initialAttendance);
    }
  }, [selectedSession, batchStudentsData, existingAttendanceData]);

  const handleCreateSession = async (event) => {
    event.preventDefault();
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

  const handleCalendarDateChange = (dateKey) => {
    setCalendarDate(dateKey);
    setCalendarFormData({
      schoolId: isSchoolAdmin ? schoolId : (filters.schoolId || ''),
      batchId: '',
    });

    if (dateKey < todayKey) {
      setShowDateSessionsModal(true);
      return;
    }

    setShowCalendarModal(true);
  };

  const handleTodayClick = () => {
    const now = new Date();
    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    handleCalendarDateChange(formatDateKey(now));
  };

  const handleOpenDateAttendance = async (event) => {
    event.preventDefault();
    try {
      const response = await createSession({
        batchId: calendarFormData.batchId,
        classDate: `${calendarDate}T09:00`,
        topicTaught: '',
        notes: '',
        status: 'scheduled',
      }).unwrap();

      setSelectedSession(response.session);
      setShowCalendarModal(false);
      setShowMarkModal(true);
      refetchSessions();
    } catch (err) {
      setErrorMsg(err?.data?.error || 'Failed to open attendance for this date');
    }
  };

  const handleOpenExistingSession = (session) => {
    setSelectedSession(session);
    setShowDateSessionsModal(false);
    setShowMarkModal(true);
  };

  const handleUpdateStatus = (studentId, status) => {
    setAttendanceData((prev) => prev.map((item) => (
      item.studentId === studentId ? { ...item, status } : item
    )));
  };

  const handleSaveAttendance = async () => {
    try {
      const hasUnmarkedStudents = attendanceData.some((record) => !record.status);
      if (hasUnmarkedStudents) {
        setErrorMsg('Please select Present, Absent, or Late for every student before saving.');
        return;
      }

      await markAttendance({
        classSessionId: selectedSession._id,
        attendanceRecords: attendanceData,
      }).unwrap();
      setSuccessMsg('Attendance saved successfully!');
      setShowMarkModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      refetchSessions();
    } catch (err) {
      setErrorMsg(err?.data?.error || 'Failed to save attendance');
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark">Attendance Management</h2>
          <p className="text-muted">Track class sessions and student presence.</p>
        </div>
        {/* <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={() => setShowSessionModal(true)}>
          <FaPlus /> Create Class Session
        </Button> */}
      </div>

      {successMsg && <Alert variant="success" className="shadow-sm border-0 mb-4"><FaCheckCircle className="me-2" />{successMsg}</Alert>}
      {errorMsg && <Alert variant="danger" className="shadow-sm border-0 mb-4"><FaExclamationTriangle className="me-2" />{errorMsg}</Alert>}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <ButtonGroup aria-label="Attendance view">
          <Button variant={viewMode === 'calendar' ? 'primary' : 'outline-primary'} className="d-flex align-items-center gap-2" onClick={() => setViewMode('calendar')}>
            <FaCalendarAlt /> Calendar View
          </Button>
          <Button variant={viewMode === 'list' ? 'primary' : 'outline-primary'} className="d-flex align-items-center gap-2" onClick={() => setViewMode('list')}>
            <FaListUl /> List View
          </Button>
        </ButtonGroup>
        <Button variant="outline-secondary" className="d-flex align-items-center gap-2" onClick={handleTodayClick}>
          <FaCalendarAlt /> Today
        </Button>
      </div>

      {viewMode === 'calendar' ? (
        <Card className="shadow-sm border-0 overflow-hidden mb-4">
          <Card.Header className="bg-white border-0 p-3 p-md-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <h5 className="fw-bold mb-1">{calendarMonthLabel}</h5>
                <div className="small text-muted">Click today to mark attendance. Click a past date to view saved attendance.</div>
              </div>
              <ButtonGroup>
                <Button variant="outline-secondary" aria-label="Previous month" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                  <FaChevronLeft />
                </Button>
                <Button variant="outline-secondary" aria-label="Next month" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                  <FaChevronRight />
                </Button>
              </ButtonGroup>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {isLoadingSessions ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2 text-muted">Loading calendar...</p></div>
            ) : (
              <div className="attendance-calendar">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="calendar-weekday">{day}</div>
                ))}
                {calendarDays.map((day) => {
                  const dateSessions = sessionsByDate[day.key] || [];
                  const isToday = day.key === todayKey;
                  const isPast = day.key < todayKey;

                  return (
                    <button
                      type="button"
                      key={day.key}
                      className={`calendar-day ${day.inMonth ? '' : 'muted'} ${isToday ? 'today' : ''}`}
                      onClick={() => handleCalendarDateChange(day.key)}
                    >
                      <span className="date-number">{day.date.getDate()}</span>
                      {isToday && <Badge bg="primary" className="today-badge">Today</Badge>}
                      {dateSessions.length > 0 && (
                        <span className="session-summary">
                          <FaClipboardList /> {dateSessions.length} session{dateSessions.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {isPast && dateSessions.some((session) => session.status === 'completed') && (
                        <span className="attendance-done">Attendance saved</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </Card>
      ) : (
        <>
          <AttendanceFilters
            batches={batches}
            filters={filters}
            isInstructor={isInstructor}
            isSchoolAdminPath={isSchoolAdminPath}
            schools={schools}
            setFilters={setFilters}
          />
          <SessionsTable
            isLoading={isLoadingSessions}
            sessions={sessions}
            onOpenSession={(session) => {
              setSelectedSession(session);
              setShowMarkModal(true);
            }}
          />
        </>
      )}

      <CreateSessionModal
        batches={batches}
        formData={sessionFormData}
        isCreating={isCreatingSession}
        onChange={setSessionFormData}
        onHide={() => setShowSessionModal(false)}
        onSubmit={handleCreateSession}
        show={showSessionModal}
      />

      <Modal show={showCalendarModal} onHide={() => setShowCalendarModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fs-5 fw-bold">Attendance for {formatDisplayDate(calendarDate)}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleOpenDateAttendance}>
          <Modal.Body className="p-4">
            {(!isSchoolAdmin && !isInstructor) && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">School *</Form.Label>
                <Form.Select
                  required
                  value={calendarFormData.schoolId}
                  onChange={(event) => setCalendarFormData({ schoolId: event.target.value, batchId: '' })}
                >
                  <option value="">-- Choose School --</option>
                  {schools.map((school) => <option key={school._id} value={school._id}>{school.schoolName}</option>)}
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group>
              <Form.Label className="small fw-bold">Batch *</Form.Label>
              <Form.Select
                required
                value={calendarFormData.batchId}
                onChange={(event) => setCalendarFormData({ ...calendarFormData, batchId: event.target.value })}
                disabled={!isSchoolAdmin && !isInstructor && !calendarFormData.schoolId}
              >
                <option value="">-- Choose Batch --</option>
                {calendarBatches.map((batch) => (
                  <option key={batch._id} value={batch._id}>{batch.batchName} ({batch.teacherId?.name || 'No teacher'})</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="bg-light border-0 px-4">
            <Button variant="link" onClick={() => setShowCalendarModal(false)} className="text-secondary text-decoration-none">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreatingSession} className="px-4 shadow-sm rounded-pill">
              {isCreatingSession ? <Spinner size="sm" /> : 'Show Students'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <PastDateSessionsModal
        dateKey={calendarDate}
        sessions={selectedPastAttendanceSessions}
        show={showDateSessionsModal}
        onHide={() => setShowDateSessionsModal(false)}
        onOpenSession={handleOpenExistingSession}
      />

      <MarkAttendanceModal
        attendanceData={attendanceData}
        isLoadingStudents={isLoadingStudents}
        isMarking={isMarking}
        onHide={() => setShowMarkModal(false)}
        onSave={handleSaveAttendance}
        onUpdateRecord={(index, remarks) => {
          const nextRecords = [...attendanceData];
          nextRecords[index].remarks = remarks;
          setAttendanceData(nextRecords);
        }}
        onUpdateStatus={handleUpdateStatus}
        selectedSession={selectedSession}
        show={showMarkModal}
      />

      <style jsx>{`
        .extra-small { font-size: 0.7rem; }
        .attendance-calendar {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          border-top: 1px solid #e9ecef;
          border-left: 1px solid #e9ecef;
        }
        .calendar-weekday {
          padding: 0.75rem;
          font-size: 0.72rem;
          font-weight: 700;
          color: #6c757d;
          text-transform: uppercase;
          background: #f8f9fa;
          border-right: 1px solid #e9ecef;
          border-bottom: 1px solid #e9ecef;
        }
        .calendar-day {
          position: relative;
          min-height: 118px;
          padding: 0.75rem;
          background: #fff;
          border: 0;
          border-right: 1px solid #e9ecef;
          border-bottom: 1px solid #e9ecef;
          text-align: left;
          transition: background-color 0.15s ease, box-shadow 0.15s ease;
        }
        .calendar-day:hover {
          background: #f7fbff;
          box-shadow: inset 0 0 0 2px rgba(13, 110, 253, 0.18);
        }
        .calendar-day.muted {
          color: #adb5bd;
          background: #fbfbfc;
        }
        .calendar-day.today {
          background: #eef5ff;
          box-shadow: inset 0 0 0 2px #0d6efd;
        }
        .date-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-weight: 700;
        }
        .today-badge {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
        }
        .session-summary,
        .attendance-done {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          width: 100%;
          margin-top: 0.65rem;
          font-size: 0.76rem;
          color: #495057;
        }
        .attendance-done {
          color: #198754;
          font-weight: 700;
        }
        @media (max-width: 767.98px) {
          .calendar-weekday {
            padding: 0.5rem 0.35rem;
            text-align: center;
          }
          .calendar-day {
            min-height: 88px;
            padding: 0.5rem;
          }
          .today-badge,
          .attendance-done {
            display: none;
          }
          .session-summary {
            font-size: 0.68rem;
          }
        }
      `}</style>
    </Container>
  );
}

function AttendanceFilters({ batches, filters, isInstructor, isSchoolAdminPath, schools, setFilters }) {
  return (
    <Card className="shadow-sm border-0 mb-4 bg-white border">
      <Card.Body>
        <Row className="g-3">
          {(!isSchoolAdminPath && !isInstructor) && (
            <Col md={3}>
              <Form.Label className="small fw-bold text-muted mb-1">School</Form.Label>
              <Form.Select value={filters.schoolId} onChange={(event) => setFilters({ ...filters, schoolId: event.target.value })}>
                <option value="">All Schools</option>
                {schools.map((school) => <option key={school._id} value={school._id}>{school.schoolName}</option>)}
              </Form.Select>
            </Col>
          )}
          <Col md={(isSchoolAdminPath || isInstructor) ? 6 : 3}>
            <Form.Label className="small fw-bold text-muted mb-1">Batch</Form.Label>
            <Form.Select value={filters.batchId} onChange={(event) => setFilters({ ...filters, batchId: event.target.value })}>
              <option value="">All Batches</option>
              {batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.batchName}</option>)}
            </Form.Select>
          </Col>
          <Col md={(isSchoolAdminPath || isInstructor) ? 6 : 3}>
            <Form.Label className="small fw-bold text-muted mb-1">Status</Form.Label>
            <Form.Select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
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
  );
}

function SessionsTable({ isLoading, sessions, onOpenSession }) {
  return (
    <Card className="shadow-sm border-0 overflow-hidden border">
      {isLoading ? (
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
            {sessions.map((session) => (
              <tr key={session._id}>
                <td className="ps-4">
                  <div className="fw-bold">{formatDisplayDate(formatDateKey(session.classDate))}</div>
                  <small className="text-muted"><FaClock size={10} className="me-1" /> {formatTime(session.classDate)}</small>
                </td>
                <td>
                  <div className="fw-bold small">{session.batchId?.batchName}</div>
                  <div className="extra-small text-muted">{formatBatchMeta(session.batchId)}</div>
                </td>
                <td><div className="small">{session.teacherId?.name}</div></td>
                <td><div className="small text-truncate" style={{ maxWidth: '150px' }}>{session.topicTaught || '---'}</div></td>
                <td>
                  <Badge bg={session.status === 'completed' ? 'success' : session.status === 'scheduled' ? 'primary' : 'danger'} pill className="px-3">
                    {session.status}
                  </Badge>
                </td>
                <td className="text-end pe-4">
                  <Button variant="outline-primary" size="sm" className="rounded-pill px-3" onClick={() => onOpenSession(session)}>
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
  );
}

function CreateSessionModal({ batches, formData, isCreating, onChange, onHide, onSubmit, show }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton><Modal.Title className="fs-5 fw-bold">Create Class Session</Modal.Title></Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body className="p-4">
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Select Batch *</Form.Label>
            <Form.Select required value={formData.batchId} onChange={(event) => onChange({ ...formData, batchId: event.target.value })}>
              <option value="">-- Choose Batch --</option>
              {batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.batchName} ({batch.teacherId?.name})</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Class Date & Time *</Form.Label>
            <Form.Control type="datetime-local" required value={formData.classDate} onChange={(event) => onChange({ ...formData, classDate: event.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Topic Taught</Form.Label>
            <Form.Control placeholder="e.g. Introduction to Major Scales" value={formData.topicTaught} onChange={(event) => onChange({ ...formData, topicTaught: event.target.value })} />
          </Form.Group>
          <Form.Group>
            <Form.Label className="small fw-bold">Internal Notes</Form.Label>
            <Form.Control as="textarea" rows={2} placeholder="Any specific observations..." value={formData.notes} onChange={(event) => onChange({ ...formData, notes: event.target.value })} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="bg-light border-0 px-4">
          <Button variant="link" onClick={onHide} className="text-secondary text-decoration-none">Cancel</Button>
          <Button variant="primary" type="submit" disabled={isCreating} className="px-4 shadow-sm rounded-pill">
            {isCreating ? <Spinner size="sm" /> : 'Create Session'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

function PastDateSessionsModal({ dateKey, sessions, show, onHide, onOpenSession }) {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="fs-5 fw-bold">Attendance on {formatDisplayDate(dateKey)}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        {sessions.length > 0 ? (
          <Table hover responsive className="mb-0 align-middle">
            <thead className="bg-light text-secondary text-uppercase extra-small fw-bold">
              <tr>
                <th className="ps-4">Batch</th>
                <th>School</th>
                <th>Instructor</th>
                <th>Time</th>
                <th className="text-end pe-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session._id}>
                  <td className="ps-4">
                    <div className="fw-bold small">{session.batchId?.batchName}</div>
                    <div className="extra-small text-muted">{formatBatchMeta(session.batchId)}</div>
                  </td>
                  <td><span className="small">{session.schoolId?.schoolName || 'School'}</span></td>
                  <td><span className="small">{session.teacherId?.name || 'Teacher'}</span></td>
                  <td><span className="small"><FaClock size={10} className="me-1" /> {formatTime(session.classDate)}</span></td>
                  <td className="text-end pe-4">
                    <Button variant="outline-primary" size="sm" className="rounded-pill px-3" onClick={() => onOpenSession(session)}>
                      View Students
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="text-center py-5 px-4">
            <FaClipboardList className="text-muted mb-3" size={28} />
            <h6 className="fw-bold mb-1">No attendance found</h6>
            <p className="small text-muted mb-0">No completed attendance sessions were found for this date.</p>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-light border-0 px-4">
        <Button variant="link" onClick={onHide} className="text-secondary text-decoration-none">Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

function MarkAttendanceModal({ attendanceData, isLoadingStudents, isMarking, onHide, onSave, onUpdateRecord, onUpdateStatus, selectedSession, show }) {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="fs-5 fw-bold d-flex align-items-center gap-2">
          <FaClipboardList className="text-primary" /> Mark Attendance - {selectedSession?.batchId?.batchName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div className="p-3 bg-white border-bottom small d-flex justify-content-between">
          <span><strong>Date:</strong> {selectedSession?.classDate ? formatDisplayDate(formatDateKey(selectedSession.classDate)) : 'N/A'}</span>
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
                {attendanceData.map((record, index) => (
                  <tr key={record.studentId} className="align-middle">
                    <td className="ps-4 py-3">
                      <div className="fw-bold small">{record.studentName}</div>
                    </td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button variant={record.status === 'present' ? 'success' : 'outline-success'} onClick={() => onUpdateStatus(record.studentId, 'present')}>Present</Button>
                        <Button variant={record.status === 'absent' ? 'danger' : 'outline-danger'} onClick={() => onUpdateStatus(record.studentId, 'absent')}>Absent</Button>
                        <Button variant={record.status === 'late' ? 'warning' : 'outline-warning'} onClick={() => onUpdateStatus(record.studentId, 'late')}>Late</Button>
                      </ButtonGroup>
                      {!record.status && <div className="extra-small text-muted mt-1">Select status</div>}
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        placeholder="Note..."
                        value={record.remarks}
                        onChange={(event) => onUpdateRecord(index, event.target.value)}
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
        <Button variant="link" onClick={onHide} className="text-secondary text-decoration-none">Close</Button>
        <Button variant="primary" className="px-5 shadow-sm rounded-pill" onClick={onSave} disabled={isMarking || attendanceData.length === 0}>
          {isMarking ? <Spinner size="sm" /> : 'Save Attendance'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return {
      date,
      key: formatDateKey(date),
      inMonth: date.getMonth() === month,
    };
  });
}

function formatDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTimeInput(value) {
  const date = value instanceof Date ? value : new Date(value);
  const dateKey = formatDateKey(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dateKey}T${hours}:${minutes}`;
}

function formatDisplayDate(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatBatchMeta(batch) {
  const parts = [batch?.programType, batch?.instrument].filter(Boolean);
  return parts.length ? parts.join(' | ') : 'Batch details';
}
