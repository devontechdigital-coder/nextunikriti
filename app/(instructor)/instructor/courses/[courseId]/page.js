'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Accordion, ListGroup, Modal, Badge, InputGroup } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FiArrowUp, FiArrowDown, FiTrash2, FiPlus, FiSearch, FiX, FiCheckCircle, FiSave, FiUploadCloud } from 'react-icons/fi';
import { useGetAdminCategoriesQuery } from '@/redux/api/apiSlice';
import toast from 'react-hot-toast';

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function CourseBuilderPage() {
  const params = useParams();
  const courseId = params.courseId;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Modals
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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

  const fetchCourse = async () => {
    try {
      const res = await axios.get(`/api/courses/${courseId}`);
      if (res.data.success) {
        setCourse(res.data.data);
      }
    } catch (err) {
      setError('Failed to load course details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  // Unsaved changes guard
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleUpdateCourse = async (e, forcePublished = null) => {
    if (e) e.preventDefault();
    setSaving(true);
    
    // Create a toast for the saving process
    const saveToast = toast.loading(forcePublished !== null ? (forcePublished ? 'Publishing...' : 'Saving Draft...') : 'Saving changes...');
    
    try {
      const payload = {
        ...course,
        categoryIds: course.categoryIds?.map(c => c._id || c) || []
      };
      
      if (forcePublished !== null) {
        payload.isPublished = forcePublished;
      }

      await axios.put(`/api/courses/${courseId}`, payload);
      
      toast.success(forcePublished !== null ? (forcePublished ? 'Course Published!' : 'Draft Saved!') : 'Changes saved!', { id: saveToast });
      
      setIsDirty(false);
      fetchCourse();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update course.', { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (e, catId) => {
    e.preventDefault();
    const currentIds = [...(course.categoryIds || [])].map(id => (id._id || id).toString());
    const idStr = catId.toString();
    const index = currentIds.indexOf(idStr);
    
    let newIds;
    if (index > -1) {
      newIds = currentIds.filter(id => id !== idStr);
    } else {
      newIds = [...currentIds, idStr];
    }
    
    setCourse({ ...course, categoryIds: newIds });
    setIsDirty(true);
  };

  const handleCreateSection = async () => {
    if(!newSectionTitle) return;
    try {
      await axios.post(`/api/courses/${courseId}/sections`, { title: newSectionTitle });
      setShowSectionModal(false);
      setNewSectionTitle('');
      toast.success('Section created!');
      fetchCourse();
    } catch (err) {
       toast.error('Failed to create section.');
    }
  };

  const handleCreateLesson = async () => {
    if(!newLessonTitle || !activeSectionId) return;
    
    let videoUrl = '';
    
    // Quick inline GCS Upload if file provided
    if(uploadFile) {
      setUploading(true);
      try {
         const { data } = await axios.post('/api/upload', {
             filename: uploadFile.name,
             contentType: uploadFile.type
         });
         
         const signedUrl = data.data.signedUrl;
         videoUrl = data.data.fileUrl; // We save the bucket path reference

         // Perform actual PUT to GCP
         await axios.put(signedUrl, uploadFile, {
             headers: { 'Content-Type': uploadFile.type }
         });
      } catch(e) {
          toast.error('Failed to upload video');
          setUploading(false);
          return;
      }
      setUploading(false);
    }

    try {
      await axios.post(`/api/sections/${activeSectionId}/lessons`, { 
          title: newLessonTitle,
          videoUrl 
      });
      setShowLessonModal(false);
      setNewLessonTitle('');
      setUploadFile(null);
      toast.success('Lesson created!');
      fetchCourse();
    } catch (err) {
       toast.error('Failed to create lesson.');
    }
  };

  const handleDeleteSection = async (sectionId) => {
      if(!confirm('Are you sure you want to delete this section and all its lessons?')) return;
      try {
          await axios.delete(`/api/sections/${sectionId}`);
          toast.success('Section deleted!');
          fetchCourse();
      } catch (err) {
          toast.error('Failed to delete section.');
      }
  };

  const handleDeleteLesson = async (lessonId) => {
      if(!confirm('Are you sure you want to delete this lesson?')) return;
      try {
          await axios.delete(`/api/lessons/${lessonId}`);
          toast.success('Lesson deleted!');
          fetchCourse();
      } catch (err) {
          toast.error('Failed to delete lesson.');
      }
  };

  const handleMoveSection = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= course.sections.length) return;

    const sections = [...course.sections];
    const [moved] = sections.splice(index, 1);
    sections.splice(newIndex, 0, moved);

    const elements = sections.map((s, i) => ({ _id: s._id, order: i }));

    try {
      await axios.put(`/api/instructor/courses/${courseId}/sections/reorder`, { elements });
      toast.success('Sections reordered!');
      fetchCourse();
    } catch (err) {
      toast.error('Failed to reorder sections');
    }
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (error) return <Container className="py-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container className="py-5">
      <Row>
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white fw-bold py-3">Course Settings</Card.Header>
            <Card.Body>
              <Form onSubmit={handleUpdateCourse}>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={course.title} 
                    onChange={e => { setCourse({...course, title: e.target.value}); setIsDirty(true); }} 
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold small text-muted text-uppercase">Categories</Form.Label>
                  {course.categoryIds?.length > 0 && (
                    <div className="mb-2 d-flex flex-wrap gap-1">
                      {course.categoryIds.map(cid => {
                        const idStr = (cid._id || cid).toString();
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

                  <div className="border rounded bg-white p-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                    {(() => {
                      const TreeSelectorNode = ({ node, level = 0 }) => {
                        const isSelected = course.categoryIds?.some(cid => (cid._id || cid).toString() === node._id);
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

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted text-uppercase">Description</Form.Label>
                  <div className="rich-text-editor-container" style={{ minHeight: '350px' }}>
                    <ReactQuill 
                      theme="snow" 
                      value={course.description || ''} 
                      onChange={val => { setCourse({...course, description: val}); setIsDirty(true); }}
                      style={{ height: '300px', marginBottom: '50px' }}
                    />
                  </div>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Price ($)</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={course.price} 
                    onChange={e => { setCourse({...course, price: e.target.value}); setIsDirty(true); }} 
                  />
                </Form.Group>
                <div className="d-flex flex-column gap-2 mt-4">
                  {course.isPublished ? (
                    <Button variant="outline-secondary" className="fw-bold d-flex align-items-center justify-content-center gap-2" onClick={(e) => handleUpdateCourse(e, false)} disabled={saving}>
                      <FiSave /> Return to Draft
                    </Button>
                  ) : (
                    <Button variant="success" className="fw-bold d-flex align-items-center justify-content-center gap-2" onClick={(e) => handleUpdateCourse(e, true)} disabled={saving}>
                      <FiUploadCloud /> {saving ? 'Publishing...' : 'Publish Course'}
                    </Button>
                  )}
                  <Button variant="dark" type="submit" className="fw-bold d-flex align-items-center justify-content-center gap-2" disabled={saving || (!isDirty && course.isPublished)}>
                    <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  {isDirty && <div className="text-center x-small text-danger mt-1 fw-bold">* You have unsaved changes</div>}
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold m-0">Curriculum</h4>
              <Button variant="outline-primary" size="sm" onClick={() => setShowSectionModal(true)}>
                  + Add Section
              </Button>
          </div>

          {course.sections?.length === 0 ? (
              <Alert variant="light" className="text-center py-5 border">
                  <p className="mb-0 text-muted">No sections added yet. Build your curriculum here.</p>
              </Alert>
          ) : (
              <Accordion defaultActiveKey="0">
                  {course.sections.map((section, idx) => (
                      <Accordion.Item eventKey={idx.toString()} key={section._id} className="mb-3 border rounded shadow-sm">
                           <Accordion.Header>
                               <div className="fw-bold w-100 d-flex justify-content-between align-items-center pe-3">
                                   <span>{section.title}</span>
                                   <div className="d-flex gap-2">
                                      <Button 
                                        variant="link" 
                                        size="sm" 
                                        className={`p-0 text-muted ${idx === 0 ? 'opacity-25' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'up'); }}
                                        disabled={idx === 0}
                                      >
                                        <FiArrowUp />
                                      </Button>
                                      <Button 
                                        variant="link" 
                                        size="sm" 
                                        className={`p-0 text-muted ${idx === course.sections.length - 1 ? 'opacity-25' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); handleMoveSection(idx, 'down'); }}
                                        disabled={idx === course.sections.length - 1}
                                      >
                                        <FiArrowDown />
                                      </Button>
                                   </div>
                               </div>
                           </Accordion.Header>
                          <Accordion.Body className="p-0">
                              <ListGroup variant="flush">
                                  {section.lessons?.map((lesson) => (
                                      <ListGroup.Item key={lesson._id} className="d-flex justify-content-between align-items-center py-3 bg-light">
                                          <div>
                                              <i className="bi bi-play-circle me-2 text-primary"></i> 
                                              {lesson.title}
                                              {lesson.videoUrl && <Badge bg="info" className="ms-2">Video attached</Badge>}
                                          </div>
                                          <Button variant="link" className="text-danger p-0 ms-3" onClick={() => handleDeleteLesson(lesson._id)}>
                                              Delete
                                          </Button>
                                      </ListGroup.Item>
                                  ))}
                                  <ListGroup.Item className="bg-white py-3">
                                      <div className="d-flex justify-content-between w-100">
                                          <Button variant="link" size="sm" className="text-decoration-none fw-bold" onClick={() => { setActiveSectionId(section._id); setShowLessonModal(true); }}>
                                              + Add Lesson
                                          </Button>
                                          <Button variant="link" size="sm" className="text-danger text-decoration-none" onClick={() => handleDeleteSection(section._id)}>
                                              Delete Section
                                          </Button>
                                      </div>
                                  </ListGroup.Item>
                              </ListGroup>
                          </Accordion.Body>
                      </Accordion.Item>
                  ))}
              </Accordion>
          )}

        </Col>
      </Row>

      {/* Modals */}
      <Modal show={showSectionModal} onHide={() => setShowSectionModal(false)}>
        <Modal.Header closeButton><Modal.Title>Add Section</Modal.Title></Modal.Header>
        <Modal.Body>
            <Form.Group>
                <Form.Label>Section Title</Form.Label>
                <Form.Control type="text" value={newSectionTitle} onChange={e => setNewSectionTitle(e.target.value)} />
            </Form.Group>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSectionModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateSection}>Save Section</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showLessonModal} onHide={() => setShowLessonModal(false)}>
        <Modal.Header closeButton><Modal.Title>Add Lesson</Modal.Title></Modal.Header>
        <Modal.Body>
            <Form.Group className="mb-3">
                <Form.Label>Lesson Title</Form.Label>
                <Form.Control type="text" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} />
            </Form.Group>
            <Form.Group>
                <Form.Label>Upload Video (Optional)</Form.Label>
                <Form.Control type="file" accept="video/mp4,video/x-m4v,video/*" onChange={e => setUploadFile(e.target.files[0])} />
                <Form.Text className="text-muted">Directly uploads to Google Cloud Storage bucket.</Form.Text>
            </Form.Group>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowLessonModal(false)} disabled={uploading}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateLesson} disabled={uploading}>
                {uploading ? 'Uploading & Saving...' : 'Save Lesson'}
            </Button>
        </Modal.Footer>
      </Modal>

      <style jsx global>{`
        .cursor-pointer { cursor: pointer; }
        .hover-bg-light:hover { background-color: #f8f9fa; }
        .x-small { font-size: 0.7rem; }
        
        /* Quill adjustments */
        .ql-container { font-family: inherit; font-size: 0.95rem; }
        .ql-toolbar { border-top-left-radius: 8px; border-top-right-radius: 8px; border-color: #dee2e6 !important; }
        .ql-container { border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; border-color: #dee2e6 !important; }
      `}</style>
    </Container>
  );
}
