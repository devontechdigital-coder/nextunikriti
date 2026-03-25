'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge, Row, Col, Breadcrumb } from 'react-bootstrap';
import { 
  useGetAdminLevelsQuery,
  useCreateAdminLevelMutation,
  useUpdateAdminLevelMutation,
  useDeleteAdminLevelMutation,
  useGetAdminInstrumentsQuery
} from '@/redux/api/apiSlice';
import { FaEdit, FaTrash, FaPlus, FaCheckCircle, FaArrowLeft, FaSortNumericDown } from 'react-icons/fa';
import Link from 'next/link';

export default function LevelsPage() {
  const { id: instrumentId } = useParams();
  const router = useRouter();

  const { data: instrumentData } = useGetAdminInstrumentsQuery();
  const { data, isLoading, isError, error } = useGetAdminLevelsQuery({ instrumentId });
  
  const [createLevel, { isLoading: isCreating }] = useCreateAdminLevelMutation();
  const [updateLevel, { isLoading: isUpdating }] = useUpdateAdminLevelMutation();
  const [deleteLevel, { isLoading: isDeleting }] = useDeleteAdminLevelMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [levelToDelete, setLevelToDelete] = useState(null);
  
  const [formData, setFormData] = useState({ levelName: '', orderNo: 0, description: '', status: 'active' });
  const [successMsg, setSuccessMsg] = useState('');

  const levels = data?.levels || [];
  const instrument = instrumentData?.instruments?.find(i => i._id === instrumentId);

  const handleOpenModal = (level = null) => {
    if (level) {
      setEditingLevel(level);
      setFormData({ 
        levelName: level.levelName, 
        orderNo: level.orderNo, 
        description: level.description || '', 
        status: level.status 
      });
    } else {
      setEditingLevel(null);
      setFormData({ 
        levelName: '', 
        orderNo: levels.length > 0 ? Math.max(...levels.map(l => l.orderNo)) + 1 : 1, 
        description: '', 
        status: 'active' 
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLevel) {
        await updateLevel({ id: editingLevel._id, ...formData }).unwrap();
        setSuccessMsg('Level updated successfully!');
      } else {
        await createLevel({ instrumentId, ...formData }).unwrap();
        setSuccessMsg('Level created successfully!');
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to save level.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLevel(levelToDelete._id).unwrap();
      setSuccessMsg('Level deleted successfully!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to delete level.');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-primary fw-bold">Loading instrument levels...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Breadcrumb className="mb-4 small">
        <Breadcrumb.Item href="/admin/instruments" linkAs={Link}>Instruments</Breadcrumb.Item>
        <Breadcrumb.Item active>{instrument?.name || 'Instrument'} Levels</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0 text-dark">
            <span className="text-primary">{instrument?.name}</span> Levels
          </h2>
          <p className="text-muted">Manage progression levels for this instrument</p>
        </div>
        <div className="d-flex gap-2">
           <Button variant="outline-secondary" onClick={() => router.back()} className="d-flex align-items-center gap-2">
              <FaArrowLeft /> Back
           </Button>
           <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={() => handleOpenModal()}>
              <FaPlus /> Add Level
           </Button>
        </div>
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
              <th className="ps-4 py-3" style={{ width: '80px' }}>Order</th>
              <th className="py-3">Level Name</th>
              <th className="py-3">Description</th>
              <th className="py-3">Status</th>
              <th className="text-end pe-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((item) => (
              <tr key={item._id} className="align-middle">
                <td className="ps-4">
                   <Badge bg="light" text="dark" className="border px-3 py-2 fw-bold text-primary">
                     #{item.orderNo}
                   </Badge>
                </td>
                <td className="fw-bold">{item.levelName}</td>
                <td className="text-muted small">
                  {item.description || <em className="text-light">No description</em>}
                </td>
                <td>
                  <Badge pill bg={item.status === 'active' ? 'success' : 'secondary'}>
                    {item.status?.toUpperCase()}
                  </Badge>
                </td>
                <td className="text-end pe-4">
                  <Button variant="outline-primary" size="sm" className="me-2 rounded-circle" onClick={() => handleOpenModal(item)}>
                    <FaEdit size={12} />
                  </Button>
                  <Button variant="outline-danger" size="sm" className="rounded-circle" onClick={() => { setLevelToDelete(item); setShowDeleteModal(true); }}>
                    <FaTrash size={12} />
                  </Button>
                </td>
              </tr>
            ))}
            {levels.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-5 text-muted">
                  No levels defined for this instrument yet.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5">{editingLevel ? 'Edit Level' : 'Add New level'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Level Name</Form.Label>
              <Form.Control 
                required 
                placeholder="e.g. Foundation, Grade 1, Advanced" 
                value={formData.levelName} 
                onChange={(e) => setFormData({...formData, levelName: e.target.value})} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Order Number (Sorting)</Form.Label>
              <Form.Control 
                type="number"
                min="1"
                required 
                value={formData.orderNo} 
                onChange={(e) => setFormData({...formData, orderNo: parseInt(e.target.value)})} 
              />
              <Form.Text className="text-muted">Used to sort levels in the batch selection (lower numbers first).</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={2}
                placeholder="Details about syllabus or requirements..." 
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
              {isCreating || isUpdating ? <Spinner size="sm" /> : 'Save Level'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold text-danger">Delete Level</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="mb-0">Are you sure you want to delete <strong>{levelToDelete?.levelName}</strong>?</p>
          <p className="text-muted small mt-2">This action can only be performed if no active batches are linked to this level.</p>
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
