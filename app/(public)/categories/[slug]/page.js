import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Course from '@/models/Course';
import '@/models/Instrument';
import '@/models/Level';
import '@/models/User';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CategoryCourseTabs from '@/components/category/CategoryCourseTabs';

async function getCategoryData(slug) {
  await connectDB();
  const category = await Category.findOne({ slug }).lean();
  if (!category) return null;
  const childCategories = await Category.find({ parentId: category._id }).select('_id').lean();
  const categoryIds = [category._id, ...childCategories.map((child) => child._id)];

  const courses = await Course.find({
    categoryIds: { $in: categoryIds },
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
                <a href="#browse-by-level" className="u-btn-dark w-auto">
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
              <div className="mb-5" id="browse-by-level">
                <div className="d-flex justify-content-between align-items-end mb-4">
                  <div>
                    <h2 className="fw-black text-dark mb-1" style={{ fontWeight: 900 }}>Browse By Level</h2>
                    <p className="text-muted mb-0">Select a level tab to view the matching {category.name} courses</p>
                  </div>
                  <span className="badge bg-danger rounded-pill">{courses.length} Courses</span>
                </div>

                <CategoryCourseTabs courses={courses} />
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
