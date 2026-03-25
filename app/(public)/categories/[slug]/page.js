import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Course from '@/models/Course';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FaCheckCircle, FaChevronRight, FaStar } from 'react-icons/fa';

async function getCategoryData(slug) {
  await connectDB();
  const category = await Category.findOne({ slug }).lean();
  if (!category) return null;

  const courses = await Course.find({
    categoryIds: category._id,
    moderationStatus: 'approved'
  })
    .populate('course_creator', 'name avatar')
    .populate('instrument_id', 'name')
    .populate('level_id', 'levelName')
    .sort({ createdAt: -1 })
    .lean();

  return { category, courses };
}

export async function generateMetadata({ params }) {
  const data = await getCategoryData(params.slug);
  if (!data) return { title: 'Category Not Found' };

  const { category } = data;
  return {
    title: category.metaTitle || `${category.name} Programs | Unikriti`,
    description: category.metaDescription || category.shortDescription || `Explore our ${category.name} courses.`,
    keywords: category.metaKeywords || '',
    openGraph: {
      title: category.metaTitle || category.name,
      description: category.metaDescription || category.shortDescription,
      images: category.image ? [category.image] : [],
    }
  };
}

export default async function CategoryLandingPage({ params }) {
  const data = await getCategoryData(params.slug);

  if (!data) {
    notFound();
  }

  const { category, courses } = data;

  return (
    <div className="category-landing">
      {/* Hero Section */}

      <section className="u-hero category border-bottom">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <div className="u-breadcrumb">
                <Link href="/">Home</Link>
                <span>/</span>
                <Link href="/courses">Programs</Link>
                <span>/</span>
                <span>{category.name}</span>
              </div>
              <div className="u-chip">🏫 {category.name} Catalog</div>
              <h1 className="u-title">{category.name}</h1>
              <p className="u-sub">
                {category.shortDescription || `Master ${category.name} with our expert-led programs designed for all skill levels.`}
              </p>
              {category.highlights && category.highlights.length > 0 && (
                <div className="u-top-pills">
                  {category.highlights.map((h, i) => (
                    <span key={i}>{h}</span>
                  ))}
                </div>
              )}
              <div className="d-flex flex-wrap gap-2 mt-4">
                <a href="#courses" className="u-btn-dark w-auto">
                  Explore Courses
                </a>
                <a href="/courses" className="u-btn-outline">
                  View All Programs
                </a>
              </div>
            </div>
            <div className="col-lg-5">
              <img
                className="u-hero-image"
                src={category.image || "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1400&auto=format&fit=crop"}
                alt={category.name}
              />
            </div>
          </div>
        </div>
      </section>



      {/* Main Content */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-12">
              {/* Description */}
              {category.description && (
                <div

                  dangerouslySetInnerHTML={{ __html: category.description }}
                />

              )}

              {/* Course Listing */}
              <div className="mb-5" id="courses">
                <div className="d-flex justify-content-between align-items-end mb-4">
                  <div>
                    <h2 className="fw-black text-dark mb-1" style={{ fontWeight: 900 }}>Available Courses</h2>
                    <p className="text-muted mb-0">Browse through our specialized {category.name} modules</p>
                  </div>
                  <span className="badge bg-danger rounded-pill">{courses.length} Courses</span>
                </div>

                <div className="row g-4">
                  {courses.length > 0 ? (
                    courses.map(course => (
                      <div className="col-md-6" key={course._id}>
                        <Link href={`/courses/${course.slug || course._id}`} className="text-decoration-none">
                          <div className="card h-100 border-0 shadow-sm hover-lift transition-all overflow-hidden rounded-4">
                            <div style={{ height: '180px', overflow: 'hidden' }}>
                              {course.thumbnail ? (
                                <img src={course.thumbnail} className="w-100 h-100 object-fit-cover" alt={course.title} />
                              ) : (
                                <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center text-muted">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="card-body p-4">
                              <div className="d-flex gap-2 mb-2">
                                <span className="badge bg-danger-subtle text-danger fw-bold small rounded-pill">
                                  {course.instrument_id?.name || 'General'}
                                </span>
                                <span className="badge bg-light text-dark fw-bold small rounded-pill border">
                                  {course.level_id?.levelName || course.level}
                                </span>
                              </div>
                              <h5 className="card-title fw-black text-dark mb-2 fs-5" style={{ fontWeight: 900 }}>
                                {course.title}
                              </h5>
                              <div className="d-flex align-items-center gap-2 mt-3 pt-3 border-top">
                                <img
                                  src={`https://ui-avatars.com/api/?name=${course.course_creator?.name}&background=random`}
                                  className="rounded-circle"
                                  style={{ width: '24px', height: '24px' }}
                                  alt="instructor"
                                />
                                <span className="extra-small fw-bold text-muted" style={{ fontSize: '0.75rem' }}>{course.course_creator?.name}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="col-12 text-center py-5 bg-light rounded-4 border">
                      <h4 className="text-muted">No courses currently available in this category.</h4>
                    </div>
                  )}
                </div>
              </div>

              {/* FAQ Section */}
              {category.faq && category.faq.length > 0 && (
                <div className="mt-5 pt-4">
                  <h2 className="fw-black text-dark mb-4" style={{ fontWeight: 900 }}>Common Questions</h2>
                  <div className="accordion u-faq custom-accordion" id="categoryFaq">
                    {category.faq.map((item, idx) => (
                      <div className="accordion-item border-0 mb-3 shadow-sm rounded-4 overflow-hidden" key={idx}>
                        <h2 className="accordion-header">
                          <button
                            className={`accordion-button fw-bold ${idx === 0 ? '' : 'collapsed'}`}
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#faq${idx}`}
                            aria-expanded={idx === 0 ? 'true' : 'false'}
                            aria-controls={`faq${idx}`}
                          >
                            {item.question}
                          </button>
                        </h2>
                        <div
                          id={`faq${idx}`}
                          className={`accordion-collapse collapse ${idx === 0 ? 'show' : ''}`}
                          data-bs-parent="#categoryFaq"
                        >
                          <div className="accordion-body bg-white text-muted lh-lg">
                            {item.answer}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>


          </div>
        </div>
      </section>
    </div>
  );
}
