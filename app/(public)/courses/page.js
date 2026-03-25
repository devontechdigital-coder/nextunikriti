'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Spinner, Alert, Badge, Button, Form } from 'react-bootstrap';
import Link from 'next/link';
import { FiStar, FiClock, FiBook, FiFilter, FiSearch } from 'react-icons/fi';

export default function PublicCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const dummyCourses = [
    { _id: 'd1', title: 'The Complete Next.js 14 Bootcamp', instructor: { name: 'Maximilian Schwarz' }, price: 49.99, rating: 4.8, reviews: '12k', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400', category: 'Development', level: 'Beginner' },
    { _id: 'd2', title: 'Machine Learning A-Z™: Hands-On Python', instructor: { name: 'Kirill Eremenko' }, price: 54.99, rating: 4.7, reviews: '15k', thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400', category: 'Data Science', level: 'Intermediate' },
    { _id: 'd3', title: 'Ultimate AWS Certified Cloud Practitioner', instructor: { name: 'Stephane Maarek' }, price: 39.99, rating: 4.9, reviews: '22k', thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400', category: 'Cloud Computing', level: 'Beginner' },
  ];

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchCourses = async (categoryId = null) => {
    setLoading(true);
    try {
      const url = categoryId ? `/api/courses?categoryId=${categoryId}` : '/api/courses';
      const res = await axios.get(url);
      if (res.data.success) {
        setCourses(res.data.data);
      } else {
        setCourses([]);
      }
    } catch (err) {
      setError('Failed to fetch courses. Please try again later.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, []);

  const handleCategoryClick = (catId) => {
    setSelectedCategoryId(catId);
    fetchCourses(catId);
  };

  const clearFilters = () => {
    setSelectedCategoryId(null);
    setSearchQuery('');
    fetchCourses(null);
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <Container className="py-5 text-center min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <Spinner animation="grow" variant="danger" className="mb-3" />
        <h4 className="fw-bold text-dark">Loading Courses...</h4>
      </div>
    </Container>
  );

  return (
    <div style={{ backgroundColor: '#fdfdfd', minHeight: '100vh' }}>
      {/* Page Header / Hero */}
      <section className="py-5 bg-dark text-white position-relative overflow-hidden mb-5" style={{ minHeight: '300px' }}>
        <div className="position-absolute top-50 start-50 translate-middle w-100 h-100 opacity-25" style={{ background: 'linear-gradient(45deg, #dc3545 0%, #000 100%)', zIndex: 0 }}></div>
        <Container className="position-relative z-1 py-5">
           <Row className="align-items-center">
             <Col lg={7}>
               <Badge bg="danger" className="mb-3 px-3 py-2 rounded-pill fw-normal">Unlimited Learning</Badge>
               <h1 className="display-4 fw-bold mb-3 tracking-tighter">Explore Our Program Catalog</h1>
               <p className="lead opacity-75 mb-4">Choose from over 210,000 online video courses with new additions published every month.</p>
               
               <div className="bg-white p-2 rounded-pill shadow-lg d-flex align-items-center max-w-lg" style={{ maxWidth: '600px' }}>
                  <FiSearch className="ms-3 text-muted" size={20} />
                  <Form.Control 
                    type="text" 
                    placeholder="Search for courses, categories, or keywords..." 
                    className="border-0 shadow-none bg-transparent py-2 px-3 fw-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="danger" className="rounded-pill px-4 py-2 fw-bold">Search</Button>
               </div>
             </Col>
             <Col lg={5} className="d-none d-lg-block text-center">
                <FiBook size={180} className="text-danger opacity-25" />
             </Col>
           </Row>
        </Container>
      </section>

      <Container className="pb-5">
        <Row>
          {/* Category Sidebar */}
          <Col lg={3} className="mb-4">
            <div className="bg-white p-4 rounded-4 shadow-sm border border-light sticky-top" style={{ top: '100px', zIndex: 10 }}>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="fw-bold m-0 border-start border-danger border-4 ps-2">Categories</h5>
                {(selectedCategoryId || searchQuery) && (
                  <Button variant="link" className="text-danger p-0 small fw-bold text-decoration-none" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="category-list overflow-auto" style={{ maxHeight: '60vh' }}>
                <div 
                  className={`p-2 rounded-2 mb-1 cursor-pointer fw-medium transition-all ${!selectedCategoryId ? 'bg-danger text-white shadow-sm' : 'hover-bg-light text-dark'}`}
                  onClick={() => handleCategoryClick(null)}
                >
                  All Courses
                </div>
                
                {(() => {
                  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
                  const parentCategories = sortedCategories.filter(c => !c.parentIds || c.parentIds.length === 0);
                  const childCategories = sortedCategories.filter(c => c.parentIds && c.parentIds.length > 0);

                  return parentCategories.map(parent => (
                    <div key={parent._id} className="mb-3 mt-3">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <div 
                          className={`p-1 rounded-2 cursor-pointer fw-bold small text-uppercase tracking-wider flex-grow-1 ${selectedCategoryId === parent._id ? 'text-danger' : 'text-muted'}`}
                          onClick={() => handleCategoryClick(parent._id)}
                        >
                          {parent.name}
                        </div>
                        {parent.slug && (
                          <Link href={`/categories/${parent.slug}`} className="text-danger small fw-bold text-decoration-none px-2" title="View Landing Page">
                            <FiSearch size={14} />
                          </Link>
                        )}
                      </div>
                      <div className="ms-2">
                        {childCategories
                          .filter(child => child.parentIds.includes(parent._id))
                          .map(child => (
                            <div key={child._id} className="d-flex align-items-center justify-content-between mb-1 group">
                                <div 
                                  className={`p-2 rounded-2 cursor-pointer small transition-all flex-grow-1 ${selectedCategoryId === child._id ? 'bg-danger-subtle text-danger fw-bold border-start border-danger border-3' : 'hover-bg-light text-secondary'}`}
                                  onClick={() => handleCategoryClick(child._id)}
                                >
                                  {child.name}
                                </div>
                                {child.slug && (
                                  <Link href={`/categories/${child.slug}`} className="text-danger small fw-bold text-decoration-none px-2 opacity-0 group-hover-opacity-100" title="View Landing Page">
                                    <FiSearch size={14} />
                                  </Link>
                                )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </Col>

          {/* Course Grid */}
          <Col lg={9}>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
               <h2 className="fw-bold m-0 text-dark">
                 {selectedCategoryId 
                  ? categories.find(c => c._id === selectedCategoryId)?.name 
                  : 'All Courses'
                 }
                 <span className="ms-2 badge bg-light text-dark fw-normal rounded-pill fs-6">{filteredCourses.length}</span>
               </h2>
               <div className="d-flex gap-2 align-items-center">
                  <FiFilter className="text-muted" />
                  <Form.Select className="rounded-pill border-0 shadow-sm px-4 py-2 small fw-bold bg-white" style={{ width: '180px' }}>
                    <option>Most Popular</option>
                    <option>Newest First</option>
                  </Form.Select>
               </div>
            </div>

            {error && <Alert variant="danger" className="rounded-4 border-0 shadow-sm">{error}</Alert>}

            {filteredCourses.length === 0 && !error ? (
              <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-light">
                <h1 className="display-1 text-muted opacity-25 mb-4">😕</h1>
                <h3 className="fw-bold text-dark">No courses found</h3>
                <p className="text-muted mb-4">Try another category or search term.</p>
                <Button variant="danger" className="rounded-pill px-5 py-2 fw-bold" onClick={clearFilters}>View All Courses</Button>
              </div>
            ) : (
              <Row className="g-4">
                {filteredCourses.map(course => (
                  <Col md={6} lg={4} key={course._id}>
                    <Link href={`/courses/${course._id}`} className="text-decoration-none text-dark">
                      <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden course-card-premium transition-all hover-lift">
                        <div className="position-relative" style={{ height: '180px' }}>
                          <Badge bg="dark" className="position-absolute top-0 start-0 m-3 z-1 rounded-1 small fw-normal bg-opacity-75">
                            {course.level || 'All Levels'}
                          </Badge>
                          {course.thumbnail ? (
                              <img src={course.thumbnail} alt={course.title} className="w-100 h-100" style={{objectFit:'cover'}} />
                          ) : (
                              <div className="d-flex align-items-center justify-content-center h-100 bg-light text-muted">
                                 <FiBook size={40} className="opacity-25" />
                              </div>
                          )}
                          {course.instrument_id && (
                             <div className="position-absolute bottom-0 start-0 m-3 z-1">
                                <Badge bg="danger" className="rounded-pill px-3 py-2 shadow-sm">{course.instrument_id.name}</Badge>
                             </div>
                          )}
                        </div>
                        <Card.Body className="p-4 d-flex flex-column">
                          <Card.Title className="fw-bold fs-6 mb-2 text-dark truncate-2" style={{ height: '2.8rem' }}>{course.title}</Card.Title>
                          
                          <div className="d-flex align-items-center gap-2 mb-3">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={`https://ui-avatars.com/api/?name=${course.course_creator?.name || 'Instructor'}&background=random`} className="rounded-circle" style={{ width: '24px', height: '24px' }} alt="instructor" />
                             <span className="text-muted extra-small fw-bold">{course.course_creator?.name || 'Platform Mentor'}</span>
                          </div>

                          <div className="mt-auto pt-3 d-flex justify-content-between align-items-center border-top border-light">
                              <span className="fw-bold fs-5 text-dark">
                                  {course.price > 0 ? `$${course.price.toFixed(2)}` : 'FREE'}
                              </span>
                              {course.level_id && (
                                <Badge bg="light" text="dark" className="fw-normal small px-2 py-1 border">{course.level_id.levelName}</Badge>
                              )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Link>
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      </Container>
      
      <style jsx>{`
        .course-card-premium {
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 1.5rem 3rem rgba(0,0,0,.15)!important;
        }
        .bg-gradient-dark {
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        }
        .font-primary {
          font-family: var(--font-inter), sans-serif;
        }
        .extra-small {
          font-size: 0.75rem;
        }
        .truncate-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .hover-bg-light:hover {
          background-color: #f8f9fa;
        }
        .bg-danger-subtle {
          background-color: #ffeef0;
        }
        .transition-all {
          transition: all 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
}
