'use client';
import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';
import { 
  Container, 
  Row, 
  Col, 
  Button, 
  Card, 
  Spinner, 
  Alert, 
  Modal, 
  Form, 
  ListGroup 
} from 'react-bootstrap';
import { 
  useGetCourseSectionsQuery,
  useCreateCourseSectionMutation,
  useUpdateSectionMutation, 
  useDeleteSectionMutation,
  useReorderCourseSectionsMutation,
  useGetLessonsQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation
} from '@/redux/api/apiSlice';
import { 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiArrowUp,
  FiArrowDown,
  FiMoreVertical, 
  FiCheck, 
  FiX, 
  FiLayers,
  FiBook,
  FiPlayCircle,
  FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CourseCurriculumPage() {
  const { courseId } = useParams();
  const { data: sectionsData, isLoading, isError, error } = useGetCourseSectionsQuery(courseId);
  const [createSection, { isLoading: isCreating }] = useCreateCourseSectionMutation();
  const [updateSection, { isLoading: isUpdating }] = useUpdateSectionMutation();
  const [deleteSection, { isLoading: isDeleting }] = useDeleteSectionMutation();
  const [reorderSections] = useReorderCourseSectionsMutation();

  const [createLesson, { isLoading: isCreatingLesson }] = useCreateLessonMutation();
  const [updateLesson, { isLoading: isUpdatingLesson }] = useUpdateLessonMutation();
  const [deleteLesson, { isLoading: isDeletingLesson }] = useDeleteLessonMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionTitle, setSectionTitle] = useState('');

  // Lesson Modal State
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [targetSectionId, setTargetSectionId] = useState(null);
  const [lessonData, setLessonData] = useState({ title: '', content: '', videoUrl: '' });

  const sections = useMemo(() => sectionsData?.data || [], [sectionsData]);

  const handleOpenModal = (section = null) => {
    if (section) {
      setEditingSection(section);
      setSectionTitle(section.title);
    } else {
      setEditingSection(null);
      setSectionTitle('');
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sectionTitle.trim()) {
      toast.error('Section title is required');
      return;
    }

    try {
      if (editingSection) {
        await updateSection({ 
          courseId, 
          sectionId: editingSection._id, 
          title: sectionTitle 
        }).unwrap();
        toast.success('Section updated!');
      } else {
        await createSection({ 
          courseId, 
          title: sectionTitle, 
          order: sections.length 
        }).unwrap();
        toast.success('Section created!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to save section');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section? All lessons inside will be deleted too.')) return;
    try {
      await deleteSection({ courseId, sectionId: id }).unwrap();
      toast.success('Section deleted!');
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to delete section');
    }
  };

  const handleMove = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const updatedSections = [...sections];
    const [moved] = updatedSections.splice(index, 1);
    updatedSections.splice(newIndex, 0, moved);

    const elements = updatedSections.map((s, i) => ({ _id: s._id, order: i }));

    try {
      await reorderSections({ courseId, elements }).unwrap();
      toast.success('Order updated!');
    } catch (err) {
      toast.error('Failed to reorder sections');
    }
  };

  const handleOpenLessonModal = (sectionId, lesson = null) => {
    setTargetSectionId(sectionId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonData({ title: lesson.title, content: lesson.content || '', videoUrl: lesson.videoUrl || '' });
    } else {
      setEditingLesson(null);
      setLessonData({ title: '', content: '', videoUrl: '' });
    }
    setShowLessonModal(true);
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    if (!lessonData.title.trim()) {
      toast.error('Lesson title is required');
      return;
    }

    try {
      if (editingLesson) {
        await updateLesson({ 
          lessonId: editingLesson._id, 
          ...lessonData 
        }).unwrap();
        toast.success('Lesson updated!');
      } else {
        await createLesson({ 
          sectionId: targetSectionId, 
          ...lessonData 
        }).unwrap();
        toast.success('Lesson created!');
      }
      setShowLessonModal(false);
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await deleteLesson(id).unwrap();
      toast.success('Lesson deleted!');
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to delete lesson');
    }
  };

  const LessonList = ({ sectionId }) => {
    const { data: lessonRes, isLoading: lessonsLoading } = useGetLessonsQuery(sectionId);
    const lessons = lessonRes?.data || [];

    if (lessonsLoading) return <div className="text-center py-2"><Spinner size="sm" /></div>;

    if (lessons.length === 0) {
      return (
        <div className="p-4 text-center">
          <div className="text-muted small mb-2">
            <FiBook className="me-1" /> No lessons added yet
          </div>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            className="rounded-pill px-3"
            onClick={() => handleOpenLessonModal(sectionId)}
          >
            <FiPlus className="me-1" /> Add Lesson
          </Button>
        </div>
      );
    }

    return (
      <>
        <ListGroup variant="flush">
          {lessons.map((lesson) => (
            <ListGroup.Item key={lesson._id} className="py-3 px-4 d-flex align-items-center justify-content-between hover-bg-light transition-all">
              <div className="d-flex align-items-center gap-3">
                <div className="text-primary fs-5">
                  {lesson.videoUrl ? <FiPlayCircle /> : <FiFileText />}
                </div>
                <div>
                  <h6 className="mb-0 fw-medium">{lesson.title}</h6>
                  {lesson.duration > 0 && <small className="text-muted">{Math.floor(lesson.duration / 60)} min</small>}
                </div>
              </div>
              <div className="d-flex gap-2">
                <Button variant="link" className="p-1 text-muted hover-primary" onClick={() => handleOpenLessonModal(sectionId, lesson)}>
                  <FiEdit3 size={14} />
                </Button>
                <Button variant="link" className="p-1 text-muted hover-danger" onClick={() => handleDeleteLesson(lesson._id)}>
                  <FiTrash2 size={14} />
                </Button>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
        <div className="p-3 border-top bg-light text-center">
          <Button variant="link" size="sm" className="text-decoration-none fw-bold" onClick={() => handleOpenLessonModal(sectionId)}>
            <FiPlus className="me-1" /> Add Another Lesson
          </Button>
        </div>
      </>
    );
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading curriculum...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Course Curriculum</h2>
          <p className="text-muted mb-0">Manage sections and lessons for your course.</p>
        </div>
        <Button 
          variant="primary" 
          className="d-flex align-items-center gap-2 shadow-sm"
          onClick={() => handleOpenModal()}
        >
          <FiPlus /> Add Section
        </Button>
      </div>

      {isError && <Alert variant="danger" className="mb-4 border-0 shadow-sm">{error?.data?.error || 'Error loading curriculum'}</Alert>}

      <div className="curriculum-list">
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <Card key={section._id} className="mb-3 border-0 shadow-sm overflow-hidden">
              <Card.Header className="bg-white py-3 border-0 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="section-order badge bg-light text-dark border p-2 rounded-3">
                    <FiLayers className="me-1 opacity-50" /> {index + 1}
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">{section.title}</h5>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="d-flex gap-1 me-2 border-end pe-2">
                    <Button 
                      variant="link" 
                      className={`p-1 text-muted ${index === 0 ? 'opacity-25' : 'hover-primary'}`}
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                    >
                      <FiArrowUp />
                    </Button>
                    <Button 
                      variant="link" 
                      className={`p-1 text-muted ${index === sections.length - 1 ? 'opacity-25' : 'hover-primary'}`}
                      disabled={index === sections.length - 1}
                      onClick={() => handleMove(index, 'down')}
                    >
                      <FiArrowDown />
                    </Button>
                  </div>
                  <Button 
                    variant="link" 
                    className="p-1 text-muted hover-primary"
                    onClick={() => handleOpenModal(section)}
                  >
                    <FiEdit3 />
                  </Button>
                  <Button 
                    variant="link" 
                    className="p-1 text-muted hover-danger"
                    onClick={() => handleDelete(section._id)}
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              </Card.Header>
                <Card.Body className="p-0 bg-light-gray">
                  <LessonList sectionId={section._id} />
                </Card.Body>
              </Card>
          ))
        ) : (
          <div className="text-center py-5 bg-white rounded-3 shadow-sm border border-dashed">
            <FiLayers size={48} className="text-muted mb-3 opacity-25" />
            <h4 className="fw-bold">No Sections Yet</h4>
            <p className="text-muted">Start by adding a section to your course.</p>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FiPlus className="me-1" /> Add First Section
            </Button>
          </div>
        )}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">{editingSection ? 'Edit Section' : 'Add Section'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="pt-0">
            <Form.Group>
              <Form.Label className="small fw-bold text-muted text-uppercase">Section Title</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. Introduction to React" 
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                autoFocus
              />
              <Form.Text className="text-muted small">Give your section a clear, descriptive name.</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating} className="px-4">
              {isCreating || isUpdating ? <Spinner size="sm" /> : editingSection ? 'Update Section' : 'Create Section'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Lesson Modal */}
      <Modal show={showLessonModal} onHide={() => setShowLessonModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleLessonSubmit}>
          <Modal.Body className="pt-0">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Lesson Title</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g. Setting up the environment" 
                value={lessonData.title}
                onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Video URL (Optional)</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="https://..." 
                value={lessonData.videoUrl}
                onChange={(e) => setLessonData({ ...lessonData, videoUrl: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Lesson Content</Form.Label>
              <div className="rich-text-editor-container" style={{ minHeight: '300px' }}>
                <ReactQuill 
                  theme="snow" 
                  value={lessonData.content}
                  onChange={(val) => setLessonData({ ...lessonData, content: val })}
                  placeholder="Explain this lesson in detail..."
                  style={{ height: '250px', marginBottom: '50px' }}
                />
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-4">
            <Button variant="light" onClick={() => setShowLessonModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreatingLesson || isUpdatingLesson} className="px-4">
              {isCreatingLesson || isUpdatingLesson ? <Spinner size="sm" /> : editingLesson ? 'Update Lesson' : 'Create Lesson'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style jsx global>{`
        .bg-light-gray { background-color: #fcfcfc; }
        .hover-bg-light:hover { background-color: #f8f9fa; }
        .hover-primary:hover { color: var(--bs-primary) !important; }
        .hover-danger:hover { color: var(--bs-danger) !important; }
        .border-dashed { border-style: dashed !important; border-width: 2px !important; }
        .transition-all { transition: all 0.2s ease; }
        
        /* Quill adjustments */
        .ql-container { font-family: inherit; font-size: 0.95rem; }
        .ql-toolbar { border-top-left-radius: 8px; border-top-right-radius: 8px; }
        .ql-container { border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
      `}</style>
    </Container>
  );
}
