'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Ratio } from 'react-bootstrap';
import { 
  useGetAdminClassSessionsQuery, 
  useGetClassSessionNextLessonQuery,
  useCompleteClassLessonMutation 
} from '@/redux/api/apiSlice';
import { FaBookOpen, FaCheckCircle, FaVideo, FaFilePdf, FaChalkboard, FaChevronLeft, FaInfoCircle } from 'react-icons/fa';

export default function ClassroomGuidePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId;

  const { data: sessionData, isLoading: isLoadingSession } = useGetAdminClassSessionsQuery({ id: sessionId });
  const session = sessionData?.sessions?.find(s => s._id === sessionId);

  const { data: lessonData, isLoading: isLoadingLesson, refetch: refetchLesson } = useGetClassSessionNextLessonQuery(sessionId, { skip: !sessionId });
  const [completeLesson, { isLoading: isCompleting }] = useCompleteClassLessonMutation();

  const lesson = lessonData?.lesson;
  const courseId = lessonData?.courseId;

  const handleMarkComplete = async () => {
    if (!lesson) return;
    try {
      await completeLesson({ 
        batchId: session.batchId._id, 
        classSessionId: sessionId, 
        lessonId: lesson._id 
      }).unwrap();
      alert('Lesson marked as complete!');
      refetchLesson();
    } catch (err) {
      alert(err?.data?.error || 'Failed to complete lesson');
    }
  };

  if (isLoadingSession || isLoadingLesson) return (
     <Container className="py-5 text-center"><Spinner animation="border" variant="primary" /></Container>
  );

  if (!session) return <Container className="py-5"><Alert variant="danger">Session not found</Alert></Container>;

  return (
    <Container fluid className="py-4 px-lg-5">
      <div className="mb-4 d-flex align-items-center justify-content-between">
        <div>
          <Button variant="link" className="p-0 text-decoration-none mb-2" onClick={() => router.back()}>
            <FaChevronLeft /> Back to Dashboard
          </Button>
          <h2 className="fw-bold mb-0">Classroom Teaching Guide</h2>
          <div className="text-muted d-flex align-items-center gap-2 mt-1">
             <Badge bg="primary">{session.batchId?.batchName}</Badge>
             <span>{session.batchId?.instrument} - {session.batchId?.level}</span>
          </div>
        </div>
        <div className="text-end">
          <Badge bg="info" className="p-2 px-3 fw-medium">
            Progress: {lessonData?.completedCount} / {lessonData?.totalLessons} Lessons
          </Badge>
        </div>
      </div>

      {!lesson ? (
        <Card className="text-center py-5 border-0 shadow-sm bg-light">
          <Card.Body>
            <FaCheckCircle className="text-success mb-3" size={48} />
            <h4 className="fw-bold">Course Completed!</h4>
            <p className="text-muted">All lessons from the assigned course have been covered for this batch.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          <Col lg={8}>
            {/* Lesson Content Area */}
            <Card className="border-0 shadow-sm overflow-hidden mb-4">
              <Card.Header className="bg-white py-3 d-flex align-items-center gap-2 border-0">
                 <FaBookOpen className="text-primary" />
                 <h5 className="fw-bold mb-0">Current Lesson: {lesson.title}</h5>
              </Card.Header>
              
              <Card.Body className="p-0">
                {lesson.videoUrl ? (
                   <div className="bg-dark">
                     <Ratio aspectRatio="16x9">
                        <iframe src={lesson.videoUrl} title="Lesson Video" allowFullScreen />
                     </Ratio>
                   </div>
                ) : (
                   <div className="p-5 text-center bg-light">
                      <FaChalkboard size={64} className="text-muted mb-3 opacity-25" />
                      <p className="text-muted">No video content for this lesson.</p>
                   </div>
                )}

                <div className="p-4">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <FaInfoCircle className="text-info" /> Description
                  </h6>
                  <p className="text-secondary leading-relaxed">{lesson.description}</p>
                </div>
              </Card.Body>
            </Card>

            {/* Teaching Instructions */}
            <Card className="border-0 shadow-sm bg-warning bg-opacity-10 border-start border-warning border-4">
              <Card.Body className="p-4">
                <h6 className="fw-bold text-dark mb-3">
                  <FaChalkboard className="me-2" /> Instructor Teaching Instructions
                </h6>
                <div className="text-dark small lh-base">
                  {lesson.teachingInstructions || "Follow the standard lesson plan for this topic. Ensure all students practice the core concepts demonstrated in the video."}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Completion & Next Steps */}
            <Card className="border-0 shadow-sm mb-4 sticky-top" style={{ top: '100px' }}>
              <Card.Body className="p-4">
                <h5 className="fw-bold mb-4">Lesson Control</h5>
                
                <div className="mb-4">
                  <div className="small text-muted mb-2">After teaching this lesson, mark it as complete to update batch and student progress.</div>
                  <Button 
                    variant="success" 
                    className="w-100 py-3 d-flex align-items-center justify-content-center gap-2 shadow-sm rounded-pill fw-bold"
                    onClick={handleMarkComplete}
                    disabled={isCompleting}
                  >
                    {isCompleting ? <Spinner size="sm" /> : <><FaCheckCircle size={20} /> Mark as Taught</>}
                  </Button>
                </div>

                <hr className="my-4" />

                <div className="mb-0">
                  <h6 className="fw-bold small text-muted text-uppercase mb-3">Key Objectives</h6>
                  <ul className="small text-secondary ps-3 mb-0">
                    <li>Review previous lesson concepts</li>
                    <li>Demonstrate new technique/topic</li>
                    <li>Interactive practice session</li>
                    <li>Verify student understanding</li>
                  </ul>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}
