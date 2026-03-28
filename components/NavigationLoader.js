'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const MIN_VISIBLE_MS = 250;

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const [routeLoadingActive, setRouteLoadingActive] = useState(false);
  const startedAtRef = useRef(0);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const hideLoader = () => {
      if (!startedAtRef.current) {
        setIsVisible(false);
        return;
      }

      const elapsed = Date.now() - startedAtRef.current;
      const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);

      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => {
        setIsVisible(false);
        startedAtRef.current = 0;
      }, remaining);
    };

    hideLoader();
  }, [pathname, searchParams]);

  useEffect(() => {
    const startLoader = () => {
      window.clearTimeout(hideTimerRef.current);
      startedAtRef.current = Date.now();
      setIsVisible(true);
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
      if (url.hash && url.pathname === window.location.pathname && url.search === window.location.search) {
        return false;
      }

      return url.pathname !== window.location.pathname || url.search !== window.location.search;
    };

    const handleClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || isModifiedEvent(event)) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a');
      if (!shouldHandleAnchor(anchor)) return;

      startLoader();
    };

    const handleSubmit = () => {
      startLoader();
    };

    const handlePopState = () => {
      startLoader();
    };

    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    window.history.pushState = function pushState(...args) {
      startLoader();
      return originalPushState(...args);
    };

    window.history.replaceState = function replaceState(...args) {
      startLoader();
      return originalReplaceState(...args);
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('submit', handleSubmit, true);
    window.addEventListener('popstate', handlePopState);

    const handleRouteLoadingStart = () => {
      window.clearTimeout(hideTimerRef.current);
      startedAtRef.current = 0;
      setIsVisible(false);
      setRouteLoadingActive(true);
    };

    const handleRouteLoadingEnd = () => {
      setRouteLoadingActive(false);
    };

    window.addEventListener('route-loading-start', handleRouteLoadingStart);
    window.addEventListener('route-loading-end', handleRouteLoadingEnd);

    return () => {
      window.clearTimeout(hideTimerRef.current);
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('submit', handleSubmit, true);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('route-loading-start', handleRouteLoadingStart);
      window.removeEventListener('route-loading-end', handleRouteLoadingEnd);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

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
