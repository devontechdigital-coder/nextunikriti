'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Container, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MdAdd, MdDelete, MdEdit, MdSearch } from 'react-icons/md';

const createInitialFormData = () => ({
  code: '',
  title: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscountAmount: '',
  startDate: '',
  expiryDate: '',
  courseId: '',
  packageId: '',
  maxUsage: '100',
  isActive: true,
});

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(createInitialFormData());
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const [couponRes, courseRes, packageRes] = await Promise.all([
        axios.get('/api/admin/coupons'),
        axios.get('/api/admin/courses'),
        axios.get('/api/admin/packages'),
      ]);

      setCoupons(couponRes.data?.coupons || []);
      setCourses(courseRes.data?.courses || courseRes.data?.data || []);
      setPackages(packageRes.data?.packages || []);
    } catch (error) {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPackages = useMemo(() => (
    formData.courseId
      ? packages.filter((pkg) => String(pkg.course_id?._id || pkg.course_id) === String(formData.courseId))
      : packages
  ), [formData.courseId, packages]);

  const filteredCoupons = useMemo(() => (
    coupons.filter((coupon) => {
      const search = searchTerm.trim().toLowerCase();
      if (!search) return true;

      return [
        coupon.code,
        coupon.title,
        coupon.description,
        coupon.courseId?.title,
        coupon.packageId?.name,
      ].some((value) => String(value || '').toLowerCase().includes(search));
    })
  ), [coupons, searchTerm]);

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData(createInitialFormData());
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || '',
      title: coupon.title || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: String(coupon.discountValue ?? coupon.discountPercentage ?? ''),
      minOrderAmount: String(coupon.minOrderAmount ?? ''),
      maxDiscountAmount: coupon.maxDiscountAmount === null || coupon.maxDiscountAmount === undefined ? '' : String(coupon.maxDiscountAmount),
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 10) : '',
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 10) : '',
      courseId: coupon.courseId?._id || coupon.courseId || '',
      packageId: coupon.packageId?._id || coupon.packageId || '',
      maxUsage: String(coupon.maxUsage ?? '100'),
      isActive: Boolean(coupon.isActive),
    });
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    if (!formData.discountValue) {
      toast.error('Discount value is required');
      return;
    }
    if (!formData.expiryDate) {
      toast.error('Expiry date is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
      };

      if (editingCoupon?._id) {
        await axios.put(`/api/admin/coupons/${editingCoupon._id}`, payload);
        toast.success('Coupon updated');
      } else {
        await axios.post('/api/admin/coupons', payload);
        toast.success('Coupon created');
      }

      handleClose();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (couponId) => {
    setDeletingId(couponId);
    try {
      await axios.delete(`/api/admin/coupons/${couponId}`);
      toast.success('Coupon deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete coupon');
    } finally {
      setDeletingId('');
    }
  };

  const formatDate = (value) => (
    value
      ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'N/A'
  );

  const renderDiscount = (coupon) => {
    if (coupon.discountType === 'fixed') {
      return `Rs.${Number(coupon.discountValue || 0).toLocaleString()} off`;
    }

    return `${Number(coupon.discountValue ?? coupon.discountPercentage ?? 0)}% off`;
  };

  if (loading) {
    return <div className="p-5 text-center"><Spinner animation="border" /></div>;
  }

  return (
    <Container fluid className="p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Coupon Management</h4>
          <div className="text-muted small">Create and manage discount coupons for package purchase.</div>
        </div>
        <Button variant="dark" className="d-flex align-items-center gap-2" onClick={openCreateModal}>
          <MdAdd size={18} /> Add Coupon
        </Button>
      </div>

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={5}>
              <Form.Label className="small fw-bold">Search Coupon</Form.Label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0"><MdSearch /></span>
                <Form.Control
                  className="border-start-0"
                  placeholder="Code, title, course or package"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </Col>
            <Col md={2}>
              <div className="small text-muted">Total Coupons</div>
              <div className="fw-bold fs-5">{coupons.length}</div>
            </Col>
            <Col md={2}>
              <div className="small text-muted">Active</div>
              <div className="fw-bold fs-5">{coupons.filter((coupon) => coupon.isActive).length}</div>
            </Col>
            <Col md={3}>
              <div className="small text-muted">Expired</div>
              <div className="fw-bold fs-5">{coupons.filter((coupon) => coupon.expiryDate && new Date(coupon.expiryDate) < new Date()).length}</div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="bg-white rounded-3 shadow-sm border overflow-hidden">
        <Table responsive hover className="mb-0 align-middle">
          <thead className="bg-light">
            <tr>
              <th className="px-4 py-3">Coupon</th>
              <th>Discount</th>
              <th>Applicability</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Start</th>
              <th>Expiry</th>
              <th className="text-end px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoupons.length > 0 ? filteredCoupons.map((coupon) => (
              <tr key={coupon._id}>
                <td className="px-4 py-3">
                  <div className="fw-bold">{coupon.code}</div>
                  {coupon.title && <div className="small text-muted">{coupon.title}</div>}
                  {coupon.description && <div className="x-small text-muted mt-1">{coupon.description}</div>}
                </td>
                <td>
                  <div className="fw-semibold">{renderDiscount(coupon)}</div>
                  {Number(coupon.minOrderAmount || 0) > 0 && (
                    <div className="x-small text-muted">Min order: Rs.{Number(coupon.minOrderAmount).toLocaleString()}</div>
                  )}
                  {coupon.maxDiscountAmount ? (
                    <div className="x-small text-muted">Max discount: Rs.{Number(coupon.maxDiscountAmount).toLocaleString()}</div>
                  ) : null}
                </td>
                <td>
                  <div className="small">{coupon.courseId?.title || 'All courses'}</div>
                  <div className="x-small text-muted">{coupon.packageId?.name || 'All packages'}</div>
                </td>
                <td>
                  <div className="fw-semibold">{Number(coupon.usageCount || 0)} / {Number(coupon.maxUsage || 0)}</div>
                </td>
                <td>
                  <Badge bg={coupon.isActive ? 'success' : 'secondary'}>
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td>{formatDate(coupon.startDate)}</td>
                <td>{formatDate(coupon.expiryDate)}</td>
                <td className="text-end px-4">
                  <div className="d-flex justify-content-end gap-2">
                    <Button size="sm" variant="outline-dark" onClick={() => openEditModal(coupon)}>
                      <MdEdit />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(coupon._id)}
                      disabled={deletingId === coupon._id}
                    >
                      {deletingId === coupon._id ? <Spinner size="sm" /> : <MdDelete />}
                    </Button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" className="text-center py-5 text-muted">No coupons found.</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={4}>
                <Form.Label className="small fw-bold">Coupon Code</Form.Label>
                <Form.Control
                  value={formData.code}
                  onChange={(event) => setFormData((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                  placeholder="WELCOME10"
                  required
                />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Title</Form.Label>
                <Form.Control
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Launch Offer"
                />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Discount Type</Form.Label>
                <Form.Select
                  value={formData.discountType}
                  onChange={(event) => setFormData((prev) => ({ ...prev, discountType: event.target.value }))}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">
                  {formData.discountType === 'fixed' ? 'Discount Amount' : 'Discount Percentage'}
                </Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max={formData.discountType === 'percentage' ? '100' : undefined}
                  value={formData.discountValue}
                  onChange={(event) => setFormData((prev) => ({ ...prev, discountValue: event.target.value }))}
                  required
                />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Min Order Amount</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={formData.minOrderAmount}
                  onChange={(event) => setFormData((prev) => ({ ...prev, minOrderAmount: event.target.value }))}
                />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Max Discount Amount</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={formData.maxDiscountAmount}
                  onChange={(event) => setFormData((prev) => ({ ...prev, maxDiscountAmount: event.target.value }))}
                  placeholder="Optional"
                />
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold">Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.startDate}
                  onChange={(event) => setFormData((prev) => ({ ...prev, startDate: event.target.value }))}
                />
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold">Expiry Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.expiryDate}
                  onChange={(event) => setFormData((prev) => ({ ...prev, expiryDate: event.target.value }))}
                  required
                />
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold">Course</Form.Label>
                <Form.Select
                  value={formData.courseId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, courseId: event.target.value, packageId: '' }))}
                >
                  <option value="">All courses</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>{course.title}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold">Package</Form.Label>
                <Form.Select
                  value={formData.packageId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, packageId: event.target.value }))}
                >
                  <option value="">All packages</option>
                  {filteredPackages.map((pkg) => (
                    <option key={pkg._id} value={pkg._id}>{pkg.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold">Max Usage</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={formData.maxUsage}
                  onChange={(event) => setFormData((prev) => ({ ...prev, maxUsage: event.target.value }))}
                />
              </Col>
              <Col md={6} className="d-flex align-items-center">
                <Form.Check
                  type="switch"
                  id="coupon-active-switch"
                  label="Coupon is active"
                  checked={formData.isActive}
                  onChange={(event) => setFormData((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
              </Col>
              <Col xs={12}>
                <Form.Label className="small fw-bold">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Short admin note or campaign description"
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="dark" disabled={saving}>
              {saving ? <Spinner size="sm" /> : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
