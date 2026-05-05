'use client';
import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
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
  ListGroup,
  Badge
} from 'react-bootstrap';
import { 
  useGetAdminCourseSectionsQuery, 
  useCreateAdminCourseSectionMutation, 
  useUpdateAdminSectionMutation, 
  useDeleteAdminSectionMutation,
  useReorderAdminCourseSectionsMutation,
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
  FiCheck, 
  FiX, 
  FiLayers,
  FiBook,
  FiArrowLeft
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LessonQuizEditor from '@/components/admin/LessonQuizEditor';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function AdminCourseCurriculumPage() {
  const { id: courseId } = useParams();
  const router = useRouter();
  const { data: sectionsData, isLoading, isError, error } = useGetAdminCourseSectionsQuery(courseId);
  const [createAdminCourseSection, { isLoading: isCreating }] = useCreateAdminCourseSectionMutation();
  const [updateSection, { isLoading: isUpdating }] = useUpdateAdminSectionMutation();
  const [deleteSection, { isLoading: isDeleting }] = useDeleteAdminSectionMutation();
  const [reorderSections] = useReorderAdminCourseSectionsMutation();
  const [createLesson, { isLoading: isCreatingLesson }] = useCreateLessonMutation();
  const [updateLesson, { isLoading: isUpdatingLesson }] = useUpdateLessonMutation();
  const [deleteLesson] = useDeleteLessonMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [showLessonPlanModal, setShowLessonPlanModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonPlanDraft, setLessonPlanDraft] = useState('');
  const [lessonPlanStatus, setLessonPlanStatus] = useState('pending');
  const [lessonPlanNote, setLessonPlanNote] = useState('');
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('');
  const [lessonDraft, setLessonDraft] = useState({ title: '', content: '', videoUrl: '', audioUrl: '', pdfUrl: '' });

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
        await createAdminCourseSection({ 
          courseId, 
          title: sectionTitle, 
          order: sections.length 
        }).unwrap();
        toast.success('Section created!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save section');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      await deleteSection({ courseId, sectionId: id }).unwrap();
      toast.success('Section deleted!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete section');
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

  const openLessonPlanModal = (lesson) => {
    setEditingLesson(lesson);
    setLessonPlanDraft(lesson.lessonPlan || '');
    setLessonPlanStatus(lesson.lessonPlanStatus || 'pending');
    setLessonPlanNote(lesson.lessonPlanReviewNote || '');
    setShowLessonPlanModal(true);
  };

  const openLessonModal = (sectionId, lesson = null) => {
    setActiveSectionId(sectionId);
    setEditingLesson(lesson);
    setLessonDraft({
      title: lesson?.title || '',
      content: lesson?.content || '',
      videoUrl: lesson?.videoUrl || '',
      audioUrl: lesson?.audioUrl || '',
      pdfUrl: lesson?.pdfUrl || '',
    });
    setShowLessonModal(true);
  };

  const handleLessonSave = async (event) => {
    event.preventDefault();
    if (!lessonDraft.title.trim()) {
      toast.error('Lesson title is required');
      return;
    }
    try {
      if (editingLesson) {
        await updateLesson({ lessonId: editingLesson._id, ...lessonDraft }).unwrap();
        toast.success('Lesson updated');
      } else {
        await createLesson({ sectionId: activeSectionId, ...lessonDraft }).unwrap();
        toast.success('Lesson added');
      }
      setShowLessonModal(false);
      setEditingLesson(null);
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await deleteLesson(lessonId).unwrap();
      toast.success('Lesson deleted');
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to delete lesson');
    }
  };

  const handleLessonPlanUpdate = async (status = lessonPlanStatus) => {
    if (!editingLesson) return;

    try {
      await updateLesson({
        lessonId: editingLesson._id,
        lessonPlan: lessonPlanDraft,
        lessonPlanStatus: status,
        lessonPlanReviewNote: lessonPlanNote
      }).unwrap();
      toast.success('Lesson plan updated!');
      setShowLessonPlanModal(false);
    } catch (err) {
      toast.error(err?.data?.error || 'Failed to update lesson plan');
    }
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
      <div className="mb-4">
        <Button 
          variant="link" 
          className="p-0 text-decoration-none text-muted mb-3 d-flex align-items-center gap-1"
          onClick={() => router.back()}
        >
          <FiArrowLeft /> Back to Course
        </Button>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="fw-bold mb-1">Manage Curriculum (Admin)</h2>
            <p className="text-muted mb-0">Academic structure of the course.</p>
          </div>
          <Button 
            variant="primary" 
            className="d-flex align-items-center gap-2 shadow-sm"
            onClick={() => handleOpenModal()}
          >
            <FiPlus /> Add Section
          </Button>
        </div>
      </div>
 
      {isError && <Alert variant="danger" className="mb-4 border-0 shadow-sm">{error?.data?.message || 'Error loading curriculum'}</Alert>}

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
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="rounded-pill"
                    onClick={() => openLessonModal(section._id)}
                  >
                    <FiPlus className="me-1" /> Lesson
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="bg-light-gray p-0">
                <ListGroup variant="flush">
                  {section.lessons?.length > 0 ? section.lessons.map((lesson) => (
                    <ListGroup.Item key={lesson._id} className="px-4 py-3 border-top">
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div>
                          <div className="fw-bold d-flex align-items-center gap-2 flex-wrap">
                            <FiBook className="text-primary" />
                            {lesson.title}
                            <Badge
                              bg={lesson.lessonPlanStatus === 'approved' ? 'success' : lesson.lessonPlanStatus === 'rejected' ? 'danger' : lesson.lessonPlanStatus === 'pending' ? 'warning' : 'secondary'}
                              text={lesson.lessonPlanStatus === 'pending' ? 'dark' : undefined}
                            >
                              {lesson.lessonPlanStatus || 'draft'}
                            </Badge>
                          </div>
                          {lesson.lessonPlan ? (
                            <p className="small text-muted mb-0 mt-2">{lesson.lessonPlan}</p>
                          ) : (
                            <p className="small text-muted mb-0 mt-2">No lesson plan submitted yet.</p>
                          )}
                          {lesson.lessonPlanReviewNote && (
                            <div className="small text-muted mt-2">Admin note: {lesson.lessonPlanReviewNote}</div>
                          )}
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {lesson.videoUrl && <Badge bg="info">Video</Badge>}
                            {lesson.audioUrl && <Badge bg="secondary">Audio</Badge>}
                            {lesson.pdfUrl && <Badge bg="dark">PDF</Badge>}
                          </div>
                          <LessonQuizEditor lessonId={lesson._id} />
                        </div>
                        <div className="d-flex gap-2">
                          <Button variant="outline-secondary" size="sm" className="rounded-pill px-3" onClick={() => openLessonModal(section._id, lesson)}>
                            Edit
                          </Button>
                          <Button variant="outline-primary" size="sm" className="rounded-pill px-3" onClick={() => openLessonPlanModal(lesson)}>
                            Review
                          </Button>
                          <Button variant="outline-danger" size="sm" className="rounded-pill px-3" onClick={() => handleDeleteLesson(lesson._id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </ListGroup.Item>
                  )) : (
                    <ListGroup.Item className="p-4 text-center border-top">
                      <div className="text-muted small mb-0">
                        <FiBook className="me-1" /> No lessons added in this section.
                      </div>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          ))
        ) : (
          <div className="text-center py-5 bg-white rounded-3 shadow-sm border border-dashed text-muted">
            <FiLayers size={48} className="mb-3 opacity-25" />
            <h4 className="fw-bold">No Sections Yet</h4>
            <p>Admin can add sections to help instructors get started.</p>
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
                placeholder="e.g. Introduction to LMS" 
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                autoFocus
              />
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

      <Modal show={showLessonPlanModal} onHide={() => setShowLessonPlanModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Review Lesson Plan</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <div className="mb-3">
            <div className="small text-muted text-uppercase fw-bold mb-1">Lesson</div>
            <div className="fw-bold">{editingLesson?.title}</div>
          </div>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Lesson Plan</Form.Label>
            <Form.Control
              as="textarea"
              rows={8}
              value={lessonPlanDraft}
              onChange={(e) => setLessonPlanDraft(e.target.value)}
              placeholder="Edit or add lesson plan details."
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Status</Form.Label>
            <Form.Select value={lessonPlanStatus} onChange={(e) => setLessonPlanStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Disapproved</option>
              <option value="draft">Draft</option>
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label className="small fw-bold text-muted text-uppercase">Review Note</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={lessonPlanNote}
              onChange={(e) => setLessonPlanNote(e.target.value)}
              placeholder="Optional note for teacher."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex justify-content-between">
          <Button variant="outline-danger" onClick={() => handleLessonPlanUpdate('rejected')} disabled={isUpdatingLesson}>
            Disapprove
          </Button>
          <div className="d-flex gap-2">
            <Button variant="light" onClick={() => setShowLessonPlanModal(false)}>Cancel</Button>
            <Button variant="outline-primary" onClick={() => handleLessonPlanUpdate()} disabled={isUpdatingLesson}>
              Save Edit
            </Button>
            <Button variant="success" onClick={() => handleLessonPlanUpdate('approved')} disabled={isUpdatingLesson}>
              Approve
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <Modal show={showLessonModal} onHide={() => setShowLessonModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleLessonSave}>
          <Modal.Body className="pt-0">
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Lesson Title</Form.Label>
                  <Form.Control value={lessonDraft.title} onChange={(e) => setLessonDraft({ ...lessonDraft, title: e.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Content</Form.Label>
                  <div className="rich-text-editor-container" style={{ minHeight: '260px' }}>
                    <ReactQuill
                      theme="snow"
                      value={lessonDraft.content}
                      onChange={(value) => setLessonDraft({ ...lessonDraft, content: value })}
                      placeholder="Write lesson details, instructions, notes, or links..."
                      style={{ height: '210px', marginBottom: '50px' }}
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={4}><Form.Group><Form.Label>Video URL</Form.Label><Form.Control value={lessonDraft.videoUrl} onChange={(e) => setLessonDraft({ ...lessonDraft, videoUrl: e.target.value })} /></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label>Audio URL</Form.Label><Form.Control value={lessonDraft.audioUrl} onChange={(e) => setLessonDraft({ ...lessonDraft, audioUrl: e.target.value })} /></Form.Group></Col>
              <Col md={4}><Form.Group><Form.Label>PDF URL</Form.Label><Form.Control value={lessonDraft.pdfUrl} onChange={(e) => setLessonDraft({ ...lessonDraft, pdfUrl: e.target.value })} /></Form.Group></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={() => setShowLessonModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isCreatingLesson || isUpdatingLesson}>
              {isCreatingLesson || isUpdatingLesson ? <Spinner size="sm" /> : 'Save Lesson'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style jsx global>{`
        .bg-light-gray { background-color: #fcfcfc; }
        .hover-primary:hover { color: var(--bs-primary) !important; }
        .hover-danger:hover { color: var(--bs-danger) !important; }
        .border-dashed { border-style: dashed !important; border-width: 2px !important; }
        .ql-container { font-family: inherit; font-size: 0.95rem; }
        .ql-toolbar { border-top-left-radius: 8px; border-top-right-radius: 8px; }
        .ql-container { border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
      `}</style>
    </Container>
  );
}
