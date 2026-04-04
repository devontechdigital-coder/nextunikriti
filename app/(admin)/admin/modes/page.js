'use client';

import { useState } from 'react';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge } from 'react-bootstrap';
import {
  useGetAdminModesQuery,
  useCreateAdminModeMutation,
  useUpdateAdminModeMutation,
  useDeleteAdminModeMutation
} from '@/redux/api/apiSlice';
import { FaEdit, FaTrash, FaPlus, FaCheckCircle, FaSlidersH } from 'react-icons/fa';

export default function ModesPage() {
  const { data, isLoading, isError, error } = useGetAdminModesQuery();
  const [createMode, { isLoading: isCreating }] = useCreateAdminModeMutation();
  const [updateMode, { isLoading: isUpdating }] = useUpdateAdminModeMutation();
  const [deleteMode, { isLoading: isDeleting }] = useDeleteAdminModeMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingMode, setEditingMode] = useState(null);
  const [modeToDelete, setModeToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [successMsg, setSuccessMsg] = useState('');

  const modes = data?.modes || [];

  const handleOpenModal = (mode = null) => {
    if (mode) {
      setEditingMode(mode);
      setFormData({ name: mode.name, description: mode.description || '', status: mode.status || 'active' });
    } else {
      setEditingMode(null);
      setFormData({ name: '', description: '', status: 'active' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMode) {
        await updateMode({ id: editingMode._id, ...formData }).unwrap();
        setSuccessMsg('Mode updated successfully!');
      } else {
        await createMode(formData).unwrap();
        setSuccessMsg('Mode created successfully!');
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to save mode.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMode(modeToDelete._id).unwrap();
      setSuccessMsg('Mode deleted successfully!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to delete mode.');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-primary fw-bold">Loading modes...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark">Mode Management</h2>
          <p className="text-muted">Create, edit, and delete course or package modes.</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={() => handleOpenModal()}>
          <FaPlus /> Add Mode
        </Button>
      </div>

      {isError && (
        <Alert variant="danger">
          Failed to load modes: {error?.data?.error || 'Unknown error'}
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
              <th className="ps-4 py-3">Mode Name</th>
              <th className="py-3">Description</th>
              <th className="py-3">Status</th>
              <th className="text-end pe-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {modes.map((mode) => (
              <tr key={mode._id} className="align-middle">
                <td className="ps-4">
                  <div className="d-flex align-items-center gap-3 py-2">
                    <div className="bg-primary bg-opacity-10 p-2 rounded text-primary">
                      <FaSlidersH size={18} />
                    </div>
                    <div className="fw-bold">{mode.name}</div>
                  </div>
                </td>
                <td className="text-muted small">
                  {mode.description || <em className="text-light">No description</em>}
                </td>
                <td>
                  <Badge pill bg={mode.status === 'active' ? 'success' : 'secondary'}>
                    {mode.status?.toUpperCase()}
                  </Badge>
                </td>
                <td className="text-end pe-4">
                  <Button variant="outline-primary" size="sm" className="me-2 rounded-circle" onClick={() => handleOpenModal(mode)}>
                    <FaEdit size={12} />
                  </Button>
                  <Button variant="outline-danger" size="sm" className="rounded-circle" onClick={() => { setModeToDelete(mode); setShowDeleteModal(true); }}>
                    <FaTrash size={12} />
                  </Button>
                </td>
              </tr>
            ))}
            {modes.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-5 text-muted">
                  No modes found. Click "Add Mode" to create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">{editingMode ? 'Edit Mode' : 'Add New Mode'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Mode Name</Form.Label>
              <Form.Control
                required
                placeholder="e.g. Online, Offline, Hybrid"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Brief details about this mode..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-bold">Status</Form.Label>
              <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="link" onClick={() => setShowModal(false)} className="text-secondary text-decoration-none">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating} className="px-4 shadow-sm rounded-pill">
              {isCreating || isUpdating ? <Spinner size="sm" /> : 'Save Mode'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold text-danger">Delete Mode</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="mb-0">Are you sure you want to delete <strong>{modeToDelete?.name}</strong>?</p>
          <p className="text-muted small mt-2">This action can only be performed if no course or package is using this mode.</p>
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
