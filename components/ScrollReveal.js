'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal Component
 * Wraps children and triggers a CSS animation when they enter the viewport.
 * 
 * @param {Object} props
 * @param {string} props.animation - CSS class for animation (e.g., 'reveal-fade-up')
 * @param {string} props.delay - CSS class for delay (e.g., 'delay-1')
 * @param {number} props.threshold - IntersectionObserver threshold (0 to 1)
 */
export default function ScrollReveal({
  children,
  animation = 'reveal-fade-up',
  delay = '',
  threshold = 0.1,
  className = ''
}) {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, stop observing
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold]);

  return (
    <div
      ref={elementRef}
      className={`reveal-base ${animation} ${delay} ${isVisible ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
