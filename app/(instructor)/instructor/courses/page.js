'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Modal, Form, InputGroup } from 'react-bootstrap';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiTrash2, FiPlus, FiSearch, FiCheckCircle, FiX } from 'react-icons/fi';
import { useGetAdminCategoriesQuery } from '@/redux/api/apiSlice';

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New Course Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourseData, setNewCourseData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    categoryIds: []
  });
  const [isCreating, setIsCreating] = useState(false);

  // Delete Confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: categoriesData } = useGetAdminCategoriesQuery();
  const [categorySearch, setCategorySearch] = useState('');
  const allCategories = useMemo(() => categoriesData?.data || [], [categoriesData?.data]);

  // Transform flat categories into a tree
  const categoryTree = useMemo(() => {
    if (!allCategories.length) return [];
    
    const buildTree = (parentId = null) => {
      return allCategories
        .filter(cat => {
          const catParentId = cat.parentId?._id || cat.parentId;
          if (parentId === null) {
            return !catParentId;
          }
          return catParentId === parentId;
        })
        .map(cat => ({
          ...cat,
          children: buildTree(cat._id)
        }));
    };

    return buildTree();
  }, [allCategories]);

  const fetchCourses = async () => {
    try {
      // Pass instructor=true to get only the current instructor's courses
      const res = await axios.get('/api/courses?instructor=true');
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourseData.title) return toast.error('Please enter a course title');
    
    setIsCreating(true);
    try {
      const res = await axios.post('/api/courses', {
        ...newCourseData,
        price: 0,
        isPublished: false // Ensure it starts as draft
      });
      if (res.data.success) {
        toast.success('Course draft created!');
        window.location.href = `/instructor/courses/${res.data.data._id}`;
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create new course.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      const res = await axios.delete(`/api/courses/${courseToDelete._id}`);
      if (res.data.success) {
        toast.success('Course deleted!');
        setCourses(courses.filter(c => c._id !== courseToDelete._id));
        setShowDeleteModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete course.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleCategory = (e, catId) => {
    e.preventDefault();
    const currentIds = [...(newCourseData.categoryIds || [])];
    const idStr = catId.toString();
    const index = currentIds.indexOf(idStr);
    
    let newIds;
    if (index > -1) {
      newIds = currentIds.filter(id => id !== idStr);
    } else {
      newIds = [...currentIds, idStr];
    }
    
    setNewCourseData({ ...newCourseData, categoryIds: newIds });
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;

  return (
    <>
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0">My Courses</h2>
        <Button variant="primary" className="fw-bold px-4 shadow-sm" onClick={() => setShowCreateModal(true)}>
          <i className="bi bi-plus-lg me-2"></i>Create Course
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {courses.length === 0 && !error ? (
        <Alert variant="info" className="text-center py-5">
          <h5>You haven&apos;t created any courses yet.</h5>
          <p>Click &quot;Create Course&quot; to get started.</p>
        </Alert>
      ) : (
        <Row className="g-4">
          {courses.map(course => (
            <Col md={6} lg={4} key={course._id}>
              <Card className="h-100 shadow-sm border-0 position-relative">
                <div style={{ height: '160px', backgroundColor: '#e9ecef', overflow: 'hidden' }} className="rounded-top">
                    {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-100 h-100" style={{objectFit:'cover'}} />
                    ) : (
                        <div className="d-flex align-items-center justify-content-center h-100 text-muted">No Image</div>
                    )}
                </div>
                <Badge 
                    bg={course.isPublished ? "success" : "secondary"} 
                    className="position-absolute top-0 end-0 m-2 px-3 py-2"
                >
                    {course.isPublished ? 'Published' : 'Draft'}
                </Badge>
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="fw-bold text-truncate mb-0" style={{ maxWidth: '80%' }}>{course.title}</h5>
                    <Button 
                      variant="link" 
                      className="text-danger p-0 border-0" 
                      onClick={() => { setCourseToDelete(course); setShowDeleteModal(true); }}
                      title="Delete Course"
                    >
                      <FiTrash2 />
                    </Button>
                  </div>
                  <div className="text-muted small mb-3 text-truncate">
                    {course.categoryIds?.length > 0 ? (
                        course.categoryIds.map((cid, i) => {
                            const idStr = (cid._id || cid).toString();
                            const cat = allCategories.find(c => c._id === idStr);
                            return cat ? (i > 0 ? ', ' : '') + cat.name : null;
                        })
                    ) : course.category} • ${course.price}
                  </div>
                  <div className="mt-auto d-flex flex-column gap-2">
                    <Link href={`/instructor/courses/${course._id}`} className="btn btn-outline-dark fw-bold w-100">
                      Manage Course
                    </Link>
                    <Link href={`/instructor/courses/${course._id}/curriculum`} className="btn btn-primary fw-bold w-100">
                      Curriculum
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>

      {/* Create Course Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Create New Course</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateCourse}>
          <Modal.Body className="py-4">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted text-uppercase">Course Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g. Complete Web Development Bootcamp" 
                    required
                    value={newCourseData.title}
                    onChange={e => setNewCourseData({...newCourseData, title: e.target.value})}
                    autoFocus
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted text-uppercase">Thumbnail/Image URL</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="https://example.com/image.jpg" 
                    value={newCourseData.thumbnail}
                    onChange={e => setNewCourseData({...newCourseData, thumbnail: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted text-uppercase">Description</Form.Label>
                  <Form.Control 
                    as="textarea"
                    rows={4}
                    placeholder="Provide a brief overview of your course..." 
                    value={newCourseData.description}
                    onChange={e => setNewCourseData({...newCourseData, description: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small text-muted text-uppercase">Categories</Form.Label>
                  {newCourseData.categoryIds?.length > 0 && (
                    <div className="mb-2 d-flex flex-wrap gap-1">
                      {newCourseData.categoryIds.map(cid => {
                        const idStr = cid.toString();
                        const cat = allCategories.find(c => c._id === idStr);
                        return cat ? (
                          <Badge key={idStr} bg="primary" className="d-flex align-items-center gap-1 py-1 px-2 small fw-normal">
                            {cat.name}
                            <FiX className="cursor-pointer" onClick={(e) => toggleCategory(e, idStr)} />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}

                  <InputGroup className="mb-2 shadow-sm input-group-sm">
                    <InputGroup.Text className="bg-white border-end-0">
                      <FiSearch className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="border-start-0"
                    />
                  </InputGroup>

                  <div className="border rounded bg-white p-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                    {(() => {
                      const TreeSelectorNode = ({ node, level = 0 }) => {
                        const isSelected = newCourseData.categoryIds?.some(cid => cid.toString() === node._id);
                        const matchesSearch = node.name.toLowerCase().includes(categorySearch.toLowerCase());
                        const hasVisibleChildren = node.children && node.children.some(child => 
                          child.name.toLowerCase().includes(categorySearch.toLowerCase()) || 
                          (child.children && child.children.length > 0)
                        );

                        if (!matchesSearch && !hasVisibleChildren && categorySearch) return null;

                        return (
                          <div key={node._id}>
                            <div 
                              className={`d-flex align-items-center gap-2 p-1 rounded cursor-pointer ${isSelected ? 'bg-primary text-white shadow-sm' : 'hover-bg-light'}`}
                              style={{ marginLeft: `${level * 12}px`, marginBottom: '2px' }}
                              onClick={(e) => toggleCategory(e, node._id)}
                            >
                              <div className="d-flex align-items-center justify-content-center" style={{ width: '16px' }}>
                                {isSelected ? <FiCheckCircle size={10} /> : <div className="border rounded-circle" style={{ width: '10px', height: '10px' }} />}
                              </div>
                              <span style={{ fontSize: '0.85rem' }}>{node.name}</span>
                            </div>
                            {node.children && node.children.map(child => (
                              <TreeSelectorNode key={child._id} node={child} level={level + 1} />
                            ))}
                          </div>
                        );
                      };

                      return categoryTree.map((root, i) => <TreeSelectorNode key={`${root._id}-${i}`} node={root} />);
                    })()}
                  </div>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="light" onClick={() => setShowCreateModal(false)} className="fw-bold">Cancel</Button>
            <Button variant="primary" type="submit" className="fw-bold px-4" disabled={isCreating}>
              {isCreating ? <Spinner size="sm" className="me-2" /> : <FiPlus className="me-2" />}
              Create Draft
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-2">
            <div className="text-center mb-4">
                <FiTrash2 size={48} className="text-danger mb-3" />
                <h5 className="fw-bold">Delete this course?</h5>
                <p className="text-muted">
                    Are you sure you want to delete <strong>{courseToDelete?.title}</strong>? 
                    This action is permanent and will remove all associated curriculum and content.
                </p>
            </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)} className="fw-bold">Cancel</Button>
          <Button variant="danger" className="fw-bold px-4" onClick={handleDeleteCourse} disabled={isDeleting}>
            {isDeleting ? <Spinner size="sm" className="me-2" /> : null}
            Confirm Delete
          </Button>
        </Modal.Footer>
      </Modal>

     <style jsx global>{`
        .cursor-pointer { cursor: pointer; }
        .hover-bg-light:hover { background-color: #f8f9fa; }
      `}</style>
    </>
  );
}
