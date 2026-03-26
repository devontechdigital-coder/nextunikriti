import connectDB from '@/lib/db';
import Course from '@/models/Course';
import Section from '@/models/Section';
import Lesson from '@/models/Lesson';
import Category from '@/models/Category';
import Instrument from '@/models/Instrument';
import Level from '@/models/Level';
import mongoose from 'mongoose';
import { notFound } from 'next/navigation';
import { FaQuestionCircle, FaGraduationCap, FaClock, FaDesktop, FaMapMarkerAlt } from 'react-icons/fa';

import PackageSelector from '@/components/PackageSelector';
import Package from '@/models/Package';

async function getCourse(courseId) {
    try {
        await connectDB();

        let course;
        if (mongoose.Types.ObjectId.isValid(courseId)) {
            course = await Course.findById(courseId);
        }

        if (!course) {
            course = await Course.findOne({ slug: courseId });
        }

        if (!course) return null;

        // Populate necessary fields
        await course.populate('course_creator', 'name avatar email bio');
        await course.populate('instrument_id', 'name');
        await course.populate('level_id', 'levelName');
        await course.populate('categoryIds');

        // Fetch packages directly from DB instead of internal API fetch
        const packages = await Package.find({ course_id: course._id, is_active: true }).lean();

        // Fetch sections and lessons
        const sections = await Section.find({ courseId: course._id }).sort({ order: 1 }).lean();
        for (const section of sections) {
            section.lessons = await Lesson.find({ sectionId: section._id }).sort({ order: 1 }).lean();
        }

        return { 
            ...course.toObject(), 
            sections, 
            packages: JSON.parse(JSON.stringify(packages)) 
        };
    } catch (error) {
        console.error("Error fetching course:", error);
        return null;
    }
}

export async function generateMetadata({ params }) {
    const course = await getCourse(params.courseId);
    if (!course) return { title: 'Course Not Found' };

    return {
        title: course.metaTitle || `${course.title} | Unikriti`,
        description: course.metaDescription || course.shortDescription || course.description.substring(0, 160),
        keywords: course.metaKeywords || '',
        openGraph: {
            title: course.metaTitle || course.title,
            description: course.metaDescription || course.shortDescription || course.description.substring(0, 160),
            images: course.thumbnail ? [course.thumbnail] : [],
        }
    };
}

export default async function PublicCourseDetailPage({ params }) {
    const course = await getCourse(params.courseId);

    if (!course) {
        notFound();
    }

    const primaryCategory = course.categoryIds?.[0]?.name || 'Course';
    const instructorName = course.course_creator?.name || 'Instructor';

    // Find the highest priced package for the sidebar
    const maxPackagePrice = course.packages && course.packages.length > 0 
        ? Math.max(...course.packages.map(p => p.price))
        : course.price;

    return (
        <div className=''>
            {/* Hero Section */}
            <section className="u-course-hero">
                <div className="container">
                    <div className="u-breadcrumb">
                        <a href="/">Home</a>
                        <span>/</span>
                        <a href="/courses">Courses</a>
                        <span>/</span>
                        <span>{primaryCategory}</span>
                    </div>
                    <div className="u-chip">🎸 {primaryCategory} Course</div>
                    <h1 className="u-course-title">
                        {course.title}
                    </h1>
                    <p className="u-course-sub">
                        {course.shortDescription || course.description.substring(0, 200) + '...'}
                    </p>
                    <div className="u-top-meta">
                        <span>{course.level_id?.levelName || course.level}</span>
                        <span>{course.mode || 'Online'}</span>
                        <span>{course.duration || 'Flexible'}</span>
                        {course.certification && <span>Certification Available</span>}
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="u-main">
                <div className="container">
                    <div className="row g-4">
                        {/* LEFT CONTENT */}
                        <div className="col-lg-8">
                            {course.thumbnail ? (
                                <img
                                    className="u-feature-img"
                                    src={course.thumbnail}
                                    alt={course.title}
                                />
                            ) : (
                                <div className="u-feature-img d-flex align-items-center justify-content-center bg-light text-muted">
                                    No Course Image
                                </div>
                            )}

                            {/* COURSE INFO CARDS */}
                            <div className="row g-3 mt-1">
                                <div className="col-md-6 col-xl-3">
                                    <div className="u-info-card">
                                        <div className="u-info-icon">⏳</div>
                                        <h6>Duration</h6>
                                        <p>{course.duration || 'Self-paced'}</p>
                                    </div>
                                </div>
                                <div className="col-md-6 col-xl-3">
                                    <div className="u-info-card">
                                        <div className="u-info-icon">📍</div>
                                        <h6>Mode</h6>
                                        <p>{course.mode || 'Online'}</p>
                                    </div>
                                </div>
                                <div className="col-md-6 col-xl-3">
                                    <div className="u-info-card">
                                        <div className="u-info-icon">🎓</div>
                                        <h6>Level</h6>
                                        <p>{course.level_id?.levelName || course.level}</p>
                                    </div>
                                </div>
                                <div className="col-md-6 col-xl-3">
                                    <div className="u-info-card">
                                        <div className="u-info-icon">🏅</div>
                                        <h6>Certification</h6>
                                        <p>{course.certification ? 'Available' : 'No Certificate'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* OVERVIEW */}
                            <div

                                dangerouslySetInnerHTML={{ __html: course.description }}
                            />

                            {/* PACKAGE SELECTOR SECTION (Interactive) */}
                            <div id="packages">
                                <PackageSelector courseId={course._id.toString()} initialPackages={course.packages} />
                            </div>



                            {/* INSTRUCTOR */}
                            <div className="u-card mt-4">
                                <h2 className="u-sec-title">Meet Your Instructor</h2>
                                <div className="u-instructor">
                                    {course.course_creator?.avatar ? (
                                        <img src={course.course_creator.avatar} alt={instructorName} />
                                    ) : (
                                        <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white" style={{ width: '92px', height: '92px' }}>
                                            {instructorName.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h5>{instructorName}</h5>
                                        <small>Instructor • {primaryCategory} Mentor</small>
                                        <p className="u-text mb-0">
                                            {course.course_creator?.bio || `Join ${instructorName} to master ${course.title} through a structured and encouraging learning path.`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* FAQ SECTIONS (if any) */}
                            {course.faq && course.faq.length > 0 && (
                                <div className="u-card mt-4">
                                    <h2 className="u-sec-title">Frequently Asked Questions</h2>
                                    <div className="accordion u-faq" id="courseFaq">
                                        {course.faq.map((item, idx) => (
                                            <div className="accordion-item" key={idx}>
                                                <h2 className="accordion-header">
                                                    <button
                                                        className={`accordion-button ${idx === 0 ? '' : 'collapsed'}`}
                                                        type="button"
                                                        data-bs-toggle="collapse"
                                                        data-bs-target={`#faq${idx}`}
                                                    >
                                                        {item.question}
                                                    </button>
                                                </h2>
                                                <div
                                                    id={`faq${idx}`}
                                                    className={`accordion-collapse collapse ${idx === 0 ? 'show' : ''}`}
                                                    data-bs-parent="#courseFaq"
                                                >
                                                    <div className="accordion-body">
                                                        {item.answer}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT SIDEBAR */}
                        <div className="col-lg-4">
                            <div className="u-side-sticky">
                                <div className="u-price-card text-center p-4">
                                    <div className="price">{maxPackagePrice > 0 ? `₹${maxPackagePrice.toLocaleString()}` : 'Free'}</div>
                                    <div className="mini mb-3">
                                        Starting price
                                    </div>
                                    <div className="d-grid mb-3">
                                        <a href="#packages" className="u-btn-dark text-decoration-none">
                                            Select Plan to Enroll
                                        </a>
                                    </div>
                                    <div className="u-side-points text-start">
                                        <div>✔ Live guided sessions</div>
                                        <div>✔ Practice support</div>
                                        <div>✔ {course.mode || 'Online'} sessions</div>
                                        {course.certification && <div>✔ Certification included</div>}
                                    </div>
                                    <div className="d-grid mt-3">
                                        <button className="u-btn-outline">
                                            Download Brochure
                                        </button>
                                    </div>
                                </div>
                                <div className="u-card mt-4">
                                    <h3 className="u-sec-title mb-3" style={{ fontSize: 24 }}>
                                        Quick Details
                                    </h3>
                                    <p className="u-text mb-2">
                                        <strong>Instrument:</strong> {course.instrument_id?.name || 'General'}
                                    </p>
                                    <p className="u-text mb-2">
                                        <strong>Level:</strong> {course.level_id?.levelName || course.level}
                                    </p>
                                    <p className="u-text mb-2">
                                        <strong>Language:</strong> {course.language || 'English'}
                                    </p>
                                    <p className="u-text mb-0">
                                        <strong>Duration:</strong> {course.duration || 'Flexible'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
