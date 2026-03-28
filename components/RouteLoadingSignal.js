'use client';

import { useEffect } from 'react';

export default function RouteLoadingSignal() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('route-loading-start'));

    return () => {
      window.dispatchEvent(new CustomEvent('route-loading-end'));
    };
  }, []);

  return null;
}
