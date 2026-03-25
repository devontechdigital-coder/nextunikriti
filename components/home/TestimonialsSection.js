'use client';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import { FiStar } from 'react-icons/fi';

const TestimonialsSection = ({ reviews = [] }) => {
  const dummyReviews = [
    {
      _id: '1',
      rating: 5,
      comment: "Unikriti has transformed my understanding of music. The instructors are world-class!",
      user: { name: "Aditi Sharma", avatar: "https://i.pravatar.cc/150?u=Aditi" }
    },
    {
      _id: '2',
      rating: 5,
      comment: "The best music school in the city. The curriculum is so well-structured.",
      user: { name: "Rahul Verma", avatar: "https://i.pravatar.cc/150?u=Rahul" }
    },
    {
      _id: '3',
      rating: 5,
      comment: "I love the hybrid learning model. It's so flexible and effective.",
      user: { name: "Sneha Kapur", avatar: "https://i.pravatar.cc/150?u=Sneha" }
    }
  ];

  const displayReviews = reviews.length > 0 ? reviews : dummyReviews;

  return (
    <section className="py-5 bg-white">
      <Container>
        <div className="text-center mb-5">
          <h6 className="text-muted fw-bold text-uppercase tracking-wider mb-2">Student Stories</h6>
          <h2 className="display-5 fw-bold m-0 text-dark">Loved by Musicians</h2>
        </div>

        <Row className="g-4">
          {displayReviews.slice(0, 3).map((test) => (
            <Col lg={4} key={test._id}>
              <Card className="h-100 border-0 shadow-sm p-4 rounded-4 position-relative overflow-hidden" style={{ backgroundColor: '#f9f9f9' }}>
                <div className="position-absolute top-0 end-0 p-4 opacity-10 fs-1 text-dark" style={{ fontFamily: 'serif' }}>&rdquo;</div>
                <Card.Body className="d-flex flex-column z-1 position-relative p-0 pt-2">
                  <div className="d-flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className={i < (test.rating || 5) ? 'text-warning fill-warning' : 'text-muted'} />
                    ))}
                  </div>
                  <Card.Text className="fs-5 fw-medium mb-4" style={{ lineHeight: '1.6', color: '#111' }}>
                    "{test.comment || test.text || 'Excellent course with practical insights.'}"
                  </Card.Text>

                  <div className="mt-auto d-flex align-items-center gap-3 pt-3 border-top border-secondary border-opacity-10">
                    <img
                      src={test.user?.avatar || 'https://via.placeholder.com/50'}
                      alt={test.user?.name || 'User'}
                      className="rounded-circle border border-2 border-white"
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    />
                    <div>
                      <h6 className="fw-bold mb-0 text-dark">{test.user?.name || 'Happy Learner'}</h6>
                      <small className="text-muted">Verified Student</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default TestimonialsSection;
