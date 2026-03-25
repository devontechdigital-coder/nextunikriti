'use client';

import { useState, useMemo } from 'react';
import { Container, Table, Spinner, Alert, Badge, Button, Modal, Form, InputGroup, Nav } from 'react-bootstrap';
import { 
  useGetAdminCoursesQuery, 
  useUpdateAdminCourseMutation, 
  useCreateAdminCourseMutation, 
  useDeleteAdminCourseMutation,
  useGetAdminUsersQuery,
  useGetAdminCategoriesQuery,
  useGetAdminInstrumentsQuery,
  useGetAdminLevelsQuery
} from '@/redux/api/apiSlice';
import { FaEdit, FaTrash, FaPlus, FaCheckCircle, FaEye, FaUserCircle, FaSearch, FaTimes, FaTag, FaLink, FaList, FaMusic, FaSignal, FaCopy, FaGlobe, FaQuestionCircle, FaGraduationCap, FaClock, FaDesktop, FaMapMarkerAlt } from 'react-icons/fa';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminCoursesPage() {
  const { data, isLoading, isError, error } = useGetAdminCoursesQuery();
  const { data: usersData } = useGetAdminUsersQuery();
  const { data: categoriesData } = useGetAdminCategoriesQuery();
  const { data: instrumentsData } = useGetAdminInstrumentsQuery();
  
  const [updateCourse, { isLoading: isUpdating }] = useUpdateAdminCourseMutation();
  const [createCourse, { isLoading: isCreating }] = useCreateAdminCourseMutation();
  const [deleteCourse, { isLoading: isDeleting }] = useDeleteAdminCourseMutation();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const [descEditorMode, setDescEditorMode] = useState('text'); // 'text' | 'code'

  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    price: 0, 
    categoryIds: [], 
    course_creator: '',
    level: 'Beginner',
    instrument_id: '',
    level_id: '',
    moderationStatus: 'approved',
    thumbnail: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    shortDescription: '',
    mode: 'Online',
    duration: '',
    certification: false,
    faq: []
  });

  const addFaqItem = () => setFormData(f => ({ ...f, faq: [...f.faq, { question: '', answer: '' }] }));
  const removeFaqItem = (idx) => setFormData(f => ({ ...f, faq: f.faq.filter((_, i) => i !== idx) }));
  const updateFaqItem = (idx, field, value) => setFormData(f => {
    const updated = [...f.faq];
    updated[idx] = { ...updated[idx], [field]: value };
    return { ...f, faq: updated };
  });

  const { data: levelsData } = useGetAdminLevelsQuery(
    { instrumentId: formData.instrument_id }, 
    { skip: !formData.instrument_id }
  );

  const [categorySearch, setCategorySearch] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewCourse, setViewCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const instructors = useMemo(() => usersData?.data?.filter(u => u.role === 'instructor' || u.role === 'admin') || [], [usersData?.data]);
  const allCategories = useMemo(() => categoriesData?.data || [], [categoriesData?.data]);

  // Transform flat categories into a tree
  const categoryTree = useMemo(() => {
    if (!allCategories.length) return [];
    
    const buildTree = (parentId = null) => {
      return allCategories
        .filter(cat => {
          const catParentId = cat.parentId?.toString() || null;
          const targetParentId = parentId?.toString() || null;
          return catParentId === targetParentId;
        })
        .map(cat => ({
          ...cat,
          children: buildTree(cat._id)
        }));
    };

    return buildTree();
  }, [allCategories]);

  const handleOpenModal = (course = null) => {
    setCategorySearch('');
    if (course) {
      setEditingCourse(course);
      const safeCategoryIds = Array.isArray(course.categoryIds) 
        ? course.categoryIds.map(id => id.toString()) 
        : [];

      setFormData({ 
        title: course.title || '', 
        description: course.description || '', 
        price: course.price || 0, 
        categoryIds: safeCategoryIds, 
        course_creator: course.course_creator?._id || course.course_creator || course.instructor?._id || course.instructor || '',
        level: course.level || 'Beginner',
        instrument_id: course.instrument_id?._id || course.instrument_id || '',
        level_id: course.level_id?._id || course.level_id || '',
        moderationStatus: course.moderationStatus || 'approved',
        thumbnail: course.thumbnail || '',
        slug: course.slug || '',
        metaTitle: course.metaTitle || '',
        metaDescription: course.metaDescription || '',
        metaKeywords: course.metaKeywords || '',
        shortDescription: course.shortDescription || '',
        mode: course.mode || 'Online',
        duration: course.duration || '',
        certification: course.certification || false,
        faq: Array.isArray(course.faq) ? course.faq : []
      });
    } else {
      setEditingCourse(null);
      setFormData({ 
        title: '', 
        description: '', 
        price: 0, 
        categoryIds: [], 
        course_creator: instructors.length > 0 ? instructors[0]._id : '',
        level: 'Beginner',
        instrument_id: '',
        level_id: '',
        moderationStatus: 'approved',
        thumbnail: '',
        slug: '',
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        shortDescription: '',
        mode: 'Online',
        duration: '',
        certification: false,
        faq: []
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await updateCourse({ courseId: editingCourse._id, ...formData }).unwrap();
        toast.success('Course updated successfully!');
      } else {
        await createCourse(formData).unwrap();
        toast.success('Course created successfully!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.data?.error || 'Failed to save course.');
    }
  };

  const handleStatusUpdate = async (courseId, status) => {
    try {
      await updateCourse({ courseId, moderationStatus: status }).unwrap();
      toast.success(`Course ${status} successfully!`);
    } catch (err) {
      toast.error(`Failed to ${status} course.`);
    }
  };

  const handleViewCourse = (course) => {
    setViewCourse(course);
    setShowViewModal(true);
  };

  const toggleCategory = (e, catId) => {
    e.preventDefault();
    const currentIds = [...formData.categoryIds];
    const index = currentIds.indexOf(catId.toString());
    if (index > -1) {
      currentIds.splice(index, 1);
    } else {
      currentIds.push(catId.toString());
    }
    setFormData({ ...formData, categoryIds: currentIds });
  };

  const handleDelete = async () => {
    try {
      await deleteCourse(courseToDelete._id).unwrap();
      toast.success('Course deleted successfully!');
      setShowDeleteModal(false);
    } catch (err) {
      toast.error('Failed to delete course.');
    }
  };

  const handleCopyPublicUrl = (course) => {
    const identifier = course.slug || course._id;
    const url = `${window.location.origin}/courses/${identifier}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Public URL copied!');
    }).catch(() => {
      toast.error('Failed to copy URL.');
    });
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading courses...</p>
      </Container>
    );
  }

  const courses = data?.data || [];

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0 text-dark">Course Moderation</h2>
        <Button variant="primary" className="d-flex align-items-center gap-2 shadow-sm" onClick={() => handleOpenModal()}>
          <FaPlus /> Add New Course
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded shadow-sm mb-4 d-flex align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
            <span className="text-muted small fw-bold text-uppercase">Filter Status:</span>
            <Form.Select 
                style={{ width: '160px' }} 
                className="form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="all">All Courses</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
            </Form.Select>
        </div>
        <div className="ms-auto flex-grow-1" style={{ maxWidth: '300px' }}>
            <Form.Control 
                type="text" 
                placeholder="Search by title..." 
                className="form-control-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {isError && (
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>Failed to load data: {error?.data?.error || 'Unknown error'}</p>
        </Alert>
      )}

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="ps-4">Course Title</th>
              <th><FaMusic className="me-1"/> Instrument / <FaSignal className="me-1"/> Level</th>
              <th>Content Owner</th>
              <th>Price</th>
              <th>Status</th>
              <th>Mode</th>
              <th>Cert.</th>
              <th className="text-end pe-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses
              .filter(c => statusFilter === 'all' || c.moderationStatus === statusFilter)
              .filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((course) => (
              <tr key={course._id} className="align-middle">
                <td className="ps-4">
                   <div className="fw-bold mb-0">{course.title}</div>
                   <div className="d-flex flex-wrap gap-1 mt-1">
                      {course.categoryIds && course.categoryIds.length > 0 ? (
                        course.categoryIds.map(cid => {
                          const cat = allCategories.find(c => c._id.toString() === cid.toString());
                          return cat ? <Badge key={cid} bg="secondary" className="x-small fw-normal">{cat.name}</Badge> : null;
                        })
                      ) : (
                        <span className="text-muted small">{course.category || 'No Category'}</span>
                      )}
                   </div>
                </td>
                <td>
                   <div className="fw-bold small">{course.instrument_id?.name || '-'}</div>
                   <div className="text-muted x-small">{course.level_id?.levelName || '-'}</div>
                </td>
                <td>
                   <div className="small fw-bold">{course.course_creator?.name || 'Unknown'}</div>
                   <div className="text-muted x-small">{course.course_creator?.email}</div>
                </td>
                <td className="fw-semibold">${course.price}</td>
                <td>
                   <Badge bg={course.moderationStatus === 'approved' ? 'success' : course.moderationStatus === 'rejected' ? 'danger' : 'warning'}>
                      {course.moderationStatus}
                   </Badge>
                </td>
                <td>
                   <Badge bg={course.mode === 'Offline' ? 'warning' : 'info'} text={course.mode === 'Offline' ? 'dark' : undefined}>
                     {course.mode === 'Offline' ? <><FaMapMarkerAlt className="me-1"/>Offline</> : <><FaDesktop className="me-1"/>Online</>}
                   </Badge>
                </td>
                <td>
                   {course.certification
                     ? <Badge bg="success"><FaGraduationCap className="me-1"/>Yes</Badge>
                     : <span className="text-muted small">—</span>}
                </td>
                 <td className="text-end pe-4">
                  <div className="d-flex justify-content-end gap-2">
                    {course.moderationStatus === 'pending' && (
                        <>
                            <Button variant="success" size="sm" onClick={() => handleStatusUpdate(course._id, 'approved')} title="Approve">
                                <FaCheckCircle />
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(course._id, 'rejected')} title="Reject">
                                <i className="bi bi-x-circle-fill"></i>
                            </Button>
                        </>
                    )}
                    <Button variant="outline-dark" size="sm" onClick={() => handleViewCourse(course)} title="View Details">
                        <FaEye />
                    </Button>
                    <Link href={`/admin/courses/${course._id}/curriculum`} className="btn btn-outline-info btn-sm" title="Curriculum">
                        <FaList />
                    </Link>
                     <Button variant="outline-success" size="sm" onClick={() => handleCopyPublicUrl(course)} title="Copy Public URL">
                         <FaCopy />
                     </Button>
                     <Button variant="outline-primary" size="sm" onClick={() => handleOpenModal(course)} title="Edit">
                        <FaEdit />
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => { setCourseToDelete(course); setShowDeleteModal(true); }} title="Delete">
                        <FaTrash />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {courses.length === 0 && <div className="p-5 text-center text-muted">No courses found</div>}
      </div>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">Course Overview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
            {viewCourse && (
                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="bg-light rounded p-2 text-center border">
                            {viewCourse.thumbnail ? (
                                <img src={viewCourse.thumbnail} alt="thumbnail" className="img-fluid rounded shadow-sm" style={{ maxHeight: '180px' }} />
                            ) : (
                                <div className="py-5 text-muted small">No Thumbnail</div>
                            )}
                        </div>
                        <div className="mt-3 text-center">
                            <h4 className="fw-bold text-primary mb-1">${viewCourse.price}</h4>
                            <Badge bg={viewCourse.moderationStatus === 'approved' ? 'success' : 'warning'}>
                                {viewCourse.moderationStatus.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                    <div className="col-md-8">
                        <h3 className="fw-bold mb-1">{viewCourse.title}</h3>
                        <div className="d-flex flex-wrap gap-1 mb-3">
                            <Badge bg="info" className="fw-normal">{viewCourse.level}</Badge>
                            {viewCourse.categoryIds && viewCourse.categoryIds.length > 0 ? (
                                viewCourse.categoryIds.map(cid => {
                                    const cat = allCategories.find(c => c._id.toString() === cid.toString());
                                    return cat ? <Badge key={cid} bg="secondary" className="fw-normal">{cat.name}</Badge> : null;
                                })
                            ) : (
                                <Badge bg="light" text="dark" className="fw-normal">{viewCourse.category || 'Uncategorized'}</Badge>
                            )}
                        </div>
                        
                        <div className="mb-4">
                            <h6 className="fw-bold text-muted text-uppercase x-small">Description</h6>
                            <p className="small mb-0 text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{viewCourse.description}</p>
                        </div>

                        <div className="bg-light p-3 rounded d-flex align-items-center gap-3">
                            <div className="bg-white rounded-circle p-2 border shadow-sm">
                                <FaUserCircle size={24} className="text-primary" />
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold">{viewCourse.course_creator?.name || viewCourse.instructor?.name}</h6>
                                <p className="text-muted small mb-0">{viewCourse.course_creator?.email || viewCourse.instructor?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => { setShowViewModal(false); handleOpenModal(viewCourse); }}>Edit Instead</Button>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close Overview</Button>
        </Modal.Footer>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingCourse ? 'Edit Course' : 'Create New Course'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Group>
                  <Form.Label>Course Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    required 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6 mb-3">
                 <Form.Label className="fw-bold small text-muted text-uppercase">Categories</Form.Label>
                 
                 {formData.categoryIds.length > 0 && (
                   <div className="mb-2 d-flex flex-wrap gap-1">
                     {formData.categoryIds.map(cid => {
                       const cat = allCategories.find(c => c._id.toString() === cid.toString());
                       return cat ? (
                         <Badge key={cid} bg="primary" className="d-flex align-items-center gap-1 py-1 px-2 small fw-normal">
                           {cat.name}
                           <FaTimes className="cursor-pointer" onClick={(e) => toggleCategory(e, cid.toString())} />
                         </Badge>
                       ) : null;
                     })}
                   </div>
                 )}

                 <InputGroup className="mb-2 shadow-sm input-group-sm">
                   <InputGroup.Text className="bg-white border-end-0">
                     <FaSearch className="text-muted" />
                   </InputGroup.Text>
                   <Form.Control
                     placeholder="Search categories..."
                     value={categorySearch}
                     onChange={(e) => setCategorySearch(e.target.value)}
                     className="border-start-0"
                   />
                 </InputGroup>

                 <div className="border rounded bg-light p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {(() => {
                       const TreeSelectorNode = ({ node, level = 0 }) => {
                         const isSelected = formData.categoryIds.some(cid => cid === node._id);
                         const matchesSearch = node.name.toLowerCase().includes(categorySearch.toLowerCase());
                         const hasVisibleChildren = node.children && node.children.some(child => 
                           child.name.toLowerCase().includes(categorySearch.toLowerCase()) || 
                           (child.children && child.children.length > 0)
                         );

                         if (!matchesSearch && !hasVisibleChildren && categorySearch) return null;

                         return (
                           <div key={node._id}>
                             <div 
                               className={`d-flex align-items-center gap-2 p-1 rounded cursor-pointer ${isSelected ? 'bg-primary text-white' : 'hover-bg-light'}`}
                               style={{ marginLeft: `${level * 12}px` }}
                               onClick={(e) => toggleCategory(e, node._id)}
                             >
                               <div className="d-flex align-items-center justify-content-center" style={{ width: '16px' }}>
                                 {isSelected ? <FaCheckCircle size={10} /> : <div className="border rounded-circle" style={{ width: '10px', height: '10px' }} />}
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
              </div>
            </div>

            {/* Thumbnail URL */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted text-uppercase">Course Image URL</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white"><FaGlobe className="text-muted" /></InputGroup.Text>
                <Form.Control 
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                />
              </InputGroup>
              {formData.thumbnail && (
                <div className="mt-2">
                  <img src={formData.thumbnail} alt="preview" style={{ maxHeight: '80px', borderRadius: '6px', border: '1px solid #dee2e6' }} />
                </div>
              )}
            </Form.Group>

            {/* Description with Text/Code tabs */}
            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <Form.Label className="fw-bold small text-muted text-uppercase mb-0">Description</Form.Label>
                <Nav variant="pills" className="description-tab-nav" style={{ gap: '4px' }}>
                  <Nav.Item>
                    <Nav.Link 
                      className={`py-0 px-2 small ${descEditorMode === 'text' ? 'active' : 'text-muted'}`}
                      style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                      onClick={() => setDescEditorMode('text')}
                    >Text</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                      className={`py-0 px-2 small ${descEditorMode === 'code' ? 'active' : 'text-muted'}`}
                      style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                      onClick={() => setDescEditorMode('code')}
                    >HTML / Code</Nav.Link>
                  </Nav.Item>
                </Nav>
              </div>
              {descEditorMode === 'text' ? (
                <Form.Control 
                  as="textarea" 
                  rows={4} 
                  required 
                  placeholder="Write a clear description of the course..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              ) : (
                <Form.Control 
                  as="textarea" 
                  rows={6} 
                  required 
                  placeholder="<p>Write raw HTML description here...</p>"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem', backgroundColor: '#1e1e1e', color: '#d4d4d4' }}
                />
              )}
              {descEditorMode === 'code' && (
                <Form.Text className="text-muted small">Raw HTML will be rendered on the public course page.</Form.Text>
              )}
            </Form.Group>

            <div className="row">
               <div className="col-md-6 mb-3">
                 <Form.Group>
                   <Form.Label className="fw-bold small text-muted text-uppercase">Mapping: Instrument</Form.Label>
                   <Form.Select 
                     value={formData.instrument_id}
                     onChange={(e) => setFormData({...formData, instrument_id: e.target.value, level_id: ''})}
                   >
                     <option value="">No Instrument (General)</option>
                     {instrumentsData?.instruments?.map(i => (
                       <option key={i._id} value={i._id}>{i.name}</option>
                     ))}
                   </Form.Select>
                   <Form.Text className="extra-small text-muted">Optional: For batch mapping</Form.Text>
                 </Form.Group>
               </div>
               <div className="col-md-6 mb-3">
                 <Form.Group>
                   <Form.Label className="fw-bold small text-muted text-uppercase">Mapping: Level</Form.Label>
                   <Form.Select 
                     value={formData.level_id}
                     onChange={(e) => setFormData({...formData, level_id: e.target.value})}
                     disabled={!formData.instrument_id}
                   >
                     <option value="">No Level</option>
                     {levelsData?.levels?.map(l => (
                       <option key={l._id} value={l._id}>{l.levelName}</option>
                     ))}
                   </Form.Select>
                   <Form.Text className="extra-small text-muted">Must select instrument first</Form.Text>
                 </Form.Group>
               </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <Form.Group>
                  <Form.Label className="fw-bold small text-muted text-uppercase">Price ($)</Form.Label>
                  <Form.Control 
                    type="number" 
                    required 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </Form.Group>
              </div>
              <div className="col-md-4 mb-3">
                <Form.Group>
                  <Form.Label className="fw-bold small text-muted text-uppercase">Level</Form.Label>
                  <Form.Select 
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-4 mb-3">
                <Form.Group>
                  <Form.Label className="fw-bold small text-muted text-uppercase">Status</Form.Label>
                  <Form.Select 
                    value={formData.moderationStatus}
                    onChange={(e) => setFormData({...formData, moderationStatus: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small text-muted text-uppercase">Course Creator (Content Owner)</Form.Label>
              <Form.Select 
                required
                value={formData.course_creator}
                onChange={(e) => setFormData({...formData, course_creator: e.target.value})}
              >
                <option value="">Select Instructor</option>
                {instructors.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* SEO Section */}
            <div className="border rounded p-3 bg-light mb-2">
              <h6 className="fw-bold small text-muted text-uppercase mb-3"><FaGlobe className="me-1" />SEO Settings</h6>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold">URL Slug</Form.Label>
                <InputGroup size="sm">
                  <InputGroup.Text className="text-muted small bg-white">/courses/</InputGroup.Text>
                  <Form.Control 
                    type="text"
                    placeholder="auto-generated-from-title"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                  />
                </InputGroup>
                <Form.Text className="text-muted extra-small">Leave blank to auto-generate from title.</Form.Text>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold">Meta Title</Form.Label>
                <Form.Control 
                  type="text" 
                  size="sm"
                  placeholder="Page title for search engines..."
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({...formData, metaTitle: e.target.value})}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-bold">Meta Description</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2}
                  size="sm"
                  placeholder="Short description for search results (150-160 chars)..."
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({...formData, metaDescription: e.target.value})}
                />
                <Form.Text className="text-muted extra-small">{formData.metaDescription.length}/160</Form.Text>
              </Form.Group>
              <Form.Group>
                <Form.Label className="small fw-bold">Meta Keywords</Form.Label>
                <Form.Control 
                  type="text" 
                  size="sm"
                  placeholder="guitar, beginner, music lessons"
                  value={formData.metaKeywords}
                  onChange={(e) => setFormData({...formData, metaKeywords: e.target.value})}
                />
                <Form.Text className="text-muted extra-small">Comma-separated keywords.</Form.Text>
              </Form.Group>
            </div>

            {/* Marketing Fields */}
            <div className="border rounded p-3 bg-light mb-2">
              <h6 className="fw-bold small text-muted text-uppercase mb-3"><FaDesktop className="me-1" />Course Details</h6>
              <div className="row">
                <div className="col-md-4 mb-2">
                  <Form.Group>
                    <Form.Label className="small fw-bold">Mode</Form.Label>
                    <Form.Select
                      size="sm"
                      value={formData.mode}
                      onChange={(e) => setFormData({...formData, mode: e.target.value})}
                    >
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-4 mb-2">
                  <Form.Group>
                    <Form.Label className="small fw-bold"><FaClock className="me-1"/>Duration</Form.Label>
                    <Form.Control
                      type="text"
                      size="sm"
                      placeholder="e.g. 3 Months, 12 Weeks"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-4 mb-2">
                  <Form.Label className="small fw-bold"><FaGraduationCap className="me-1"/>Certification</Form.Label>
                  <div className="pt-1">
                    <Form.Check
                      type="switch"
                      id="certificationToggle"
                      label={formData.certification ? 'Yes — Certificate Provided' : 'No Certificate'}
                      checked={formData.certification}
                      onChange={(e) => setFormData({...formData, certification: e.target.checked})}
                    />
                  </div>
                </div>
              </div>
              <Form.Group className="mt-2">
                <Form.Label className="small fw-bold">Short Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  size="sm"
                  placeholder="A brief summary shown prominently on the course page..."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                />
              </Form.Group>
            </div>

            {/* FAQ Section */}
            <div className="border rounded p-3 bg-light mb-2">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold small text-muted text-uppercase mb-0"><FaQuestionCircle className="me-1" />FAQ</h6>
                <Button variant="outline-primary" size="sm" onClick={addFaqItem}>
                  <FaPlus className="me-1" />Add Question
                </Button>
              </div>
              {formData.faq.length === 0 && (
                <p className="text-muted small mb-0">No FAQ items yet. Click "Add Question" to add one.</p>
              )}
              {formData.faq.map((item, idx) => (
                <div key={idx} className="bg-white border rounded p-2 mb-2">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="text-muted small fw-bold">Q{idx + 1}</span>
                    <Form.Control
                      type="text"
                      size="sm"
                      placeholder="Question"
                      value={item.question}
                      onChange={(e) => updateFaqItem(idx, 'question', e.target.value)}
                      className="flex-grow-1"
                    />
                    <Button variant="outline-danger" size="sm" onClick={() => removeFaqItem(idx)} title="Remove">
                      <FaTimes />
                    </Button>
                  </div>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    size="sm"
                    placeholder="Answer"
                    value={item.answer}
                    onChange={(e) => updateFaqItem(idx, 'answer', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? <Spinner size="sm" /> : editingCourse ? 'Update Course' : 'Create Course'}
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
          Are you sure you want to delete course <strong>{courseToDelete?.title}</strong>? All associated lessons and enrollments might be affected.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Spinner size="sm" /> : 'Delete Course'}
          </Button>
        </Modal.Footer>
      </Modal>
      <style jsx global>{`
        .cursor-pointer {
          cursor: pointer;
        }
        .hover-bg-light:hover {
          background-color: #e9ecef;
        }
        .x-small {
          font-size: 0.7rem;
        }
      `}</style>
    </Container>
  );
}

