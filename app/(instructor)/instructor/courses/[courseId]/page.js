'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert, Accordion, ListGroup, Modal, Badge, InputGroup } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FiArrowUp, FiArrowDown, FiTrash2, FiEdit3, FiPlus, FiSearch, FiX, FiCheckCircle, FiSave, FiUploadCloud } from 'react-icons/fi';
import {
  useGetAdminCategoriesQuery,
  useGetAdminInstrumentsQuery,
  useGetAdminLevelsQuery
} from '@/redux/api/apiSlice';
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
  const [editingLesson, setEditingLesson] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonPlan, setNewLessonPlan] = useState('');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');

  const { data: categoriesData } = useGetAdminCategoriesQuery();
  const { data: instrumentsData } = useGetAdminInstrumentsQuery();
  const [categorySearch, setCategorySearch] = useState('');
  const allCategories = useMemo(() => categoriesData?.data || [], [categoriesData?.data]);
  const { data: levelsData } = useGetAdminLevelsQuery(
    { instrumentId: course?.instrument_id?._id || course?.instrument_id || '' },
    { skip: !course?.instrument_id }
  );

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

  const fetchCourse = useCallback(async () => {
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
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

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
        categoryIds: course.categoryIds?.map(c => c._id || c) || [],
        instrument_id: course.instrument_id?._id || course.instrument_id || '',
        level_id: course.level_id?._id || course.level_id || ''
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

  const updateCourseField = (field, value) => {
    setCourse({ ...course, [field]: value });
    setIsDirty(true);
  };

  const addFaqItem = () => {
    updateCourseField('faq', [...(course.faq || []), { question: '', answer: '' }]);
  };

  const removeFaqItem = (idx) => {
    updateCourseField('faq', (course.faq || []).filter((_, i) => i !== idx));
  };

  const updateFaqItem = (idx, field, value) => {
    const updated = [...(course.faq || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    updateCourseField('faq', updated);
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

  const openAddLessonModal = (sectionId) => {
    setEditingLesson(null);
    setActiveSectionId(sectionId);
    setNewLessonTitle('');
    setNewLessonPlan('');
    setNewLessonVideoUrl('');
    setShowLessonModal(true);
  };

  const openEditLessonModal = (lesson, sectionId) => {
    setEditingLesson(lesson);
    setActiveSectionId(sectionId);
    setNewLessonTitle(lesson.title || '');
    setNewLessonPlan(lesson.lessonPlan || '');
    setNewLessonVideoUrl(lesson.videoUrl || '');
    setShowLessonModal(true);
  };

  const closeLessonModal = () => {
    setShowLessonModal(false);
    setEditingLesson(null);
    setActiveSectionId(null);
    setNewLessonTitle('');
    setNewLessonPlan('');
    setNewLessonVideoUrl('');
  };

  const handleSaveLesson = async () => {
    if(!newLessonTitle || (!activeSectionId && !editingLesson)) return;

    try {
      const payload = {
        title: newLessonTitle,
        videoUrl: newLessonVideoUrl,
        lessonPlan: newLessonPlan
      };

      if (editingLesson) {
        await axios.put(`/api/lessons/${editingLesson._id}`, payload);
        toast.success('Lesson updated!');
      } else {
        await axios.post(`/api/sections/${activeSectionId}/lessons`, payload);
        toast.success('Lesson created!');
      }

      closeLessonModal();
      fetchCourse();
    } catch (err) {
       toast.error(editingLesson ? 'Failed to update lesson.' : 'Failed to create lesson.');
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
                    onChange={e => updateCourseField('title', e.target.value)} 
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted text-uppercase">Course Image URL</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={course.thumbnail || ''}
                    onChange={e => updateCourseField('thumbnail', e.target.value)}
                  />
                  {course.thumbnail && (
                    <div className="mt-2">
                      <img src={course.thumbnail} alt="Course preview" className="rounded border" style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small text-muted text-uppercase">Download Brochure URL</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://example.com/brochure.pdf"
                    value={course.brochureUrl || ''}
                    onChange={e => updateCourseField('brochureUrl', e.target.value)}
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
                      onChange={val => updateCourseField('description', val)}
                      style={{ height: '300px', marginBottom: '50px' }}
                    />
                  </div>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold small text-muted text-uppercase">Mapping: Instrument</Form.Label>
                      <Form.Select
                        value={course.instrument_id?._id || course.instrument_id || ''}
                        onChange={e => {
                          setCourse({ ...course, instrument_id: e.target.value, level_id: '' });
                          setIsDirty(true);
                        }}
                      >
                        <option value="">No Instrument</option>
                        {instrumentsData?.instruments?.map(instrument => (
                          <option key={instrument._id} value={instrument._id}>{instrument.name}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold small text-muted text-uppercase">Mapping: Level</Form.Label>
                      <Form.Select
                        value={course.level_id?._id || course.level_id || ''}
                        onChange={e => updateCourseField('level_id', e.target.value)}
                        disabled={!course.instrument_id}
                      >
                        <option value="">No Level</option>
                        {levelsData?.levels?.map(level => (
                          <option key={level._id} value={level._id}>{level.levelName}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold small text-muted text-uppercase">Level</Form.Label>
                      <Form.Select value={course.level || 'All Levels'} onChange={e => updateCourseField('level', e.target.value)}>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="All Levels">All Levels</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold small text-muted text-uppercase">Approval Status</Form.Label>
                      <Form.Control value={course.moderationStatus || 'pending'} disabled />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Price ($)</Form.Label>
                  <Form.Control 
                    type="number" 
                    value={course.price || 0} 
                    onChange={e => updateCourseField('price', e.target.value)} 
                  />
                </Form.Group>

                <div className="border rounded p-3 bg-light mb-3">
                  <h6 className="fw-bold small text-muted text-uppercase mb-3">SEO Settings</h6>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-bold">URL Slug</Form.Label>
                    <InputGroup size="sm">
                      <InputGroup.Text className="bg-white text-muted">/courses/</InputGroup.Text>
                      <Form.Control
                        placeholder="auto-generated-from-title"
                        value={course.slug || ''}
                        onChange={e => updateCourseField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      />
                    </InputGroup>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-bold">Meta Title</Form.Label>
                    <Form.Control size="sm" value={course.metaTitle || ''} onChange={e => updateCourseField('metaTitle', e.target.value)} />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-bold">Meta Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      size="sm"
                      value={course.metaDescription || ''}
                      onChange={e => updateCourseField('metaDescription', e.target.value)}
                    />
                    <Form.Text className="text-muted extra-small">{(course.metaDescription || '').length}/160</Form.Text>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Meta Keywords</Form.Label>
                    <Form.Control size="sm" value={course.metaKeywords || ''} onChange={e => updateCourseField('metaKeywords', e.target.value)} />
                  </Form.Group>
                </div>

                <div className="border rounded p-3 bg-light mb-3">
                  <h6 className="fw-bold small text-muted text-uppercase mb-3">Course Details</h6>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-bold">Mode</Form.Label>
                        <Form.Select size="sm" value={course.mode || 'Online'} onChange={e => updateCourseField('mode', e.target.value)}>
                          <option value="Online/Offline">Online/Offline</option>
                          <option value="Online">Online</option>
                          <option value="Offline">Offline</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-bold">Duration</Form.Label>
                        <Form.Control size="sm" placeholder="e.g. 3 Months" value={course.duration || ''} onChange={e => updateCourseField('duration', e.target.value)} />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small fw-bold">Certification</Form.Label>
                      <Form.Check
                        type="switch"
                        id="instructorCertificationToggle"
                        label={course.certification ? 'Yes' : 'No'}
                        checked={!!course.certification}
                        onChange={e => updateCourseField('certification', e.target.checked)}
                      />
                    </Col>
                  </Row>
                  <Form.Group className="mt-2">
                    <Form.Label className="small fw-bold">Short Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      size="sm"
                      value={course.shortDescription || ''}
                      onChange={e => updateCourseField('shortDescription', e.target.value)}
                    />
                  </Form.Group>
                </div>

                <div className="border rounded p-3 bg-light mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold small text-muted text-uppercase mb-0">FAQ</h6>
                    <Button variant="outline-primary" size="sm" onClick={addFaqItem}>
                      <FiPlus className="me-1" /> Add Question
                    </Button>
                  </div>
                  {(course.faq || []).length === 0 && (
                    <p className="text-muted small mb-0">No FAQ items yet.</p>
                  )}
                  {(course.faq || []).map((item, idx) => (
                    <div key={idx} className="bg-white border rounded p-2 mb-2">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="text-muted small fw-bold">Q{idx + 1}</span>
                        <Form.Control
                          size="sm"
                          placeholder="Question"
                          value={item.question || ''}
                          onChange={e => updateFaqItem(idx, 'question', e.target.value)}
                        />
                        <Button variant="outline-danger" size="sm" onClick={() => removeFaqItem(idx)} title="Remove">
                          <FiTrash2 />
                        </Button>
                      </div>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        size="sm"
                        placeholder="Answer"
                        value={item.answer || ''}
                        onChange={e => updateFaqItem(idx, 'answer', e.target.value)}
                      />
                    </div>
                  ))}
                </div>

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
                                              {lesson.lessonPlan && (
                                                <Badge
                                                  bg={lesson.lessonPlanStatus === 'approved' ? 'success' : lesson.lessonPlanStatus === 'rejected' ? 'danger' : 'warning'}
                                                  text={lesson.lessonPlanStatus === 'pending' ? 'dark' : undefined}
                                                  className="ms-2"
                                                >
                                                  Plan {lesson.lessonPlanStatus || 'pending'}
                                                </Badge>
                                              )}
                                              
                                          </div>
                                          <div className="d-flex align-items-center gap-2 ms-3">
                                            <Button variant="outline-primary" size="sm" className="rounded-pill px-3 d-flex align-items-center gap-1" onClick={() => openEditLessonModal(lesson, section._id)}>
                                                <FiEdit3 size={13} /> Edit
                                            </Button>
                                            <Button variant="link" className="text-danger p-0" onClick={() => handleDeleteLesson(lesson._id)}>
                                                Delete
                                            </Button>
                                            
                                          </div>
                                      </ListGroup.Item>
                                  ))}
                                  <ListGroup.Item className="bg-white py-3">
                                      <div className="d-flex justify-content-between w-100">
                                          <Button variant="link" size="sm" className="text-decoration-none fw-bold" onClick={() => openAddLessonModal(section._id)}>
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

      <Modal show={showLessonModal} onHide={closeLessonModal}>
        <Modal.Header closeButton><Modal.Title>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</Modal.Title></Modal.Header>
        <Modal.Body>
            <Form.Group className="mb-3">
                <Form.Label>Lesson Title</Form.Label>
                <Form.Control type="text" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Lesson Plan</Form.Label>
                <div className="rich-text-editor-container" style={{ minHeight: '260px' }}>
                  <ReactQuill
                    theme="snow"
                    value={newLessonPlan}
                    onChange={setNewLessonPlan}
                    placeholder="Write the class objective, activities, practice work, and expected outcome."
                    style={{ height: '210px', marginBottom: '50px' }}
                  />
                </div>
                <Form.Text className="text-muted">Submitted lesson plans will stay pending until admin approval.</Form.Text>
            </Form.Group>
            <Form.Group>
                <Form.Label>Video URL</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://example.com/lesson-video.mp4"
                  value={newLessonVideoUrl}
                  onChange={e => setNewLessonVideoUrl(e.target.value)}
                />
                <Form.Text className="text-muted">Paste a hosted video URL, YouTube link, or storage URL.</Form.Text>
            </Form.Group>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={closeLessonModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveLesson}>
                {editingLesson ? 'Update Lesson' : 'Save Lesson'}
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
