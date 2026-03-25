'use client';

import { useState } from 'react';
import { Container, Table, Spinner, Alert, Form, Button, Modal, Badge } from 'react-bootstrap';
import { 
  useGetAdminUsersQuery, 
  useUpdateAdminUserMutation, 
  useCreateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetAdminSchoolsQuery
} from '@/redux/api/apiSlice';
import { FaEdit, FaTrash, FaPlus, FaCheckCircle } from 'react-icons/fa';
import { useSelector } from 'react-redux';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState(''); // Debounced search term

  const { data, isLoading, isError, error } = useGetAdminUsersQuery({
    page,
    search: searchTerm,
    role: roleFilter
  });
  
  const { data: schoolData } = useGetAdminSchoolsQuery();
  const schools = schoolData?.schools || [];
  
  const { userInfo } = useSelector((state) => state.auth);
  const isSchoolAdmin = userInfo?.role === 'school_admin';
  
  const [updateUser, { isLoading: isUpdating }] = useUpdateAdminUserMutation();
  const [createUser, { isLoading: isCreating }] = useCreateAdminUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteAdminUserMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'student', schoolId: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(search);
    setPage(1); // Reset to first page on search
  };

  const handleRoleChange = (role) => {
    setRoleFilter(role);
    setPage(1);
  };

  const handleBlockUnblock = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      await updateUser({ userId: user._id, status: newStatus }).unwrap();
      setSuccessMsg(`User ${newStatus === 'active' ? 'unblocked' : 'blocked'} successfully!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to update user status.');
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, email: user.email, phone: user.phone || '', role: user.role, schoolId: user.schoolId || '', password: '' });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', phone: '', password: '', role: isSchoolAdmin ? 'instructor' : 'student', schoolId: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateUser({ userId: editingUser._id, ...formData }).unwrap();
        setSuccessMsg('User updated successfully!');
      } else {
        await createUser(formData).unwrap();
        setSuccessMsg('User created successfully!');
      }
      handleCloseModal();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err?.data?.error || 'Failed to save user.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(userToDelete._id).unwrap();
      setSuccessMsg('User deleted successfully!');
      setShowDeleteModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading users...</p>
      </Container>
    );
  }

  const users = data?.data || [];
  const meta = data?.meta || { totalPages: 1, currentPage: 1 };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">User Management</h2>
        <Button variant="primary" className="d-flex align-items-center gap-2" onClick={() => handleOpenModal()}>
          <FaPlus /> Add User
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-3 rounded shadow-sm mb-4 d-flex flex-wrap gap-3 align-items-center">
        <Form onSubmit={handleSearch} className="d-flex gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
          <Form.Control 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="secondary" type="submit">Search</Button>
        </Form>
        {!isSchoolAdmin && (
          <div className="d-flex align-items-center gap-2 ms-auto">
            <span className="text-muted small fw-bold">Role:</span>
            <Form.Select 
              style={{ width: '150px' }}
              value={roleFilter}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </Form.Select>
          </div>
        )}
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
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="ps-4 fw-bold">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone || <em className="text-muted">N/A</em>}</td>
                <td>
                  <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'instructor' ? 'primary' : 'info'}>
                    {user.role}
                  </Badge>
                </td>
                <td>
                   <Badge pill bg={user.status === 'active' ? 'success' : 'secondary'}>
                     {user.status}
                   </Badge>
                </td>
                <td className="text-end pe-4">
                  <Button 
                    variant={user.status === 'active' ? 'outline-warning' : 'outline-success'} 
                    size="sm" 
                    className="me-2"
                    onClick={() => handleBlockUnblock(user)}
                    title={user.status === 'active' ? 'Block User' : 'Unblock User'}
                  >
                    {user.status === 'active' ? 'Block' : 'Unblock'}
                  </Button>
                  <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenModal(user)}>
                    <FaEdit />
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => { setUserToDelete(user); setShowDeleteModal(true); }}>
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {users.length === 0 && <div className="p-5 text-center text-muted">No users found</div>}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2">
          <Button 
            variant="light" 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          {[...Array(meta.totalPages)].map((_, i) => (
            <Button 
              key={i + 1}
              variant={page === i + 1 ? 'primary' : 'light'}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button 
            variant="light" 
            disabled={page === meta.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? 'Edit User' : 'Add New User'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control 
                type="text" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control 
                type="email" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Optional"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{editingUser ? 'Reset Password (Optional)' : 'Password'}</Form.Label>
              <Form.Control 
                type="password" 
                required={!editingUser}
                placeholder={editingUser ? 'Enter new password to reset' : 'Enter password'}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </Form.Group>
            {!isSchoolAdmin && (
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                  <option value="school_admin">School Admin</option>
                </Form.Select>
              </Form.Group>
            )}
            
            {!isSchoolAdmin && formData.role === 'school_admin' && (
              <Form.Group className="mb-3">
                <Form.Label>Assign School (Required for School Admin)</Form.Label>
                <Form.Select 
                  required
                  value={formData.schoolId}
                  onChange={(e) => setFormData({...formData, schoolId: e.target.value})}
                >
                  <option value="">Select School</option>
                  {schools.map(s => <option key={s._id} value={s._id}>{s.schoolName}</option>)}
                </Form.Select>
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? <Spinner size="sm" /> : 'Save User'}
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
          Are you sure you want to delete user <strong>{userToDelete?.name}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Spinner size="sm" /> : 'Delete User'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
