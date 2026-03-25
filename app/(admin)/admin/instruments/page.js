'use client';

import { useState } from 'react';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge, Row, Col } from 'react-bootstrap';
import { 
  useGetAdminInstrumentsQuery,
  useCreateAdminInstrumentMutation,
  useUpdateAdminInstrumentMutation,
  useDeleteAdminInstrumentMutation
} from '@/redux/api/apiSlice';
import { FaEdit, FaTrash, FaPlus, FaCheckCircle, FaMusic, FaListOl } from 'react-icons/fa';
import Link from 'next/link';

export default function InstrumentsPage() {
  const { data, isLoading, isError, error } = useGetAdminInstrumentsQuery();
  const [createInstrument, { isLoading: isCreating }] = useCreateAdminInstrumentMutation();
  const [updateInstrument, { isLoading: isUpdating }] = useUpdateAdminInstrumentMutation();
  const [deleteInstrument, { isLoading: isDeleting }] = useDeleteAdminInstrumentMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState(null);
  const [instrumentToDelete, setInstrumentToDelete] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [successMsg, setSuccessMsg] = useState('');

  const instruments = data?.instruments || [];

  const handleOpenModal = (instrument = null) => {
    if (instrument) {
      setEditingInstrument(instrument);
      setFormData({ name: instrument.name, description: instrument.description || '', status: instrument.status });
    } else {
      setEditingInstrument(null);
      setFormData({ name: '', description: '', status: 'active' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInstrument) {
        await updateInstrument({ id: editingInstrument._id, ...formData }).unwrap();
        setSuccessMsg('Instrument updated successfully!');
      } else {
        await createInstrument(formData).unwrap();
        setSuccessMsg('Instrument created successfully!');
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to save instrument.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInstrument(instrumentToDelete._id).unwrap();
      setSuccessMsg('Instrument deleted successfully!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to delete instrument.');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-primary fw-bold">Loading instruments...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark">Instrument Management</h2>
          <p className="text-muted">Manage available musical instruments and their levels</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={() => handleOpenModal()}>
          <FaPlus /> Add Instrument
        </Button>
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
              <th className="ps-4 py-3">Instrument Name</th>
              <th className="py-3">Description</th>
              <th className="py-3">Status</th>
              <th className="py-3 text-center">Levels</th>
              <th className="text-end pe-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {instruments.map((item) => (
              <tr key={item._id} className="align-middle">
                <td className="ps-4">
                  <div className="d-flex align-items-center gap-3 py-2">
                    <div className="bg-primary bg-opacity-10 p-2 rounded text-primary">
                      <FaMusic size={18} />
                    </div>
                    <div className="fw-bold">{item.name}</div>
                  </div>
                </td>
                <td className="text-muted small">
                  {item.description || <em className="text-light">No description</em>}
                </td>
                <td>
                  <Badge pill bg={item.status === 'active' ? 'success' : 'secondary'}>
                    {item.status?.toUpperCase()}
                  </Badge>
                </td>
                <td className="text-center">
                  <Link href={`/admin/instruments/${item._id}/levels`}>
                    <Button variant="outline-info" size="sm" className="rounded-pill px-3 d-inline-flex align-items-center gap-2">
                       <FaListOl size={12} /> Manage Levels
                    </Button>
                  </Link>
                </td>
                <td className="text-end pe-4">
                  <Button variant="outline-primary" size="sm" className="me-2 rounded-circle" onClick={() => handleOpenModal(item)}>
                    <FaEdit size={12} />
                  </Button>
                  <Button variant="outline-danger" size="sm" className="rounded-circle" onClick={() => { setInstrumentToDelete(item); setShowDeleteModal(true); }}>
                    <FaTrash size={12} />
                  </Button>
                </td>
              </tr>
            ))}
            {instruments.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-5 text-muted">
                  No instruments found. Click "Add Instrument" to create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">{editingInstrument ? 'Edit Instrument' : 'Add New Instrument'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Instrument Name</Form.Label>
              <Form.Control 
                required 
                placeholder="e.g. Guitar, Piano, Vocals" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                placeholder="Brief details about this instrument..." 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
              />
            </Form.Group>
            <Form.Group className="mb-0">
              <Form.Label className="small fw-bold">Status</Form.Label>
              <Form.Select 
                value={formData.status} 
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="link" onClick={() => setShowModal(false)} className="text-secondary text-decoration-none">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating} className="px-4 shadow-sm rounded-pill">
              {isCreating || isUpdating ? <Spinner size="sm" /> : 'Save Instrument'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold text-danger">Delete Instrument</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="mb-0">Are you sure you want to delete <strong>{instrumentToDelete?.name}</strong>?</p>
          <p className="text-muted small mt-2">This action can only be performed if no levels or batches are assigned to this instrument.</p>
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
