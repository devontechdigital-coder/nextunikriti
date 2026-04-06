'use client';
import React, { useEffect, useState, useRef } from 'react';
import SectionSkeleton from './SectionSkeleton';

const Timeline = ({ settings, isLoading }) => {
  const [bars, setBars] = useState([]);
  const [progress, setProgress] = useState(0);
  const timelineRef    = useRef(null);
  const sectionRef     = useRef(null);
  const waveWrapRef    = useRef(null);
  const tlCurrentRef   = useRef(0);
  const tlTargetRef    = useRef(0);
  const rafRef         = useRef(null);

  const displayTimeline = settings || [];

  useEffect(() => {
    if (isLoading || displayTimeline.length === 0) return;
    setBars(Array.from({ length: 600 }, (_, i) => {
      const sine   = Math.abs(Math.sin(i * 0.18)) * 35;
      const random = Math.random() * 25;
      return {
        height: 8 + sine + random,
        delay: (Math.random() * 1.8).toFixed(2) + 's'
      };
    }));
  }, [isLoading, displayTimeline]);

  useEffect(() => {
    const tl      = timelineRef.current;
    const section = sectionRef.current;
    const waveWrap = waveWrapRef.current;
    if (!tl || !section || displayTimeline.length === 0) return;

    const LERP = 0.08;
    const getTlMax = () => tl.scrollWidth - tl.clientWidth;

    // ✅ Use ResizeObserver to always match waveform to full scrollWidth
    const syncWaveWidth = () => {
      if (waveWrap) {
        waveWrap.style.width = tl.scrollWidth + 'px';
      }
    };

    // Run after paint so scrollWidth is accurate
    const ro = new ResizeObserver(() => syncWaveWidth());
    ro.observe(tl);
    // Also run immediately after a short delay
    setTimeout(syncWaveWidth, 100);
    setTimeout(syncWaveWidth, 500); // double-check after fonts/images load

    const tick = () => {
      tlCurrentRef.current += (tlTargetRef.current - tlCurrentRef.current) * LERP;
      if (Math.abs(tlTargetRef.current - tlCurrentRef.current) < 0.2) {
        tlCurrentRef.current = tlTargetRef.current;
      }
      tl.style.transform = `translateX(${-tlCurrentRef.current}px)`;
      const max = getTlMax();
      const pct = max > 0 ? Math.min(100, Math.max(0, (tlCurrentRef.current / max) * 100)) : 0;
      setProgress(pct);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    const onScroll = () => {
      const sectionTop    = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const wrapHeight    = window.innerHeight;
      const scrolled      = window.scrollY - sectionTop;
      const scrollable    = sectionHeight - wrapHeight;
      const max           = getTlMax();

      if (scrolled < 0 || scrollable <= 0) { tlTargetRef.current = 0; return; }
      if (scrolled > scrollable)            { tlTargetRef.current = max; return; }
      tlTargetRef.current = (scrolled / scrollable) * max;
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [displayTimeline, bars]); // ✅ bars in deps — re-sync after bars render

  if (isLoading) return (
    <section id="timelineSection" className="py-5">
      <div className="container"><SectionSkeleton type="timeline" /></div>
    </section>
  );

  useEffect(() => {
  if (isLoading || displayTimeline.length === 0) return;
  // ✅ 2000 bars — enough to cover any timeline scrollWidth
  setBars(Array.from({ length: 2000 }, (_, i) => {
    const sine   = Math.abs(Math.sin(i * 0.18)) * 35;
    const random = Math.random() * 25;
    return {
      height: 8 + sine + random,
      delay: (i * 0.008).toFixed(2) + 's' // ✅ staggered delay per bar
    };
  }));
}, [isLoading, displayTimeline]);

  if (!displayTimeline.length) return null;

  const loopedTimeline = [...displayTimeline, ...displayTimeline];

  return (
    <section id="timelineSection" ref={sectionRef}>
      <div className="timeline-sticky">

        <div className="text-center timeline-heading">
          <span className="u-kicker u-badge">TIMELINE</span>
          <h2 className="u-title">Story Timeline</h2>
          <p className="u-sub">
            Explore Unikriti's programs — curated for schools, individuals,
            online learners and certification goals.
          </p>
        </div>

        <div className="timeline-outer">
                {/* ✅ waveform-wrapper — ref so JS can set exact width */}
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

          <div id="timeline" className="timeline" ref={timelineRef}>

      
            {loopedTimeline.map((item, idx) => {
              const isTop = idx % 2 === 0;
              return (
                <div
                  className={`timeline-item ${isTop ? 'top' : 'bottom'}`}
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
                      <span className={`timeline-pin bg-${(idx % 5) + 1}`} />
                    </>
                  ) : (
                    <>
                      <span className={`timeline-pin bg-${(idx % 5) + 1}`} />
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

        {/* Scrollbar bottom */}
        <div className="timeline-scrollbar-track">
          <div
            className="timeline-scrollbar-thumb"
            style={{ width: `${progress}%` }}
          />
        </div>

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