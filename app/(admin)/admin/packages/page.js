'use client';

import { useState } from 'react';
import { Alert, Badge, Button, Col, Container, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import {
  useCreateAdminPackageMutation,
  useDeleteAdminPackageMutation,
  useGetAdminCoursesQuery,
  useGetAdminModesQuery,
  useGetAdminPackagesQuery,
  useUpdateAdminPackageMutation,
} from '@/redux/api/apiSlice';
import { FaBoxOpen, FaCheckCircle, FaEdit, FaListUl, FaPlus, FaToggleOff, FaToggleOn, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { buildPackagePricingOptions, getPackageDisplayPrice } from '@/lib/packagePricing';
import { mergeGradeOptions, normalizeGradeName } from '@/lib/gradeUtils';

const createEmptyPricingOption = () => ({
  label: '',
  paymentType: 'quarterly',
  basePrice: '',
  discountAmount: '',
  adminFee: '',
  durationDays: 90,
  adminFeePolicy: 'first_quarter_of_year',
  isActive: true,
});

const createInitialFormData = () => ({
  course_id: '',
  gradeName: '',
  name: '',
  mode: '',
  description: '',
  features: [''],
  pricingOptions: [createEmptyPricingOption()],
  is_active: true,
});

const formatPrice = (value) => `Rs.${Number(value || 0).toLocaleString()}`;

export default function PackagesPage() {
  const [courseFilter, setCourseFilter] = useState('');
  const { data, isLoading, isError, error } = useGetAdminPackagesQuery(courseFilter ? { course_id: courseFilter } : {});
  const { data: coursesData } = useGetAdminCoursesQuery();
  const { data: modesData } = useGetAdminModesQuery({ status: 'active' });

  const [createPackage, { isLoading: isCreating }] = useCreateAdminPackageMutation();
  const [updatePackage, { isLoading: isUpdating }] = useUpdateAdminPackageMutation();
  const [deletePackage, { isLoading: isDeleting }] = useDeleteAdminPackageMutation();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPkgId, setCurrentPkgId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pkgToDelete, setPkgToDelete] = useState(null);
  const [formData, setFormData] = useState(createInitialFormData());
  const [successMsg, setSuccessMsg] = useState('');

  const packages = data?.packages || [];
  const courses = coursesData?.data || [];
  const modes = modesData?.modes || [];
  const selectedCourse = courses.find((course) => course._id === formData.course_id);
  const selectedCourseGrades = mergeGradeOptions(selectedCourse?.level_id?.grades || []);

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      const pricingOptions = buildPackagePricingOptions(pkg);
      setIsEditing(true);
      setCurrentPkgId(pkg._id);
      setFormData({
        course_id: pkg.course_id?._id || pkg.course_id || '',
        gradeName: pkg.gradeName || '',
        name: pkg.name || '',
        mode: pkg.mode || '',
        description: pkg.description || '',
        features: pkg.features?.length ? pkg.features : [''],
        pricingOptions: pricingOptions.length
          ? pricingOptions.map((option) => ({
              _id: option._id || '',
              key: option.key || '',
              label: option.label || '',
              paymentType: option.paymentType || 'quarterly',
              basePrice: option.basePrice ?? '',
              discountAmount: option.discountAmount ?? '',
              adminFee: option.adminFee ?? '',
              durationDays: option.durationDays || 90,
              adminFeePolicy: option.adminFeePolicy || 'first_quarter_of_year',
              isActive: option.isActive ?? true,
            }))
          : [createEmptyPricingOption()],
        is_active: pkg.is_active ?? true,
      });
    } else {
      setIsEditing(false);
      setCurrentPkgId(null);
      setFormData(createInitialFormData());
    }
    setShowModal(true);
  };

  const handleCourseChange = (courseId) => {
    const nextCourse = courses.find((course) => course._id === courseId);
    const nextGrades = mergeGradeOptions(nextCourse?.level_id?.grades || []);

    setFormData((prev) => ({
      ...prev,
      course_id: courseId,
      gradeName: nextGrades.some((grade) => grade.toLowerCase() === normalizeGradeName(prev.gradeName).toLowerCase())
        ? prev.gradeName
        : '',
    }));
  };

  const handleFeatureChange = (index, value) => {
    const features = [...formData.features];
    features[index] = value;
    setFormData((prev) => ({ ...prev, features }));
  };

  const addFeature = () => {
    setFormData((prev) => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index) => {
    const features = formData.features.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, features: features.length ? features : [''] }));
  };

  const handlePricingOptionChange = (index, field, value) => {
    const pricingOptions = [...formData.pricingOptions];
    pricingOptions[index] = { ...pricingOptions[index], [field]: value };
    setFormData((prev) => ({ ...prev, pricingOptions }));
  };

  const addPricingOption = () => {
    setFormData((prev) => ({ ...prev, pricingOptions: [...prev.pricingOptions, createEmptyPricingOption()] }));
  };

  const removePricingOption = (index) => {
    const pricingOptions = formData.pricingOptions.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, pricingOptions: pricingOptions.length ? pricingOptions : [createEmptyPricingOption()] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const pricingOptions = formData.pricingOptions
      .map((option) => ({
        ...(option._id ? { _id: option._id } : {}),
        ...(option.key ? { key: option.key } : {}),
        label: option.label?.trim(),
        paymentType: option.paymentType,
        basePrice: Number(option.basePrice || 0),
        discountAmount: Number(option.discountAmount || 0),
        adminFee: Number(option.adminFee || 0),
        durationDays: Number(option.durationDays || 0),
        adminFeePolicy: option.adminFeePolicy,
        isActive: Boolean(option.isActive),
      }))
      .filter((option) => option.label && option.durationDays > 0);

    if (!pricingOptions.length) {
      toast.error('Please add at least one valid pricing option');
      return;
    }

    try {
      const payload = {
        course_id: formData.course_id,
        gradeName: normalizeGradeName(formData.gradeName),
        name: formData.name.trim(),
        mode: formData.mode,
        description: formData.description.trim(),
        features: formData.features.map((feature) => feature.trim()).filter(Boolean),
        pricingOptions,
        is_active: formData.is_active,
      };

      if (isEditing) {
        await updatePackage({ id: currentPkgId, ...payload }).unwrap();
        setSuccessMsg('Package updated successfully!');
      } else {
        await createPackage(payload).unwrap();
        setSuccessMsg('Package created successfully!');
      }

      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to save package.');
    }
  };

  const handleToggleStatus = async (pkg) => {
    try {
      await updatePackage({ id: pkg._id, is_active: !pkg.is_active }).unwrap();
      toast.success(`Package ${!pkg.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePackage(pkgToDelete._id).unwrap();
      setSuccessMsg('Package deleted permanently!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to delete package.');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-primary fw-bold">Loading packages...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark">Package Management</h2>
          <p className="text-muted">Manage packages and pricing options from the new schema.</p>
        </div>
        <Button variant="dark" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={() => handleOpenModal()}>
          <FaPlus /> Create New Package
        </Button>
      </div>

      <div className="bg-white p-4 rounded shadow-sm mb-4 border">
        <Row className="g-3 align-items-end">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1">Filter by Course</Form.Label>
              <Form.Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>{course.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {isError && (
        <Alert variant="danger">
          Failed to load packages: {error?.data?.error || 'Unknown error'}
        </Alert>
      )}

      {successMsg && (
        <Alert variant="success" className="d-flex align-items-center gap-2 shadow-sm border-0 mb-4">
          <FaCheckCircle /> {successMsg}
        </Alert>
      )}

      <div className="bg-white rounded shadow-sm overflow-hidden mb-4 border">
        <Table hover responsive className="mb-0">
          <thead className="bg-light text-secondary text-uppercase small fw-bold">
            <tr>
              <th className="ps-4 py-3">Package Name</th>
              <th className="py-3">Course</th>
              <th className="py-3 text-center">Mode</th>
              <th className="py-3 text-center">Grade</th>
              <th className="py-3 text-center">Starting Price</th>
              <th className="py-3">Pricing Options</th>
              <th className="py-3 text-center">Features</th>
              <th className="py-3">Status</th>
              <th className="text-end pe-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => {
              const pricingOptions = buildPackagePricingOptions(pkg);
              return (
                <tr key={pkg._id} className="align-middle">
                  <td className="ps-4">
                    <div className="d-flex align-items-center gap-3 py-2">
                      <div className="bg-dark bg-opacity-10 p-2 rounded text-dark">
                        <FaBoxOpen size={18} />
                      </div>
                      <div>
                        <div className="fw-bold">{pkg.name}</div>
                        <small className="text-muted d-block text-truncate" style={{ maxWidth: '220px' }}>{pkg.description || 'No description'}</small>
                      </div>
                    </div>
                  </td>
                  <td><div className="fw-medium small">{pkg.course_id?.title || 'N/A'}</div></td>
                  <td className="text-center">
                    <Badge bg={pkg.mode === 'Offline' ? 'warning' : 'info'} text={pkg.mode === 'Offline' ? 'dark' : undefined}>
                      {pkg.mode || 'Online'}
                    </Badge>
                  </td>
                  <td className="text-center">
                    {pkg.gradeName ? <Badge bg="secondary">{pkg.gradeName}</Badge> : <span className="text-muted small">All grades</span>}
                  </td>
                  <td className="text-center font-monospace fw-bold text-success">{formatPrice(pkg.displayPrice ?? getPackageDisplayPrice(pkg))}</td>
                  <td className="small">
                    {pricingOptions.length ? pricingOptions.map((option) => (
                      <div key={option.key} className="mb-1">
                        <span className="fw-semibold">{option.label}</span>
                        {' '}({option.paymentType}, {option.durationDays} days): {formatPrice(option.price)}
                        {!option.isActive && <span className="text-muted"> [inactive]</span>}
                      </div>
                    )) : <span className="text-muted">No pricing options</span>}
                  </td>
                  <td className="text-center">
                    <Badge bg="info" pill className="fw-normal">
                      {pkg.features?.length || 0} Features
                    </Badge>
                  </td>
                  <td>
                    <Badge pill bg={pkg.is_active ? 'success' : 'secondary'}>
                      {pkg.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </td>
                  <td className="text-end pe-4">
                    <Button
                      variant="link"
                      className={`p-0 me-3 ${pkg.is_active ? 'text-success' : 'text-secondary'}`}
                      onClick={() => handleToggleStatus(pkg)}
                      title={pkg.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {pkg.is_active ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                    </Button>
                    <Button variant="link" className="text-primary p-0 me-3" onClick={() => handleOpenModal(pkg)}>
                      <FaEdit size={18} />
                    </Button>
                    <Button variant="link" className="text-danger p-0" onClick={() => { setPkgToDelete(pkg); setShowDeleteModal(true); }}>
                      <FaTrash size={18} />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {packages.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center py-5 text-muted">
                  No packages found. Click &quot;Create New Package&quot; to get started.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="xl">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold fs-5">
            {isEditing ? `Edit Package: ${formData.name}` : 'Create New Package'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Row>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Select Course</Form.Label>
                <Form.Select required value={formData.course_id} onChange={(e) => handleCourseChange(e.target.value)}>
                  <option value="">-- Choose Course --</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>{course.title}</option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={2} className="mb-3">
                <Form.Label className="small fw-bold">Grade</Form.Label>
                <Form.Select value={formData.gradeName} onChange={(e) => setFormData((prev) => ({ ...prev, gradeName: e.target.value }))} disabled={!selectedCourseGrades.length}>
                  <option value="">{selectedCourseGrades.length ? 'All Grades' : 'No grades for this level'}</option>
                  {selectedCourseGrades.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={3} className="mb-3">
                <Form.Label className="small fw-bold">Package Name</Form.Label>
                <Form.Control required placeholder="e.g. Basic, Premium" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
              </Col>
              <Col md={3} className="mb-3">
                <Form.Label className="small fw-bold">Mode</Form.Label>
                <Form.Select required value={formData.mode} onChange={(e) => setFormData((prev) => ({ ...prev, mode: e.target.value }))}>
                  <option value="">Select Mode</option>
                  {modes.map((mode) => (
                    <option key={mode._id} value={mode.name}>{mode.name}</option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={12} className="mb-4">
                <Form.Label className="small fw-bold">Description</Form.Label>
                <Form.Control as="textarea" rows={2} placeholder="Brief summary of what this package includes" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} />
              </Col>

              <Col md={12} className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0">Pricing Options</h6>
                  <Button type="button" variant="outline-dark" size="sm" onClick={addPricingOption}>
                    + Add Pricing Option
                  </Button>
                </div>
                {formData.pricingOptions.map((option, idx) => (
                  <div key={idx} className="border rounded p-3 mb-3 bg-light-subtle">
                    <Row className="g-3">
                      <Col md={3}>
                        <Form.Label className="small fw-bold">Label</Form.Label>
                        <Form.Control
                          required
                          placeholder="Quarterly Plan"
                          value={option.label}
                          onChange={(e) => handlePricingOptionChange(idx, 'label', e.target.value)}
                        />
                      </Col>
                      <Col md={2}>
                        <Form.Label className="small fw-bold">Payment Type</Form.Label>
                        <Form.Select value={option.paymentType} onChange={(e) => handlePricingOptionChange(idx, 'paymentType', e.target.value)}>
                          <option value="quarterly">Quarterly</option>
                          <option value="annual">Annual</option>
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                        <Form.Label className="small fw-bold">Base Price</Form.Label>
                        <Form.Control type="number" min="0" value={option.basePrice} onChange={(e) => handlePricingOptionChange(idx, 'basePrice', e.target.value)} />
                      </Col>
                      <Col md={2}>
                        <Form.Label className="small fw-bold">Discount</Form.Label>
                        <Form.Control type="number" min="0" value={option.discountAmount} onChange={(e) => handlePricingOptionChange(idx, 'discountAmount', e.target.value)} />
                      </Col>
                      <Col md={2}>
                        <Form.Label className="small fw-bold">Admin Fee</Form.Label>
                        <Form.Control type="number" min="0" value={option.adminFee} onChange={(e) => handlePricingOptionChange(idx, 'adminFee', e.target.value)} />
                      </Col>
                      <Col md={1} className="d-flex align-items-end">
                        <Button type="button" variant="outline-danger" className="w-100" onClick={() => removePricingOption(idx)}>
                          <FaTrash size={12} />
                        </Button>
                      </Col>
                      <Col md={3}>
                        <Form.Label className="small fw-bold">Duration (Days)</Form.Label>
                        <Form.Control type="number" min="1" value={option.durationDays} onChange={(e) => handlePricingOptionChange(idx, 'durationDays', e.target.value)} />
                      </Col>
                      <Col md={5}>
                        <Form.Label className="small fw-bold">Admin Fee Policy</Form.Label>
                        <Form.Select value={option.adminFeePolicy} onChange={(e) => handlePricingOptionChange(idx, 'adminFeePolicy', e.target.value)}>
                          <option value="first_quarter_of_year">First quarter of year</option>
                          <option value="every_annual">Every annual</option>
                        </Form.Select>
                      </Col>
                      <Col md={4} className="d-flex align-items-end">
                        <Form.Check
                          type="switch"
                          id={`pricing-option-active-${idx}`}
                          label="Pricing option active"
                          checked={option.isActive}
                          onChange={(e) => handlePricingOptionChange(idx, 'isActive', e.target.checked)}
                        />
                      </Col>
                    </Row>
                  </div>
                ))}
              </Col>

              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <FaListUl size={14} /> Included Features
                  </h6>
                  <Button type="button" variant="outline-dark" size="sm" onClick={addFeature}>
                    + Add Feature
                  </Button>
                </div>
                {formData.features.map((feature, idx) => (
                  <Row key={idx} className="mb-2 g-2">
                    <Col>
                      <Form.Control placeholder="e.g. Live classes, practice support" value={feature} onChange={(e) => handleFeatureChange(idx, e.target.value)} />
                    </Col>
                    <Col xs="auto">
                      <Button type="button" variant="outline-danger" onClick={() => removeFeature(idx)}>
                        <FaTrash size={12} />
                      </Button>
                    </Col>
                  </Row>
                ))}
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="link" onClick={() => setShowModal(false)} className="text-secondary text-decoration-none">Cancel</Button>
            <Button variant="dark" type="submit" disabled={isCreating || isUpdating} className="px-5 shadow-sm rounded-pill">
              {isCreating || isUpdating ? <Spinner size="sm" /> : isEditing ? 'Update Package' : 'Create Package'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-danger">Delete Package</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div className="text-danger mb-3">
            <FaTrash size={48} />
          </div>
          <h5 className="fw-bold mb-2">Are you sure?</h5>
          <p className="text-muted mb-0 px-3">
            This will <strong>permanently delete</strong> the package <strong>{pkgToDelete?.name}</strong>.
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center pb-4">
          <Button variant="light" className="px-4" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" className="px-4" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Spinner size="sm" /> : 'Delete Now'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
