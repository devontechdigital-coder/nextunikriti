'use client';
import { Container, Row, Col } from 'react-bootstrap';
import { FiAward } from 'react-icons/fi';

const Awards = () => {
  return (
    <section className="py-5 bg-white">
      <Container>
        <div className="text-center mb-5">
          <h2 className="display-5">Awards & Recognitions</h2>
          <div className="u-accent-line mx-auto" style={{ width: '60px', height: '4px', background: 'var(--u-black)' }}></div>
        </div>
        <Row className="text-center g-4">
          {[1, 2, 3, 4].map((a) => (
            <Col key={a} md={3}>
              <div className="p-4 border rounded-3 reveal-fade-up is-visible">
                <FiAward size={48} className="mb-3" />
                <h5>Global Music Award {2020 + a}</h5>
                <p className="small text-muted">Excellence in Education</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default Awards;
