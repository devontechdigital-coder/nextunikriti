import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { getSettings } from '@/lib/getSettings';
import ContactForm from '@/components/contact/ContactForm';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';

export const metadata = {
  title: 'Contact Us | Unikriti School of Performing Arts',
  description: 'Get in touch with Unikriti School of Performing Arts. Reach out for course inquiries, trial bookings, or any other questions.',
};

export default async function ContactPage() {
  const settings = await getSettings();
  const contact = settings.hp_contact || {};

  return (
    <>
      <section className="topbansec">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h2>Contact Us</h2>
            </div>
          </div>
        </div>
      </section>

      <section className="u-contact-section py-5">
        <div className="container">
          {/* Contact Details */}
          <div className="row mb-5">
            <div className="col-lg-6">
              <p className="u-section-text">
                We're here to help! If you have any questions or want to book a free trial, feel free to get in touch.
              </p>

              {/* Contact Info */}
              <div className="u-contact-details">
                <div className="u-contact-item">
                  <h4 className="u-detail-title">School Address</h4>
                  <p className="u-detail-text">
                    {contact.address || '307, Silver Stone Residency, Sector 19, Dwarka, New Delhi, 110 075'}
                  </p>
                </div>

                <div className="u-contact-item">
                  <h4 className="u-detail-title">Phone Number</h4>
                  <p className="u-detail-text">
                    <a href={`tel:${contact.phone || '+919717690913'}`}>
                      {contact.phone || '+91-97176-90913'}
                    </a>
                  </p>
                </div>

                <div className="u-contact-item">
                  <h4 className="u-detail-title">Email</h4>
                  <p className="u-detail-text">
                    <a href={`mailto:${contact.email || 'info@unikriti.in'}`}>
                      {contact.email || 'info@unikriti.in'}
                    </a>
                  </p>
                </div>

                <div className="u-contact-item">
                  <h4 className="u-detail-title">Follow Us</h4>
                  <div className="u-social-links">
                    <a href={contact.facebook || "#"} target="_blank" rel="noopener noreferrer" className="u-social-link">
                      <FaFacebook />
                    </a>
                    <a href={contact.instagram || "#"} target="_blank" rel="noopener noreferrer" className="u-social-link">
                      <FaInstagram />
                    </a>
                    <a href={contact.youtube || "#"} target="_blank" rel="noopener noreferrer" className="u-social-link">
                      <FaYoutube />
                    </a>
                    {contact.linkedin && (
                      <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="u-social-link">
                        <FaLinkedin />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="col-lg-6">
              <ContactForm />
            </div>
          </div>

          {/* Google Map Section */}
          <div className="row">
            <div className="col-12">
              <h3 className="u-sub-title">Find Us Here</h3>
              <div className="u-map-container">
                <iframe
                  src={contact.mapEmbed || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d28347.357875557477!2d77.03569605063618!3d28.57376328005389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1a460b620779%3A0xbe67bce469d4f02a!2sSilver%20Stone%20Residency%2C%20Dwarka!5e0!3m2!1sen!2sin!4v1689379339239!5m2!1sen!2sin"}
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
