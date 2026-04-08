import RouteLoadingSignal from '@/components/RouteLoadingSignal';

export default function CourseLoading() {
  return (
    <div>
      <RouteLoadingSignal />

      <section className="u-course-hero">
        <div className="container py-5">
          <div className="u-skeleton mb-3" style={{ width: 190, height: 14 }} />
          <div className="u-skeleton rounded-pill mb-3" style={{ width: 170, height: 32 }} />
          <div className="u-skeleton mb-3" style={{ width: '62%', height: 56 }} />
          <div className="u-skeleton mb-2" style={{ width: '90%', height: 14 }} />
          <div className="u-skeleton mb-4" style={{ width: '72%', height: 14 }} />
          <div className="d-flex flex-wrap gap-2">
            <div className="u-skeleton rounded-pill" style={{ width: 120, height: 32 }} />
            <div className="u-skeleton rounded-pill" style={{ width: 100, height: 32 }} />
            <div className="u-skeleton rounded-pill" style={{ width: 130, height: 32 }} />
          </div>
        </div>
      </section>

      <section className="u-main">
        <div className="container py-4">
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="u-skeleton rounded-4 w-100 mb-4" style={{ minHeight: 360 }} />

              <div className="row g-3 mt-1 mb-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div className="col-md-6 col-xl-3" key={index}>
                    <div className="u-info-card">
                      <div className="u-skeleton mx-auto mb-3 rounded-circle" style={{ width: 40, height: 40 }} />
                      <div className="u-skeleton mx-auto mb-2" style={{ width: '70%', height: 16 }} />
                      <div className="u-skeleton mx-auto" style={{ width: '85%', height: 12 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="u-skeleton mb-3" style={{ width: '100%', height: 18 }} />
              <div className="u-skeleton mb-2" style={{ width: '94%', height: 18 }} />
              <div className="u-skeleton mb-2" style={{ width: '88%', height: 18 }} />
              <div className="u-skeleton mb-5" style={{ width: '82%', height: 18 }} />

              <div className="u-card mt-4 p-4">
                <div className="u-skeleton mb-3" style={{ width: 220, height: 28 }} />
                <div className="row g-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div className="col-md-4" key={index}>
                      <div className="border rounded-4 p-4">
                        <div className="u-skeleton mx-auto mb-3 rounded-circle" style={{ width: 44, height: 44 }} />
                        <div className="u-skeleton mb-2" style={{ width: '70%', height: 22, margin: '0 auto' }} />
                        <div className="u-skeleton mb-2" style={{ width: '55%', height: 28, margin: '0 auto' }} />
                        <div className="u-skeleton mb-2" style={{ width: '92%', height: 12 }} />
                        <div className="u-skeleton" style={{ width: '76%', height: 12, margin: '0 auto' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="u-price-card text-center p-4">
                <div className="u-skeleton mx-auto mb-2" style={{ width: 120, height: 36 }} />
                <div className="u-skeleton mx-auto mb-3" style={{ width: 110, height: 12 }} />
                <div className="u-skeleton rounded-pill w-100 mb-3" style={{ height: 48 }} />
                <div className="u-skeleton mb-2" style={{ width: '85%', height: 12 }} />
                <div className="u-skeleton mb-2" style={{ width: '78%', height: 12 }} />
                <div className="u-skeleton mb-2" style={{ width: '82%', height: 12 }} />
                <div className="u-skeleton mt-4" style={{ width: '100%', height: 170, borderRadius: 24 }} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
