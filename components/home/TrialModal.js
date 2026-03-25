'use client';

import React from 'react';

const TrialModal = () => {
  return (
    <div
      className="modal fade"
      id="trialModal"
      tabIndex={-1}
      aria-labelledby="trialModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header u-modal-header">
            <h5 className="modal-title" id="trialModalLabel">
              Book Your Free Trial
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
          </div>
          <div className="modal-body p-4">
            <div className="u-modal-img mb-3">
              <img
                src="https://ontechtesting.in/unikriti/image/guitar3.webp"
                alt="Trial Session"
                className="img-fluid rounded"
              />
            </div>
            <p className="text-muted small mb-4">
              Experience the Unikriti way. Fill in your details and our team will
              get in touch to schedule your session.
            </p>
            <form id="trialForm">
              <div className="mb-3">
                <label htmlFor="nameInput" className="form-label">
                  Full Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="nameInput"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="phoneInput" className="form-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id="phoneInput"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="emailInput" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="emailInput"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <div className="d-flex justify-content-center">
                <button type="submit" className="btn u-btn-dark w-100">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialModal;
