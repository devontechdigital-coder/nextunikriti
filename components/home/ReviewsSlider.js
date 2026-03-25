'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import SectionSkeleton from './SectionSkeleton';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const ReviewsSlider = ({ settings = [], isLoading }) => {
  if (isLoading) return <SectionSkeleton type="generic" />;
  if (!isLoading && (!settings || settings.length === 0)) return null;

  const displayTestimonials = settings;

  return (
    <section className="u-reviews py-5 position-relative overflow-hidden">
      <div className="container">
        <div className="row align-items-center mb-5">
          <div className="col-md-7">
            <span className="u-kicker u-badge">TESTIMONIALS</span>
            <h2 className="u-title">What Our Students Say</h2>
          </div>
          <div className="col-md-5 text-md-end">
            <p className="u-sub mb-0 mx-auto mx-md-0">Real stories from our creative community.</p>
          </div>
        </div>

        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          navigation
          pagination={{ clickable: true }}
          breakpoints={{
            768: { slidesPerView: 2 },
            1200: { slidesPerView: 3 },
          }}
          className="u-reviewSwiper pb-5"
        >
          {displayTestimonials.map((review, idx) => (
            <SwiperSlide key={idx}>
              <div className="u-reviewCard p-4 rounded-4 border bg-white shadow-sm h-100">
                <div className="u-reviewTop d-flex align-items-center gap-3 mb-3">
                  <div className="u-avatar">
                    <img
                      src={review.img || `https://i.pravatar.cc/150?u=${idx}`}
                      alt={review.name}
                      className="rounded-circle"
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="u-user">
                    <h6 className="u-name mb-0 fw-bold">{review.name}</h6>
                    <small className="u-meta text-muted">{review.meta || 'Student'}</small>
                  </div>
                  <div className="ms-auto rounded-circle p-2 border"><img src="https://ontechtesting.in/unikriti/image/google.png" width={30} height={30} /> </div>
                </div>
                <div className="u-stars mb-3">
                  {[...Array(review.rating || 5)].map((_, i) => <span key={i} style={{ color: '#ffc107' }}>⭐</span>)}
                </div>
                <p className="u-text mb-0 italic">"{review.text}"</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default ReviewsSlider;
