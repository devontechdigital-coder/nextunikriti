import React from 'react';
import SectionSkeleton from './SectionSkeleton';

const FAQSection = ({ settings = [], isLoading }) => {
  if (isLoading) return <SectionSkeleton type="faq" />;
  if (!isLoading && (!settings || settings.length === 0)) return null;

  const displayFAQs = settings;

  return (
    <section id="faq" className="faq-section py-5 bg-white">
      <div className="container" >
        <div className="text-center mb-5">
          <span className="u-kicker u-badge">SUPPORT</span>
          <h2 className="u-title">Frequently Asked Questions</h2>
          <p className="u-sub mx-auto">Quick answers to common questions about our programs and classes.</p>
        </div>
        <div className="row g-4 justify-content-center">
          <div className="col-lg-10">
            <div className="accordion faq-accordion" id="faqAccordion">
              {displayFAQs.map((faq, idx) => (
                <div className="accordion-item" key={idx} style={{ border: '1px solid rgba(0,0,0,0.05)', marginBottom: '15px', borderRadius: '12px', overflow: 'hidden' }}>
                  <h2 className="accordion-header" id={`q${idx}`}>
                    <button
                      className={`accordion-button ${idx !== 0 ? 'collapsed' : ''}`}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#a${idx}`}
                      aria-expanded={idx === 0 ? "true" : "false"}
                      aria-controls={`a${idx}`}
                      style={{ fontWeight: '700', padding: '20px' }}
                    >
                      <span className="faq-q-icon" style={{ background: '#000', color: '#fff', borderRadius: '8px', padding: '2px 8px', marginRight: '15px' }}>?</span>
                      {faq.q}
                    </button>
                  </h2>
                  <div
                    id={`a${idx}`}
                    className={`accordion-collapse collapse ${idx === 0 ? 'show' : ''}`}
                    aria-labelledby={`q${idx}`}
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body" style={{ padding: '20px', borderTop: '1px solid rgba(0,0,0,0.05)', color: '#555' }}>
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
