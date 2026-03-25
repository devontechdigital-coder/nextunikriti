'use client';

import { useState } from 'react';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge, Row, Col } from 'react-bootstrap';
import { 
  useGetAdminPackagesQuery,
  useCreateAdminPackageMutation,
  useUpdateAdminPackageMutation,
  useDeleteAdminPackageMutation,
  useGetAdminCoursesQuery
} from '@/redux/api/apiSlice';
import { FaEdit, FaTrash, FaPlus, FaCheckCircle, FaBoxOpen, FaListUl, FaToggleOn, FaToggleOff } from 'react-icons/fa';

export default function PackagesPage() {
  const [courseFilter, setCourseFilter] = useState('');
  const { data, isLoading, isError, error } = useGetAdminPackagesQuery(courseFilter ? { course_id: courseFilter } : {});
  const { data: coursesData } = useGetAdminCoursesQuery();

  const [createPackage, { isLoading: isCreating }] = useCreateAdminPackageMutation();
  const [updatePackage, { isLoading: isUpdating }] = useUpdateAdminPackageMutation();
  const [deletePackage, { isLoading: isDeleting }] = useDeleteAdminPackageMutation();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPkgId, setCurrentPkgId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pkgToDelete, setPkgToDelete] = useState(null);
  
  const [formData, setFormData] = useState({ 
    course_id: '',
    name: '',
    price: 0,
    days: 0,
    description: '',
    features: [''],
    is_active: true
  });
  
  const [successMsg, setSuccessMsg] = useState('');

  const packages = data?.packages || [];
  const courses = coursesData?.data || [];

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setIsEditing(true);
      setCurrentPkgId(pkg._id);
      setFormData({
        course_id: pkg.course_id?._id || pkg.course_id || '',
        name: pkg.name,
        price: pkg.price,
        days: pkg.days || 0,
        description: pkg.description || '',
        features: pkg.features && pkg.features.length > 0 ? pkg.features : [''],
        is_active: pkg.is_active
      });
    } else {
      setIsEditing(false);
      setCurrentPkgId(null);
      setFormData({ 
        course_id: '',
        name: '',
        price: 0,
        days: 0,
        description: '',
        features: [''],
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length > 0 ? newFeatures : [''] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Filter out empty features
      const filteredFormData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== '')
      };

      if (isEditing) {
        await updatePackage({ id: currentPkgId, ...filteredFormData }).unwrap();
        setSuccessMsg('Package updated successfully!');
      } else {
        await createPackage(filteredFormData).unwrap();
        setSuccessMsg('Package created successfully!');
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to save package.');
    }
  };

  const handleToggleStatus = async (pkg) => {
    try {
      await updatePackage({ id: pkg._id, is_active: !pkg.is_active }).unwrap();
      toast.success(`Package ${!pkg.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      toast.error(err.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePackage(pkgToDelete._id).unwrap();
      setSuccessMsg('Package deleted permanently!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to deactivate package.');
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
          <p className="text-muted">Define pricing tiers and features for your courses</p>
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
              <Form.Select 
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                <option value="">All Courses</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </div>

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
              <th className="py-3 text-center">Price</th>
              <th className="py-3 text-center">Duration</th>
              <th className="py-3 text-center">Features</th>
              <th className="py-3">Status</th>
              <th className="text-end pe-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg._id} className="align-middle">
                <td className="ps-4">
                  <div className="d-flex align-items-center gap-3 py-2">
                    <div className="bg-dark bg-opacity-10 p-2 rounded text-dark">
                      <FaBoxOpen size={18} />
                    </div>
                    <div>
                      <div className="fw-bold">{pkg.name}</div>
                      <small className="text-muted d-block text-truncate" style={{maxWidth: '200px'}}>{pkg.description}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="fw-medium small">{pkg.course_id?.title || 'N/A'}</div>
                </td>
                <td className="text-center font-monospace fw-bold text-success">
                  ₹{pkg.price.toLocaleString()}
                </td>
                <td className="text-center">
                  <Badge bg="secondary" pill className="fw-normal">
                    {pkg.days || 0} Days
                  </Badge>
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
                  <Button 
                    variant="link" 
                    className="text-primary p-0 me-3" 
                    onClick={() => handleOpenModal(pkg)}
                  >
                    <FaEdit size={18} />
                  </Button>
                  <Button 
                    variant="link" 
                    className="text-danger p-0" 
                    onClick={() => { setPkgToDelete(pkg); setShowDeleteModal(true); }}
                  >
                    <FaTrash size={18} />
                  </Button>
                </td>
              </tr>
            ))}
            {packages.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">
                  No packages found. Click "Create New Package" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold fs-5">
            {isEditing ? `Edit Package: ${formData.name}` : 'Create New Package'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Row>
              <Col md={12} className="mb-3">
                <Form.Label className="small fw-bold">Select Course</Form.Label>
                <Form.Select 
                  required 
                  value={formData.course_id} 
                  onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </Form.Select>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Package Name</Form.Label>
                <Form.Control 
                  required 
                  placeholder="e.g. Basic, Premium, Lifetime Access" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Price (₹)</Form.Label>
                <Form.Control 
                  type="number" 
                  required 
                  min="0" 
                  value={formData.price} 
                  onChange={(e) => setFormData({...formData, price: e.target.value})} 
                />
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Duration (Days)</Form.Label>
                <Form.Control 
                  type="number" 
                  required 
                  min="0" 
                  value={formData.days} 
                  onChange={(e) => setFormData({...formData, days: Number(e.target.value)})} 
                />
              </Col>
              <Col md={12} className="mb-4">
                <Form.Label className="small fw-bold">Description (Optional)</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2} 
                  placeholder="Brief summary of what this package includes"
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </Col>
              
              <Col md={12}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <FaListUl size={14} /> Included Features
                  </h6>
                  <Button variant="outline-dark" size="sm" onClick={addFeature}>
                    + Add Feature
                  </Button>
                </div>
                {formData.features.map((feature, idx) => (
                  <Row key={idx} className="mb-2 g-2">
                    <Col>
                      <Form.Control 
                        placeholder="e.g. 24/7 Support, Downloadable Resources" 
                        value={feature} 
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                      />
                    </Col>
                    <Col xs="auto">
                      <Button variant="outline-danger" onClick={() => removeFeature(idx)}>
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

      {/* Delete Confirmation Modal */}
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
          <Button 
            variant="danger" 
            className="px-4" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Spinner size="sm" /> : 'Delete Now'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
