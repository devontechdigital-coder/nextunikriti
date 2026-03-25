'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Alert, Table, Badge } from 'react-bootstrap';

export default function InstructorAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/api/instructor/analytics');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

  if (!data) {
    return (
      <Container className="py-5">
        <h2 className="fw-bold mb-4">Detailed Analytics</h2>
        {error ? <Alert variant="danger">{error}</Alert> : <Alert variant="info">No analytics data available.</Alert>}
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="fw-bold mb-4">Detailed Analytics</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-5 g-4">
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
             <Card.Header className="bg-white py-3 border-0">
                <h5 className="fw-bold m-0">Enrollment Trends (Last 30 Days)</h5>
             </Card.Header>
             <Card.Body className="p-4 bg-light text-center">
                {/* Mock Chart Area */}
                <div style={{ height: '200px' }} className="d-flex align-items-end justify-content-between px-lg-5">
                   {data.trends.length > 0 ? data.trends.map((t, i) => (
                     <div key={i} className="bg-primary flex-grow-1 mx-1 rounded-top" style={{ height: `${(t.count / 10) * 100}%`, minWidth: '10px' }} title={`${t._id}: ${t.count}`}></div>
                   )) : (
                     <div className="w-100 py-5 text-muted small">No recent enrollment trends data</div>
                   )}
                </div>
                <div className="mt-3 small text-muted">Daily enrollment count visual representative</div>
             </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white py-3 border-0">
               <h5 className="fw-bold m-0">Course Content & Engagement Breakdown</h5>
            </Card.Header>
            <Card.Body className="p-0">
               <Table hover responsive className="mb-0">
                  <thead className="bg-light">
                     <tr>
                        <th className="ps-4">Course</th>
                        <th>Students</th>
                        <th>Revenue</th>
                        <th>Completion Rate</th>
                        <th className="pe-4">Rating</th>
                     </tr>
                  </thead>
                  <tbody>
                     {data.courseStats.map((course, idx) => (
                       <tr key={idx}>
                          <td className="ps-4 fw-semibold">{course.title}</td>
                          <td>{course.enrollments}</td>
                          <td>${course.revenue.toFixed(2)}</td>
                          <td><Badge bg="info">Coming Soon</Badge></td>
                          <td className="pe-4 text-warning">
                             <i className="bi bi-star-fill"></i> 4.9
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
