'use client';

import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaCamera, FaSave, FaUserCircle } from 'react-icons/fa';
import GooglePlaceSelect from '@/components/common/GooglePlaceSelect';

const createInitialForm = () => ({
  name: '',
  phone: '',
  email: '',
  bio: '',
  avatar: '',
  enrolmentNumber: '',
  joiningYear: '',
  dateOfJoining: '',
  dateOfLeaving: '',
  studentName: '',
  status: 'lead',
  onBoard: false,
  time: '',
  enrolledFor: '',
  location: '',
  dateOfBirth: '',
  gender: 'male',
  bloodGroup: '',
  address1: '',
  address2: '',
  street: '',
  cityDistrict: '',
  state: '',
  pinCode: '',
  nationality: 'Indian',
  profilePhoto: '',
  motherName: '',
  motherMobile: '',
  motherEmail: '',
  fatherName: '',
  fatherMobile: '',
  fatherEmail: '',
  homePhone: '',
  emergencyDetails: '',
  relationship: '',
  emergencyPhoneNo: '',
  allergies: '',
  medicalCondition: '',
});

const formatDate = (value) => (value ? String(value).slice(0, 10) : '');

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
          const student = profile.studentProfile || {};
          setFormData({
            ...createInitialForm(),
            name: profile.name || '',
            phone: profile.phone || '',
            email: profile.email || '',
            bio: profile.bio || '',
            avatar: profile.avatar || '',
            enrolmentNumber: student.enrolmentNumber || '',
            joiningYear: student.joiningYear || '',
            dateOfJoining: formatDate(student.dateOfJoining || student.joiningDate),
            dateOfLeaving: formatDate(student.dateOfLeaving || student.leavingDate),
            studentName: student.studentName || profile.name || '',
            status: student.status || 'lead',
            onBoard: Boolean(student.onBoard),
            time: student.time || '',
            enrolledFor: student.enrolledFor || '',
            location: student.location || '',
            dateOfBirth: formatDate(student.dateOfBirth || student.dob),
            gender: student.gender || 'male',
            bloodGroup: student.bloodGroup || '',
            address1: student.address1 || student.addressLine1 || '',
            address2: student.address2 || student.addressLine2 || '',
            street: student.street || '',
            cityDistrict: student.cityDistrict || student.city || '',
            state: student.state || '',
            pinCode: student.pinCode || '',
            nationality: student.nationality || 'Indian',
            profilePhoto: student.profilePhoto || '',
            motherName: student.motherName || '',
            motherMobile: student.motherMobile || '',
            motherEmail: student.motherEmail || '',
            fatherName: student.fatherName || '',
            fatherMobile: student.fatherMobile || '',
            fatherEmail: student.fatherEmail || '',
            homePhone: student.homePhone || '',
            emergencyDetails: student.emergencyDetails || '',
            relationship: student.relationship || '',
            emergencyPhoneNo: student.emergencyPhoneNo || '',
            allergies: student.allergies || '',
            medicalCondition: student.medicalCondition || '',
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

  const handleAddressSelect = (place) => {
    if (!place) return;
    setFormData((prev) => ({
      ...prev,
      address1: place.label || prev.address1,
      cityDistrict: place.city || prev.cityDistrict,
      state: place.state || prev.state,
      nationality: place.country || prev.nationality,
      location: place.label || prev.location,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put('/api/student/profile', formData);

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
        <p className="text-muted mb-0">Keep your student, contact, parent, and medical information up to date.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4 sticky-top" style={{ top: 24 }}>
            <Card.Body className="p-4 text-center">
              <div className="profile-avatar mx-auto mb-3">
                {(formData.profilePhoto || formData.avatar) ? (
                  <img src={formData.profilePhoto || formData.avatar} alt={formData.name || 'Student'} className="w-100 h-100 object-fit-cover rounded-circle" />
                ) : (
                  <FaUserCircle size={96} className="text-secondary opacity-75" />
                )}
              </div>
              <h5 className="fw-bold mb-1">{formData.studentName || formData.name || 'Student'}</h5>
              <div className="text-muted small mb-2">{formData.email || formData.phone || 'No contact added yet'}</div>
              {formData.enrolmentNumber && <div className="badge bg-dark rounded-pill">{formData.enrolmentNumber}</div>}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Form onSubmit={handleSubmit}>
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Body className="p-4">
                <h6 className="fw-semibold mb-3">Account Details</h6>
                <Row className="g-3">
                  <Col md={6}><Form.Group><Form.Label className="small fw-bold">Full Name</Form.Label><Form.Control value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required /></Form.Group></Col>
                  <Col md={6}><Form.Group><Form.Label className="small fw-bold">Phone</Form.Label><Form.Control value={formData.phone} disabled /><div className="small text-muted mt-1">Phone is managed from your login account.</div></Form.Group></Col>
                  <Col md={6}><Form.Group><Form.Label className="small fw-bold">Email</Form.Label><Form.Control type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="you@example.com" /></Form.Group></Col>
                  <Col md={6}><Form.Group><Form.Label className="small fw-bold d-flex align-items-center gap-2"><FaCamera size={12} /> Avatar URL</Form.Label><Form.Control value={formData.avatar} onChange={(e) => handleChange('avatar', e.target.value)} placeholder="https://..." /></Form.Group></Col>
                  <Col md={12}><Form.Group><Form.Label className="small fw-bold">Bio</Form.Label><Form.Control as="textarea" rows={3} value={formData.bio} onChange={(e) => handleChange('bio', e.target.value)} placeholder="Tell us a little about your learning goals." /></Form.Group></Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Body className="p-4">
                <h6 className="fw-semibold mb-3">Academic & CRM Info</h6>
                <Row className="g-3">
                  <Col md={4}><Form.Group><Form.Label>Enrolment Number</Form.Label><Form.Control value={formData.enrolmentNumber} disabled placeholder="Auto-generated" /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Student Name</Form.Label><Form.Control value={formData.studentName} onChange={(e) => handleChange('studentName', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Status</Form.Label><Form.Select value={formData.status} onChange={(e) => handleChange('status', e.target.value)}><option value="lead">Lead</option><option value="trial">Trial</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="left">Left</option></Form.Select></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Joining Year</Form.Label><Form.Control value={formData.joiningYear} onChange={(e) => handleChange('joiningYear', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Date of Joining</Form.Label><Form.Control type="date" value={formData.dateOfJoining} onChange={(e) => handleChange('dateOfJoining', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Date of Leaving</Form.Label><Form.Control type="date" value={formData.dateOfLeaving} onChange={(e) => handleChange('dateOfLeaving', e.target.value)} /></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label>On Board</Form.Label><Form.Select value={formData.onBoard ? 'yes' : 'no'} onChange={(e) => handleChange('onBoard', e.target.value === 'yes')}><option value="no">No</option><option value="yes">Yes</option></Form.Select></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label>Time</Form.Label><Form.Control value={formData.time} onChange={(e) => handleChange('time', e.target.value)} /></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label>Enrolled For</Form.Label><Form.Control value={formData.enrolledFor} onChange={(e) => handleChange('enrolledFor', e.target.value)} /></Form.Group></Col>
                  <Col md={3}><Form.Group><Form.Label>Location</Form.Label><Form.Control value={formData.location} onChange={(e) => handleChange('location', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Date of Birth</Form.Label><Form.Control type="date" value={formData.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Gender</Form.Label><Form.Select value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Form.Select></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Blood Group</Form.Label><Form.Control value={formData.bloodGroup} onChange={(e) => handleChange('bloodGroup', e.target.value)} /></Form.Group></Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Body className="p-4">
                <h6 className="fw-semibold mb-3">Address Details</h6>
                <Row className="g-3">
                  <Col xs={12}><Form.Group><Form.Label>Search Address</Form.Label><GooglePlaceSelect value={formData.address1 ? { label: formData.address1, value: formData.address1 } : null} onChange={handleAddressSelect} /></Form.Group></Col>
                  <Col md={6}><Form.Group><Form.Label>Address 1</Form.Label><Form.Control value={formData.address1} onChange={(e) => handleChange('address1', e.target.value)} /></Form.Group></Col>
                  <Col md={6}><Form.Group><Form.Label>Address 2</Form.Label><Form.Control value={formData.address2} onChange={(e) => handleChange('address2', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Street</Form.Label><Form.Control value={formData.street} onChange={(e) => handleChange('street', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>City / District</Form.Label><Form.Control value={formData.cityDistrict} onChange={(e) => handleChange('cityDistrict', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>State</Form.Label><Form.Control value={formData.state} onChange={(e) => handleChange('state', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>PIN Code</Form.Label><Form.Control value={formData.pinCode} onChange={(e) => handleChange('pinCode', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Nationality</Form.Label><Form.Control value={formData.nationality} onChange={(e) => handleChange('nationality', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Profile Photo URL</Form.Label><Form.Control value={formData.profilePhoto} onChange={(e) => handleChange('profilePhoto', e.target.value)} /></Form.Group></Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Body className="p-4">
                <h6 className="fw-semibold mb-3">Parent & Emergency Details</h6>
                <Row className="g-3">
                  <Col md={4}><Form.Group><Form.Label>Mother Name</Form.Label><Form.Control value={formData.motherName} onChange={(e) => handleChange('motherName', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Mother Mobile</Form.Label><Form.Control value={formData.motherMobile} onChange={(e) => handleChange('motherMobile', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Mother Email</Form.Label><Form.Control type="email" value={formData.motherEmail} onChange={(e) => handleChange('motherEmail', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Father Name</Form.Label><Form.Control value={formData.fatherName} onChange={(e) => handleChange('fatherName', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Father Mobile</Form.Label><Form.Control value={formData.fatherMobile} onChange={(e) => handleChange('fatherMobile', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Father Email</Form.Label><Form.Control type="email" value={formData.fatherEmail} onChange={(e) => handleChange('fatherEmail', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Home Phone</Form.Label><Form.Control value={formData.homePhone} onChange={(e) => handleChange('homePhone', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Emergency Details</Form.Label><Form.Control value={formData.emergencyDetails} onChange={(e) => handleChange('emergencyDetails', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Relationship</Form.Label><Form.Control value={formData.relationship} onChange={(e) => handleChange('relationship', e.target.value)} /></Form.Group></Col>
                  <Col md={4}><Form.Group><Form.Label>Emergency Phone No</Form.Label><Form.Control value={formData.emergencyPhoneNo} onChange={(e) => handleChange('emergencyPhoneNo', e.target.value)} /></Form.Group></Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Body className="p-4">
                <h6 className="fw-semibold mb-3">Medical Details</h6>
                <Row className="g-3">
                  <Col md={6}><Form.Group><Form.Label>Allergies</Form.Label><Form.Control as="textarea" rows={2} value={formData.allergies} onChange={(e) => handleChange('allergies', e.target.value)} /></Form.Group></Col>
                  <Col md={6}><Form.Group><Form.Label>Medical Condition</Form.Label><Form.Control as="textarea" rows={2} value={formData.medicalCondition} onChange={(e) => handleChange('medicalCondition', e.target.value)} /></Form.Group></Col>
                </Row>
              </Card.Body>
            </Card>

            <Button type="submit" variant="dark" className="rounded-pill px-4 fw-bold" disabled={saving}>
              {saving ? <Spinner size="sm" /> : <><FaSave className="me-2" />Save Changes</>}
            </Button>
          </Form>
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
