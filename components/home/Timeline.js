'use client';

import React, { useEffect, useState, useRef } from 'react';
import SectionSkeleton from './SectionSkeleton';

const Timeline = ({ settings, isLoading }) => {
  const [bars, setBars] = useState([]);
  const [progress, setProgress] = useState(0);
  const timelineRef = useRef(null);
  const targetScrollRef = useRef(0);
  const currentScrollRef = useRef(0);
  const rafRef = useRef(null);

  const displayTimeline = settings || [];

  useEffect(() => {
    if (isLoading || displayTimeline.length === 0) return;
    const generatedBars = [];
    for (let i = 0; i < 300; i++) {
      generatedBars.push({
        height: 20 + Math.random() * 30,
        delay: Math.random() * 1.8 + 's'
      });
    }
    setBars(generatedBars);
  }, [isLoading, displayTimeline]);

  useEffect(() => {
    const el = timelineRef.current;
    const section = document.getElementById('timelineSection');
    if (!el || !section || displayTimeline.length === 0) return;

    const SCROLL_SPEED = 2;
    const LERP = 0.08; // smoothness — lower = smoother/slower

    // Smooth lerp animation loop
    const animate = () => {
      const maxScroll = el.scrollWidth / 2 - el.clientWidth;
      currentScrollRef.current += (targetScrollRef.current - currentScrollRef.current) * LERP;

      // Snap to target when very close
      if (Math.abs(targetScrollRef.current - currentScrollRef.current) < 0.5) {
        currentScrollRef.current = targetScrollRef.current;
      }

      el.scrollLeft = currentScrollRef.current;

      // Update progress bar
      const pct = maxScroll > 0 ? (currentScrollRef.current / maxScroll) * 100 : 0;
      setProgress(Math.min(100, Math.max(0, pct)));

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    const onWheel = (e) => {
      const maxScroll = el.scrollWidth / 2 - el.clientWidth;
      const atStart = targetScrollRef.current <= 0;
      const atEnd = targetScrollRef.current >= maxScroll;

      if (e.deltaY < 0 && atStart) return;
      if (e.deltaY > 0 && atEnd) return;

      e.preventDefault();

      targetScrollRef.current = Math.max(
        0,
        Math.min(targetScrollRef.current + e.deltaY * SCROLL_SPEED, maxScroll)
      );
    };

    section.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      section.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(rafRef.current);
    };
  }, [displayTimeline]);

  if (isLoading) {
    return (
      <section id="timelineSection" className="py-5">
        <div className="container">
          <SectionSkeleton type="timeline" />
        </div>
      </section>
    );
  }

  if (!displayTimeline || displayTimeline.length === 0) return null;

  const loopedTimeline = [...displayTimeline, ...displayTimeline];

  return (
    <section id="timelineSection" className="py-5">
      <div className="w-100">

        <div className="text-center mb-4">
          <span className="u-kicker u-badge">TIMELINE</span>
          <h2 className="u-title">Story Timeline</h2>
          <p className="u-sub">
            Explore Unikriti's programs — curated for schools, individuals,
            online learners and certification goals.
          </p>
        </div>

        {/* ✅ Progress scroll bar */}
        <div className="timeline-scrollbar-track">
          <div
            className="timeline-scrollbar-thumb"
            style={{ width: `${progress}%` }}
          />
          {/* Animated dot on thumb end */}
          <div
            className="timeline-scrollbar-dot"
            style={{ left: `${progress}%` }}
          />
        </div>

        <div className="timeline-outer">
          <div
            id="timeline"
            className="timeline px-0"
            ref={timelineRef}
          >
            <div className="waveform-wrapper">
              <div className="waveform" id="waveform">
                {[...bars, ...bars].map((bar, i) => (
                  <div
                    key={i}
                    className="bar"
                    style={{ height: `${bar.height}px`, animationDelay: bar.delay }}
                  />
                ))}
              </div>
            </div>

            {loopedTimeline.map((item, idx) => {
              const isTop = idx % 2 === 0;
              const positionClass = isTop ? 'top' : 'bottom';
              const bgClass = `bg-${(idx % 5) + 1}`;

              return (
                <div
                  className={`timeline-item ${positionClass}`}
                  key={`${item.id || idx}-${idx}`}
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

        {/* Scroll hint */}
        <div className="timeline-hint">
          <span className="timeline-hint-arrow">↓</span>
          <span>Scroll to explore</span>
          <span className="timeline-hint-arrow">↓</span>
        </div>

      </div>
    </section>
  );
};

export default Timeline;