'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCertificates = async () => {
    try {
      const res = await axios.get('/api/student/certificates');
      if (res.data.success) {
        setCertificates(res.data.data);
      }
    } catch (err) {
      setError('Failed to load certificates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="py-5">
      <h2 className="fw-bold mb-4">My Certificates</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {certificates.length === 0 && !error ? (
        <Alert variant="info" className="text-center py-5 border-0 shadow-sm">
          <div className="mb-4">
            <i className="bi bi-patch-check text-muted" style={{ fontSize: '4rem' }}></i>
          </div>
          <h4 className="fw-bold">No certificates earned yet.</h4>
          <p className="text-muted mb-0">Complete your courses with 100% progress to earn your recognized certificates!</p>
        </Alert>
      ) : (
        <Row className="g-4">
          {certificates.map((cert) => (
            <Col md={6} lg={4} key={cert._id}>
              <Card className="h-100 shadow-sm border-0 bg-white">
                <div className="p-4 text-center border-bottom bg-light rounded-top">
                   <i className="bi bi-award text-warning fs-1"></i>
                </div>
                <Card.Body className="p-4">
                  <div className="small text-muted mb-1 text-uppercase fw-bold ls-1">Completion Certificate</div>
                  <h5 className="fw-bold mb-3">{cert.courseId.title}</h5>
                  <div className="small text-muted mb-4">Issued on: {new Date(cert.issueDate).toLocaleDateString()}</div>
                  <Button 
                    href={cert.certificateUrl} 
                    target="_blank" 
                    variant="outline-primary" 
                    className="w-100 fw-bold border-2"
                  >
                    Download PDF
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}
