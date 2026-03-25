'use client';

import React from 'react';
import HeroSkeleton from './SectionSkeleton';

const HeroSection = ({ settings, isLoading }) => {
  if (isLoading) return <HeroSkeleton type="hero" />;
  if (!settings || (!settings.title && !settings.videoUrl)) return null;

  const {
    title = "creativity <span>unleashed</span>",
    subtitle = "Modern Music School",
    description = "Unikriti is a creative ecosystem for the next generation of learners to build skills that matter. Join us for a transformative musical journey.",
    videoUrl = "https://ontechtesting.in/unikriti/image/video.mp4",
    ctaText = "Book Free Trial",
    ctaUrl = "#"
  } = (settings || {});

  const renderTitle = (text) => {
    if (!text) return null;
    let newText = text;
    if (text.toLowerCase().includes('music')) {
      newText = text.replace(/music/gi, '<span class="thin">music</span>');
    }
    return <h1 className="u-vertical" dangerouslySetInnerHTML={{ __html: newText }} />;
  };

  return (
    <section className="u-hero py-5 u-hero-frame  bg-dark">
      <div className="u-divider" />
      <div className="container-fluid px-0">
        <div className="u-hero-grid">
          {/* Left Area (Headline) */}
          <div className="u-left">
            {renderTitle(title)}
            <div className="u-mini-rail">
              <span>learn</span>
              <span>perform</span>
              <span>certify</span>
            </div>
          </div>

          {/* Center Area (Video/Visual) */}
          <div className="u-center">

            <video
              key={videoUrl}
              style={{ width: '80%', height: 'auto' }}
              autoPlay
              muted
              loop
              playsInline
              className="u-img"
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

          </div>

          {/* Right Area (Copy/CTA) */}
          <div className="u-right">
            <img src="https://ontechtesting.in/unikriti/image/piano.webp" />
            <span className="u-badge mb-2">{subtitle}</span>
            <p className="u-copy">
              {description}
            </p>

            <div className="u-cta">
              <a href={ctaUrl || "#"}>{ctaText}</a>
              <div className="u-arrow">
                <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 13L13 1M13 1H4.5M13 1V9.5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
