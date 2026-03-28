import RouteLoadingSignal from '@/components/RouteLoadingSignal';

export default function Loading() {
  return (
    <div
      className="position-fixed top-0 start-0 vw-100 vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: 'rgba(255, 255, 255, 0.72)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 2000,
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <RouteLoadingSignal />
      <div className="d-flex flex-column align-items-center justify-content-center text-center">
        <div
          className="spinner-border text-secondary"
          style={{ width: '2.5rem', height: '2.5rem', borderWidth: '0.25rem' }}
          role="presentation"
        />
        
      </div>
    </div>
  );
}
