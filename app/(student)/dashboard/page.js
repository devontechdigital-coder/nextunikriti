'use client';
import { Card, ProgressBar, Row, Col, Badge } from 'react-bootstrap';
import Link from 'next/link';

export default function StudentDashboard() {
  const enrolledCourses = [
    { _id: 1, title: 'The Complete Next.js 14 Bootcamp', progress: 45, instructor: 'Maximilian Schwarzmüller', nextLesson: 'Server Actions' },
    { _id: 2, title: 'Machine Learning A-Z', progress: 12, instructor: 'Kirill Eremenko', nextLesson: 'Data Preprocessing' }
  ];

  return (
    <div>
      <h3 className="fw-bold mb-4">My Learning</h3>
      
      <Row className="g-4">
        {enrolledCourses.map(course => (
          <Col lg={4} md={6} key={course._id}>
            <Card className="shadow-sm border-0 h-100 course-card">
              <Card.Body className="d-flex flex-column">
                <Card.Title className="fw-bold fs-5">{course.title}</Card.Title>
                <Card.Text className="text-muted small mb-3">{course.instructor}</Card.Text>
                
                <div className="mt-auto">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="small text-muted">{course.progress}% Complete</span>
                  </div>
                  <ProgressBar variant="primary" now={course.progress} className="mb-3" style={{ height: '6px' }} />
                  
                  <Link href={`/learn/${course._id}`} className="btn btn-outline-primary w-100 fw-bold">
                    Resume: {course.nextLesson}
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
