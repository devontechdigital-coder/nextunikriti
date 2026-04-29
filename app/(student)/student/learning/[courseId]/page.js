'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, ListGroup, Button, Spinner, Alert, Badge, Accordion, Form } from 'react-bootstrap';
import { useParams, useRouter } from 'next/navigation';

const VIDEO_QUALITY_OPTIONS = ['auto', '240p', '360p', '480p', '720p', '1080p'];

export default function LearningPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId;

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeLesson, setActiveLesson] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [videoQuality, setVideoQuality] = useState('auto');

  const flatLessons = course?.sections?.flatMap(sec => sec.lessons) || [];

  const isLessonLocked = (lessonId) => {
    if (!enrollment) return false;
    const index = flatLessons.findIndex(l => l._id === lessonId);
    if (index <= 0) return false;
    const prevLessonId = flatLessons[index - 1]._id;
    return !enrollment.completedLessons?.includes(prevLessonId);
  };

  const checkBookmark = async (lessonId) => {
    try {
      const res = await axios.get('/api/student/bookmarks');
      if (res.data.success) {
        const bookmarked = res.data.data.some(b => b.lessonId?._id === lessonId);
        setIsBookmarked(bookmarked);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (activeLesson) {
       checkBookmark(activeLesson._id);
       
       // Update last accessed lesson when actively changing lessons
       if (courseId) {
           axios.patch(`/api/progress/${courseId}`, { lastLessonId: activeLesson._id })
             .catch(e => console.error("Failed to update last lesson", e));
       }
    }
  }, [activeLesson, courseId]);

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;

    const loadVideoBlob = async () => {
      setVideoBlobUrl('');
      setVideoError('');

      if (!activeLesson?.hasVideo) return;

      setVideoLoading(true);
      try {
        const res = await axios.post(
          '/api/videos/play',
          { lessonId: activeLesson._id, quality: videoQuality },
          { responseType: 'blob' }
        );

        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setVideoBlobUrl(objectUrl);
      } catch (err) {
        if (!cancelled) {
          setVideoError('Unable to load this video.');
        }
      } finally {
        if (!cancelled) setVideoLoading(false);
      }
    };

    loadVideoBlob();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeLesson, videoQuality]);

  const toggleBookmark = async () => {
    try {
      const res = await axios.post('/api/student/bookmarks', {
        courseId,
        lessonId: activeLesson._id
      });
      if (res.data.success) {
        setIsBookmarked(res.data.bookmarked);
      }
    } catch (e) { alert('Failed to toggle bookmark'); }
  };

  const fetchData = useCallback(async () => {
    try {
      const learningRes = await axios.get(`/api/student/learn/${courseId}`);

      if (learningRes.data.success) {
        const courseData = {
          ...learningRes.data.data.course,
          sections: learningRes.data.data.sections || [],
        };
        const enrollmentData = learningRes.data.data.enrollment;
        setCourse(courseData);
        setEnrollment(enrollmentData);

        // Auto-resume logic: if lastLessonId exists in enrollment, use it. Otherwise default to first lesson.
        if (courseData.sections?.length > 0) {
          let lessonToSelect = null;
          const flattened = courseData.sections.flatMap(s => s.lessons);
          
          if (enrollmentData?.lastLessonId) {
             lessonToSelect = flattened.find(l => l._id === enrollmentData.lastLessonId);
             
             // Check if it's locked just in case
             if (lessonToSelect) {
                 const index = flattened.findIndex(l => l._id === lessonToSelect._id);
                 if (index > 0) {
                     const prevLessonId = flattened[index - 1]._id;
                     if (!enrollmentData.completedLessons?.includes(prevLessonId)) {
                         // Fallback to first unlocked
                         lessonToSelect = null;
                     }
                 }
             }
          }
          
          if (!lessonToSelect) {
            lessonToSelect = flattened.find((l, idx) => {
               if (idx === 0) return true;
               const prevL = flattened[idx - 1];
               return enrollmentData.completedLessons?.includes(prevL._id) && !enrollmentData.completedLessons?.includes(l._id);
            }) || flattened[0];
          }
          
          if (lessonToSelect) setActiveLesson((current) => current || lessonToSelect);
        }
      } else {
          setError('Could not find course or enrollment data.');
      }
    } catch (err) {
      setError('Failed to load learning environment.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) fetchData();
  }, [courseId, fetchData]);

  const handleMarkComplete = async () => {
    if (!activeLesson || completing) return;
    setCompleting(true);
    try {
      const res = await axios.post('/api/progress/mark-complete', {
        courseId,
        lessonId: activeLesson._id
      });
      if (res.data.success) {
        setEnrollment(res.data.data);
        // If 100% complete, ask to generate certificate
        if (res.data.data.progress === 100) {
            alert('Congratulations! You have completed the course. Check the certificates page!');
        }
      }
    } catch (err) {
      alert('Failed to update progress.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center" style={{ height: '80vh' }}>
      <Spinner animation="border" variant="primary" />
    </div>
  );

  if (error || !course) return <Container className="py-5"><Alert variant="danger">{error || 'Course not found'}</Alert></Container>;

  return (
    <Container fluid className="p-0 bg-white" style={{ minHeight: '90vh' }}>
      <Row className="g-0">
        {/* Main Content Area: Video & Description */}
        <Col lg={9} className="border-end overflow-auto" style={{ height: 'calc(100vh - 72px)' }}>
          {activeLesson ? (
            <div>
              <div className="bg-black d-flex align-items-center justify-content-center text-white position-relative" style={{ aspectRatio: '16/9', maxHeight: '70vh' }}>
                {activeLesson.hasVideo ? (
                    videoLoading ? (
                      <div className="text-center">
                        <Spinner animation="border" variant="light" />
                        <div className="small opacity-75 mt-3">Preparing secure video...</div>
                      </div>
                    ) : videoBlobUrl ? (
                      <video
                        key={videoBlobUrl}
                        controls
                        controlsList="nodownload noplaybackrate"
                        disablePictureInPicture
                        onContextMenu={(e) => e.preventDefault()}
                        className="w-100 h-100"
                        style={{ objectFit: 'contain', backgroundColor: '#000' }}
                      >
                        <source src={videoBlobUrl} type="video/mp4" />
                      </video>
                    ) : (
                      <div className="text-center opacity-75">
                        <i className="bi bi-exclamation-circle fs-1"></i>
                        <p className="mb-1">{videoError || 'Video is not ready yet.'}</p>
                      </div>
                    )
                ) : (
                    <div className="text-center opacity-50">
                        <i className="bi bi-file-earmark-text fs-1"></i>
                        <p>No video for this lesson</p>
                    </div>
                )}
                {activeLesson.hasVideo && (
                  <div className="position-absolute top-0 end-0 m-3 quality-picker">
                    <Form.Select
                      size="sm"
                      value={videoQuality}
                      onChange={(event) => setVideoQuality(event.target.value)}
                      className="bg-dark text-white border-secondary shadow-sm"
                      aria-label="Video quality"
                    >
                      {VIDEO_QUALITY_OPTIONS.map((quality) => (
                        <option key={quality} value={quality}>
                          {quality === 'auto' ? 'Auto' : quality}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                )}
              </div>

              <Container className="py-4 px-lg-5">
                <div className="d-flex justify-content-between align-items-start mb-4">
                   <div>
                      <div className="d-flex align-items-center">
                        <h3 className="fw-bold mb-1">{activeLesson.title}</h3>
                        <Button 
                          variant="link" 
                          className={`ms-2 p-0 fs-4 ${isBookmarked ? 'text-warning' : 'text-muted'}`}
                          onClick={toggleBookmark}
                          title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
                        >
                          <i className={`bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
                        </Button>
                      </div>
                      <div className="text-muted small">Course: {course.title}</div>
                   </div>
                   <Button 
                    variant={enrollment.completedLessons?.includes(activeLesson._id) ? "success" : "outline-dark"}
                    className="fw-bold rounded-pill px-4"
                    onClick={handleMarkComplete}
                    disabled={completing || enrollment.completedLessons?.includes(activeLesson._id)}
                   >
                     {completing ? <Spinner size="sm" /> : enrollment.completedLessons?.includes(activeLesson._id) ? '✓ Completed' : 'Mark as Complete'}
                   </Button>
                </div>

                <hr />
                
                <h5 className="fw-bold mt-4">Lesson Details</h5>
                <p className="text-muted">Explore the contents and attachments provided for this module.</p>
                
                {activeLesson.resources?.length > 0 && (
                   <Card className="mt-3 border-0 bg-light">
                      <Card.Body>
                         <h6 className="fw-bold mb-3">Downloadable Resources</h6>
                         {activeLesson.resources.map((res, i) => (
                            <a key={i} href={res.url} target="_blank" className="d-flex align-items-center mb-2 text-decoration-none text-dark bg-white p-2 rounded border">
                               <i className="bi bi-file-pdf text-danger me-2"></i>
                               <span>{res.title}</span>
                            </a>
                         ))}
                      </Card.Body>
                   </Card>
                )}
              </Container>
            </div>
          ) : (
             <div className="p-5 text-center mt-5">
                <h4>Please select a lesson to start learning.</h4>
             </div>
          )}
        </Col>

        {/* Sidebar: Curriculum */}
        <Col lg={3} className="bg-light shadow-sm overflow-auto" style={{ height: 'calc(100vh - 72px)' }}>
          <div className="p-3 border-bottom bg-white sticky-top">
            <h6 className="fw-bold m-0">Course Content</h6>
            <div className="small text-muted mt-1">{enrollment.progress}% Overall Progress</div>
          </div>

          <Accordion defaultActiveKey="0" flush>
            {course.sections?.map((section, sIdx) => (
              <Accordion.Item eventKey={sIdx.toString()} key={section._id}>
                <Accordion.Header className="py-1">
                  <div className="fw-bold small">{section.title}</div>
                </Accordion.Header>
                <Accordion.Body className="p-0">
                  <ListGroup variant="flush">
                    {section.lessons?.map((lesson) => {
                      const isCompleted = enrollment.completedLessons?.includes(lesson._id);
                      const isLocked = isLessonLocked(lesson._id);
                      return (
                        <ListGroup.Item 
                          key={lesson._id} 
                          action={!isLocked}
                          active={activeLesson?._id === lesson._id}
                          className={`border-0 py-3 ps-4 d-flex align-items-center ${isCompleted ? 'bg-opacity-10 bg-success' : ''} ${isLocked ? 'opacity-50' : ''}`}
                          onClick={() => {
                            if (!isLocked) setActiveLesson(lesson);
                          }}
                          style={isLocked ? { cursor: 'not-allowed', backgroundColor: '#f8f9fa' } : {}}
                        >
                          <div className="me-3">
                            {isLocked ? (
                              <i className="bi bi-lock-fill text-muted fs-5"></i>
                            ) : isCompleted ? (
                              <i className="bi bi-check-circle-fill text-success fs-5"></i>
                            ) : (
                              <i className="bi bi-play-circle fs-5 opacity-50"></i>
                            )}
                          </div>
                          <div className="min-w-0 flex-grow-1">
                            <div className="fw-semibold small text-truncate" style={{ fontSize: '0.85rem' }}>{lesson.title}</div>
                            {lesson.hasVideo && <div className="text-muted small" style={{fontSize: '0.7rem'}}>Video • 10m</div>}
                          </div>
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Col>
      </Row>
      <style jsx>{`
        .quality-picker {
          width: 112px;
          z-index: 5;
        }
        .quality-picker :global(select) {
          font-size: 0.78rem;
        }
      `}</style>
    </Container>
  );
}
