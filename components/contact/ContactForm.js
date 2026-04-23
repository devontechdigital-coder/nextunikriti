'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axios.post('/api/enquiries', {
        ...formData,
        enquiryType: 'general',
        source: 'contact_page',
        pageTitle: 'Contact Us',
        pageSlug: 'contact',
      });
      toast.success('Your message has been sent successfully! We will get back to you soon.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="u-contact-form" onSubmit={handleSubmit}>
      <h3 className="u-sub-title">Get In Touch</h3>
      <div className="mb-3">
        <label htmlFor="name" className="form-label">Full Name</label>
        <input 
          type="text" 
          className="form-control" 
          id="name" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          placeholder="Your Name" 
          required 
        />
      </div>

      <div className="mb-3">
        <label htmlFor="email" className="form-label">Email Address</label>
        <input 
          type="email" 
          className="form-control" 
          id="email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange} 
          placeholder="Your Email" 
          required 
        />
      </div>

      <div className="mb-3">
        <label htmlFor="phone" className="form-label">Phone Number</label>
        <input
          type="tel"
          className="form-control"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Your Phone"
        />
      </div>

      <div className="mb-3">
        <label htmlFor="message" className="form-label">Message</label>
        <textarea 
          className="form-control" 
          id="message" 
          name="message" 
          rows="4" 
          value={formData.message} 
          onChange={handleChange} 
          placeholder="Your Message" 
          required
        ></textarea>
      </div>

      <button 
        type="submit" 
        className="btn u-btn-dark w-100" 
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

export default ContactForm;
