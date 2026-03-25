'use client';

import { useState } from 'react';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge, Card, Row, Col } from 'react-bootstrap';
import { 
  useGetAdminInstructorsQuery, 
  useUpdateAdminUserMutation, 
  useCreateAdminUserMutation,
  useGetInstructorStatsQuery,
  useGetInstructorCoursesQuery,
  useGetAdminSchoolsQuery
} from '@/redux/api/apiSlice';
import { FaCheck, FaTimes, FaBan, FaEye, FaChartLine, FaCheckCircle, FaPlus, FaUserTie } from 'react-icons/fa';
import { useSelector } from 'react-redux';

export default function AdminInstructorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isError, error } = useGetAdminInstructorsQuery({
    page,
    search: searchTerm
  });

  const [updateUser, { isLoading: isUpdating }] = useUpdateAdminUserMutation();
  const [createUser, { isLoading: isCreating }] = useCreateAdminUserMutation();
  const { data: schoolData } = useGetAdminSchoolsQuery();
  const schools = schoolData?.schools || [];
  
  const { user } = useSelector((state) => state.auth);
  const isSchoolAdmin = user?.role === 'school_admin';
  const schoolId = user?.schoolId || user?._id;

  const [successMsg, setSuccessMsg] = useState('');

  // Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: 'instructor', schoolId: ''
  });

  // Stats Modal State
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(search);
    setPage(1);
  };

  const handleStatusUpdate = async (userId, status) => {
    try {
      await updateUser({ userId, status }).unwrap();
      setSuccessMsg(`Instructor status updated to ${status}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const openStats = (instructor) => {
    setSelectedInstructor(instructor);
    setShowStatsModal(true);
  };

  const handleOpenCreateModal = () => {
    setFormData({
      name: '', email: '', phone: '', password: '', role: 'instructor', 
      schoolId: isSchoolAdmin ? schoolId : ''
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser(formData).unwrap();
      setSuccessMsg('Instructor created successfully!');
      setShowCreateModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to create instructor.');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading instructors...</p>
      </Container>
    );
  }

  const instructors = data?.data || [];
  const meta = data?.meta || { totalPages: 1, currentPage: 1 };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Instructor Management</h2>
        {(user?.role === 'admin' || isSchoolAdmin) && (
          <Button variant="primary" className="d-flex align-items-center gap-2 px-4 shadow-sm" onClick={handleOpenCreateModal}>
            <FaPlus /> Add New Instructor
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-3 rounded shadow-sm mb-4">
        <Form onSubmit={handleSearch} className="d-flex gap-2" style={{ maxWidth: '400px' }}>
          <Form.Control 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="secondary" type="submit">Search</Button>
        </Form>
      </div>

      {successMsg && (
        <Alert variant="success" className="d-flex align-items-center gap-2">
          <FaCheckCircle /> {successMsg}
        </Alert>
      )}

      {isError && (
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>Failed to load data: {error?.data?.error || 'Unknown error'}</p>
        </Alert>
      )}

      <div className="bg-white rounded shadow-sm overflow-hidden mb-4">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="ps-4">Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Joined</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {instructors.map((ins) => (
              <tr key={ins._id}>
                <td className="ps-4 fw-bold">{ins.name}</td>
                <td>{ins.email}</td>
                <td>
                  <Badge bg={ins.status === 'active' ? 'success' : ins.status === 'suspended' ? 'danger' : 'warning'}>
                    {ins.status}
                  </Badge>
                </td>
                <td className="small">{new Date(ins.createdAt).toLocaleDateString()}</td>
                <td className="text-end pe-4">
                  <div className="d-flex justify-content-end gap-2">
                    {ins.status === 'pending_approval' && (
                      <>
                        <Button variant="success" size="sm" onClick={() => handleStatusUpdate(ins._id, 'active')} title="Approve">
                          <FaCheck />
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(ins._id, 'rejected')} title="Reject">
                          <FaTimes />
                        </Button>
                      </>
                    )}
                    {ins.status === 'active' && (
                      <Button variant="outline-danger" size="sm" onClick={() => handleStatusUpdate(ins._id, 'suspended')} title="Suspend">
                        <FaBan />
                      </Button>
                    )}
                    {ins.status === 'suspended' && (
                      <Button variant="outline-success" size="sm" onClick={() => handleStatusUpdate(ins._id, 'active')} title="Unsuspend">
                        <FaCheck />
                      </Button>
                    )}
                    <Button variant="outline-primary" size="sm" onClick={() => openStats(ins)} title="View Stats & Courses">
                      <FaChartLine />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {instructors.length === 0 && <div className="p-5 text-center text-muted">No instructors found</div>}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2">
          <Button variant="light" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="align-self-center mx-2">Page {page} of {meta.totalPages}</span>
          <Button variant="light" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Create Instructor Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold fs-5">Add New Instructor</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Full Name</Form.Label>
              <Form.Control 
                required 
                placeholder="Enter name"
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Email Address</Form.Label>
              <Form.Control 
                type="email" 
                required 
                placeholder="name@example.com"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Phone Number</Form.Label>
              <Form.Control 
                placeholder="10-digit phone"
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Password</Form.Label>
              <Form.Control 
                type="password"
                required 
                placeholder="Minimum 6 characters"
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
              />
            </Form.Group>
            {!isSchoolAdmin && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Assign to School</Form.Label>
                <Form.Select 
                  value={formData.schoolId} 
                  onChange={(e) => setFormData({...formData, schoolId: e.target.value})}
                >
                  <option value="">No School (Independent)</option>
                  {schools.map(s => <option key={s._id} value={s._id}>{s.schoolName}</option>)}
                </Form.Select>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer className="bg-light">
            <Button variant="link" onClick={() => setShowCreateModal(false)} className="text-secondary text-decoration-none">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating} className="px-5 shadow-sm">
              {isCreating ? <Spinner size="sm" /> : 'Create Instructor'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Stats & Courses Modal */}
      {selectedInstructor && (
        <InstructorStatsModal 
          show={showStatsModal} 
          onHide={() => setShowStatsModal(false)} 
          instructor={selectedInstructor} 
        />
      )}
    </Container>
  );
}

function InstructorStatsModal({ show, onHide, instructor }) {
  const { data: stats, isLoading: statsLoading } = useGetInstructorStatsQuery(instructor._id);
  const { data: courses, isLoading: coursesLoading } = useGetInstructorCoursesQuery(instructor._id);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Performance: {instructor.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-light">
        <Row className="mb-4">
          <Col md={6}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small fw-bold text-uppercase mb-1">Total Earnings</div>
                <h3 className="fw-bold text-success">
                  {statsLoading ? <Spinner size="sm" /> : `$${stats?.data?.totalEarnings || 0}`}
                </h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="text-center border-0 shadow-sm h-100">
              <Card.Body>
                <div className="text-muted small fw-bold text-uppercase mb-1">Total Courses</div>
                <h3 className="fw-bold text-primary">
                  {statsLoading ? <Spinner size="sm" /> : stats?.data?.courseCount || 0}
                </h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <h5 className="fw-bold mb-3">Course Portfolio</h5>
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <Table hover responsive className="mb-0 small">
            <thead className="bg-light">
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {coursesLoading ? (
                <tr><td colSpan="4" className="text-center p-3"><Spinner size="sm" /></td></tr>
              ) : (
                courses?.data?.map(c => (
                  <tr key={c._id}>
                    <td className="fw-bold">{c.title}</td>
                    <td>{c.category}</td>
                    <td>${c.price}</td>
                    <td>
                      <Badge bg={c.isPublished ? 'success' : 'secondary'}>
                        {c.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
              {!coursesLoading && courses?.data?.length === 0 && (
                <tr><td colSpan="4" className="text-center p-3 text-muted">No courses found</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
