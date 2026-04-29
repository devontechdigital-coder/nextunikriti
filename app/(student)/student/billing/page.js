'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Nav, ProgressBar, Row, Spinner, Tab, Table } from 'react-bootstrap';
import axios from 'axios';
import { FaCalendarAlt, FaCreditCard, FaDownload, FaFileInvoice, FaRedo, FaWallet } from 'react-icons/fa';

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const loadRazorpayScript = () => new Promise((resolve) => {
  if (window.Razorpay) {
    resolve(true);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

export default function StudentBillingPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCourses = async () => {
    try {
      setError('');
      const res = await axios.get('/api/my-courses');
      if (res.data.success) setCourses(res.data.data);
    } catch (err) {
      setError('Failed to load billing details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const activeCourses = useMemo(() => (
    courses.filter((course) => course.payment_status === 'paid')
  ), [courses]);
  const renewableCourses = useMemo(() => (
    activeCourses.filter((course) => course.pricing_option_payment_type === 'quarterly')
  ), [activeCourses]);
  const invoices = courses;

  const handleRenew = async (course) => {
    setRenewingId(course.enrollment_id);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('/api/student/renewals', { enrollmentId: course.enrollment_id });
      const { gateway, url, redirectUrl, order, key, paymentDbId } = res.data;

      if (gateway === 'stripe' && url) {
        window.location.href = url;
        return;
      }

      if (gateway === 'icici' && redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      if (gateway === 'razorpay' && order) {
        const loaded = await loadRazorpayScript();
        if (!loaded) throw new Error('Unable to load Razorpay checkout');

        const rzp = new window.Razorpay({
          key,
          amount: order.amount,
          currency: order.currency,
          name: 'Unikriti',
          description: `${course.course_title} Renewal`,
          order_id: order.id,
          handler: async (response) => {
            const verifyRes = await axios.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentDbId,
            });

            if (verifyRes.data.success) {
              setSuccess('Renewal payment successful.');
              await fetchCourses();
            } else {
              setError(verifyRes.data.message || 'Payment verification failed.');
            }
          },
          theme: { color: '#111827' },
        });

        rzp.open();
        return;
      }

      setError('Unable to start renewal payment.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to start renewal.');
    } finally {
      setRenewingId('');
    }
  };

  if (loading) {
    return <div className="py-5 text-center"><Spinner animation="border" variant="primary" /></div>;
  }

  return (
    <div className="py-2">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Renewal and Billing</h2>
        <p className="text-muted mb-0">Track expiry dates, renew quarterly plans, and view invoices.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row className="g-3 mb-4">
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <div className="small text-uppercase text-muted fw-bold mb-2">Active Plans</div>
              <div className="display-6 fw-bold">{activeCourses.length}</div>
              <div className="small text-muted">Paid courses currently active.</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <div className="small text-uppercase text-muted fw-bold mb-2">Renewable</div>
              <div className="display-6 fw-bold">{renewableCourses.length}</div>
              <div className="small text-muted">Quarterly plans eligible for renewal.</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <div className="small text-uppercase text-muted fw-bold mb-2">Invoices</div>
              <div className="display-6 fw-bold">{invoices.length}</div>
              <div className="small text-muted">Payment records in your account.</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tab.Container defaultActiveKey="renewals">
        <Nav variant="pills" className="u-billing-tabs mb-4 gap-2">
          <Nav.Item>
            <Nav.Link eventKey="renewals" className="rounded-pill px-4 fw-bold">
              <FaRedo className="me-2" size={12} /> Renewals
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="invoices" className="rounded-pill px-4 fw-bold">
              <FaFileInvoice className="me-2" size={12} /> Invoices
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="renewals">
            {activeCourses.length === 0 ? (
              <EmptyState icon={<FaWallet size={44} />} title="No Active Plans" text="Your active course plans will appear here." />
            ) : (
              <Row className="g-4">
                {activeCourses.map((course) => {
                  const isQuarterly = course.pricing_option_payment_type === 'quarterly';
                  const progressUsed = course.total_duration_days
                    ? Math.min(100, Math.round((Number(course.days_used || 0) / Number(course.total_duration_days || 1)) * 100))
                    : 0;

                  return (
                    <Col lg={4} md={6} key={course.enrollment_id}>
                      <Card className="border-0 shadow-sm rounded-4 h-100">
                        <Card.Body className="p-4 d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                            <div>
                              <h6 className="fw-bold mb-1">{course.course_title}</h6>
                              <div className="small text-muted">{course.package_name}</div>
                            </div>
                            <Badge bg={isQuarterly ? 'primary' : 'secondary'} className="rounded-pill px-3">
                              {course.pricing_option_payment_type || 'plan'}
                            </Badge>
                          </div>

                          <div className="small text-muted mb-2">
                            <FaCalendarAlt size={12} className="me-2" />
                            Expires on <span className="fw-semibold">{formatDate(course.endDate)}</span>
                          </div>
                          <div className="small text-muted mb-3">
                            {course.days_left ?? 0} days left
                          </div>

                          <ProgressBar now={progressUsed} variant={course.days_left <= 15 ? 'warning' : 'primary'} className="mb-3" style={{ height: '6px' }} />

                          <div className="p-3 bg-light rounded-3 mb-3">
                            <div className="d-flex justify-content-between small mb-2">
                              <span className="text-muted">Plan price</span>
                              <span className="fw-bold">{formatCurrency(course.pricing_option_price || course.amount)}</span>
                            </div>
                            <div className="d-flex justify-content-between small">
                              <span className="text-muted">Duration</span>
                              <span className="fw-bold">{course.total_duration_days || 0} days</span>
                            </div>
                          </div>

                          <div className="mt-auto">
                            {isQuarterly ? (
                              <Button
                                variant="dark"
                                className="w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2"
                                disabled={renewingId === course.enrollment_id}
                                onClick={() => handleRenew(course)}
                              >
                                {renewingId === course.enrollment_id ? <Spinner size="sm" /> : <FaCreditCard size={12} />}
                                Renew Quarterly Plan
                              </Button>
                            ) : (
                              <Button variant="outline-secondary" className="w-100 rounded-pill fw-bold" disabled>
                                Annual plans do not need quarterly renewal
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Tab.Pane>

          <Tab.Pane eventKey="invoices">
            {invoices.length === 0 ? (
              <EmptyState icon={<FaFileInvoice size={44} />} title="No Invoices" text="Your payment records will appear here." />
            ) : (
              <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light text-uppercase small text-muted">
                    <tr>
                      <th className="ps-4">Invoice</th>
                      <th>Course</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Gateway</th>
                      <th>Status</th>
                      <th className="text-end pe-4">Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.payment_id}>
                        <td className="ps-4">
                          <div className="fw-bold small">#{String(invoice.payment_id).slice(-8).toUpperCase()}</div>
                          <div className="extra-small text-muted">{invoice.transaction_id || 'N/A'}</div>
                        </td>
                        <td>
                          <div className="fw-semibold small">{invoice.course_title}</div>
                          <div className="extra-small text-muted">{invoice.package_name}</div>
                        </td>
                        <td className="small">{formatDate(invoice.purchaseDate || invoice.createdAt)}</td>
                        <td className="small fw-bold">{formatCurrency(invoice.amount)}</td>
                        <td className="small">{invoice.gateway || 'N/A'}</td>
                        <td>
                          <Badge bg={invoice.payment_status === 'paid' ? 'success' : 'warning'} text={invoice.payment_status === 'paid' ? undefined : 'dark'} className="rounded-pill px-3">
                            {invoice.payment_status}
                          </Badge>
                        </td>
                        <td className="text-end pe-4">
                          <a
                            href={`/api/student/invoices/${invoice.payment_id}`}
                            className="btn btn-outline-dark btn-sm rounded-pill fw-bold d-inline-flex align-items-center gap-2"
                            download
                          >
                            <FaDownload size={11} /> Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      <style jsx>{`
        .extra-small { font-size: 0.72rem; }
        :global(.u-billing-tabs .nav-link) { color: #666; background: #eee; border: none !important; }
        :global(.u-billing-tabs .nav-link.active) { background-color: #000 !important; color: #fff !important; }
      `}</style>
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <Card className="text-center p-5 border-dashed bg-light rounded-4">
      <Card.Body>
        <div className="mb-3 text-muted opacity-50">{icon}</div>
        <h5 className="fw-bold text-dark">{title}</h5>
        <p className="text-muted small mb-0">{text}</p>
      </Card.Body>
      <style jsx>{`
        .border-dashed { border: 2px dashed #ccc !important; }
      `}</style>
    </Card>
  );
}
