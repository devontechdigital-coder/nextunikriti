'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner, Tab, Table, Tabs } from 'react-bootstrap';
import { FiCheckCircle, FiEdit3, FiEye, FiRefreshCw, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Disapproved' },
  { key: 'draft', label: 'Draft' },
];

const getStatusVariant = (status) => {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'pending') return 'warning';
  return 'secondary';
};

export default function AdminLessonReviewsPage() {
  const [lessons, setLessons] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonPlanDraft, setLessonPlanDraft] = useState('');
  const [reviewNote, setReviewNote] = useState('');

  const counts = useMemo(() => {
    return lessons.reduce((acc, lesson) => {
      acc.all += 1;
      acc[lesson.lessonPlanStatus || 'draft'] = (acc[lesson.lessonPlanStatus || 'draft'] || 0) + 1;
      return acc;
    }, { all: 0, pending: 0, approved: 0, rejected: 0, draft: 0 });
  }, [lessons]);

  const visibleLessons = useMemo(() => {
    if (status === 'all') return lessons;
    return lessons.filter((lesson) => (lesson.lessonPlanStatus || 'draft') === status);
  }, [lessons, status]);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/lesson-reviews');
      if (res.data.success) {
        setLessons(res.data.data || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load lesson reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const openReviewModal = (lesson) => {
    setSelectedLesson(lesson);
    setLessonPlanDraft(lesson.lessonPlan || '');
    setReviewNote(lesson.lessonPlanReviewNote || '');
  };

  const closeReviewModal = () => {
    setSelectedLesson(null);
    setLessonPlanDraft('');
    setReviewNote('');
  };

  const handleUpdate = async (nextStatus = selectedLesson?.lessonPlanStatus || 'pending') => {
    if (!selectedLesson) return;

    setSaving(true);
    try {
      const res = await axios.put(`/api/lessons/${selectedLesson._id}`, {
        lessonPlan: lessonPlanDraft,
        lessonPlanStatus: nextStatus,
        lessonPlanReviewNote: reviewNote,
      });

      if (res.data.success) {
        toast.success('Lesson review updated');
        closeReviewModal();
        fetchLessons();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update lesson review');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickUpdate = async (lesson, nextStatus) => {
    setSaving(true);
    try {
      const res = await axios.put(`/api/lessons/${lesson._id}`, {
        lessonPlan: lesson.lessonPlan,
        lessonPlanStatus: nextStatus,
        lessonPlanReviewNote: lesson.lessonPlanReviewNote || '',
      });

      if (res.data.success) {
        toast.success(nextStatus === 'approved' ? 'Lesson plan approved' : 'Lesson plan disapproved');
        fetchLessons();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update lesson review');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted fw-bold">Loading lesson reviews...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Lesson Reviews</h2>
          <p className="text-muted mb-0">Review lesson plans submitted by instructors before approval.</p>
        </div>
        <Button variant="outline-primary" className="rounded-pill px-4 fw-bold d-flex align-items-center gap-2" onClick={fetchLessons}>
          <FiRefreshCw /> Refresh
        </Button>
      </div>

      <Row className="g-3 mb-4">
        {statusTabs.map((item) => (
          <Col md={4} xl key={item.key}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body>
                <div className="small text-muted text-uppercase fw-bold">{item.label}</div>
                <div className="display-6 fw-bold">{counts[item.key] || 0}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 pt-4 px-4">
          <Tabs activeKey={status} onSelect={(key) => setStatus(key || 'pending')} className="u-lesson-review-tabs">
            {statusTabs.map((item) => (
              <Tab key={item.key} eventKey={item.key} title={`${item.label} (${counts[item.key] || 0})`} />
            ))}
          </Tabs>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light text-secondary text-uppercase small">
              <tr>
                <th className="ps-4 py-3">Lesson</th>
                <th>Course</th>
                <th>Submitted By</th>
                <th>Status</th>
                <th>Updated</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleLessons.map((lesson) => (
                <tr key={lesson._id}>
                  <td className="ps-4">
                    <div className="fw-bold">{lesson.title}</div>
                    <div className="small text-muted">{lesson.sectionId?.title || 'No section'}</div>
                  </td>
                  <td>
                    <div className="small fw-bold">{lesson.course?.title || 'Unknown course'}</div>
                    <div className="small text-muted">
                      {lesson.course?.course_creator?.name || lesson.course?.instructor?.name || 'Unknown instructor'}
                    </div>
                  </td>
                  <td>
                    <div className="small">{lesson.lessonPlanSubmittedBy?.name || 'Instructor'}</div>
                    <div className="small text-muted">{lesson.lessonPlanSubmittedBy?.email || ''}</div>
                  </td>
                  <td>
                    <Badge
                      bg={getStatusVariant(lesson.lessonPlanStatus)}
                      text={lesson.lessonPlanStatus === 'pending' ? 'dark' : undefined}
                      className="rounded-pill px-3 py-2"
                    >
                      {(lesson.lessonPlanStatus || 'draft').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="small text-muted">
                    {lesson.updatedAt ? new Date(lesson.updatedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="text-end pe-4">
                    <Button variant="outline-primary" size="sm" className="rounded-pill px-3 me-2" onClick={() => openReviewModal(lesson)}>
                      <FiEye className="me-1" /> Review
                    </Button>
                    <Button variant="outline-success" size="sm" className="rounded-pill px-3 me-2" onClick={() => handleQuickUpdate(lesson, 'approved')} disabled={saving}>
                      <FiCheckCircle />
                    </Button>
                    <Button variant="outline-danger" size="sm" className="rounded-pill px-3" onClick={() => handleQuickUpdate(lesson, 'rejected')} disabled={saving}>
                      <FiXCircle />
                    </Button>
                  </td>
                </tr>
              ))}
              {visibleLessons.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No lesson plans found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={!!selectedLesson} onHide={closeReviewModal} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">{selectedLesson?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <div className="mb-3">
            <div className="small text-muted text-uppercase fw-bold">Course</div>
            <div>{selectedLesson?.course?.title || 'Unknown course'}</div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted text-uppercase">Lesson Plan</Form.Label>
            <div className="rich-text-editor-container" style={{ minHeight: '320px' }}>
              <ReactQuill
                theme="snow"
                value={lessonPlanDraft}
                onChange={setLessonPlanDraft}
                style={{ height: '260px', marginBottom: '50px' }}
              />
            </div>
          </Form.Group>

          <Form.Group>
            <Form.Label className="small fw-bold text-muted text-uppercase">Review Note</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Optional note for the instructor"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 d-flex justify-content-between">
          <Button variant="outline-danger" onClick={() => handleUpdate('rejected')} disabled={saving}>
            <FiXCircle className="me-1" /> Disapprove
          </Button>
          <div className="d-flex gap-2">
            <Button variant="light" onClick={closeReviewModal}>Cancel</Button>
            <Button variant="outline-primary" onClick={() => handleUpdate(selectedLesson?.lessonPlanStatus || 'pending')} disabled={saving}>
              <FiEdit3 className="me-1" /> Save Edit
            </Button>
            <Button variant="success" onClick={() => handleUpdate('approved')} disabled={saving}>
              <FiCheckCircle className="me-1" /> Approve
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
