'use client';

import React from 'react';

const PopularCourses = () => {
  return (
    <section className="u-courses py-5">
      <div className="container">
        <div className="text-center mb-4">
          <span className="u-kicker u-badge">COURSES</span>
          <h2 className="u-title">Learn with structure Grow with confidence</h2>
          <p className="u-sub">
            Choose Instruments, Singing, or Certification tracks — designed for
            clear progress and performance readiness.
          </p>
        </div>
        {/* Tabs */}
        <div className="d-flex justify-content-center">
          <ul className="nav u-tabs" id="unikritiCoursesTabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className="nav-link active"
                id="c-instruments-tab"
                data-bs-toggle="tab"
                data-bs-target="#c-instruments"
                type="button"
                role="tab"
              >
                <span className="ti">🎸</span> Instruments
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className="nav-link"
                id="c-singing-tab"
                data-bs-toggle="tab"
                data-bs-target="#c-singing"
                type="button"
                role="tab"
              >
                <span className="ti">🎤</span> Singing
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className="nav-link"
                id="c-cert-tab"
                data-bs-toggle="tab"
                data-bs-target="#c-cert"
                type="button"
                role="tab"
              >
                <span className="ti">🏅</span> Certification
              </button>
            </li>
          </ul>
        </div>
        <div className="tab-content mt-4">
          {/* ===================== INSTRUMENTS ===================== */}
          <div
            className="tab-pane fade show active"
            id="c-instruments"
            role="tabpanel"
            aria-labelledby="c-instruments-tab"
          >
            <div className="u-shell">
              <div className="row g-4 align-items-stretch">
                {/* Featured panel */}
                <div className="col-lg-5">
                  <div className="u-feature">
                    <img src="https://ontechtesting.in/unikriti/image/instrumemnt.gif" alt="Instruments" />
                  </div>
                </div>
                {/* Cards */}
                <div className="col-lg-7">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="u-course-card">
                        <div className="u-course-top">
                          <div className="u-ic">🎸</div>
                          <div>
                            <div className="u-course-name">Guitar</div>
                          </div>
                        </div>
                        <div className="u-mini-grid">
                          <div>
                            <span>⏳</span> 3–6 Months
                          </div>
                          <div>
                            <span>📍</span> Online/Offline
                          </div>
                        </div>
                        <div className="u-actions">
                          <a className="btn u-btn-dark w-100" href="#">
                            Book Now
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="u-course-card">
                        <div className="u-course-top">
                          <div className="u-ic">🎹</div>
                          <div>
                            <div className="u-course-name">Keyboard / Piano</div>
                          </div>
                        </div>
                        <div className="u-mini-grid">
                          <div>
                            <span>⏳</span> 3–6 Months
                          </div>
                          <div>
                            <span>📍</span> Online/Offline
                          </div>
                        </div>
                        <div className="u-actions">
                          <a className="btn u-btn-dark w-100" href="#">
                            Book Now
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="u-course-card">
                        <div className="u-course-top">
                          <div className="u-ic">🥁</div>
                          <div>
                            <div className="u-course-name">Drums</div>
                          </div>
                        </div>
                        <div className="u-mini-grid">
                          <div>
                            <span>⏳</span> 3–6 Months
                          </div>
                          <div>
                            <span>📍</span> Offline Preferred
                          </div>
                        </div>
                        <div className="u-actions">
                          <a className="btn u-btn-dark w-100" href="#">
                            Book Now
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="u-course-card">
                        <div className="u-course-top">
                          <div className="u-ic">🎻</div>
                          <div>
                            <div className="u-course-name">Violin</div>
                          </div>
                        </div>
                        <div className="u-mini-grid">
                          <div>
                            <span>⏳</span> 3–6 Months
                          </div>
                          <div>
                            <span>📍</span> Online/Offline
                          </div>
                        </div>
                        <div className="u-actions">
                          <a className="btn u-btn-dark w-100" href="#">
                            Book Now
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ===================== SINGING ===================== */}
          <div
            className="tab-pane fade"
            id="c-singing"
            role="tabpanel"
            aria-labelledby="c-singing-tab"
          >
            <div className="u-shell">
              <div className="row g-4 align-items-stretch">
                {/* Featured panel */}
                <div className="col-lg-5">
                  <div className="u-feature">
                    <img src="https://ontechtesting.in/unikriti/image/instrumemnt.gif" alt="Singing" />
                  </div>
                </div>
                {/* Cards */}
                <div className="col-lg-7">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="u-course-card">
                        <div className="u-course-top">
                          <div className="u-ic">🎙️</div>
                          <div>
                            <div className="u-course-name">Hindustani Vocals</div>
                          </div>
                        </div>
                        <div className="u-mini-grid">
                          <div>
                            <span>⏳</span> 3–12 Months
                          </div>
                          <div>
                            <span>📍</span> Online/Offline
                          </div>
                        </div>
                        <div className="u-actions">
                          <a className="btn u-btn-dark w-100" href="#">
                            Book Now
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="u-course-card">
                        <div className="u-course-top">
                          <div className="u-ic">🎤</div>
                          <div>
                            <div className="u-course-name">Western Vocals</div>
                          </div>
                        </div>
                        <div className="u-mini-grid">
                          <div>
                            <span>⏳</span> 3–12 Months
                          </div>
                          <div>
                            <span>📍</span> Online/Offline
                          </div>
                        </div>
                        <div className="u-actions">
                          <a className="btn u-btn-dark w-100" href="#">
                            Book Now
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="u-course-card">
                        <div className="u-course-top">
                          <div className="u-ic">🎼</div>
                          <div>
                            <div className="u-course-name">Carnatic Vocals</div>
                          </div>
                        </div>
                        <div className="u-mini-grid">
                          <div>
                            <span>⏳</span> 3–12 Months
                          </div>
                          <div>
                            <span>📍</span> Online/Offline
                          </div>
                        </div>
                        <div className="u-actions">
                          <a className="btn u-btn-dark w-100" href="#">
                            Book Now
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="u-course-card">
                        <div className="u-course-top">
                          <div className="u-ic">🎶</div>
                          <div>
                            <div className="u-course-name">Bollywood Vocals</div>
                          </div>
                        </div>
                        <div className="u-mini-grid">
                          <div>
                            <span>⏳</span> 3–12 Months
                          </div>
                          <div>
                            <span>📍</span> Online/Offline
                          </div>
                        </div>
                        <div className="u-actions">
                          <a className="btn u-btn-dark w-100" href="#">
                            Book Now
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ===================== CERTIFICATION ===================== */}
          <div
            className="tab-pane fade"
            id="c-cert"
            role="tabpanel"
            aria-labelledby="c-cert-tab"
          >
            <div className="u-shell">
              <div className="row g-4 align-items-stretch">
                {/* Featured panel */}
                <div className="col-lg-5">
                  <div className="u-feature">
                    <img src="https://ontechtesting.in/unikriti/image/instrumemnt.gif" alt="Certification" />
                  </div>
                </div>
                {/* Cards */}
                <div className="col-lg-7">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="u-course-card">
                        <div className="u-course-top">
                          <div className="u-ic">🏅</div>
                          <div>
                            <div className="u-course-name">
                              Trinity Certification
                            </div>
                          </div>
                        </div>
                        <div className="u-mini-grid">
                          <div>
                            <span>🗓️</span> Grade-based Plan
                          </div>
                          <div>
                            <span>📍</span> Online/Offline
                          </div>
                        </div>
                        <div className="u-actions">
                          <a className="btn u-btn-dark w-100" href="#">
                            Enroll
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="u-course-card">
                        <div className="u-course-top">
                          <div className="u-ic">🎭</div>
                          <div>
                            <div className="u-course-name">Performance Prep</div>
                          </div>
                        </div>
                        <div className="u-mini-grid">
                          <div>
                            <span>⏳</span> 4–8 Weeks
                          </div>
                          <div>
                            <span>📍</span> Online/Offline
                          </div>
                        </div>
                        <div className="u-actions">
                          <a className="btn u-btn-dark w-100" href="#">
                            Book Slot
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* tab-content */}
      </div>
    </section>
  );
};

export default PopularCourses;
