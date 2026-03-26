'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Container, Row, Col, Card, Alert, Spinner, Badge, ProgressBar, ListGroup } from 'react-bootstrap';
import { useGetStudentLmsProgressQuery } from '@/redux/api/apiSlice';
import { FaGraduationCap, FaCheckCircle, FaClock } from 'react-icons/fa';

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEnrollments = async () => {
    try {
      const res = await axios.get('/api/student/enrollments');
      if (res.data.success) {
        setEnrollments(res.data.data);
      }
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const { data: batchProgressData, isLoading: isLoadingBatchProgress } = useGetStudentLmsProgressQuery();

  useEffect(() => {
    fetchEnrollments();
  }, []);

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

  const activeCourses = enrollments.filter(e => !e.completed);
  const completedCourses = enrollments.filter(e => e.completed);

  return (
    <Container className="py-5">
      <h2 className="fw-bold mb-4">Welcome back!</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-5 g-4">
        <Col md={4}>
          <Card className="text-center h-100 border-0 shadow-sm py-4">
            <Card.Body>
              <h1 className="fw-bold text-primary mb-0">{enrollments.length}</h1>
              <div className="text-muted">Enrolled Courses</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100 border-0 shadow-sm py-4">
            <Card.Body>
              <h1 className="fw-bold text-success mb-0">{completedCourses.length}</h1>
              <div className="text-muted">Courses Completed</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100 border-0 shadow-sm py-4">
            <Card.Body>
              <h1 className="fw-bold text-warning mb-0">{activeCourses.length}</h1>
              <div className="text-muted">Courses in Progress</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* NEW: Batch Course Progress */}
      {batchProgressData?.success && batchProgressData.courseTitle && (
        <Card className="border-0 shadow-sm mb-5 overflow-hidden border">
          <Row className="g-0">
            <Col md={4} className="bg-primary bg-opacity-10 d-flex align-items-center justify-content-center p-4 text-center">
              <div>
                 <FaGraduationCap size={48} className="text-primary mb-2" />
                 <div className="fw-bold text-dark small">{batchProgressData.batchName}</div>
                 <Badge bg="primary" pill className="extra-small">Active Batch</Badge>
              </div>
            </Col>
            <Col md={8}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                   <h6 className="fw-bold mb-0">My Course: {batchProgressData.courseTitle}</h6>
                   <Badge bg="success" pill className="px-3 small">{batchProgressData.progressPercentage}%</Badge>
                </div>
                <ProgressBar now={batchProgressData.progressPercentage} variant="success" className="mb-3" style={{ height: '8px' }} />
                <div className="d-flex gap-4 extra-small text-muted">
                   <div className="d-flex align-items-center gap-1">
                      <FaCheckCircle className="text-success" /> {batchProgressData.completedLessonsCount} Lessons Done
                   </div>
                   <div className="d-flex align-items-center gap-1">
                      <FaClock className="text-warning" /> {batchProgressData.totalLessons - batchProgressData.completedLessonsCount} Left
                   </div>
                </div>
              </Card.Body>
            </Col>
          </Row>
        </Card>
      )}

      <Row>
        <Col lg={8}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold m-0">Continue Learning</h4>
            <Link href="/student/my-courses" className="text-decoration-none small fw-bold">View All</Link>
          </div>
          
          {activeCourses.length === 0 ? (
            <Alert variant="light" className="text-center py-5 border">
               <p className="text-muted mb-0">No active courses. Start a new one today!</p>
            </Alert>
          ) : (
            <div className="d-grid gap-3">
              {activeCourses.slice(0, 3).map(enrollment => (
                <Card key={enrollment._id} className="border-0 shadow-sm">
                  <Card.Body className="d-flex align-items-center p-3">
                    <div style={{ width: '80px', height: '60px', backgroundColor: '#e9ecef' }} className="rounded overflow-hidden me-3 flex-shrink-0">
                      {enrollment.courseId.thumbnail ? (
                        <img src={enrollment.courseId.thumbnail} alt="" className="w-100 h-100 object-fit-cover" />
                      ) : (
                        <div className="h-100 d-flex align-items-center justify-content-center text-muted"><i className="bi bi-book"></i></div>
                      )}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <h6 className="fw-bold mb-1 text-truncate">{enrollment.courseId.title}</h6>
                      <ProgressBar now={enrollment.progress} variant="primary" style={{ height: '4px' }} className="mt-2" />
                    </div>
                    <Link href={`/student/learning/${enrollment.courseId._id}`} className="ms-4 btn btn-sm btn-outline-dark fw-bold px-3">
                      Resume
                    </Link>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Col>
        
        <Col lg={4}>
           <h4 className="fw-bold mb-3">Recent Activity</h4>
           <Card className="border-0 shadow-sm">
              <ListGroup variant="flush">
                 {enrollments.slice(0, 5).map(e => (
                   <ListGroup.Item key={e._id} className="py-3 px-4 border-bottom-0">
                      <div className="small text-muted">{new Date(e.updatedAt).toLocaleDateString()}</div>
                      <div className="fw-bold small">{e.courseId.title.slice(0, 30)}...</div>
                      <Badge bg={e.completed ? "success" : "info"} className="mt-1">
                        {e.completed ? "Completed" : `${e.progress}% complete`}
                      </Badge>
                   </ListGroup.Item>
                 ))}
                 {enrollments.length === 0 && (
                   <ListGroup.Item className="text-center py-4 text-muted small">No activity yet</ListGroup.Item>
                 )}
              </ListGroup>
           </Card>
        </Col>
      </Row>
    </Container>
  );
}
