'use client';

import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Modal, ProgressBar, Row, Spinner, Table } from 'react-bootstrap';
import axios from 'axios';
import { FaCalendarAlt, FaChalkboardTeacher, FaCheckCircle, FaClipboardList, FaUsers } from 'react-icons/fa';

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function StudentBatchesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await axios.get('/api/student/batches');
        if (res.data.success) setCourses(res.data.data);
      } catch (err) {
        setError('Failed to load batches. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  if (loading) {
    return <div className="py-5 text-center"><Spinner animation="border" variant="primary" /></div>;
  }

  const batches = courses;
  const totalClassesLeft = batches.reduce((sum, batch) => sum + Number(batch.classes_left || 0), 0);
  const totalCompletedClasses = batches.reduce((sum, batch) => sum + Number(batch.completed_classes || 0), 0);
  const averageAttendance = batches.length
    ? Math.round(batches.reduce((sum, batch) => sum + Number(batch.attendance?.percentage || 0), 0) / batches.length)
    : 0;

  return (
    <div className="py-2">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">My Batches</h2>
        <p className="text-muted mb-0">View your assigned batches, class balance, and attendance.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3 mb-4">
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <div className="small text-uppercase text-muted fw-bold mb-2">Active Batches</div>
              <div className="display-6 fw-bold">{batches.length}</div>
              <div className="small text-muted">Assigned learning batches.</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <div className="small text-uppercase text-muted fw-bold mb-2">Classes Left</div>
              <div className="display-6 fw-bold">{totalClassesLeft}</div>
              <div className="small text-muted">Remaining classes across batches.</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <div className="small text-uppercase text-muted fw-bold mb-2">Completed Classes</div>
              <div className="display-6 fw-bold">{totalCompletedClasses}</div>
              <div className="small text-muted">Classes already completed.</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <div className="small text-uppercase text-muted fw-bold mb-2">Avg Attendance</div>
              <div className="display-6 fw-bold">{averageAttendance}%</div>
              <div className="small text-muted">Across all active batches.</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {batches.length === 0 ? (
        <Card className="text-center p-5 border-dashed bg-light rounded-4">
          <Card.Body>
            <div className="mb-3 text-muted"><FaUsers size={48} className="opacity-25" /></div>
            <h5 className="fw-bold text-dark">No Active Batches</h5>
            <p className="text-muted small mb-0">Your batch details will appear here once your enrollment is assigned to a batch.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {batches.map((batch) => (
            <Col lg={4} md={6} key={batch.batch_id}>
              <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden">
                <Card.Body className="p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">{batch.batch_name}</h6>
                      <div className="small text-muted">
                        {[batch.batch_instrument, batch.batch_level].filter(Boolean).join(' - ') || 'Batch details'}
                      </div>
                    </div>
                    <Badge bg={batch.batch_student_status === 'active' ? 'success' : 'secondary'} className="rounded-pill px-3">
                      {batch.batch_student_status || 'assigned'}
                    </Badge>
                  </div>

                  <div className="p-3 bg-light rounded-3 mb-3">
                    <div className="d-flex justify-content-between small mb-2">
                      <span className="text-muted">Classes left</span>
                      <span className="fw-bold">{batch.classes_left ?? 0}</span>
                    </div>
                    <div className="d-flex justify-content-between small mb-2">
                      <span className="text-muted">Completed classes</span>
                      <span className="fw-bold">{batch.completed_classes ?? 0}</span>
                    </div>
                    <div className="d-flex justify-content-between small">
                      <span className="text-muted">Total classes</span>
                      <span className="fw-bold">{batch.total_classes ?? 0}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="fw-bold text-muted">Attendance</span>
                      <span className="fw-bold text-primary">{batch.attendance?.percentage ?? 0}%</span>
                    </div>
                    <ProgressBar now={batch.attendance?.percentage ?? 0} variant="success" className="mb-2" style={{ height: '6px' }} />
                    <div className="extra-small text-muted">
                      Present {batch.attendance?.present ?? 0}, Late {batch.attendance?.late ?? 0}, Absent {batch.attendance?.absent ?? 0}
                    </div>
                  </div>

                  <Button
                    variant="outline-primary"
                    className="rounded-pill fw-bold mb-3 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => setSelectedBatch(batch)}
                  >
                    <FaClipboardList size={12} /> View Attendance
                  </Button>

                  <div className="small text-muted mb-2">
                    <FaCalendarAlt size={12} className="me-2" />
                    {formatDate(batch.batch_startDate)} to {formatDate(batch.batch_endDate)}
                  </div>
                  <div className="small text-muted mb-3">
                    <FaChalkboardTeacher size={12} className="me-2" />
                    {batch.scheduled_classes ?? 0} upcoming scheduled classes
                  </div>

                  <div className="mt-auto">
                    <div className="small fw-bold text-muted mb-2">
                      <FaCheckCircle size={12} className="me-2" />
                      Courses in this batch
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {batch.courses.length > 0 ? batch.courses.map((course) => (
                        <Badge key={course.course_id || course.enrollment_id} bg="light" text="dark" className="border rounded-pill px-3 py-2">
                          {course.course_title}
                        </Badge>
                      )) : (
                        <span className="small text-muted">No course assigned yet.</span>
                      )}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={Boolean(selectedBatch)} onHide={() => setSelectedBatch(null)} centered size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fs-5 fw-bold">
            Attendance - {selectedBatch?.batch_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedBatch?.attendance_records?.length > 0 ? (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-secondary text-uppercase extra-small fw-bold">
                <tr>
                  <th className="ps-4">Date</th>
                  {/* <th>Topic</th> */}
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {selectedBatch.attendance_records.map((record) => (
                  <tr key={record.session_id}>
                    <td className="ps-4">
                      <div className="fw-bold small">{formatDate(record.classDate)}</div>
                    </td>
                    {/* <td>
                      <div className="small">{record.topicTaught || 'N/A'}</div>
                    </td> */}
                    <td>
                      <Badge bg={getAttendanceVariant(record.status)} className="rounded-pill px-3">
                        {formatAttendanceStatus(record.status)}
                      </Badge>
                    </td>
                    <td>
                      <div className="small text-muted">{record.remarks || '-'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5 px-4">
              <FaClipboardList className="text-muted mb-3" size={28} />
              <h6 className="fw-bold mb-1">No attendance yet</h6>
              <p className="small text-muted mb-0">Completed class attendance for this batch will appear here.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light border-0 px-4">
          <Button variant="link" onClick={() => setSelectedBatch(null)} className="text-secondary text-decoration-none">Close</Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .border-dashed { border: 2px dashed #ccc !important; }
        .extra-small { font-size: 0.72rem; }
      `}</style>
    </div>
  );
}

function getAttendanceVariant(status) {
  if (status === 'present') return 'success';
  if (status === 'late') return 'warning';
  if (status === 'absent') return 'danger';
  return 'secondary';
}

function formatAttendanceStatus(status) {
  if (!status || status === 'not_marked') return 'Not marked';
  return status.charAt(0).toUpperCase() + status.slice(1);
}
