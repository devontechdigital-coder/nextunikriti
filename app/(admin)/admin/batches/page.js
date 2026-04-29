'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge, Row, Col } from 'react-bootstrap';
import {
  useGetAdminBatchesQuery,
  useGetAdminSchoolsQuery,
  useGetAdminUsersQuery,
  useGetAdminInstrumentsQuery,
  useGetAdminLevelsQuery,
  useCreateAdminBatchMutation,
  useDeleteAdminBatchMutation,
  useUpdateAdminBatchMutation
} from '@/redux/api/apiSlice';
import { FaEdit, FaTrash, FaPlus, FaCheckCircle, FaLayerGroup, FaFilter, FaUserTie } from 'react-icons/fa';
import Link from 'next/link';
import { useSelector } from 'react-redux';

const createInitialFormData = (isSchoolAdmin, schoolId) => ({
  batchName: '',
  schoolId: isSchoolAdmin ? schoolId : '',
  programType: 'in_school',
  instrument: 'Keyboard',
  level: 'Foundation',
  grade: '',
  batchNo: '',
  roomNo: '',
  teacherId: '',
  maxStrength: 20,
  totalDays: 0,
  startDate: '',
  endDate: '',
  status: 'active',
});

export default function BatchesPage() {
  const [filters, setFilters] = useState({
    schoolId: (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('auth_user') || '{}')?.role === 'school_admin')
      ? (JSON.parse(localStorage.getItem('auth_user') || '{}')?.schoolId || JSON.parse(localStorage.getItem('auth_user') || '{}')?._id)
      : '',
    teacherId: '',
    programType: '',
    grade: '',
    batchNo: ''
  });

  const pathname = usePathname();
  const isSchoolAdminPath = useMemo(() => pathname.startsWith('/school'), [pathname]);
  const { user } = useSelector((state) => state.auth);
  const isSchoolAdmin = user?.role === 'school_admin' || isSchoolAdminPath;
  const schoolId = user?.schoolId || user?._id || '';

  const { data, isLoading } = useGetAdminBatchesQuery(filters);
  const { data: schoolData } = useGetAdminSchoolsQuery();
  const { data: userData } = useGetAdminUsersQuery({ role: 'instructor' });
  const { data: instrumentData } = useGetAdminInstrumentsQuery({ status: 'active' });

  const [createBatch, { isLoading: isCreating }] = useCreateAdminBatchMutation();
  const [updateBatch, { isLoading: isUpdating }] = useUpdateAdminBatchMutation();
  const [deleteBatch, { isLoading: isDeleting }] = useDeleteAdminBatchMutation();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [formData, setFormData] = useState(createInitialFormData(isSchoolAdmin, schoolId));
  const [successMsg, setSuccessMsg] = useState('');

  const batches = data?.batches || [];
  const schools = schoolData?.schools || [];
  const teachers = userData?.data || [];
  const activeInstruments = useMemo(() => instrumentData?.instruments || [], [instrumentData?.instruments]);

  const selectedInstrument = activeInstruments.find((instrument) => instrument.name === formData.instrument);
  const { data: levelData } = useGetAdminLevelsQuery(
    { instrumentId: selectedInstrument?._id, status: 'active' },
    { skip: !selectedInstrument }
  );
  const availableLevels = useMemo(() => levelData?.levels || [], [levelData?.levels]);

  const displayLevels = useMemo(() => {
    if (isEditing && formData.level && !availableLevels.find((level) => level.levelName === formData.level)) {
      return [{ _id: 'temp', levelName: formData.level }, ...availableLevels];
    }
    return availableLevels;
  }, [availableLevels, isEditing, formData.level]);

  const displayInstruments = useMemo(() => {
    if (isEditing && formData.instrument && !activeInstruments.find((instrument) => instrument.name === formData.instrument)) {
      return [{ _id: 'temp', name: formData.instrument }, ...activeInstruments];
    }
    return activeInstruments;
  }, [activeInstruments, isEditing, formData.instrument]);

  const handleOpenModal = (batch = null) => {
    if (batch && typeof batch.preventDefault === 'function') {
      batch = null;
    }

    if (batch) {
      setIsEditing(true);
      setCurrentBatchId(batch._id);
      setFormData({
        batchName: batch.batchName || '',
        schoolId: (batch.schoolId?._id || batch.schoolId || '').toString(),
        programType: batch.programType || 'in_school',
        instrument: batch.instrument || 'Keyboard',
        level: batch.level || 'Foundation',
        grade: batch.grade || '',
        batchNo: batch.batchNo || '',
        roomNo: batch.roomNo || '',
        teacherId: (batch.teacherId?._id || batch.teacherId || '').toString(),
        maxStrength: batch.maxStrength || 20,
        totalDays: batch.totalDays || 0,
        startDate: batch.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '',
        endDate: batch.endDate ? new Date(batch.endDate).toISOString().split('T')[0] : '',
        status: batch.status || 'active',
      });
    } else {
      setIsEditing(false);
      setCurrentBatchId(null);
      setFormData(createInitialFormData(isSchoolAdmin, schoolId));
    }

    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateBatch({ id: currentBatchId, ...formData }).unwrap();
        setSuccessMsg('Batch updated successfully!');
      } else {
        await createBatch(formData).unwrap();
        setSuccessMsg('Batch created successfully!');
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to save batch.');
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
          <p className="text-muted">Create and manage batches without course pricing or timetable fields.</p>
        </div>
        <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={() => handleOpenModal()}>
          <FaPlus /> Create New Batch
        </Button>
      </div>

      <div className="bg-white p-4 rounded shadow-sm mb-4 border">
        <Row className="g-3">
          {!isSchoolAdminPath && (
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                  <FaFilter size={12} /> School
                </Form.Label>
                <Form.Select value={filters.schoolId} onChange={(e) => setFilters({ ...filters, schoolId: e.target.value })}>
                  <option value="">All Schools</option>
                  {schools.map((school) => (
                    <option key={school._id} value={school._id}>{school.schoolName}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          )}
          <Col md={3}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaFilter size={12} /> Teacher
              </Form.Label>
              <Form.Select value={filters.teacherId} onChange={(e) => setFilters({ ...filters, teacherId: e.target.value })}>
                <option value="">All Teachers</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaFilter size={12} /> Program Type
              </Form.Label>
              <Form.Select value={filters.programType} onChange={(e) => setFilters({ ...filters, programType: e.target.value })}>
                <option value="">All Programs</option>
                <option value="in_school">In School</option>
                <option value="after_school">After School</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaFilter size={12} /> Grade
              </Form.Label>
              <Form.Control
                placeholder="Filter grade"
                value={filters.grade}
                onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={2}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted mb-1 d-flex align-items-center gap-1">
                <FaFilter size={12} /> Batch No
              </Form.Label>
              <Form.Control
                placeholder="Filter batch no"
                value={filters.batchNo}
                onChange={(e) => setFilters({ ...filters, batchNo: e.target.value })}
              />
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
              <th className="py-3">Grade / Room</th>
              <th>{isSchoolAdminPath ? 'Teacher' : 'School / Teacher'}</th>
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
                      {batch.batchNo && <small className="text-primary d-block">Batch No: {batch.batchNo}</small>}
                      <small className="text-muted d-block">{batch.instrument} - {batch.level}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge bg="light" text="dark" className="border mt-1 me-1">
                    {batch.programType?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </td>
                <td>
                  <div className="small">
                    <div className="fw-medium">{batch.grade || 'N/A'}</div>
                    <div className="text-muted">Room: {batch.roomNo || 'Open'}</div>
                    <div className="text-muted">Days: {batch.totalDays || 0}</div>
                  </div>
                </td>
                <td>
                  <div className="small">
                    {!isSchoolAdminPath && (
                      <div className="fw-medium">{batch.schoolId?.schoolName || 'N/A'}</div>
                    )}
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
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2 rounded-circle shadow-xs"
                    onClick={() => handleOpenModal(batch)}
                  >
                    <FaEdit size={12} />
                  </Button>
                  <Link href={`/admin/batches/${batch._id}`} passHref>
                    <Button variant="outline-primary" size="sm" className="me-2 rounded-pill px-3">
                      Manage
                    </Button>
                  </Link>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="rounded-circle shadow-xs"
                    onClick={() => { setBatchToDelete(batch); setShowDeleteModal(true); }}
                  >
                    <FaTrash size={12} />
                  </Button>
                </td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-5 text-muted">
                  No batches found matching selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold fs-5">
            {isEditing ? `Edit Batch: ${formData.batchName}` : 'Create New Academic Batch'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4">
            <Row className="mb-4">
              <Col md={isSchoolAdminPath ? 12 : 6} className="mb-3">
                <Form.Label className="small fw-bold">Batch Name</Form.Label>
                <Form.Control required placeholder="e.g. MON-WED-A" value={formData.batchName} onChange={(e) => setFormData({ ...formData, batchName: e.target.value })} />
              </Col>
              {!isSchoolAdminPath && (
                <Col md={6} className="mb-3">
                  <Form.Label className="small fw-bold">School</Form.Label>
                  <Form.Select required value={formData.schoolId} onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}>
                    <option value="">Select School</option>
                    {schools.map((school) => <option key={school._id.toString()} value={school._id.toString()}>{school.schoolName}</option>)}
                  </Form.Select>
                </Col>
              )}
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Grade</Form.Label>
                <Form.Control placeholder="e.g. Grade 5" value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} />
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Batch No</Form.Label>
                <Form.Control placeholder="e.g. B-102" value={formData.batchNo} onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })} />
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Room No</Form.Label>
                <Form.Control placeholder="e.g. Music Room 1" value={formData.roomNo} onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })} />
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Program Type</Form.Label>
                <Form.Select value={formData.programType} onChange={(e) => setFormData({ ...formData, programType: e.target.value })}>
                  <option value="in_school">In School</option>
                  <option value="after_school">After School</option>
                </Form.Select>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Instrument</Form.Label>
                <Form.Select
                  value={formData.instrument}
                  onChange={(e) => setFormData((prev) => ({ ...prev, instrument: e.target.value, level: '' }))}
                >
                  <option value="">Select Instrument</option>
                  {displayInstruments.map((instrument) => <option key={instrument._id} value={instrument.name}>{instrument.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Level</Form.Label>
                <Form.Select value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} disabled={!formData.instrument}>
                  <option value="">Select Level</option>
                  {displayLevels.map((level) => <option key={level._id} value={level.levelName}>{level.levelName}</option>)}
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label className="small fw-bold">Assigned Teacher</Form.Label>
                <Form.Select required value={formData.teacherId} onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}>
                  <option value="">Select Instructor</option>
                  {teachers.map((teacher) => <option key={teacher._id.toString()} value={teacher._id.toString()}>{teacher.name}</option>)}
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label className="small fw-bold">Max Capacity</Form.Label>
                <Form.Control type="number" required min="1" value={formData.maxStrength} onChange={(e) => setFormData({ ...formData, maxStrength: e.target.value })} />
              </Col>
              <Col md={4} className="mb-3">
                <Form.Label className="small fw-bold">Total No. of Days</Form.Label>
                <Form.Control type="number" min="0" value={formData.totalDays} onChange={(e) => setFormData({ ...formData, totalDays: e.target.value })} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Start Date</Form.Label>
                <Form.Control type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">End Date</Form.Label>
                <Form.Control type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
              </Col>
              <Col md={4}>
                <Form.Label className="small fw-bold">Status</Form.Label>
                <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="link" onClick={() => setShowModal(false)} className="text-secondary text-decoration-none">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating} className="px-5 shadow-sm rounded-pill">
              {isCreating || isUpdating ? <Spinner size="sm" /> : isEditing ? 'Update Batch' : 'Create Batch'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

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
