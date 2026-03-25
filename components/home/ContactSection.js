'use client';

import React from 'react';
import SectionSkeleton from './SectionSkeleton';

const ContactSection = ({ settings, isLoading }) => {
   if (isLoading) return <SectionSkeleton type="contact" />;
   if (!settings || (!settings.email && !settings.phone && !settings.address)) return null;

   return (
      <section id="contact" className="u-contact py-5 bg-white">
         <div className="container">
            <div className="text-center mb-5">
               <span className="u-kicker u-badge">GET IN TOUCH</span>
               <h2 className="u-title">Contact Us</h2>
               <p className="u-sub mx-auto">Have questions? We're here to help you start your musical journey.</p>
            </div>

            <div className="row g-4 align-items-stretch">
               <div className="col-lg-5">
                  <div className="contact-card p-4 rounded-4 border shadow-sm h-100">
                     <h4 className="fw-bold mb-4">Contact Information</h4>

                     {settings.email && (
                        <div className="contact-item d-flex align-items-center gap-3 mb-4">
                           <div className="contact-icon bg-dark text-white p-3 rounded-3" style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📧</div>
                           <div>
                              <h6 className="mb-0 fw-bold">Email Address</h6>
                              <a href={`mailto:${settings.email}`} className="text-decoration-none text-muted">{settings.email}</a>
                           </div>
                        </div>
                     )}

                     {settings.phone && (
                        <div className="contact-item d-flex align-items-center gap-3 mb-4">
                           <div className="contact-icon bg-dark text-white p-3 rounded-3" style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📞</div>
                           <div>
                              <h6 className="mb-0 fw-bold">Phone Number</h6>
                              <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="text-decoration-none text-muted">{settings.phone}</a>
                           </div>
                        </div>
                     )}

                     {settings.address && (
                        <div className="contact-item d-flex align-items-center gap-3 mb-4">
                           <div className="contact-icon bg-dark text-white p-3 rounded-3" style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📍</div>
                           <div>
                              <h6 className="mb-0 fw-bold">Our Location</h6>
                              <p className="mb-0 text-muted">{settings.address}</p>
                           </div>
                        </div>
                     )}

                     <div className="mt-auto pt-4 border-top">
                        <h6 className="fw-bold mb-3">Follow Us</h6>
                        <div className="d-flex gap-3 social-links">
                           {settings.facebook && <a href={settings.facebook} className="p-2 border rounded-3 bg-light text-dark text-decoration-none">FB</a>}
                           {settings.instagram && <a href={settings.instagram} className="p-2 border rounded-3 bg-light text-dark text-decoration-none">IG</a>}
                           {settings.linkedin && <a href={settings.linkedin} className="p-2 border rounded-3 bg-light text-dark text-decoration-none">LN</a>}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="col-lg-7">
                  <div className="map-card h-100 rounded-4 overflow-hidden border shadow-sm" style={{ minHeight: '400px' }}>
                     {settings.mapEmbed ? (
                        <iframe
                           src={settings.mapEmbed}
                           width="100%"
                           height="100%"
                           style={{ border: 0 }}
                           allowFullScreen=""
                           loading="lazy"
                        />
                     ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-light text-muted" style={{ minHeight: '400px' }}>
                           No map available
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </section>
   );
};

export default ContactSection;