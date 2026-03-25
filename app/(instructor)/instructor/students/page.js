'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';

export default function MyStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/instructor/students');
      if (res.data.success) {
        setStudents(res.data.data);
      }
    } catch (err) {
      setError('Failed to load students list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="py-5">
      <h2 className="fw-bold mb-4">My Students</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white py-3 border-0 border-bottom">
           <h5 className="fw-bold m-0">Enrolled Students</h5>
        </Card.Header>
        <Card.Body className="p-0">
           <Table hover responsive className="mb-0">
              <thead className="bg-light">
                 <tr>
                    <th className="ps-4">Student</th>
                    <th>Enrolled In</th>
                    <th>Date Joined</th>
                    <th className="pe-4 text-end">Progress</th>
                 </tr>
              </thead>
              <tbody>
                 {students.map((enrollment, idx) => (
                   <tr key={idx}>
                      <td className="ps-4">
                         <div className="d-flex align-items-center">
                            <div style={{ width: '32px', height: '32px', backgroundColor: '#e9ecef' }} className="rounded-circle me-2 overflow-hidden flex-shrink-0">
                               {enrollment.userId?.avatar ? <img src={enrollment.userId.avatar} alt="" className="w-100 h-100" /> : <div className="h-100 d-flex align-items-center justify-content-center text-muted"><i className="bi bi-person"></i></div>}
                            </div>
                            <div>
                               <div className="fw-bold small">{enrollment.userId?.name || 'Anonymous'}</div>
                               <div className="text-muted" style={{ fontSize: '0.7rem' }}>{enrollment.userId?.email}</div>
                            </div>
                         </div>
                      </td>
                      <td className="small">{enrollment.courseId?.title}</td>
                      <td className="small">{new Date(enrollment.createdAt).toLocaleDateString()}</td>
                      <td className="pe-4 text-end">
                         <Badge bg={enrollment.progress === 100 ? "success" : "primary"}>
                            {enrollment.progress}%
                         </Badge>
                      </td>
                   </tr>
                 ))}
                 {students.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-5 text-muted">No students enrolled yet.</td></tr>
                 )}
              </tbody>
           </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}
