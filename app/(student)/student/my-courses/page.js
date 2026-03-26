'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, ProgressBar, Spinner, Alert, Button, Badge } from 'react-bootstrap';
import Link from 'next/link';

export default function MyCoursesPage() {
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
      setError(err.response?.data?.error || 'Failed to load your courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="py-5">
      <h2 className="fw-bold mb-4">My Learning</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {enrollments.length === 0 && !error ? (
        <Alert variant="info" className="text-center py-5 shadow-sm border-0">
          <h4 className="fw-bold">You haven&apos;t enrolled in any courses yet.</h4>
          <p className="text-muted mb-4">Explore our catalog and start learning today!</p>
          <Link href="/courses">
            <Button variant="primary" className="fw-bold px-4">Browse Courses</Button>
          </Link>
        </Alert>
      ) : (
        <Row className="g-4">
          {enrollments.map((enrollment) => {
            const course = enrollment.courseId;
            return (
              <Col md={6} lg={4} key={enrollment._id}>
                <Card className="h-100 shadow-sm border-0 transition-all hover-lift">
                  <div style={{ height: '160px', backgroundColor: '#e9ecef', overflow: 'hidden' }} className="rounded-top">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-100 h-100 object-fit-cover" />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100 text-muted">Course Thumbnail</div>
                    )}
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <div className="text-muted small mb-1">
                      {course.category} {enrollment.packageId && <Badge bg="light" text="dark" className="ms-1 border">{enrollment.packageId.name}</Badge>}
                    </div>
                    <Card.Title className="fw-bold text-truncate mb-3">{course.title}</Card.Title>
                    
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-bold">{enrollment.progress}% Complete</span>
                      </div>
                      <ProgressBar now={enrollment.progress} variant="primary" style={{ height: '6px' }} className="mb-3" />
                      
                      <Link href={`/student/learning/${course._id}`} className="btn btn-dark w-100 fw-bold">
                        {enrollment.progress === 0 ? 'Start Course' : 'Continue Learning'}
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <style jsx>{`
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </Container>
  );
}
