'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import SectionSkeleton from './SectionSkeleton';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/autoplay';
import 'swiper/css/pagination';

const AwardsSlider = ({ settings = [], isLoading }) => {
  if (isLoading) return <SectionSkeleton type="awards" />;
  if (!isLoading && (!settings || settings.length === 0)) return null;

  const displayAwards = settings;

  return (
    <section className="awards-section">
      <div className="container">
        <h2 className="awards-title">Our Awards & Recognitions</h2>

        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 4 },
          }}
          className="awards-slider pb-5"
        >
          {displayAwards.map((award, idx) => (
            <SwiperSlide key={idx}>
              <div className="awardbox text-center shadow-sm">
                <div className="award-img-wrap mb-3" style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={award.img || "/image/award-placeholder.png"}
                    alt={award.name}
                    className="img-fluid"
                    style={{ maxHeight: '100%', objectFit: 'contain', width: 'auto' }}
                  />
                </div>
                <h4>{award.name}</h4>
                {award.desc && <p className="small text-muted mt-2 px-2">{award.desc}</p>}
                <span className="mt-2 d-block text-secondary small">Recognition of Excellence</span>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default AwardsSlider;
