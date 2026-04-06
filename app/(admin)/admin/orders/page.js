'use client';

import { useEffect, useState } from 'react';
import { Container, Table, Badge, Button, Form, Spinner, Row, Col, Card, Modal } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MdSearch, MdCheckCircle, MdCancel, MdPayment, MdAdd } from 'react-icons/md';
import { buildPackagePricingOptions, getPackageDisplayPrice, resolvePackagePriceOption } from '@/lib/packagePricing';

const createInitialOrderForm = () => ({
  userId: '',
  courseId: '',
  packageId: '',
  packagePriceKey: '',
  paymentMode: 'pay_later',
});

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [packages, setPackages] = useState([]);
  const [formData, setFormData] = useState(createInitialOrderForm());

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/admin/orders');
      if (res.data.success) {
        const sortedOrders = [...(res.data.data || [])].sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setOrders(sortedOrders);
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!showCreateModal) {
      return;
    }

    const loadCatalog = async () => {
      setCatalogLoading(true);
      try {
        const [studentsRes, coursesRes] = await Promise.all([
          axios.get('/api/admin/users', {
            params: { role: 'student', page: 1, limit: 200, search: '' }
          }),
          axios.get('/api/admin/courses'),
        ]);

        setStudents(studentsRes.data?.data || []);
        setCourses(coursesRes.data?.courses || coursesRes.data?.data || []);
      } catch (error) {
        toast.error('Failed to load students or courses');
      } finally {
        setCatalogLoading(false);
      }
    };

    loadCatalog();
  }, [showCreateModal]);

  useEffect(() => {
    if (!formData.courseId) {
      setPackages([]);
      setFormData((prev) => ({ ...prev, packageId: '', packagePriceKey: '' }));
      return;
    }

    const loadPackages = async () => {
      try {
        const res = await axios.get('/api/admin/packages', {
          params: { course_id: formData.courseId }
        });
        const nextPackages = res.data?.packages || [];
        setPackages(nextPackages);
        setFormData((prev) => ({
          ...prev,
          packageId: nextPackages[0]?._id || '',
          packagePriceKey: nextPackages[0] ? resolvePackagePriceOption(nextPackages[0])?.key || '' : '',
        }));
      } catch (error) {
        setPackages([]);
        setFormData((prev) => ({ ...prev, packageId: '', packagePriceKey: '' }));
        toast.error('Failed to load packages for selected course');
      }
    };

    loadPackages();
  }, [formData.courseId]);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      const res = await axios.patch('/api/admin/orders', { orderId: id, action });
      if (res.data.success) {
        toast.success(`Successfully performed: ${action}`);
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenCreateModal = () => {
    setFormData(createInitialOrderForm());
    setPackages([]);
    setShowCreateModal(true);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!formData.userId || !formData.courseId) {
      toast.error('Please select a student and course');
      return;
    }

    setCreatingOrder(true);
    try {
      const payload = {
        userId: formData.userId,
        courseId: formData.courseId,
        paymentMode: formData.paymentMode,
      };

      if (formData.packageId) {
        payload.packageId = formData.packageId;
        if (formData.packagePriceKey) {
          payload.packagePriceKey = formData.packagePriceKey;
        }
      }

      const res = await axios.post('/api/admin/orders', payload);
      if (res.data.success) {
        toast.success('Custom order created successfully');
        setShowCreateModal(false);
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create custom order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.courseId?.title?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === '' || order.status === statusFilter;
      const matchesCourse = courseFilter === '' || order.courseId?._id === courseFilter;
      const orderDate = order.createdAt ? new Date(order.createdAt) : null;
      const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
      const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
      const matchesDateFrom = !fromDate || (orderDate && orderDate >= fromDate);
      const matchesDateTo = !toDate || (orderDate && orderDate <= toDate);

      return matchesSearch && matchesStatus && matchesCourse && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge bg="success">Active</Badge>;
      case 'pending_payment':
        return <Badge bg="warning" text="dark">Pending Payment</Badge>;
      case 'suspended':
        return <Badge bg="danger">Rejected / Suspended</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge bg="success">Paid</Badge>;
      case 'pending':
        return <Badge bg="warning" text="dark">Pending</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getGatewayLabel = (gateway) => {
    if (gateway === 'pay_later') return 'Pay Later';
    if (gateway === 'admin_manual') return 'Admin Manual';
    if (gateway === 'razorpay') return 'Razorpay';
    if (gateway === 'stripe') return 'Stripe';
    if (gateway === 'icici') return 'ICICI';
    return gateway || 'N/A';
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const uniqueCourses = [...new Set(
    orders
      .map((order) => order.courseId)
      .filter(Boolean)
      .map((course) => JSON.stringify({ id: course._id, title: course.title }))
  )].map((item) => JSON.parse(item));

  const selectedPackage = packages.find((pkg) => pkg._id === formData.packageId);
  const selectedCourse = courses.find((course) => course._id === formData.courseId);
  const selectedPackageOption = selectedPackage ? resolvePackagePriceOption(selectedPackage, formData.packagePriceKey) : null;
  const displayAmount = selectedPackage ? Number(selectedPackageOption?.price || getPackageDisplayPrice(selectedPackage)) : (selectedCourse?.price ?? 0);

  if (loading) {
    return <div className="p-5 text-center"><Spinner animation="border" variant="primary" /></div>;
  }

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Course Enrollment Orders</h4>
        <div className="d-flex align-items-center gap-3">
          <div className="text-muted small">Total Orders: {orders.length}</div>
          <Button variant="dark" className="d-flex align-items-center gap-2" onClick={handleOpenCreateModal}>
            <MdAdd size={18} /> Add Custom Order
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold">Search</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0"><MdSearch /></span>
                  <Form.Control
                    placeholder="User name, email or course..."
                    className="border-start-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small fw-bold">Enrollment Status</Form.Label>
                <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending_payment">Pending Payment</option>
                  <option value="suspended">Rejected</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small fw-bold">Filter by Course</Form.Label>
                <Form.Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
                  <option value="">All Courses</option>
                  {uniqueCourses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small fw-bold">Date From</Form.Label>
                <Form.Control
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small fw-bold">Date To</Form.Label>
                <Form.Control
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Button
                variant="light"
                className="w-100 fw-bold border"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setCourseFilter('');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Reset
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
        <Table responsive hover className="mb-0 align-middle">
          <thead className="bg-light">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th>Course / Plan</th>
              <th>Status (Enroll)</th>
              <th>Payment</th>
              <th>Purchase Date</th>
              <th>Renewal Date</th>

              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? filteredOrders.map((order) => (
              <tr key={order._id}>
                <td className="px-4 py-3">
                  <div className="fw-bold">{order.userId?.name || 'Unknown'}</div>
                  <div className="small text-muted">{order.userId?.email || order.userId?.phone}</div>
                </td>
                <td>
                  <div className="fw-semibold">{order.courseId?.title || 'Unknown Course'}</div>
                  <div className="small text-primary">
                    {order.packageId?.name || 'No Plan'} - Rs.{Number(order.packageId?.displayPrice || 0).toLocaleString()}
                  </div>
                  {order.packageId?.selectedOptionLabel && (
                    <div className="small text-muted">{order.packageId.selectedOptionLabel}</div>
                  )}
                </td>
                <td>{getStatusBadge(order.status)}</td>
                <td>
                  {getPaymentBadge(order.paymentStatus)}
                  <div className="x-small text-muted mt-1">Mode: {getGatewayLabel(order.gateway)}</div>
                </td>
                <td>
                  <div className="small">{formatDate(order.createdAt)}</div>
                  </td>
                  <td>
                <div className="small">{formatDate(order.endDate)}  </div> 
                </td>
                <td className="text-end px-4">
                  <div className="d-flex justify-content-end gap-2">
                    {order.status === 'pending_payment' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAction(order._id, 'approve')}
                          disabled={actionLoading === order._id}
                        >
                          <MdCheckCircle className="me-1" /> Approve
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleAction(order._id, 'reject')}
                          disabled={actionLoading === order._id}
                        >
                          <MdCancel className="me-1" /> Reject
                        </Button>
                      </>
                    )}
                    {order.paymentStatus === 'pending' && order.status === 'active' && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleAction(order._id, 'mark_paid')}
                        disabled={actionLoading === order._id}
                      >
                        <MdPayment className="me-1" /> Mark Paid
                      </Button>
                    )}
                    {actionLoading === order._id && <Spinner size="sm" animation="border" />}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">No matching orders found.</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Create Custom Order</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateOrder}>
          <Modal.Body className="p-4">
            {catalogLoading ? (
              <div className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <div className="small text-muted mt-3">Loading students and courses...</div>
              </div>
            ) : (
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Student</Form.Label>
                    <Form.Select value={formData.userId} onChange={(e) => setFormData((prev) => ({ ...prev, userId: e.target.value }))} required>
                      <option value="">Select student</option>
                      {students.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.name} {student.email ? `(${student.email})` : ''}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Course</Form.Label>
                    <Form.Select
                      value={formData.courseId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, courseId: e.target.value }))}
                      required
                    >
                      <option value="">Select course</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Plan / Package</Form.Label>
                    <Form.Select
                      value={formData.packageId}
                      onChange={(e) => {
                        const nextPackage = packages.find((pkg) => pkg._id === e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          packageId: e.target.value,
                          packagePriceKey: nextPackage ? resolvePackagePriceOption(nextPackage)?.key || '' : '',
                        }));
                      }}
                      disabled={!formData.courseId}
                    >
                      <option value="">No package (use course price)</option>
                      {packages.map((pkg) => (
                        <option key={pkg._id} value={pkg._id}>
                          {pkg.name} - Rs.{Number(getPackageDisplayPrice(pkg) || 0).toLocaleString()}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Pricing Option</Form.Label>
                    <Form.Select
                      value={formData.packagePriceKey}
                      onChange={(e) => setFormData((prev) => ({ ...prev, packagePriceKey: e.target.value }))}
                      disabled={!selectedPackage}
                    >
                      {!selectedPackage && <option value="">Select package first</option>}
                      {selectedPackage && buildPackagePricingOptions(selectedPackage).map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label} - Rs.{Number(option.price || 0).toLocaleString()}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Payment Mode</Form.Label>
                    <Form.Select
                      value={formData.paymentMode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, paymentMode: e.target.value }))}
                    >
                      <option value="pay_later">Pay Later</option>
                      <option value="manual_paid">Manual Paid</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Card className="border bg-light">
                    <Card.Body>
                      <div className="small text-uppercase text-muted fw-bold mb-2">Order Preview</div>
                      <div className="fw-semibold">{selectedCourse?.title || 'Select a course'}</div>
                      <div className="small text-muted">{selectedPackage?.name || 'Standard course pricing'}</div>
                      {selectedPackageOption?.label && <div className="small text-muted">{selectedPackageOption.label}</div>}
                      <div className="mt-2 fw-bold">Amount: Rs.{Number(displayAmount || 0).toLocaleString()}</div>
                      <div className="small text-muted mt-1">
                        {formData.paymentMode === 'manual_paid'
                          ? 'This creates an active enrollment with paid status.'
                          : 'This creates a pending payment enrollment like the public pay-later flow.'}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="dark" type="submit" disabled={catalogLoading || creatingOrder}>
              {creatingOrder ? <Spinner size="sm" /> : 'Create Order'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style jsx>{`
        .x-small { font-size: 0.75rem; }
        .very-small { font-size: 0.7rem; }
      `}</style>
    </Container>
  );
}
