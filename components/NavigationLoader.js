'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const MAX_LOADER_MS = 15000;
const isPublicPath = (pathname) =>
  Boolean(pathname) &&
  !pathname.startsWith('/admin') &&
  !pathname.startsWith('/school') &&
  !pathname.startsWith('/student') &&
  !pathname.startsWith('/instructor');

export default function NavigationLoader() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [routeLoadingActive, setRouteLoadingActive] = useState(false);
  const targetPathRef = useRef(null);
  const failSafeTimerRef = useRef(null);

  useEffect(() => {
    if (!targetPathRef.current) return;

    if (pathname === targetPathRef.current) {
      window.clearTimeout(failSafeTimerRef.current);
      failSafeTimerRef.current = null;
      targetPathRef.current = null;
      setIsVisible(false);
    }
  }, [pathname]);

  useEffect(() => {
    const stopLoader = () => {
      window.clearTimeout(failSafeTimerRef.current);
      failSafeTimerRef.current = null;
      targetPathRef.current = null;
      setIsVisible(false);
    };

    const startLoader = (nextPathname) => {
      window.clearTimeout(failSafeTimerRef.current);
      targetPathRef.current = nextPathname;
      setIsVisible(true);
      failSafeTimerRef.current = window.setTimeout(() => {
        stopLoader();
      }, MAX_LOADER_MS);
    };

    const isModifiedEvent = (event) =>
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

    const shouldHandleAnchor = (anchor) => {
      if (!anchor || !anchor.href) return false;
      if (anchor.target && anchor.target !== '_self') return false;
      if (anchor.hasAttribute('download')) return false;
      if (anchor.getAttribute('rel') === 'external') return false;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      if (url.hash) return false;
      if (url.pathname === window.location.pathname) return false;

      return true;
    };

    const handleClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedEvent(event)) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a');
      if (!shouldHandleAnchor(anchor)) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      startLoader(nextUrl.pathname);
    };

    document.addEventListener('click', handleClick, true);

    const handleRouteLoadingStart = () => {
      window.clearTimeout(failSafeTimerRef.current);
      failSafeTimerRef.current = null;
      setIsVisible(false);
      setRouteLoadingActive(true);
    };

    const handleRouteLoadingEnd = () => {
      setRouteLoadingActive(false);
    };

    window.addEventListener('route-loading-start', handleRouteLoadingStart);
    window.addEventListener('route-loading-end', handleRouteLoadingEnd);

    return () => {
      window.clearTimeout(failSafeTimerRef.current);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('route-loading-start', handleRouteLoadingStart);
      window.removeEventListener('route-loading-end', handleRouteLoadingEnd);
    };
  }, []);

  if (isPublicPath(pathname)) {
    return null;
  }

  return (
    <div
      className={`page-transition-loader page-transition-loader--global position-fixed top-0 start-0 vw-100 vh-100 d-flex align-items-center justify-content-center ${
        isVisible && !routeLoadingActive ? 'is-visible' : ''
      }`}
      role="status"
      aria-live="polite"
      aria-hidden={!isVisible}
      aria-label="Loading page"
    >
      <div className="d-flex flex-column align-items-center justify-content-center text-center">
        <div
          className="spinner-border text-secondary"
          style={{ width: '2.5rem', height: '2.5rem', borderWidth: '0.25rem' }}
          role="presentation"
        />
        <p className="mb-0 mt-3 text-muted small fw-medium">
          Loading...
        </p>
      </div>
    </div>
  );
}
