'use client';

import React, { useEffect, useState } from 'react';
import SectionSkeleton from './SectionSkeleton';

const Timeline = ({ settings, isLoading }) => {
  const [bars, setBars] = useState([]);

  const displayTimeline = settings || [];

  // 🔄 Generate waveform bars
  useEffect(() => {
    if (isLoading || displayTimeline.length === 0) return;

    const generatedBars = [];
    for (let i = 0; i < 300; i++) {
      generatedBars.push({
        height: 20 + Math.random() * 30,
        delay: Math.random() * 1.8 + "s"
      });
    }

    setBars(generatedBars);
  }, [isLoading, displayTimeline]);

  // 🔄 Loading state → show skeleton
  if (isLoading) {
    return (
      <section id="timelineSection" className="py-5">
        <div className="container">
          <div id="timeline" className="timeline">
            <SectionSkeleton type="timeline" />
          </div>
        </div>
      </section>
    );
  }

  // ❌ No data → hide section
  if (!displayTimeline || displayTimeline.length === 0) {
    return null;
  }

  return (
    <section id="timelineSection" className="py-5">
      <div className="container">

        {/* Heading */}
        <div className="text-center mb-4">
          <span className="u-kicker u-badge">TIMELINE</span>
          <h2 className="u-title">Story Timeline</h2>
          <p className="u-sub">
            Explore Unikriti’s programs — curated for schools, individuals,
            online learners and certification goals.
          </p>
        </div>

        <div id="timeline" className="timeline">

          {/* Waveform */}
          <div className="waveform-wrapper">
            <div className="waveform" id="waveform">
              {bars.map((bar, i) => (
                <div
                  key={i}
                  className="bar"
                  style={{
                    height: `${bar.height}px`,
                    animationDelay: bar.delay
                  }}
                />
              ))}
            </div>
          </div>

          {/* Timeline Items */}
          {displayTimeline.map((item, idx) => {
            const isTop = idx % 2 === 0;
            const positionClass = isTop ? 'top' : 'bottom';
            const bgClass = `bg-${(idx % 5) + 1}`;

            return (
              <div
                className={`timeline-item ${positionClass}`}
                key={item.id || idx}
              >
                {isTop ? (
                  <>
                    <div className="timeline-card">
                      <h3 className="timeline-year">{item.year}</h3>
                      <p className="timeline-desc">
                        {item.title && <strong>{item.title}: </strong>}
                        {item.desc}
                      </p>
                    </div>
                    <span className={`timeline-pin ${bgClass}`} />
                  </>
                ) : (
                  <>
                    <span className={`timeline-pin ${bgClass}`} />
                    <div className="timeline-card">
                      <h3 className="timeline-year">{item.year}</h3>
                      <p className="timeline-desc">
                        {item.title && <strong>{item.title}: </strong>}
                        {item.desc}
                      </p>
                    </div>
                  </>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
};

export default Timeline;