'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Accordion, ListGroup, Badge, Spinner, Alert, Button, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaPlay, FaLock, FaCheckCircle, FaArrowLeft, FaClock, FaBookOpen } from 'react-icons/fa';

export default function StudentCourseView() {
    const { courseId } = useParams();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                const res = await axios.get(`/api/student/course-view/${courseId}`);
                if (res.data.success) {
                    setData(res.data.data);
                }
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to load course details.');
            } finally {
                setLoading(false);
            }
        };
        if (courseId) fetchCourseData();
    }, [courseId]);

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" variant="primary" /></div>;

    if (error) return (
        <div className="py-4">
            <Alert variant="warning" className="border-0 shadow-sm p-4 text-center">
                <FaLock size={40} className="text-warning mb-3 opacity-50" />
                <h4 className="fw-bold">Access Restricted</h4>
                <p className="mb-4">{error}</p>
                <div className="d-flex justify-content-center gap-3">
                   <Link href="/student/dashboard" className="btn btn-dark rounded-pill px-4 fw-bold">Back to Dashboard</Link>
                   <Link href={`/courses/${courseId}`} className="btn btn-outline-dark rounded-pill px-4 fw-bold">View Course Page</Link>
                </div>
            </Alert>
        </div>
    );

    const { course, sections, enrollment } = data;

    return (
        <div className="py-2">
            <Link href="/student/dashboard" className="text-decoration-none text-muted small fw-bold d-flex align-items-center gap-1 mb-4">
                <FaArrowLeft size={10} /> BACK TO LIST
            </Link>

            <Row className="g-4">
                {/* Left Side: Course Info */}
                <Col xl={8}>
                    <Card className="border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
                        <div style={{ height: '240px' }} className="position-relative">
                            {course.thumbnail ? (
                                <img src={course.thumbnail} alt={course.title} className="w-100 h-100 object-fit-cover" />
                            ) : (
                                <div className="bg-light h-100 d-flex align-items-center justify-content-center text-muted">📚</div>
                            )}
                            <div className="position-absolute bottom-0 start-0 w-100 p-4" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                                <Badge bg="success" className="mb-2 px-3 rounded-pill">Enrollment Active</Badge>
                                <h4 className="text-white fw-bold mb-0">{course.title}</h4>
                            </div>
                        </div>
                        <Card.Body className="p-4 p-lg-5">
                            <h5 className="fw-bold mb-4">Course Curriculum</h5>
                            
                            <Accordion defaultActiveKey="0" flush className="u-curriculum-accordion">
                                {sections.map((section, idx) => (
                                    <Accordion.Item eventKey={idx.toString()} key={section._id} className="border rounded-3 mb-3 overflow-hidden shadow-sm">
                                        <Accordion.Header>
                                            <div className="d-flex align-items-center gap-3 w-100 me-3">
                                                <div className="section-num text-muted small fw-bold">SECTION {idx + 1}</div>
                                                <div className="fw-bold text-dark small">{section.title}</div>
                                                <div className="ms-auto small text-muted d-none d-sm-block">{section.lessons?.length || 0} lessons</div>
                                            </div>
                                        </Accordion.Header>
                                        <Accordion.Body className="p-0">
                                            <ListGroup variant="flush">
                                                {section.lessons?.map((lesson) => {
                                                    const isCompleted = enrollment.completedLessons?.includes(lesson._id);
                                                    return (
                                                        <ListGroup.Item key={lesson._id} className="py-3 px-4 d-flex align-items-center gap-3 transition-all border-bottom border-light">
                                                            {isCompleted ? <FaCheckCircle className="text-success flex-shrink-0" /> : <FaPlay className="text-muted opacity-50 flex-shrink-0" size={12} />}
                                                            <div className="flex-grow-1 min-w-0">
                                                                <div className={`fw-semibold text-dark small ${isCompleted ? 'text-decoration-line-through text-muted' : ''}`}>{lesson.title}</div>
                                                                <div className="very-small text-muted d-flex align-items-center gap-2 mt-1">
                                                                    <FaClock size={10} /> {lesson.duration || '5:00'} min
                                                                </div>
                                                            </div>
                                                            <Button 
                                                                variant={isCompleted ? "outline-success" : "dark"} 
                                                                size="sm" 
                                                                className="rounded-pill px-3 fw-bold x-small"
                                                                as={Link}
                                                                href={`/student/learning/${course._id}`}
                                                            >
                                                                {isCompleted ? 'Reviewed' : 'Start Lesson'}
                                                            </Button>
                                                        </ListGroup.Item>
                                                    );
                                                })}
                                            </ListGroup>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                ))}
                            </Accordion>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right Side: Progress Card */}
                <Col xl={4}>
                    <Card className="border-0 shadow-sm rounded-4 sticky-top" style={{ top: '1rem' }}>
                        <Card.Body className="p-4">
                            <h6 className="fw-bold mb-4 d-flex align-items-center gap-2">
                                <FaBookOpen className="text-primary" /> Learning Progress
                            </h6>
                            
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-primary mb-1">{enrollment.progress}%</h2>
                                <div className="text-muted small fw-bold">Overall Completion</div>
                            </div>
                            
                            <ProgressBar now={enrollment.progress} variant="primary" className="mb-4 rounded-pill" style={{ height: '8px' }} />
                            
                            <div className="d-grid gap-3 mb-4">
                                <div className="d-flex justify-content-between p-3 bg-light rounded-3">
                                    <span className="small text-muted fw-bold">Watched</span>
                                    <span className="small fw-bold text-dark">{enrollment.completedLessons?.length || 0} / {sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0)}</span>
                                </div>
                                <div className="d-flex justify-content-between p-3 bg-light rounded-3">
                                    <span className="small text-muted fw-bold">Plan</span>
                                    <Badge bg="dark" className="rounded-pill px-2">{enrollment.packageId?.name || 'Standard'}</Badge>
                                </div>
                            </div>

                            <Button 
                                variant="primary" 
                                size="lg" 
                                className="w-100 rounded-pill py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                                as={Link}
                                href={`/student/learning/${course._id}`}
                            >
                                <FaPlay size={12} /> {enrollment.progress > 0 ? 'Resume Learning' : 'Start Learning'}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <style jsx>{`
                .u-curriculum-accordion :global(.accordion-button:not(.collapsed)) { background-color: transparent; }
                .u-curriculum-accordion :global(.accordion-button:focus) { box-shadow: none; border: none; }
                .u-curriculum-accordion :global(.accordion-header) { font-size: 0.9rem; }
                .transition-all { transition: all 0.2s ease; }
                .x-small { font-size: 0.75rem; }
                .very-small { font-size: 0.7rem; }
            `}</style>
        </div>
    );
}
