'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Alert, Table, Button, Modal, Form } from 'react-bootstrap';

export default function InstructorEarningsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEarnings = async () => {
    try {
      const res = await axios.get('/api/instructor/earnings');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError('Failed to load earnings data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post('/api/instructor/payouts', {
        amount: parseFloat(payoutAmount),
        paymentMethod: 'Bank Transfer' // Default for now
      });
      if (res.data.success) {
        alert('Payout request submitted successfully!');
        setShowPayoutModal(false);
        fetchEarnings();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit payout request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0">Earnings & Payouts</h2>
        <Button variant="success" className="fw-bold px-4" onClick={() => setShowPayoutModal(true)}>Request Payout</Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-4 mb-5">
        <Col md={4}>
          <Card className="border-0 shadow-sm text-center py-4 bg-primary text-white">
             <Card.Body>
                <div className="small opacity-75 fw-bold text-uppercase mb-1">Total Revenue</div>
                <h1 className="fw-bold mb-0">₹{data.totalRevenue.toFixed(2)}</h1>
             </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm text-center py-4 bg-success text-white">
             <Card.Body>
                <div className="small opacity-75 fw-bold text-uppercase mb-1">Total Withdrawn</div>
                <h1 className="fw-bold mb-0">₹{data.totalWithdrawn.toFixed(2)}</h1>
             </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm text-center py-4 bg-dark text-white">
             <Card.Body>
                <div className="small opacity-75 fw-bold text-uppercase mb-1">Available Balance</div>
                <h1 className="fw-bold mb-0">₹{data.balance.toFixed(2)}</h1>
             </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={12}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white py-3 border-0 border-bottom">
               <h5 className="fw-bold m-0">Recent Sales</h5>
            </Card.Header>
            <Card.Body className="p-0">
               <Table hover responsive className="mb-0">
                  <thead className="bg-light">
                     <tr>
                        <th className="ps-4">Date</th>
                        <th>Student</th>
                        <th>Course</th>
                        <th className="pe-4 text-end">Amount</th>
                     </tr>
                  </thead>
                  <tbody>
                     {data.sales.map((sale, idx) => (
                       <tr key={idx}>
                          <td className="ps-4 small">{new Date(sale.createdAt).toLocaleDateString()}</td>
                          <td>{sale.userId?.name || 'Unknown Student'}</td>
                          <td className="small">{sale.courseId?.title}</td>
                          <td className="pe-4 text-end fw-bold text-success">${sale.amount.toFixed(2)}</td>
                       </tr>
                     ))}
                     {data.sales.length === 0 && (
                        <tr><td colSpan="4" className="text-center py-4 text-muted">No sales yet.</td></tr>
                     )}
                  </tbody>
               </Table>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white py-3 border-0 border-bottom">
               <h5 className="fw-bold m-0">Payout History</h5>
            </Card.Header>
            <Card.Body className="p-0">
               <Table hover responsive className="mb-0">
                  <thead className="bg-light">
                     <tr>
                        <th className="ps-4">Requested On</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th className="pe-4 text-end">Processed at</th>
                     </tr>
                  </thead>
                  <tbody>
                     {data.payoutHistory.map((payout, idx) => (
                       <tr key={idx}>
                          <td className="ps-4 small">{new Date(payout.requestedAt).toLocaleDateString()}</td>
                          <td className="fw-bold">${payout.amount.toFixed(2)}</td>
                          <td>
                             <span className={`badge ${payout.status === 'completed' ? 'bg-success' : payout.status === 'rejected' ? 'bg-danger' : 'bg-warning'}`}>
                                {payout.status}
                             </span>
                          </td>
                          <td className="pe-4 text-end small">
                             {payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : '-'}
                          </td>
                       </tr>
                     ))}
                     {data.payoutHistory.length === 0 && (
                        <tr><td colSpan="4" className="text-center py-4 text-muted">No payout history.</td></tr>
                     )}
                  </tbody>
               </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Payout Request Modal */}
      <Modal show={showPayoutModal} onHide={() => setShowPayoutModal(false)} centered>
         <Modal.Header closeButton>
            <Modal.Title className="fw-bold">Request Payout</Modal.Title>
         </Modal.Header>
         <Form onSubmit={handleRequestPayout}>
            <Modal.Body>
               <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Available Balance: ${data.balance.toFixed(2)}</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01" 
                    placeholder="Enter amount to withdraw" 
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    required 
                    min="10"
                    max={data.balance}
                  />
                  <Form.Text className="text-muted small">Minimum withdrawal: $10.00</Form.Text>
               </Form.Group>
            </Modal.Body>
            <Modal.Footer className="border-0">
               <Button variant="light" onClick={() => setShowPayoutModal(false)}>Cancel</Button>
               <Button variant="success" type="submit" disabled={submitting || !payoutAmount || payoutAmount < 10}>
                  {submitting ? <Spinner size="sm" /> : 'Request Payout'}
               </Button>
            </Modal.Footer>
         </Form>
      </Modal>

    </Container>
  );
}
