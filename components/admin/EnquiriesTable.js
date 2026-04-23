'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Alert, Badge, Card, Form, Spinner, Table } from 'react-bootstrap';

const statusOptions = ['new', 'contacted', 'scheduled', 'closed'];
const statusVariant = {
  new: 'primary',
  contacted: 'info',
  scheduled: 'success',
  closed: 'secondary',
};

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function EnquiriesTable({ scope = 'admin' }) {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [savingId, setSavingId] = useState('');

  const title = scope === 'school' ? 'School Enquiries' : 'Enquiries';

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/admin/enquiries', { params: { status: statusFilter } });
      setEnquiries(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load enquiries.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const summary = useMemo(() => ({
    total: enquiries.length,
    newCount: enquiries.filter((item) => item.status === 'new').length,
  }), [enquiries]);

  const updateStatus = async (id, status) => {
    setSavingId(id);
    try {
      await axios.put('/api/admin/enquiries', { id, status });
      setEnquiries((items) => items.map((item) => (item._id === id ? { ...item, status } : item)));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update enquiry.');
    } finally {
      setSavingId('');
    }
  };

  const formatList = (values, fallback) => {
    const list = Array.isArray(values) ? values.filter(Boolean) : [];
    return list.length ? list.join(' / ') : fallback;
  };

  const getSourceTitle = (enquiry) => {
    if (enquiry.source === 'contact_page') {
      return enquiry.subject || 'Contact enquiry';
    }
    return enquiry.pageTitle || 'Dynamic page';
  };

  return (
    <div className="p-4 p-lg-5">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">{title}</h2>
          <p className="text-muted mb-0">Submitted from public dynamic page forms.</p>
        </div>
        <Form.Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: 220 }}
        >
          <option value="all">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
          ))}
        </Form.Select>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="row g-3 mb-4">
        <div className="col-md-6 col-xl-3">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small fw-bold text-uppercase">Total</div>
              <div className="fs-2 fw-bold">{summary.total}</div>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-6 col-xl-3">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small fw-bold text-uppercase">New</div>
              <div className="fs-2 fw-bold">{summary.newCount}</div>
            </Card.Body>
          </Card>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          {loading ? (
            <div className="p-5 text-center"><Spinner animation="border" /></div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Student</th>
                  <th>Contact</th>
                  <th>Class Details</th>
                  <th>School</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th className="pe-4">Received</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((enquiry) => (
                  <tr key={enquiry._id}>
                    <td className="ps-4">
                      <div className="fw-bold">{enquiry.name}</div>
                      <div className="small text-muted">
                        {[enquiry.age && `${enquiry.age} yrs`, enquiry.gender].filter(Boolean).join(' / ')}
                      </div>
                    </td>
                    <td>
                      <div>{enquiry.phone}</div>
                      <div className="small text-muted">{enquiry.email || 'No email'}</div>
                    </td>
                    <td>
                      <div className="fw-semibold">{enquiry.instrument || 'Instrument not selected'}</div>
                      <div className="small text-muted">
                        {[enquiry.center, formatList(enquiry.preferredDays, enquiry.preferredDay), formatList(enquiry.preferredTimeSlots, enquiry.preferredTimeSlot)].filter(Boolean).join(' / ') || 'No preferred slot'}
                      </div>
                    </td>
                    <td>{enquiry.schoolId?.schoolName || enquiry.schoolName || 'Not selected'}</td>
                    <td>
                      <div>{getSourceTitle(enquiry)}</div>
                      {enquiry.pageSlug && <code className="small">/{enquiry.pageSlug}</code>}
                      {enquiry.message && <div className="small text-muted text-truncate" style={{ maxWidth: 220 }}>{enquiry.message}</div>}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={statusVariant[enquiry.status] || 'secondary'}>
                          {enquiry.status}
                        </Badge>
                        <Form.Select
                          size="sm"
                          value={enquiry.status}
                          disabled={savingId === enquiry._id}
                          onChange={(e) => updateStatus(enquiry._id, e.target.value)}
                          style={{ width: 130 }}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </Form.Select>
                      </div>
                    </td>
                    <td className="pe-4 small text-muted">{formatDate(enquiry.createdAt)}</td>
                  </tr>
                ))}
                {enquiries.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-5">No enquiries found.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
