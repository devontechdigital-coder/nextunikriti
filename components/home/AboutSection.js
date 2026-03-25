'use client';

import React from 'react';
import SectionSkeleton from './SectionSkeleton';

const AboutSection = ({ settings, isLoading }) => {
  // 🔄 Loading state
  if (isLoading) return <SectionSkeleton type="about" />;

  // ❌ No data → hide section
  if (
    !settings ||
    (!settings.title &&
      !settings.text &&
      !settings.imageUrl &&
      !settings.ctaText &&
      (!settings.blurbs || settings.blurbs.length === 0))
  ) {
    return null;
  }

  const { title, text, imageUrl, ctaText, ctaUrl, blurbs } = settings;

  // 🧠 Title formatter
  const renderTitle = (text) => {
    if (!text) return null;

    let newText = text;

    return (
      <h2
        className="u-title"
        dangerouslySetInnerHTML={{ __html: newText }}
      />
    );
  };

  return (
    <section className="u-about py-5 position-relative">
      <div className="container">
        <div className="row g-5 align-items-center">

          {/* LEFT CONTENT */}
          <div className="col-lg-6">
            <span className="u-kicker u-badge">ABOUT UNIKRITI</span>

            {renderTitle(title)}

            {text && (
              <p
                className="u-para my-4"
                style={{ whiteSpace: 'pre-line' }}
              >
                {text}
              </p>
            )}

            {blurbs && blurbs.length > 0 && (
              <div className="row g-4 mb-4">
                {blurbs.map((blurb, idx) => (
                  <div className="col-md-6" key={idx}>
                    <div className="u-info-card">
                      <div className="ic">
                        {blurb.icon || '✨'}
                      </div>
                      <div className="content">
                        <h6>{blurb.title}</h6>
                        <p>{blurb.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ctaText && (
              <div className="d-flex gap-3 mt-4">
                <a
                  href={ctaUrl || "#"}
                  className="u-btn-dark text-decoration-none"
                >
                  {ctaText}
                </a>
              </div>
            )}
          </div>

          {/* RIGHT IMAGE */}
          <div className="col-lg-6">
            {imageUrl && (
              <div className="u-collage">
                <div className="u-img u-img-1 w-100">
                  <img
                    src={imageUrl}
                    className="img-fluid rounded-4 shadow-lg"
                    alt="About"
                  />
                </div>

                {/* Static stat (optional, API se bhi laa sakte ho) */}
                <div className="u-stat p-3 shadow-lg">
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-box bg-dark text-white p-2 rounded-circle">
                      🏆
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">
                        100% Success Rate
                      </h6>
                      <small className="text-muted">
                        In Trinity Exams
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;