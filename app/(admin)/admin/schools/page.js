'use client';

import { useState } from 'react';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge } from 'react-bootstrap';
import WeeklyScheduleEditor from '@/components/schools/WeeklyScheduleEditor';
import { createDefaultSchoolSchedule } from '@/lib/schoolSchedule';
import { 
  useGetAdminSchoolsQuery,
  useCreateAdminSchoolMutation, 
  useUpdateAdminSchoolMutation, 
  useDeleteAdminSchoolMutation 
} from '@/redux/api/apiSlice';
import { FaEdit, FaTrash, FaPlus, FaCheckCircle, FaSchool } from 'react-icons/fa';
import GooglePlaceSelect from '@/components/common/GooglePlaceSelect';

export default function SchoolsPage() {
  const [filters, setFilters] = useState({ city: '', status: '' });
  
  const { data, isLoading, isError, error } = useGetAdminSchoolsQuery(filters);
  
  const [createSchool, { isLoading: isCreating }] = useCreateAdminSchoolMutation();
  const [updateSchool, { isLoading: isUpdating }] = useUpdateAdminSchoolMutation();
  const [deleteSchool, { isLoading: isDeleting }] = useDeleteAdminSchoolMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  
  const [formData, setFormData] = useState({ 
    schoolName: '', 
    schoolCode: '', 
    board: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    city: '',
    state: '',
    pinCode: '',
    address: '',
    weeklySchedule: createDefaultSchoolSchedule(),
    status: 'active'
  });
  const [successMsg, setSuccessMsg] = useState('');

  const schools = data?.schools || [];

  const handleOpenModal = (school = null) => {
    if (school) {
      setEditingSchool(school);
      setFormData({ 
        schoolName: school.schoolName, 
        schoolCode: school.schoolCode || '', 
        board: school.board || '',
        contactPerson: school.contactPerson || '',
        contactPhone: school.contactPhone || '',
        contactEmail: school.contactEmail || '',
        city: school.city || '',
        state: school.state || '',
        pinCode: school.pinCode || '',
        address: school.address || '',
        weeklySchedule: school.weeklySchedule || createDefaultSchoolSchedule(),
        status: school.status || 'active'
      });
    } else {
      setEditingSchool(null);
      setFormData({ 
        schoolName: '', 
        schoolCode: '', 
        board: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
        city: '',
        state: '',
        pinCode: '',
        address: '',
        weeklySchedule: createDefaultSchoolSchedule(),
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchool(null);
  };

  const handleAddressSelect = (place) => {
    if (!place) return;
    setFormData((prev) => ({
      ...prev,
      address: place.label || prev.address,
      city: place.city || prev.city,
      state: place.state || prev.state,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchool) {
        await updateSchool({ id: editingSchool._id, ...formData }).unwrap();
        setSuccessMsg('School updated successfully!');
      } else {
        await createSchool(formData).unwrap();
        setSuccessMsg('School created successfully!');
      }
      handleCloseModal();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to save school.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSchool(schoolToDelete._id).unwrap();
      setSuccessMsg('School deleted successfully!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to delete school.');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading schools...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">School Management</h2>
          <p className="text-muted">Manage partner schools and agreements</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2" onClick={() => handleOpenModal()}>
          <FaPlus /> Add School
        </Button>
      </div>

      <div className="bg-white p-3 rounded shadow-sm mb-4 border d-flex flex-wrap align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted fw-bold small">City:</span>
          <Form.Control 
            type="text"
            placeholder="Search city..."
            style={{ width: '150px' }}
            value={filters.city}
            onChange={(e) => setFilters({...filters, city: e.target.value})}
          />
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted fw-bold small">Status:</span>
          <Form.Select 
            style={{ width: '130px' }}
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Form.Select>
        </div>
      </div>

      {successMsg && (
        <Alert variant="success" className="d-flex align-items-center gap-2 shadow-sm border-0">
          <FaCheckCircle /> {successMsg}
        </Alert>
      )}

      {isError && (
        <Alert variant="danger" className="border-0 shadow-sm">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error?.data?.error || 'Failed to load schools'}</p>
        </Alert>
      )}

      <div className="bg-white rounded shadow-sm overflow-hidden mb-4 border">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="ps-4">School Name</th>
              <th>Board</th>
              <th>City</th>
              <th>Status</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((school) => (
              <tr key={school._id}>
                <td className="ps-4">
                  <div className="d-flex align-items-center gap-3 py-1">
                    <div className="bg-light p-2 rounded">
                      <FaSchool className="text-success" />
                    </div>
                    <div>
                      <div className="fw-bold">{school.schoolName}</div>
                      <small className="text-muted">{school.schoolCode}</small>
                    </div>
                  </div>
                </td>
                <td>{school.board || 'N/A'}</td>
                <td>{school.city || 'N/A'}</td>
                <td>
                  <Badge pill bg={school.status === 'active' ? 'success' : 'secondary'}>
                    {school.status}
                  </Badge>
                </td>
                <td className="text-end pe-4">
                  <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenModal(school)}>
                    <FaEdit />
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => { setSchoolToDelete(school); setShowDeleteModal(true); }}>
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
            {schools.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-5 text-muted">
                  No schools found matching the criteria.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="xl">
        <Modal.Header closeButton>
          <Modal.Title>{editingSchool ? 'Edit School' : 'Add New School'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="bg-light p-4">
            <h6 className="fw-bold mb-3 text-primary">Basic Information</h6>
            <div className="row bg-white p-3 rounded shadow-xs mb-4">
              <div className="col-md-6 mb-3">
                <Form.Label>School Name</Form.Label>
                <Form.Control 
                  type="text" 
                  required 
                  value={formData.schoolName}
                  onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                />
              </div>
              <div className="col-md-6 mb-3">
                <Form.Label>School Code</Form.Label>
                <Form.Control 
                  type="text" 
                  value={formData.schoolCode}
                  onChange={(e) => setFormData({...formData, schoolCode: e.target.value})}
                />
              </div>
              <div className="col-md-4 mb-4">
                <Form.Label>Board</Form.Label>
                <Form.Control 
                  type="text" 
                  value={formData.board}
                  onChange={(e) => setFormData({...formData, board: e.target.value})}
                  placeholder="e.g., CBSE, ICSE"
                />
              </div>
              <div className="col-12 mb-4">
                <Form.Label>Search Address</Form.Label>
                <GooglePlaceSelect
                  value={formData.address ? { label: formData.address, value: formData.address } : null}
                  onChange={handleAddressSelect}
                />
              </div>
              <div className="col-md-4 mb-4">
                <Form.Label>City</Form.Label>
                <Form.Control 
                  type="text" 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className="col-md-4 mb-4">
                <Form.Label>State</Form.Label>
                <Form.Control 
                  type="text" 
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                />
              </div>
              <div className="col-md-4 mb-4">
                <Form.Label>PIN Code</Form.Label>
                <Form.Control 
                  type="text" 
                  value={formData.pinCode}
                  onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
                />
              </div>
              <div className="col-12 mb-4">
                <Form.Label>Address</Form.Label>
                <Form.Control 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="col-md-4 mb-4">
                <Form.Label>Status</Form.Label>
                <Form.Select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </div>
            </div>

            <h6 className="fw-bold mb-3 text-primary">Weekly Availability</h6>
            <div className="bg-white p-3 rounded shadow-xs mb-4">
              <WeeklyScheduleEditor
                value={formData.weeklySchedule}
                onChange={(weeklySchedule) => setFormData({ ...formData, weeklySchedule })}
              />
            </div>

            <h6 className="fw-bold mb-3 text-primary">Contact Details</h6>
            <div className="row bg-white p-3 rounded shadow-xs mb-0">
              <div className="col-md-4 mb-3">
                <Form.Label>Contact Person</Form.Label>
                <Form.Control 
                  type="text" 
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                />
              </div>
              <div className="col-md-4 mb-3">
                <Form.Label>Contact Phone</Form.Label>
                <Form.Control 
                  type="text" 
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                />
              </div>
              <div className="col-md-4 mb-3">
                <Form.Label>Contact Email</Form.Label>
                <Form.Control 
                  type="email" 
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? <Spinner size="sm" /> : 'Save School'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete school <strong>{schoolToDelete?.schoolName}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Spinner size="sm" /> : 'Delete School'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
