'use client';

import React, { useEffect, useRef } from 'react';  // ← add useRef



const SectionSkeleton = ({ type }) => {


  // ─── orbitTeam ref + layout effect ───────────────────────────────────────
  const orbitRef = useRef(null);

  useEffect(() => {
    if (type !== 'orbitTeam') return;

    const place = () => {
      const wrapper = orbitRef.current;
      if (!wrapper) return;

      const W = wrapper.offsetWidth;
      const radius = W * 0.4;

      const nodes = wrapper.querySelectorAll('.user-node');
      nodes.forEach((node) => {
        const angleDeg = parseFloat(node.getAttribute('data-angle'));
        if (isNaN(angleDeg)) return;

        const angleRad = (angleDeg * Math.PI) / 180;
        const x = Math.cos(angleRad) * radius;
        const y = Math.sin(angleRad) * radius;

        node.style.left = `calc(50% + ${x}px)`;
        node.style.bottom = `${y}px`;
      });
    };

    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [type]);

  if (type === 'hero') {
    return (

      <section className="u-hero py-5 u-hero-frame">
        <div className="u-divider" />
        <div className="container-fluid px-0">
          <div className="u-hero-grid">
            <div className="u-left" style={{ alignItems: 'end' }}>
              <div className="u-vertical u-skeleton dark" style={{ width: 35, height: '80%' }} />

              <div className="u-vertical u-skeleton dark ms-3" style={{ width: 35, height: '30%' }} />


            </div>
            <div className="u-center">
              <div className="  u-skeleton dark ms-3" style={{ width: '80%', aspectRatio: '1/0.5' }} />

            </div>
            <div className="u-right">
              <div className=" u-skeleton dark " style={{ width: '80%', aspectRatio: '1/0.5' }} />
              <div className=" u-skeleton dark " style={{ width: '50%', height: 40 }} />

              {[90, 80, 90, 80, 70].map((w, i) => (
                <p
                  key={i}
                  className="u-copy u-skeleton"
                  style={{ width: `${w}%`, height: 10 }}
                />
              ))}

              <div className="u-skeleton dark " style={{ height: 50 }} />

            </div>
          </div>
        </div>
      </section>



    );
  }


  if (type === 'timeline') {
    return (
      <>

        {/* Waveform Skeleton (same structure as real UI) */}
        <div className="waveform-wrapper">
          <div className="waveform" id="waveform">
            {Array.from({ length: 80 }).map((_, i) => (
              <div
                key={i}
                className="bar u-skeleton"
                style={{
                  height: `${20 + Math.random() * 40}px`,
                  animationDelay: `${i * 0.02}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Timeline Items Skeleton */}
        {Array.from({ length: 5 }).map((_, idx) => {
          const isTop = idx % 2 === 0;
          const positionClass = isTop ? 'top' : 'bottom';
          const bgClass = `bg-${(idx % 5) + 1}`;

          return (
            <div className={`timeline-item ${positionClass}`} key={idx}>
              {isTop ? (
                <>
                  <div className="timeline-card">
                    <div
                      className="u-skeleton dark timeline-year mb-2"
                      style={{ width: 70, height: 20 }}
                    />
                    <div
                      className="u-skeleton timeline-desc"
                      style={{ width: '95%', height: 12 }}
                    />
                    <div
                      className="u-skeleton timeline-desc mt-1"
                      style={{ width: '75%', height: 12 }}
                    />
                  </div>

                  <span
                    className={`timeline-pin ${bgClass} u-skeleton`}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%'
                    }}
                  />
                </>
              ) : (
                <>
                  <span
                    className={`timeline-pin ${bgClass} u-skeleton`}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%'
                    }}
                  />

                  <div className="timeline-card">
                    <div
                      className="u-skeleton dark timeline-year mb-2"
                      style={{ width: 70, height: 20 }}
                    />
                    <div
                      className="u-skeleton timeline-desc"
                      style={{ width: '95%', height: 12 }}
                    />
                    <div
                      className="u-skeleton timeline-desc mt-1"
                      style={{ width: '75%', height: 12 }}
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </>
    );
  }


  if (type === 'about') {
    return (
      <section className="u-about py-5 position-relative">
        <div className="container">
          <div className="row g-5 align-items-center">

            {/* LEFT SIDE */}
            <div className="col-lg-6">

              {/* Badge */}
              <div className="u-skeleton mb-3" style={{ width: 140, height: 20 }} />

              {/* Title */}
              <div className="u-skeleton mb-2" style={{ width: '90%', height: 30 }} />
              <div className="u-skeleton mb-3" style={{ width: '70%', height: 30 }} />

              {/* Paragraph */}
              {[90, 85, 80].map((w, i) => (
                <div
                  key={i}
                  className="u-skeleton mb-2"
                  style={{ width: `${w}%`, height: 10 }}
                />
              ))}

              {/* Blurbs */}
              <div className="row g-4 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div className="col-md-6" key={i}>
                    <div className="d-flex gap-3 align-items-start">
                      <div
                        className="u-skeleton"
                        style={{ width: 40, height: 40, borderRadius: '50%' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div className="u-skeleton mb-2" style={{ width: '70%', height: 14 }} />
                        <div className="u-skeleton" style={{ width: '90%', height: 10 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Button */}
              <div className="u-skeleton mt-4" style={{ width: 140, height: 45 }} />

            </div>

            {/* RIGHT SIDE */}
            <div className="col-lg-6">
              <div className="u-collage">

                {/* Main Image */}
                <div
                  className="u-skeleton w-100"
                  style={{ aspectRatio: '1/0.8', borderRadius: 20 }}
                />

                {/* Floating Stat */}
                <div
                  className="u-skeleton mt-3"
                  style={{ width: 220, height: 70, borderRadius: 12 }}
                />

              </div>
            </div>

          </div>
        </div>
      </section>
    );
  }

  if (type === 'awards') {
    return (
      <section className="awards-section">
        <div className="container">

          {/* Title */}
          <div className="u-skeleton dark mb-4 mx-auto d-block" style={{ width: 280, height: 30 }} />

          <div className="row g-4">

            {Array.from({ length: 4 }).map((_, i) => (
              <div className="col-6 col-md-3" key={i}>
                <div className="awardbox text-center shadow-sm p-3">

                  {/* Image */}
                  <div
                    className="u-skeleton dark mb-3 mx-auto d-block"
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 10
                    }}
                  />

                  {/* Title */}
                  <div
                    className="u-skeleton dark mx-auto mb-2"
                    style={{ width: '70%', height: 16 }}
                  />

                  {/* Description */}
                  <div
                    className="u-skeleton mx-auto mb-1"
                    style={{ width: '90%', height: 10 }}
                  />
                  <div
                    className="u-skeleton mx-auto mb-2"
                    style={{ width: '70%', height: 10 }}
                  />

                </div>
              </div>
            ))}

          </div>

        </div>
      </section>
    );
  }

  if (type === 'orbitTeam') {
    return (
      <section className="u-ourteam py-5">
        <div className="container">

          {/* Header */}
          <div className="text-center mb-4">
            <div className="u-skeleton d-block" style={{ height: '22px', width: '80px', margin: '0 auto 10px', borderRadius: '20px' }} />
            <div className="u-skeleton d-block" style={{ height: '28px', width: '220px', margin: '0 auto 10px' }} />
            <div className="u-skeleton d-block" style={{ height: '14px', width: '340px', margin: '0 auto 4px' }} />
          </div>

          {/* ↓ attach ref here — same minHeight as OrbitTeam */}
          <div className="orbit-wrapper" ref={orbitRef} style={{ minHeight: '400px', position: 'relative' }}>

            <div className="arc-line" />

            {/* Center logo — identical class to real component */}
            <div className="main-logo u-skeleton" style={{ borderRadius: '50%' }} />

            {/* Same angle distribution as OrbitTeam's fallback formula */}
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const count = 6;
              const angle = 180 - (idx * (180 / (count - 1)));
              return (
                <div
                  key={idx}
                  className="user-node"
                  data-angle={angle}
                  style={{ pointerEvents: 'none' }}
                >
                  <div className="info-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
                    <div className="u-skeleton" style={{ height: '13px', width: '72px', marginBottom: '5px', borderRadius: '4px' }} />
                    <div className="u-skeleton" style={{ height: '11px', width: '52px', borderRadius: '4px' }} />
                  </div>
                  <div className="user-img u-skeleton" style={{ borderRadius: '50%' }} />
                </div>
              );
            })}

          </div>
        </div>
      </section>
    );
  }

  if (type === 'faq') {
    return (
      <section id="faq" className="faq-section py-5 bg-white">
        <div className="container" style={{ maxWidth: 800 }}>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="u-skeleton mx-auto d-block mb-3" style={{ width: 70, height: 18, borderRadius: 20 }} />
            <div className="u-skeleton mx-auto  d-block  mb-3" style={{ width: 300, height: 30 }} />
            <div className="u-skeleton mx-auto  d-block  mb-2" style={{ width: 340, height: 13 }} />
            <div className="u-skeleton mx-auto  d-block " style={{ width: 240, height: 13 }} />
          </div>

          <div className="row g-4 justify-content-center">
            <div className="col-lg-10">

              {/* First item — open state with answer lines */}
              <div style={{ border: '1px solid rgba(0,0,0,0.05)', marginBottom: 15, borderRadius: 12, overflow: 'hidden', padding: 20 }}>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="u-skeleton" style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0 }} />
                  <div className="u-skeleton" style={{ height: 14, width: '65%' }} />
                  <div className="u-skeleton ms-auto" style={{ height: 14, width: 20, flexShrink: 0 }} />
                </div>
                <div style={{ paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="u-skeleton mb-2" style={{ height: 11, width: '95%' }} />
                  <div className="u-skeleton mb-2" style={{ height: 11, width: '80%' }} />
                  <div className="u-skeleton" style={{ height: 11, width: '60%' }} />
                </div>
              </div>

              {/* Remaining collapsed items */}
              {[65, 55, 70, 50].map((w, i) => (
                <div
                  key={i}
                  className="d-flex align-items-center gap-3"
                  style={{ border: '1px solid rgba(0,0,0,0.05)', marginBottom: 15, borderRadius: 12, overflow: 'hidden', padding: 20 }}
                >
                  <div className="u-skeleton" style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0 }} />
                  <div className="u-skeleton" style={{ height: 14, width: `${w}%` }} />
                  <div className="u-skeleton ms-auto" style={{ height: 14, width: 20, flexShrink: 0 }} />
                </div>
              ))}

            </div>
          </div>
        </div>
      </section>
    );
  }


  if (type === 'contact') {
    return (
      <section id="contact" className="u-contact py-5 bg-white">
        <div className="container">

          {/* Header */}
          <div className="text-center mb-5">
            <div className="u-skeleton mx-auto d-block mb-3" style={{ width: 80, height: 18, borderRadius: 20 }} />
            <div className="u-skeleton mx-auto d-block mb-3" style={{ width: 180, height: 30 }} />
            <div className="u-skeleton mx-auto d-block mb-2" style={{ width: 340, height: 13 }} />
          </div>

          <div className="row g-4 align-items-stretch">

            {/* Left — contact info card */}
            <div className="col-lg-5">
              <div className="contact-card p-4 rounded-4 border shadow-sm h-100">

                {/* Card title */}
                <div className="u-skeleton mb-4" style={{ width: 160, height: 18 }} />

                {/* 3 contact items: icon + two lines */}
                {[['90px', '140px'], ['100px', '120px'], ['90px', '95%']].map(([w1, w2], i) => (
                  <div key={i} className="d-flex align-items-start gap-3 mb-4">
                    <div className="u-skeleton" style={{ width: 50, height: 50, borderRadius: 12, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="u-skeleton mb-2" style={{ width: w1, height: 13 }} />
                      <div className="u-skeleton mb-1 d-block" style={{ width: w2, height: 11 }} />
                      {i === 2 && <div className="u-skeleton" style={{ width: '70%', height: 11 }} />}
                    </div>
                  </div>
                ))}

                {/* Follow Us */}
                <div className="pt-4 border-top">
                  <div className="u-skeleton mb-3" style={{ width: 70, height: 13 }} />
                  <div className="d-flex gap-3">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="u-skeleton" style={{ width: 38, height: 36, borderRadius: 8 }} />
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Right — map placeholder */}
            <div className="col-lg-7">
              <div
                className="u-skeleton rounded-4 w-100"
                style={{ minHeight: 400, }}
              />
            </div>

          </div>
        </div>
      </section>
    );
  }

  // Generic Section Skeleton
  return (
    <section className="py-5" style={{ background: '#fff' }}>
      <div className="container">
        <div className="text-center mb-5">
          <div className="u-skeleton mx-auto mb-2" style={{ width: '120px', height: '24px' }}></div>
          <div className="u-skeleton u-skeleton-title mx-auto" style={{ width: '300px' }}></div>
        </div>
        <div className="row g-4">
          {[1, 2, 3].map(i => (
            <div className="col-md-4" key={i}>
              <div className="p-4 border rounded shadow-sm">
                <div className="u-skeleton u-skeleton-img mb-3" style={{ height: '180px' }}></div>
                <div className="u-skeleton u-skeleton-title mb-2" style={{ width: '70%', height: '24px' }}></div>
                <div className="u-skeleton u-skeleton-text" style={{ width: '100%' }}></div>
                <div className="u-skeleton u-skeleton-text" style={{ width: '80%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionSkeleton;
