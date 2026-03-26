'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, ProgressBar, Spinner, Alert, Button, Nav, Tab } from 'react-bootstrap';
import axios from 'axios';
import Link from 'next/link';
import { FaPlay, FaGraduationCap, FaCheckCircle, FaBook, FaPlus, FaHourglassHalf, FaWallet } from 'react-icons/fa';

export default function StudentDashboardPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await axios.get('/api/my-courses');
                if (res.data.success) {
                    setCourses(res.data.data);
                }
            } catch (err) {
                setError('Failed to load courses. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    if (loading) {
        return <div className="py-5 text-center"><Spinner animation="border" variant="primary" /></div>;
    }

    const activePaid = courses.filter(c => c.payment_status === 'paid');
    const pendingRequests = courses.filter(c => c.payment_status !== 'paid');

    return (
        <div className="py-2">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h2 className="fw-bold mb-1">My Learning Dashboard</h2>
                  <p className="text-muted mb-0">Track your progress and manages your courses.</p>
                </div>
                <Link href="/courses" className="btn btn-outline-dark rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-2">
                    <FaPlus size={12} /> Browse More Courses
                </Link>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Tab.Container defaultActiveKey="active">
                <Nav variant="pills" className="u-dashboard-tabs mb-4 gap-2">
                    <Nav.Item>
                        <Nav.Link eventKey="active" className="rounded-pill px-4 fw-bold">
                            <FaPlay className="me-2" size={12}/> My Courses ({activePaid.length})
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="pending" className="rounded-pill px-4 fw-bold">
                            <FaHourglassHalf className="me-2" size={12}/> Pending Approval ({pendingRequests.length})
                        </Nav.Link>
                    </Nav.Item>
                </Nav>

                <Tab.Content>
                    <Tab.Pane eventKey="active">
                        {activePaid.length === 0 ? (
                            <Card className="text-center p-5 border-dashed bg-light rounded-4">
                                <Card.Body>
                                    <div className="mb-3 text-muted"> <FaBook size={48} className="opacity-25" /> </div>
                                    <h5 className="fw-bold text-dark">No Active Courses</h5>
                                    <p className="text-muted small mb-4">You haven't purchased any courses yet, or they are still pending approval.</p>
                                    <Link href="/courses" className="btn btn-primary rounded-pill px-5 py-2 fw-bold">Explore All Courses</Link>
                                </Card.Body>
                            </Card>
                        ) : (
                            <Row className="g-4">
                                {activePaid.map((course) => (
                                    <Col lg={4} md={6} key={course.course_id}>
                                        <Card className="u-course-card border-0 shadow-sm h-100 rounded-4 overflow-hidden">
                                            <div className="position-relative" style={{ height: '160px' }}>
                                                {course.thumbnail ? (
                                                    <img src={course.thumbnail} alt={course.course_title} className="w-100 h-100 object-fit-cover transition-img" />
                                                ) : (
                                                    <div className="bg-light h-100 d-flex align-items-center justify-content-center text-muted">📚</div>
                                                )}
                                                <div className="position-absolute bottom-0 start-0 p-3 w-100" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                                                    <Badge bg="success" className="rounded-pill px-3">{course.package_name}</Badge>
                                                </div>
                                            </div>
                                            <Card.Body className="p-4 d-flex flex-column">
                                                <h6 className="fw-bold mb-2 text-dark text-truncate" title={course.course_title}>{course.course_title}</h6>
                                                <div className="mt-auto">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <span className="small fw-bold text-muted">Progress</span>
                                                        <span className="small fw-bold text-primary">{course.progress}%</span>
                                                    </div>
                                                    <ProgressBar now={course.progress} variant="primary" className="mb-4" style={{ height: '6px' }} />
                                                    <Link href={`/student/dashboard/course/${course.course_id}`} className="btn btn-dark w-100 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 transition-btn">
                                                        <FaPlay size={10} /> Resume
                                                    </Link>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </Tab.Pane>

                    <Tab.Pane eventKey="pending">
                        {pendingRequests.length === 0 ? (
                            <Card className="text-center p-5 border-dashed bg-light rounded-4">
                                <Card.Body>
                                    <div className="mb-3 text-muted"> <FaWallet size={48} className="opacity-25" /> </div>
                                    <h5 className="fw-bold text-dark">No Pending Requests</h5>
                                    <p className="text-muted small">All your purchased courses are active.</p>
                                </Card.Body>
                            </Card>
                        ) : (
                            <Row className="g-4">
                                {pendingRequests.map((course) => (
                                    <Col lg={4} md={6} key={course.course_id}>
                                        <Card className="border-0 shadow-sm h-100 rounded-4 overflow-hidden opacity-75">
                                            <Card.Body className="p-4 d-flex flex-column">
                                                <div className="d-flex justify-content-between mb-3">
                                                    <Badge bg="warning" text="dark" className="rounded-pill px-3">Pending Payment</Badge>
                                                    <span className="small text-muted">{course.package_name}</span>
                                                </div>
                                                <h6 className="fw-bold mb-3 text-dark">{course.course_title}</h6>
                                                <div className="p-3 bg-light rounded-3 mb-3 small">
                                                    Our team is verifying your "Pay Later" request. Access will be granted once approved.
                                                </div>
                                                <div className="mt-auto">
                                                    <Link href={`/courses/${course.course_id}`} className="btn btn-outline-dark w-100 rounded-pill py-2 fw-bold small">
                                                        View Course Page
                                                    </Link>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>

            <style jsx>{`
                .u-course-card { transition: all 0.3s ease; border: 1px solid transparent !important; }
                .u-course-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.1) !important; border-color: #eee !important; }
                .transition-img { transition: transform 0.3s ease; }
                .u-course-card:hover .transition-img { transform: scale(1.05); }
                .transition-btn { transition: all 0.2s ease; }
                .transition-btn:hover { background-color: #000 !important; color: #fff !important; transform: scale(1.02); }
                .border-dashed { border: 2px dashed #ccc !important; }
                :global(.u-dashboard-tabs .nav-link) { color: #666; background: #eee; border: none !important; }
                :global(.u-dashboard-tabs .nav-link.active) { background-color: #000 !important; color: #fff !important; }
            `}</style>
        </div>
    );
}
