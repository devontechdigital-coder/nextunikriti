import RouteLoadingSignal from '@/components/RouteLoadingSignal';

export default function PublicLoading() {
  return (
    <section
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: '50vh',
        padding: '4rem 1rem',
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <RouteLoadingSignal />
      <div className="d-flex flex-column align-items-center justify-content-center text-center">
        <div
          className="spinner-border text-secondary"
          style={{ width: '2.5rem', height: '2.5rem', borderWidth: '0.25rem' }}
          role="presentation"
        />
        <p className="mb-0 mt-3 text-muted small fw-medium">Loading content...</p>
      </div>
    </section>
  );
}
