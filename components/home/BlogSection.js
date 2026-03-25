'use client';

import React from 'react';

const BlogSection = () => {
  return (
    <section className="u-blog-section py-5">
      <div className="container">
        {/* Header Section */}
        <div className="u-blog-header text-center mb-5">
          <h2 className="u-title">Our Latest Blog Posts</h2>
          <p className="u-subtext">
            Stay updated with Unikriti's music insights, learning tips, and
            success stories!
          </p>
        </div>
        {/* Blog Post 1 */}
        <div className="row mb-5">
          <div className="col-md-3 col-12">
            <div className="u-blog-post">
              <div className="u-blog-img">
                <img
                  src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1600&auto=format&fit=crop"
                  alt="Music Learning Tips"
                />
              </div>
              <div className="u-blog-content">
                <h3 className="u-blog-title">
                  Top 5 Tips for Learning Music Faster
                </h3>
                <div className="u-blog-footer">
                  <span className="u-author">By Vivek Sharma</span>
                  <span className="u-date">June 25, 2026</span>
                </div>
                <a href="#" className="btn u-btn-dark">
                  Read More
                </a>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-12">
            <div className="u-blog-post">
              <div className="u-blog-img">
                <img
                  src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1600&auto=format&fit=crop"
                  alt="Trinity Certification"
                />
              </div>
              <div className="u-blog-content">
                <h3 className="u-blog-title">
                  Why Trinity Certification Matters for Musicians
                </h3>
                <div className="u-blog-footer">
                  <span className="u-author">By Anjali Desai</span>
                  <span className="u-date">June 20, 2026</span>
                </div>
                <a href="#" className="btn u-btn-dark">
                  Read More
                </a>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-12">
            <div className="u-blog-post">
              <div className="u-blog-img">
                <img
                  src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1600&auto=format&fit=crop"
                  alt="Online Music Classes"
                />
              </div>
              <div className="u-blog-content">
                <h3 className="u-blog-title">
                  How Online Music Classes are Revolutionizing Music
                </h3>
                <div className="u-blog-footer">
                  <span className="u-author">By Rohit Patel</span>
                  <span className="u-date">June 18, 2026</span>
                </div>
                <a href="#" className="btn u-btn-dark">
                  Read More
                </a>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-12">
            <div className="u-blog-post">
              <div className="u-blog-img">
                <img
                  src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1600&auto=format&fit=crop"
                  alt="Music Events"
                />
              </div>
              <div className="u-blog-content">
                <h3 className="u-blog-title">
                  Upcoming Music Events at Unikriti
                </h3>
                <div className="u-blog-footer">
                  <span className="u-author">By Sneha Iyer</span>
                  <span className="u-date">June 15, 2026</span>
                </div>
                <a href="#" className="btn u-btn-dark">
                  Read More
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
