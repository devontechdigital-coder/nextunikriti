'use client';

import React from 'react';

const ProgramsSection = () => {
  return (
    <section className="u-protabs py-5">
      <div className="container">
        <div className="text-center mb-4">
          <span className="u-kicker u-badge">MUSIC LABS</span>
          <h2 className="u-title">Choose your learning path</h2>
          <p className="u-sub">
            Explore Unikriti’s programs — curated for schools, individuals, online
            learners and certification goals.
          </p>
        </div>
        {/* Tabs (CENTER) */}
        <div className="d-flex justify-content-center">
          <ul className="nav u-tabs" id="unikritiProgramsTabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className="nav-link active"
                id="tab-inschool"
                data-bs-toggle="tab"
                data-bs-target="#pane-inschool"
                type="button"
                role="tab"
              >
                <span className="ti">🏫</span> In-School
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className="nav-link"
                id="tab-afterschool"
                data-bs-toggle="tab"
                data-bs-target="#pane-afterschool"
                type="button"
                role="tab"
              >
                <span className="ti">🎤</span> After-School
              </button>
            </li>
          </ul>
        </div>
        {/* Tab Content */}
        <div className="tab-content mt-4" id="unikritiProgramsTabsContent">
          {/* ===== TAB 1: IN-SCHOOL ===== */}
          <div
            className="tab-pane fade show active"
            id="pane-inschool"
            role="tabpanel"
            aria-labelledby="tab-inschool"
          >
            <div className="u-card">
              <div className="row g-0 align-items-stretch">
                <div className="col-lg-6">
                  <div className="u-media">
                    <img
                      src="https://static.wixstatic.com/media/2050fd_ef88ffb9a0fb47e3bffe452e3690cf84~mv2.gif"
                      alt="In-School Program"
                    />
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="u-body">
                    <h3 className="u-h3">
                      <img src="https://ontechtesting.in/unikriti/image/child-care.png" />
                      In-School Program
                    </h3>
                    <p className="u-desc">
                      Integrate music into school life — structured curriculum,
                      weekly club programs (Musical Theatre), teacher training,
                      and event support for annual days and showcases.
                    </p>
                    <div className="u-meta">
                      <div className="u-meta-item">
                        <span className="u-ic">🗓️</span>
                        <div>
                          <div className="u-meta-k">Duration</div>
                          <div className="u-meta-v">Academic Session / Term</div>
                        </div>
                      </div>
                      <div className="u-meta-item">
                        <span className="u-ic">🏫</span>
                        <div>
                          <div className="u-meta-k">Mode</div>
                          <div className="u-meta-v">In-School (Weekly)</div>
                        </div>
                      </div>
                      <div className="u-meta-item">
                        <span className="u-ic">🎭</span>
                        <div>
                          <div className="u-meta-k">Weekly Club</div>
                          <div className="u-meta-v">Musical Theatre Program</div>
                        </div>
                      </div>
                      <div className="u-meta-item">
                        <span className="u-ic">₹</span>
                        <div>
                          <div className="u-meta-k">Pricing</div>
                          <div className="u-meta-v">Custom School Plan*</div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      <a href="#" className="btn u-btn-dark">
                        Book a School Call
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ===== TAB 2: AFTER-SCHOOL ===== */}
          <div
            className="tab-pane fade"
            id="pane-afterschool"
            role="tabpanel"
            aria-labelledby="tab-afterschool"
          >
            <div className="u-card">
              <div className="row g-0 align-items-stretch">
                <div className="col-lg-6">
                  <div className="u-media">
                    <img
                      src="https://static.wixstatic.com/media/2050fd_ef88ffb9a0fb47e3bffe452e3690cf84~mv2.gif"
                      alt="In-School Program"
                    />
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="u-body">
                    <h3 className="u-h3">
                      <img src="https://ontechtesting.in/unikriti/image/teachers.png" />
                      After-School Program
                    </h3>
                    <p className="u-desc">
                      Personalised learning in instruments and singing with a
                      clear progress roadmap. Ideal for students who want skill
                      mastery + international certification options.
                    </p>
                    <div className="u-meta">
                      <div className="u-meta-item">
                        <span className="u-ic">⏳</span>
                        <div>
                          <div className="u-meta-k">Duration</div>
                          <div className="u-meta-v">3 / 6 / 12 Months</div>
                        </div>
                      </div>
                      <div className="u-meta-item">
                        <span className="u-ic">🎧</span>
                        <div>
                          <div className="u-meta-k">Mode</div>
                          <div className="u-meta-v">Online / Offline</div>
                        </div>
                      </div>
                      <div className="u-meta-item">
                        <span className="u-ic">🏅</span>
                        <div>
                          <div className="u-meta-k">Certification</div>
                          <div className="u-meta-v">Trinity (Optional)</div>
                        </div>
                      </div>
                      <div className="u-meta-item">
                        <span className="u-ic">₹</span>
                        <div>
                          <div className="u-meta-k">Starting Fee</div>
                          <div className="u-meta-v">₹3,999 / month*</div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      <a href="#" className="btn u-btn-dark">
                        Book Now
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* tab content */}
      </div>
    </section>
  );
};

export default ProgramsSection;
