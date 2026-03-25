'use client';
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';

const CategoriesSection = ({ categories = [] }) => {
  return (
    <section className="py-5" style={{ backgroundColor: '#f8f9fa' }}>
      <Container className="py-4 text-center">
        <h6 className="text-danger fw-bold tracking-wider text-uppercase mb-2">Explore Categories</h6>
        <h2 className="display-6 fw-bold mb-2 text-dark">Choose From 20+ In-Demand Domains</h2>
        <p className="text-muted mb-5 mx-auto" style={{ maxWidth: '600px' }}>
          Up-skill in any of the above domains and accelerate your career graph with 100% placement assistance.
        </p>
        
        <div className="d-flex flex-wrap justify-content-center gap-3 mb-5 px-lg-5">
          {categories.length === 0 ? (
            <div className="text-muted py-4">No categories found.</div>
          ) : (
            categories.map((cat) => (
              <div 
                key={cat._id} 
                className={`bg-white border rounded-pill px-4 py-3 shadow-sm d-flex align-items-center gap-2 category-pill`}
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
              >
                <span className="fs-5">{cat.icon || '📚'}</span>
                <span className="fw-bold text-dark">{cat.name}</span>
              </div>
            ))
          )}
        </div>

        <Button variant="danger" size="lg" className="px-4 py-3 rounded-pill fw-bold shadow-sm">
          Explore All Categories
        </Button>
      </Container>

      {/* category-pill styles moved to globals.scss */}
    </section>
  );
};

export default CategoriesSection;
