'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

function groupCoursesByLevel(courses) {
  const levelMap = new Map();

  courses.forEach((course) => {
    const levelId = course.level_id?._id?.toString?.() || course.level_id?.toString?.() || `level-${course.level || 'all-levels'}`;
    const levelName = course.level_id?.levelName || course.level || 'All Levels';

    if (!levelMap.has(levelId)) {
      levelMap.set(levelId, {
        id: levelId,
        name: levelName,
        courses: [],
      });
    }

    levelMap.get(levelId).courses.push(course);
  });

  return Array.from(levelMap.values());
}

export default function CategoryCourseTabs({ courses = [] }) {
  const levelGroups = useMemo(() => groupCoursesByLevel(courses), [courses]);
  const [activeLevelId, setActiveLevelId] = useState(levelGroups[0]?.id || '');
  const activeLevel = levelGroups.find((level) => level.id === activeLevelId) || levelGroups[0];

  useEffect(() => {
    if (!levelGroups.some((level) => level.id === activeLevelId)) {
      setActiveLevelId(levelGroups[0]?.id || '');
    }
  }, [activeLevelId, levelGroups]);

  if (!levelGroups.length) {
    return (
      <div className="col-12 text-center py-5 bg-light rounded-4 border">
        <h4 className="text-muted">No courses currently available in this category.</h4>
      </div>
    );
  }

  return (
    <div className="w-100">
 
      <div className="d-flex flex-wrap gap-2 mb-4 justify-content-center bg-light border rounded-2 p-2">
        {levelGroups.map((level) => (
          <button
            key={level.id}
            type="button"
            className={`btn flex-fill py-2 rounded-2 px-4 ${activeLevel?.id === level.id ? 'btn-dark' : 'btn-outline-dark'}`}
            onClick={() => setActiveLevelId(level.id)}
          >
            {level.name}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <h4 className="fw-bold mb-1">{activeLevel?.name || 'Available Courses'}</h4>
        <p className="text-muted mb-0">
          {activeLevel?.courses?.length || 0} course{activeLevel?.courses?.length === 1 ? '' : 's'} available in this level.
        </p>
      </div>

      <div className="row g-4">
        {activeLevel?.courses?.map((course) => (
          <div className="col-md-6 col-xl-4" key={course._id?.toString?.() || course.slug}>
            {(() => {
              const courseHref = `/courses/${course.slug || course._id}`;

              return (
            <div className=" border rounded-4 overflow-hidden bg-white shadow-sm">
              <Link href={courseHref} className="d-block text-decoration-none">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-100"
                    style={{ height: 200, objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center bg-light text-muted"
                    style={{ height: 200 }}
                  >
                    Course Preview
                  </div>
                )}
              </Link>

              <div className="p-4 d-flex flex-column h-100">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {course.instrument_id?.name && (
                    <span className="badge text-bg-light border">{course.instrument_id.name}</span>
                  )}
                  {course.mode && (
                    <span className="badge text-bg-light border">{course.mode}</span>
                  )}
                </div>

                <h5 className="fw-bold mb-2">
                  <Link href={courseHref} className="text-dark text-decoration-none stretched-link position-relative">
                    {course.title}
                  </Link>
                </h5>
                <p className="text-muted small mb-3 flex-grow-1">
                  {course.shortDescription || 'Explore the full course details, syllabus, and enrollment packages.'}
                </p>

                

                <Link
                  href={courseHref}
                  className="btn btn-dark rounded-pill px-4 mt-auto position-relative"
                >
                  View Course
                </Link>
              </div>
            </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}
