'use client';

import { useState } from 'react';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge, Row, Col } from 'react-bootstrap';
import { 
  useGetAdminBatchesQuery,
  useGetAdminUsersQuery,
  useGetAdminInstrumentsQuery,
  useGetAdminLevelsQuery,
  useCreateAdminBatchMutation, 
  useDeleteAdminBatchMutation 
} from '@/redux/api/apiSlice';
import { FaTrash, FaPlus, FaCheckCircle, FaLayerGroup, FaFilter, FaCalendarAlt, FaUserTie } from 'react-icons/fa';
import Link from 'next/link';
import { useSelector } from 'react-redux';

export default function SchoolBatchesPage() {
  const { user } = useSelector((state) => state.auth);
  const schoolId = user?.schoolId || user?._id;

  const [filters, setFilters] = useState({ 
    schoolId: schoolId, 
    teacherId: '', 
    programType: '' 
  });
  
  const { data, isLoading, isError, error } = useGetAdminBatchesQuery(filters);
  const { data: userData } = useGetAdminUsersQuery({ role: 'instructor' });
  const { data: instrumentData } = useGetAdminInstrumentsQuery({ status: 'active' });
  
  const [createBatch, { isLoading: isCreating }] = useCreateAdminBatchMutation();
  const [deleteBatch, { isLoading: isDeleting }] = useDeleteAdminBatchMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  
  const [formData, setFormData] = useState({ 
    batchName: '', schoolId: schoolId, programType: 'in_school', 
    instrument: 'Keyboard', level: 'Foundation', teacherId: '', 
    maxStrength: 20, startDate: '', endDate: '', status: 'active'
  });
  const [successMsg, setSuccessMsg] = useState('');

  const batches = data?.batches || [];
  const teachers = userData?.data || [];
  const activeInstruments = instrumentData?.instruments || [];

  // Fetch levels for the selected instrument in the form
  const selectedInstrument = activeInstruments.find(i => i.name === formData.instrument);
  const { data: levelData } = useGetAdminLevelsQuery(
    { instrumentId: selectedInstrument?._id, status: 'active' }, 
    { skip: !selectedInstrument }
  );
  const availableLevels = levelData?.levels || [];

  const handleOpenModal = () => {
    setFormData({ 
      batchName: '', schoolId: schoolId, programType: 'in_school', 
      instrument: 'Keyboard', level: 'Foundation', teacherId: '', 
      maxStrength: 20, startDate: '', endDate: '', status: 'active'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBatch(formData).unwrap();
      setSuccessMsg('Batch created successfully!');
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to create batch.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBatch(batchToDelete._id).unwrap();
      setSuccessMsg('Batch deleted successfully!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to delete batch.');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-primary fw-bold">Loading batches...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark">Batch Management</h2>
          <p className="text-muted">Schedule classes, assign teachers, and manage capacity</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={handleOpenModal}>
          <FaPlus /> Create New Batch
        </Button>
      </div>

      <div className="bg-white p-4 rounded shadow-sm mb-4 border">
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaFilter size={12} /> Teacher
              </Form.Label>
              <Form.Select 
                value={filters.teacherId}
                onChange={(e) => setFilters({...filters, teacherId: e.target.value})}
              >
                <option value="">All Teachers</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaFilter size={12} /> Program Type
              </Form.Label>
              <Form.Select 
                value={filters.programType}
                onChange={(e) => setFilters({...filters, programType: e.target.value})}
              >
                <option value="">All Programs</option>
                <option value="in_school">In School</option>
                <option value="after_school">After School</option>
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
              <th className="ps-4 py-3">Batch Name</th>
              <th className="py-3">Details</th>
              <th>Teacher</th>
              <th className="py-3 text-center">Strength</th>
              <th className="py-3">Status</th>
              <th className="text-end pe-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch._id} className="align-middle">
                <td className="ps-4">
                  <div className="d-flex align-items-center gap-3 py-2">
                    <div className="bg-primary bg-opacity-10 p-2 rounded text-primary">
                      <FaLayerGroup size={18} />
                    </div>
                    <div>
                      <div className="fw-bold">{batch.batchName}</div>
                      <small className="text-muted d-block">{batch.instrument} - {batch.level}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="small">
                    <div className="d-flex align-items-center gap-1 text-muted">
                      <FaCalendarAlt size={10} /> {batch.startDate ? new Date(batch.startDate).toLocaleDateString() : 'N/A'}
                    </div>
                    <Badge bg="light" text="dark" className="border mt-1">
                      {batch.programType?.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </td>
                <td>
                  <div className="small">
                    <div className="text-muted"><FaUserTie size={10} /> {batch.teacherId?.name || 'N/A'}</div>
                  </div>
                </td>
                <td className="text-center font-monospace">
                   <span className="fw-bold text-primary">?</span> / {batch.maxStrength}
                </td>
                <td>
                  <Badge pill bg={batch.status === 'active' ? 'success' : 'secondary'}>
                    {batch.status?.toUpperCase()}
                  </Badge>
                </td>
                <td className="text-end pe-4">
                  <Link href={`/school/batches/${batch._id}`} passHref>
                    <Button variant="outline-primary" size="sm" className="me-2 rounded-pill px-3">
                      Manage
                    </Button>
                  </Link>
                  <Button variant="outline-danger" size="sm" className="rounded-circle shadow-xs" onClick={() => { setBatchToDelete(batch); setShowDeleteModal(true); }}>
                    <FaTrash size={12} />
                  </Button>
                </td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-5 text-muted">
                  No batches found matching selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Create Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold fs-5">Create New Academic Batch</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Row className="mb-4">
              <Col md={12} className="mb-3">
                <Form.Label className="small fw-bold">Batch Name</Form.Label>
                <Form.Control required placeholder="e.g. MON-WED-A" value={formData.batchName} onChange={(e) => setFormData({...formData, batchName: e.target.value})} />
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Program Type</Form.Label>
                <Form.Select value={formData.programType} onChange={(e) => setFormData({...formData, programType: e.target.value})}>
                  <option value="in_school">In School</option>
                  <option value="after_school">After School</option>
                </Form.Select>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Instrument</Form.Label>
                <Form.Select 
                  value={formData.instrument} 
                  onChange={(e) => setFormData({...formData, instrument: e.target.value, level: ''})}
                >
                  <option value="">Select Instrument</option>
                  {activeInstruments.map(i => <option key={i._id} value={i.name}>{i.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Level</Form.Label>
                <Form.Select 
                  value={formData.level} 
                  onChange={(e) => setFormData({...formData, level: e.target.value})}
                  disabled={!formData.instrument}
                >
                  <option value="">Select Level</option>
                  {availableLevels.map(l => <option key={l._id} value={l.levelName}>{l.levelName}</option>)}
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label className="small fw-bold">Assigned Teacher</Form.Label>
                <Form.Select required value={formData.teacherId} onChange={(e) => setFormData({...formData, teacherId: e.target.value})}>
                  <option value="">Select Instructor</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label className="small fw-bold">Max Capacity</Form.Label>
                <Form.Control type="number" required min="1" value={formData.maxStrength} onChange={(e) => setFormData({...formData, maxStrength: e.target.value})} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Start Date</Form.Label>
                <Form.Control type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">End Date</Form.Label>
                <Form.Control type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Status</Form.Label>
                <Form.Select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="link" onClick={() => setShowModal(false)} className="text-secondary text-decoration-none">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating} className="px-5 shadow-sm rounded-pill">
              {isCreating ? <Spinner size="sm" /> : 'Create Batch'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold text-danger">Delete Batch</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="mb-0">Are you sure you want to delete batch <strong>{batchToDelete?.batchName}</strong>?</p>
          <p className="text-muted small mt-2">This will also remove all student enrollment records associated with this batch.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting} className="px-4">
            {isDeleting ? <Spinner size="sm" /> : 'Confirm Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
