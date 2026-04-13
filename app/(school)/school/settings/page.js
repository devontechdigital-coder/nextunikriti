'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Button, Container, Form, Spinner } from 'react-bootstrap';
import WeeklyScheduleEditor from '@/components/schools/WeeklyScheduleEditor';
import { createDefaultSchoolSchedule } from '@/lib/schoolSchedule';

export default function SchoolSettingsPage() {
  const [formData, setFormData] = useState({
    schoolName: '',
    board: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    weeklySchedule: createDefaultSchoolSchedule(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    axios.get('/api/school/settings')
      .then((res) => {
        if (res.data.success) {
          const school = res.data.school;
          setFormData({
            schoolName: school.schoolName || '',
            board: school.board || '',
            contactPerson: school.contactPerson || '',
            contactPhone: school.contactPhone || '',
            contactEmail: school.contactEmail || '',
            address: school.address || '',
            city: school.city || '',
            state: school.state || '',
            pinCode: school.pinCode || '',
            weeklySchedule: school.weeklySchedule || createDefaultSchoolSchedule(),
          });
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load school settings.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.put('/api/school/settings', formData);
      if (res.data.success) {
        setSuccess('School settings updated successfully.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update school settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">School Settings</h2>
        <p className="text-muted mb-0">Manage your school profile, open days, and class timings.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit} className="bg-white rounded-4 shadow-sm p-4">
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <Form.Label>School Name</Form.Label>
            <Form.Control value={formData.schoolName} onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })} />
          </div>
          <div className="col-md-6">
            <Form.Label>Board</Form.Label>
            <Form.Control value={formData.board} onChange={(e) => setFormData({ ...formData, board: e.target.value })} />
          </div>
          <div className="col-md-6">
            <Form.Label>Contact Person</Form.Label>
            <Form.Control value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
          </div>
          <div className="col-md-6">
            <Form.Label>Contact Phone</Form.Label>
            <Form.Control value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} />
          </div>
          <div className="col-md-6">
            <Form.Label>Contact Email</Form.Label>
            <Form.Control type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} />
          </div>
          <div className="col-md-6">
            <Form.Label>City</Form.Label>
            <Form.Control value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
          </div>
          <div className="col-md-6">
            <Form.Label>State</Form.Label>
            <Form.Control value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
          </div>
          <div className="col-md-6">
            <Form.Label>PIN Code</Form.Label>
            <Form.Control value={formData.pinCode} onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })} />
          </div>
          <div className="col-12">
            <Form.Label>Address</Form.Label>
            <Form.Control value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
        </div>

        <h5 className="fw-bold mb-3">Available Days and Timings</h5>
        <WeeklyScheduleEditor
          value={formData.weeklySchedule}
          onChange={(weeklySchedule) => setFormData({ ...formData, weeklySchedule })}
        />

        <div className="mt-4 d-flex justify-content-end">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? <Spinner size="sm" /> : 'Save Settings'}
          </Button>
        </div>
      </Form>
    </Container>
  );
}
