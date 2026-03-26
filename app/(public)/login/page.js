'use client';

import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/redux/slices/authSlice';

export default function LoginPage() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('student');
  
  // Student State
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [hash, setHash] = useState('');

  // Instructor/Admin State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post('/api/auth/send-otp', { phone });
      if (res.data.success) {
        setHash(res.data.data.hash);
        setOtpSent(true);
        setSuccess('OTP sent successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post('/api/auth/verify-otp', { phone, hash, otp });
      if (res.data.success) {
        window.location.href = '/student/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        const userData = res.data.data;
        dispatch(setCredentials(userData));
        const role = userData.role;
        if (role === 'admin') {
          window.location.href = '/admin';
        } else if (role === 'school_admin') {
          window.location.href = '/school/dashboard';
        } else {
          window.location.href = '/instructor';
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <Row className="w-100 justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-lg border-0 rounded-4">
            <Card.Body className="p-4 p-md-5">
              <h3 className="text-center mb-4 fw-bold">Welcome Back</h3>
              
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Tabs
                activeKey={activeTab}
                onSelect={(k) => { setActiveTab(k); setError(''); setSuccess(''); }}
                className="mb-4 nav-justified"
                variant="pills"
              >
                <Tab eventKey="student" title="Student">
                  {!otpSent ? (
                    <Form onSubmit={handleSendOTP}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="tel"
                          placeholder="e.g. +1234567890"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="py-2"
                        />
                      </Form.Group>
                      <Button variant="primary" type="submit" className="w-100 py-2 fw-bold" disabled={loading}>
                        {loading ? 'Sending...' : 'Send OTP'}
                      </Button>
                    </Form>
                  ) : (
                    <Form onSubmit={handleVerifyOTP}>
                      <Form.Group className="mb-3">
                        <Form.Label>Enter OTP</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="6-digit code"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                          className="py-2 text-center fs-4 letter-spacing-2"
                          maxLength={6}
                        />
                      </Form.Group>
                      <Button variant="success" type="submit" className="w-100 py-2 fw-bold" disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify & Login'}
                      </Button>
                      <div className="text-center mt-3">
                        <Button variant="link" onClick={() => setOtpSent(false)} className="text-muted text-decoration-none">
                          Change Phone Number
                        </Button>
                      </div>
                    </Form>
                  )}
                </Tab>

                <Tab eventKey="instructor" title="Staff Login">
                  <Form onSubmit={handleEmailLogin}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="py-2"
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="py-2"
                      />
                    </Form.Group>
                    <Button variant="dark" type="submit" className="w-100 py-2 fw-bold" disabled={loading}>
                      {loading ? 'Logging in...' : 'Login to Dashboard'}
                    </Button>
                  </Form>
                </Tab>
              </Tabs>
              
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
