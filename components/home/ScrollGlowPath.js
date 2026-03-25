'use client';

import React from 'react';

const ScrollGlowPath = () => {
  return (
    <div className="scroll-glow-path" aria-hidden="true">
      <svg id="glowSvg" viewBox="0 0 100 1000" preserveAspectRatio="none">
        <defs>
          <linearGradient id="glowGrad" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0%" stopColor="#00e5ff" />
            <stop offset="55%" stopColor="#33ff99" />
            <stop offset="100%" stopColor="#8a2be2" />
          </linearGradient>
          <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={4} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Bloom under */}
        <path id="glowBloomPath" />
        {/* Main line */}
        <path id="glowMainPath" />
      </svg>
      {/* Perfect circle dot (HTML, no SVG distortion) */}
      <div id="glowDot" className="glow-dot" />
    </div>
  );
};

export default ScrollGlowPath;
