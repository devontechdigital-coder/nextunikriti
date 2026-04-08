import RouteLoadingSignal from '@/components/RouteLoadingSignal';

export default function CourseLoading() {
  return (
    <div>
      <RouteLoadingSignal />

      {/* HERO SKELETON */}
   <section className="u-course-hero">
  <div className="container">
    <div className="d-flex align-items-center gap-2 mb-3">
      <div className="u-skeleton" style={{ width: 36, height: 13 }} />
      <div className="u-skeleton" style={{ width: 8, height: 13 }} />
      <div className="u-skeleton" style={{ width: 56, height: 13 }} />
      <div className="u-skeleton" style={{ width: 8, height: 13 }} />
      <div className="u-skeleton" style={{ width: 70, height: 13 }} />
    </div>
    <div
      className="u-skeleton rounded-pill mb-2"
      style={{ width: "62%", height: 52 }}
    />
    <div className="u-skeleton mb-2" style={{ width: "90%", height: 14 }} />
    <div className="u-skeleton mb-4" style={{ width: "72%", height: 14 }} />
    <div className="d-flex flex-wrap gap-2">
      <div
        className="u-skeleton rounded-pill"
        style={{ width: 110, height: 32 }}
      />
      <div
        className="u-skeleton rounded-pill"
        style={{ width: 88, height: 32 }}
      />
      <div
        className="u-skeleton rounded-pill"
        style={{ width: 126, height: 32 }}
      />
      <div
        className="u-skeleton rounded-pill"
        style={{ width: 152, height: 32 }}
      />
    </div>
  </div>
</section>


      {/* MAIN CONTENT */}
      <section className="u-main">
        <div className="container">
          <div className="row g-4">

            {/* LEFT COLUMN */}
            <div className="col-lg-8">

              {/* Feature image */}
              <div className="u-skeleton rounded-4 w-100" style={{ height: 360 }} />

              {/* Info cards */}
              <div className="row g-3 mt-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div className="col-md-6 col-xl-3" key={i}>
                    <div className="u-info-card">
                      <div className="u-skeleton rounded-circle mx-auto mb-2" style={{ width: 40, height: 40 }} />
                      <div className="u-skeleton mx-auto mb-2" style={{ width: '60%', height: 14 }} />
                      <div className="u-skeleton mx-auto" style={{ width: '80%', height: 12 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="mt-4 mb-4">
                <div className="u-skeleton mb-2" style={{ width: '100%', height: 16 }} />
                <div className="u-skeleton mb-2" style={{ width: '94%', height: 16 }} />
                <div className="u-skeleton mb-2" style={{ width: '88%', height: 16 }} />
                <div className="u-skeleton mb-2" style={{ width: '82%', height: 16 }} />
                <div className="u-skeleton" style={{ width: '70%', height: 16 }} />
              </div>

              {/* Package selector skeleton */}
              <div className="u-card mt-4 p-4">
                <div className="u-skeleton mb-2" style={{ width: 220, height: 26 }} />
                <div className="u-skeleton mb-4" style={{ width: 150, height: 13 }} />

                {/* Package filter tabs */}
                <div className="d-flex gap-2 mb-4">
                  <div className="u-skeleton rounded-pill" style={{ width: 80, height: 34 }} />
                  <div className="u-skeleton rounded-pill" style={{ width: 80, height: 34 }} />
                  <div className="u-skeleton rounded-pill" style={{ width: 80, height: 34 }} />
                </div>

                <div className="row g-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div className="col-md-4" key={i}>
                      <div className="border rounded-4 p-4">
                        <div className="u-skeleton rounded-circle mx-auto mb-3" style={{ width: 44, height: 44 }} />
                        <div className="u-skeleton mx-auto mb-2" style={{ width: '70%', height: 20 }} />
                        <div className="u-skeleton mx-auto mb-3" style={{ width: '55%', height: 28 }} />
                        <div className="u-skeleton mb-2" style={{ width: '92%', height: 12 }} />
                        <div className="u-skeleton mb-3" style={{ width: '76%', height: 12 }} />
                        <div className="u-skeleton rounded-pill w-100" style={{ height: 40 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructor card */}
              <div className="u-card mt-4">
                <div className="u-skeleton mb-4" style={{ width: 220, height: 26 }} />
                <div className="d-flex gap-3 align-items-start">
                  <div className="u-skeleton rounded-circle flex-shrink-0" style={{ width: 92, height: 92 }} />
                  <div className="flex-grow-1">
                    <div className="u-skeleton mb-2" style={{ width: '45%', height: 20 }} />
                    <div className="u-skeleton mb-3" style={{ width: '35%', height: 13 }} />
                    <div className="u-skeleton mb-2" style={{ width: '100%', height: 13 }} />
                    <div className="u-skeleton mb-2" style={{ width: '96%', height: 13 }} />
                    <div className="u-skeleton" style={{ width: '80%', height: 13 }} />
                  </div>
                </div>
              </div>

              {/* FAQ skeleton (optional section) */}
              <div className="u-card mt-4">
                <div className="u-skeleton mb-4" style={{ width: 280, height: 26 }} />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="mb-2">
                    <div className="u-skeleton rounded-3" style={{ width: '100%', height: 52 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="col-lg-4">
              <div className="u-side-sticky">

                {/* Price card */}
                <div className="u-price-card text-center p-4">
                  <div className="u-skeleton mx-auto mb-2" style={{ width: 130, height: 40 }} />
                  <div className="u-skeleton mx-auto mb-4" style={{ width: 100, height: 12 }} />
                  <div className="u-skeleton rounded-pill w-100 mb-4" style={{ height: 48 }} />
                  <div className="text-start d-flex flex-column gap-2 mb-4">
                    <div className="u-skeleton" style={{ width: '80%', height: 13 }} />
                    <div className="u-skeleton" style={{ width: '65%', height: 13 }} />
                    <div className="u-skeleton" style={{ width: '74%', height: 13 }} />
                    <div className="u-skeleton" style={{ width: '82%', height: 13 }} />
                  </div>
                  <div className="u-skeleton rounded-3 w-100" style={{ height: 44 }} />
                </div>

                {/* Quick details card */}
                <div className="u-card mt-4">
                  <div className="u-skeleton mb-4" style={{ width: 150, height: 24 }} />
                  <div className="d-flex flex-column gap-3">
                    <div className="u-skeleton" style={{ width: '88%', height: 14 }} />
                    <div className="u-skeleton" style={{ width: '78%', height: 14 }} />
                    <div className="u-skeleton" style={{ width: '84%', height: 14 }} />
                    <div className="u-skeleton" style={{ width: '70%', height: 14 }} />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}