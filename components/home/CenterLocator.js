'use client';

import React from 'react';

const CenterLocator = () => {
  return (
    <section id="center-locator" className="center-locator py-5">
      <div className="container">
        <div className="row align-items-end g-4 mb-4">
          <div className="col-lg-12 text-center">
            <h2 className="cl-title">Center Locator</h2>
            <p className="cl-subtitle mb-0">
              Find the nearest music school center in your city. Explore our top
              locations below.
            </p>
          </div>
        </div>
        <div className="row g-4">
          {/* Card 1 */}
          <div className="col-md-6 col-lg-3">
            <div className="cl-card">
              <div className="cl-top">
                <div className="cl-icon">
                  <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1600&auto=format&fit=crop" />
                </div>
                <span className="cl-badge">Delhi NCR</span>
              </div>
              <h5 className="cl-name">Harmony Music School</h5>
              <p className="cl-location mb-0">Punjabi Bagh, New Delhi</p>
              <div className="cl-actions">
                <a href="#" className="cl-link">
                  Get Directions
                </a>
                <a href="#" className="cl-link">
                  Call
                </a>
              </div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="col-md-6 col-lg-3">
            <div className="cl-card">
              <div className="cl-top">
                <div className="cl-icon">
                  <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1600&auto=format&fit=crop" />
                </div>
                <span className="cl-badge">Gurgaon</span>
              </div>
              <h5 className="cl-name">Rhythm Academy</h5>
              <p className="cl-location mb-0">Sector 49, Gurugram</p>
              <div className="cl-actions">
                <a href="#" className="cl-link">
                  Get Directions
                </a>
                <a href="#" className="cl-link">
                  Call
                </a>
              </div>
            </div>
          </div>
          {/* Card 3 */}
          <div className="col-md-6 col-lg-3">
            <div className="cl-card">
              <div className="cl-top">
                <div className="cl-icon">
                  <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1600&auto=format&fit=crop" />
                </div>
                <span className="cl-badge">Noida</span>
              </div>
              <h5 className="cl-name">Melody Institute</h5>
              <p className="cl-location mb-0">Sector 18, Noida</p>
              <div className="cl-actions">
                <a href="#" className="cl-link">
                  Get Directions
                </a>
                <a href="#" className="cl-link">
                  Call
                </a>
              </div>
            </div>
          </div>
          {/* Card 4 */}
          <div className="col-md-6 col-lg-3">
            <div className="cl-card">
              <div className="cl-top">
                <div className="cl-icon">
                  <img src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1600&auto=format&fit=crop" />
                </div>
                <span className="cl-badge">Jaipur</span>
              </div>
              <h5 className="cl-name">Swar Sadhna School</h5>
              <p className="cl-location mb-0">Vaishali Nagar, Jaipur</p>
              <div className="cl-actions">
                <a href="#" className="cl-link">
                  Get Directions
                </a>
                <a href="#" className="cl-link">
                  Call
                </a>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom CTA (Optional) */}
        <div className="text-center mt-4">
          <a href="#all-locations" className="btn btn-dark cl-btn">
            View All Locations
          </a>
        </div>
      </div>
    </section>
  );
};

export default CenterLocator;
