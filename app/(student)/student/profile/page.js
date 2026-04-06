'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaCamera, FaSave, FaUserCircle } from 'react-icons/fa';

const createInitialForm = () => ({
  name: '',
  phone: '',
  email: '',
  bio: '',
  avatar: '',
});

export default function StudentProfilePage() {
  const [formData, setFormData] = useState(createInitialForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await axios.get('/api/student/profile');
        if (res.data.success) {
          const profile = res.data.data;
          setFormData({
            name: profile.name || '',
            phone: profile.phone || '',
            email: profile.email || '',
            bio: profile.bio || '',
            avatar: profile.avatar || '',
          });
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put('/api/student/profile', {
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        avatar: formData.avatar,
      });

      if (res.data.success) {
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-5 text-center"><Spinner animation="border" variant="primary" /></div>;
  }

  return (
    <div className="py-2">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">My Profile</h2>
        <p className="text-muted mb-0">Keep your student information up to date.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4 text-center">
              <div className="profile-avatar mx-auto mb-3">
                {formData.avatar ? (
                  <img src={formData.avatar} alt={formData.name || 'Student'} className="w-100 h-100 object-fit-cover rounded-circle" />
                ) : (
                  <FaUserCircle size={96} className="text-secondary opacity-75" />
                )}
              </div>
              <h5 className="fw-bold mb-1">{formData.name || 'Student'}</h5>
              <div className="text-muted small mb-3">{formData.email || formData.phone || 'No contact added yet'}</div>
              <div className="small text-muted">
                Add a photo, short bio, and latest contact details so your student portal feels complete.
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4">
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Full Name</Form.Label>
                      <Form.Control
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Phone</Form.Label>
                      <Form.Control value={formData.phone} disabled />
                      <div className="small text-muted mt-1">Phone is managed from your login account.</div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="you@example.com"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold d-flex align-items-center gap-2">
                        <FaCamera size={12} /> Avatar URL
                      </Form.Label>
                      <Form.Control
                        value={formData.avatar}
                        onChange={(e) => handleChange('avatar', e.target.value)}
                        placeholder="https://..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small fw-bold">Bio</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        value={formData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        placeholder="Tell us a little about your learning goals."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={12} className="pt-2">
                    <Button type="submit" variant="dark" className="rounded-pill px-4 fw-bold" disabled={saving}>
                      {saving ? <Spinner size="sm" /> : <><FaSave className="me-2" />Save Changes</>}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .profile-avatar {
          width: 112px;
          height: 112px;
          border-radius: 999px;
          overflow: hidden;
          background: #f1f3f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
