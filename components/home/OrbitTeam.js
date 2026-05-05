'use client';

import React, { useEffect, useRef } from 'react';
import SectionSkeleton from './SectionSkeleton';

const OrbitTeam = ({ settings = [], logoUrl = '', isLoading }) => {
  const wrapperRef = useRef(null);
  const logoRef = useRef(null);
  const svgLineRef = useRef(null);

  const displayTeam = settings || [];
  const centerLogoUrl = logoUrl?.trim() || '/image/logo-round.png';

  useEffect(() => {
    if (isLoading || displayTeam.length === 0) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const radius = wrapper.offsetWidth * 0.4; // 40vw equivalent from CSS
    const nodes = wrapper.querySelectorAll('.user-node');

    nodes.forEach(node => {
      const angleDeg = parseFloat(node.getAttribute('data-angle'));
      if (!isNaN(angleDeg)) {
        const angleRad = (angleDeg * Math.PI) / 180;

        // Position relative to center
        const x = Math.cos(angleRad) * radius;
        const y = Math.sin(angleRad) * radius;

        node.style.left = `calc(50% + ${x}px)`;
        node.style.bottom = `${y}px`;
      }
    });
  }, [displayTeam]);

  const getCenter = (el) => {
    if (!el || !wrapperRef.current) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const parentRect = wrapperRef.current.getBoundingClientRect();

    return {
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top + rect.height / 2
    };
  };

  const handleMouseEnter = (e) => {
    const node = e.currentTarget;
    const line = svgLineRef.current;
    const logo = logoRef.current;

    if (!line || !logo) return;

    const start = getCenter(node);
    const end = getCenter(logo);

    line.setAttribute('x1', start.x);
    line.setAttribute('y1', start.y);
    line.setAttribute('x2', end.x);
    line.setAttribute('y2', end.y);
    line.style.opacity = 1;
  };

  const handleMouseLeave = () => {
    if (svgLineRef.current) {
      svgLineRef.current.style.opacity = 0;
    }
  };

  if (isLoading) return <SectionSkeleton type="orbitTeam" />;
  if (displayTeam.length === 0) return null;

  return (
    <section className="u-ourteam py-5">
      <div className="container">
        <div className="text-center mb-4">
          <span className="u-kicker u-badge">OUR TEAM</span>
          <h2 className="u-title">Our Dedicated Team</h2>
          <p className="u-sub">
            Choose Instruments, Singing, or Certification tracks — designed for
            clear progress and performance readiness.
          </p>
        </div>
        <div className="orbit-wrapper" ref={wrapperRef} style={{ minHeight: '400px', position: 'relative' }}>
          <svg className="connector-svg" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            <line
              ref={svgLineRef}
              className="connector-line"
              x1={0} y1={0} x2={0} y2={0}
              stroke="white" strokeWidth="2" opacity="0"
              style={{ transition: 'opacity 0.2s' }}
            />
          </svg>
          <div className="arc-line" />
          <div className="main-logo" ref={logoRef}>
            <img src={centerLogoUrl} alt="Unikriti" />
          </div>

          {displayTeam.map((member, idx) => {
            // If angle is missing, calculate it for even distribution in a semi-circle (0 to 180)
            const angle = member.angle !== undefined ? member.angle : (180 - (idx * (180 / (displayTeam.length - 1))));

            return (
              <div
                key={idx}
                className="user-node"
                data-angle={angle}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="info-card">
                  <h6>{member.name}</h6>
                  <p className="mb-0 text-muted">{member.role}</p>
                </div>
                <img
                  src={member.img || `https://i.pravatar.cc/150?u=${idx}`}
                  className="user-img"
                  alt={member.name}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default OrbitTeam;
