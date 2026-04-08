import RouteLoadingSignal from '@/components/RouteLoadingSignal';

export default function CategoryLoading() {
  return (
    <div className="category-landing">
      <RouteLoadingSignal />

      <section className="u-hero category border-bottom">
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
               <div className="u-skeleton rounded-pill mb-3" style={{ width: 150, height: 32 }} /> <br/>
              <div className="u-skeleton mb-3" style={{ width: '75%', height: 52 }} />
              <div className="u-skeleton mb-2" style={{ width: '95%', height: 14 }} />
              <div className="u-skeleton mb-4" style={{ width: '80%', height: 14 }} />
              <div className="d-flex flex-wrap gap-2 mb-4">
                <div className="u-skeleton rounded-pill" style={{ width: 110, height: 34 }} />
                <div className="u-skeleton rounded-pill" style={{ width: 130, height: 34 }} />
                <div className="u-skeleton rounded-pill" style={{ width: 120, height: 34 }} />
              </div>
              <div className="d-flex gap-3">
                <div className="u-skeleton rounded-pill" style={{ width: 170, height: 46 }} />
                <div className="u-skeleton rounded-pill" style={{ width: 170, height: 46 }} />
              </div>
            </div>
            <div className="col-lg-5">
              <div className="u-skeleton rounded-4 w-100" style={{ aspectRatio: '1 / 0.78' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-white">
        <div className="container">
          <div className="u-skeleton mb-3" style={{ width: '100%', height: 18 }} />
          <div className="u-skeleton mb-2" style={{ width: '92%', height: 18 }} />
          <div className="u-skeleton mb-5" style={{ width: '84%', height: 18 }} />

          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <div className="u-skeleton mb-2" style={{ width: 220, height: 30 }} />
              <div className="u-skeleton" style={{ width: 280, height: 14 }} />
            </div>
            <div className="u-skeleton rounded-pill" style={{ width: 110, height: 34 }} />
          </div>

          <div className="row g-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="col-md-6" key={index}>
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                  <div className="u-skeleton w-100" style={{ height: 180 }} />
                  <div className="card-body p-4">
                    <div className="d-flex gap-2 mb-3">
                      <div className="u-skeleton rounded-pill" style={{ width: 90, height: 26 }} />
                      <div className="u-skeleton rounded-pill" style={{ width: 100, height: 26 }} />
                    </div>
                    <div className="u-skeleton mb-2" style={{ width: '85%', height: 26 }} />
                    <div className="u-skeleton mb-4" style={{ width: '68%', height: 26 }} />
                    <div className="d-flex align-items-center gap-2 pt-3 border-top">
                      <div className="u-skeleton rounded-circle" style={{ width: 24, height: 24 }} />
                      <div className="u-skeleton" style={{ width: 130, height: 12 }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
