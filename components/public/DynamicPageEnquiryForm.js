'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { normalizeSchoolSchedule } from '@/lib/schoolSchedule';

const initialForm = {
  name: '',
  age: '',
  gender: '',
  email: '',
  phone: '',
  center: '',
  instrument: '',
  schoolId: '',
  preferredDays: [],
  preferredTimeSlots: [],
  preferredSchedule: [],
};

const buildSchoolSlotValue = (slot = {}) => `${slot.startTime || ''} - ${slot.endTime || ''}`.trim();

const formatScheduleTime = (value) => {
  if (!value || !String(value).includes(':')) return value || '';
  const [hoursString, minutesString] = String(value).split(':');
  const hours = Number(hoursString);
  const minutes = Number(minutesString || 0);
  if (Number.isNaN(hours)) return value;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const twelveHour = hours % 12 || 12;
  return `${twelveHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
};

const buildSchoolSlotLabel = (slot = {}) => `${formatScheduleTime(slot.startTime)} - ${formatScheduleTime(slot.endTime)}`;

const getScheduleTimeSlots = (schedule, dayOfWeek) => (
  schedule.find((entry) => entry.dayOfWeek === dayOfWeek)?.timeSlots || []
);

const buildPreferredSchedulePayload = (schedule) => (
  schedule
    .map((entry) => ({
      dayOfWeek: entry.dayOfWeek,
      timeSlots: Array.isArray(entry.timeSlots) ? entry.timeSlots.filter(Boolean) : [],
    }))
    .filter((entry) => entry.dayOfWeek && entry.timeSlots.length)
);

const flattenScheduleSlots = (schedule) => (
  buildPreferredSchedulePayload(schedule).flatMap((entry) => (
    entry.timeSlots.map((slot) => `${entry.dayOfWeek}: ${slot}`)
  ))
);

export default function DynamicPageEnquiryForm({ pageSlug, pageTitle }) {
  const [formData, setFormData] = useState(initialForm);
  const [schools, setSchools] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [schoolsRes, instrumentsRes] = await Promise.all([
          axios.get('/api/schools'),
          axios.get('/api/admin/instruments?status=active'),
        ]);
        setSchools(schoolsRes.data?.schools || []);
        setInstruments(instrumentsRes.data?.instruments || []);
      } catch {
        setSchools([]);
        setInstruments([]);
      }
    };

    loadOptions();
  }, []);

  const selectedSchool = schools.find((school) => school._id === formData.schoolId) || null;
  const selectedSchoolSchedule = useMemo(() => (
    selectedSchool ? normalizeSchoolSchedule(selectedSchool.weeklySchedule || []) : []
  ), [selectedSchool]);
  const availableSchoolDays = useMemo(() => selectedSchoolSchedule.filter((entry) => (
    entry.isOpen && Array.isArray(entry.slots) && entry.slots.some((slot) => slot.startTime && slot.endTime)
  )), [selectedSchoolSchedule]);
  const slotsBySelectedDay = useMemo(() => {
    const selectedDays = new Set(formData.preferredDays);
    return availableSchoolDays
      .filter((entry) => selectedDays.has(entry.dayOfWeek))
      .map((entry) => ({
        dayOfWeek: entry.dayOfWeek,
        slots: (entry.slots || []).filter((slot) => slot.startTime && slot.endTime),
      }));
  }, [availableSchoolDays, formData.preferredDays]);

  useEffect(() => {
    const availableDayNames = availableSchoolDays.map((entry) => entry.dayOfWeek);
    setFormData((current) => ({
      ...current,
      preferredDays: current.preferredDays.filter((day) => availableDayNames.includes(day)),
      preferredSchedule: current.preferredSchedule.filter((entry) => availableDayNames.includes(entry.dayOfWeek)),
    }));
  }, [availableSchoolDays]);

  useEffect(() => {
    const availableSlotsByDay = new Map(
      availableSchoolDays.map((entry) => [
        entry.dayOfWeek,
        new Set((entry.slots || []).map((slot) => buildSchoolSlotValue(slot)).filter((slotValue) => slotValue && slotValue !== '-')),
      ])
    );
    setFormData((current) => ({
      ...current,
      preferredSchedule: current.preferredSchedule
        .map((entry) => ({
          ...entry,
          timeSlots: getScheduleTimeSlots(current.preferredSchedule, entry.dayOfWeek)
            .filter((slotValue) => availableSlotsByDay.get(entry.dayOfWeek)?.has(slotValue)),
        }))
        .filter((entry) => entry.timeSlots.length || current.preferredDays.includes(entry.dayOfWeek)),
    }));
  }, [availableSchoolDays]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const togglePreferredDay = (dayOfWeek) => {
    setFormData((current) => {
      const isSelected = current.preferredDays.includes(dayOfWeek);
      return {
        ...current,
        preferredDays: isSelected
          ? current.preferredDays.filter((day) => day !== dayOfWeek)
          : [...current.preferredDays, dayOfWeek],
        preferredSchedule: isSelected
          ? current.preferredSchedule.filter((entry) => entry.dayOfWeek !== dayOfWeek)
          : current.preferredSchedule.some((entry) => entry.dayOfWeek === dayOfWeek)
            ? current.preferredSchedule
            : [...current.preferredSchedule, { dayOfWeek, timeSlots: [] }],
      };
    });
  };

  const togglePreferredDayTime = (dayOfWeek, slotValue) => {
    setFormData((current) => {
      const schedule = current.preferredSchedule.some((entry) => entry.dayOfWeek === dayOfWeek)
        ? current.preferredSchedule
        : [...current.preferredSchedule, { dayOfWeek, timeSlots: [] }];

      return {
        ...current,
        preferredSchedule: schedule.map((entry) => {
          if (entry.dayOfWeek !== dayOfWeek) return entry;
          const timeSlots = Array.isArray(entry.timeSlots) ? entry.timeSlots : [];
          return {
            ...entry,
            timeSlots: timeSlots.includes(slotValue)
              ? timeSlots.filter((item) => item !== slotValue)
              : [...timeSlots, slotValue],
          };
        }),
      };
    });
  };

  const handleSchoolChange = (schoolId) => {
    setFormData((current) => ({
      ...current,
      schoolId,
      preferredDays: [],
      preferredTimeSlots: [],
      preferredSchedule: [],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const preferredSchedule = buildPreferredSchedulePayload(formData.preferredSchedule);
      await axios.post('/api/enquiries', {
        ...formData,
        preferredSchedule,
        preferredTimeSlots: flattenScheduleSlots(preferredSchedule),
        schoolName: selectedSchool?.schoolName || '',
        pageSlug,
        pageTitle,
        source: 'dynamic_page',
        enquiryType: 'trial_class',
      });
      setFormData(initialForm);
      setMessage('Thank you. Our team will contact you soon.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="eq-section">
      <div className="eq-card">
        <div className="eq-header bg-dark p-4">
          <span className="eq-eyebrow">
            <span className="eq-eyebrow-line" />
            Enrolment
            <span className="eq-eyebrow-line" />
          </span>
          <h2 className="eq-title text-white">Book a Trial Class</h2>
          <p className="eq-subtitle text-white">
            Fill in the details below and our team will reach out to confirm your slot.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="eq-form">
          <div className="eq-section-block">
            <p className="eq-section-label">Personal Details</p>
            <div className="eq-grid">
              <div className="eq-field">
                <label className="eq-label" htmlFor="eq-name">Full Name</label>
                <input id="eq-name" className="eq-input" placeholder="Your full name" value={formData.name} onChange={(e) => updateField('name', e.target.value)} required />
              </div>
              <div className="eq-field">
                <label className="eq-label" htmlFor="eq-age">Age</label>
                <input id="eq-age" className="eq-input" type="number" placeholder="e.g. 12" value={formData.age} onChange={(e) => updateField('age', e.target.value)} />
              </div>
              <div className="eq-field">
                <label className="eq-label" htmlFor="eq-gender">Gender</label>
                <div className="eq-select-wrap">
                  <select id="eq-gender" className="eq-select" value={formData.gender} onChange={(e) => updateField('gender', e.target.value)}>
                    <option value="">Select gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronIcon />
                </div>
              </div>
              <div className="eq-field">
                <label className="eq-label" htmlFor="eq-email">Email</label>
                <input id="eq-email" className="eq-input" type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => updateField('email', e.target.value)} />
              </div>
              <div className="eq-field">
                <label className="eq-label" htmlFor="eq-phone">Phone No <span className="eq-required">*</span></label>
                <input id="eq-phone" className="eq-input" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} required />
              </div>
              <div className="eq-field">
                <label className="eq-label" htmlFor="eq-center">Center</label>
                <input id="eq-center" className="eq-input" placeholder="Nearest center" value={formData.center} onChange={(e) => updateField('center', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="eq-divider" />

          <div className="eq-section-block">
            <p className="eq-section-label">Class Preferences</p>
            <div className="eq-grid">
              <div className="eq-field">
                <label className="eq-label" htmlFor="eq-instrument">Instrument</label>
                <div className="eq-select-wrap">
                  <select id="eq-instrument" className="eq-select" value={formData.instrument} onChange={(e) => updateField('instrument', e.target.value)}>
                    <option value="">Select instrument</option>
                    {instruments.map((instrument) => (
                      <option key={instrument._id} value={instrument.name}>{instrument.name}</option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
              </div>
              <div className="eq-field">
                <label className="eq-label" htmlFor="eq-school">School</label>
                <div className="eq-select-wrap">
                  <select id="eq-school" className="eq-select" value={formData.schoolId} onChange={(e) => handleSchoolChange(e.target.value)}>
                    <option value="">Select school</option>
                    {schools.map((school) => (
                      <option key={school._id} value={school._id}>
                        {school.schoolName}{school.city ? `, ${school.city}` : ''}{school.state ? `, ${school.state}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
              </div>

              <div className="eq-choice-group eq-full">
                <div className="eq-choice-label">Preferred Days <span className="eq-optional">Optional</span></div>
                {!formData.schoolId ? (
                  <p className="eq-empty-hint">Choose a school first to view available days.</p>
                ) : availableSchoolDays.length ? (
                  <div className="eq-chips">
                    {availableSchoolDays.map((entry) => (
                      <button
                        key={entry.dayOfWeek}
                        type="button"
                        className={`eq-chip${formData.preferredDays.includes(entry.dayOfWeek) ? ' eq-chip-active' : ''}`}
                        onClick={() => togglePreferredDay(entry.dayOfWeek)}
                      >
                        {entry.dayOfWeek}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="eq-empty-hint">This school does not have active timings yet.</p>
                )}
              </div>

              <div className="eq-choice-group eq-full">
                <div className="eq-choice-label">Preferred Time Slots <span className="eq-optional">Optional</span></div>
                {!formData.schoolId ? (
                  <p className="eq-empty-hint">Choose a school first to view time slots.</p>
                ) : formData.preferredDays.length > 0 ? (
                  slotsBySelectedDay.length > 0 ? (
                    <div className="eq-day-slot-list">
                      {slotsBySelectedDay.map((entry) => (
                        <div key={entry.dayOfWeek} className="eq-day-slot-group">
                          <div className="eq-day-slot-title">{entry.dayOfWeek}</div>
                          {entry.slots.length ? (
                            <div className="eq-chips">
                              {entry.slots.map((slot) => {
                                const slotValue = buildSchoolSlotValue(slot);
                                return (
                                  <button
                                    key={`${entry.dayOfWeek}-${slotValue}`}
                                    type="button"
                                    className={`eq-chip${getScheduleTimeSlots(formData.preferredSchedule, entry.dayOfWeek).includes(slotValue) ? ' eq-chip-active' : ''}`}
                                    onClick={() => togglePreferredDayTime(entry.dayOfWeek, slotValue)}
                                  >
                                    {buildSchoolSlotLabel(slot)}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="eq-empty-hint">No time slot available for {entry.dayOfWeek}.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="eq-empty-hint">No time slot available for the selected day.</p>
                  )
                ) : (
                  <p className="eq-empty-hint">Choose a day to view time slots.</p>
                )}
              </div>
            </div>
          </div>

          {message && <div className="eq-alert eq-alert-success"><TickIcon /> {message}</div>}
          {error && <div className="eq-alert eq-alert-error"><WarnIcon /> {error}</div>}

          <div className="eq-footer">
            <button type="submit" className="eq-submit" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="eq-spinner" />
                  Submitting...
                </>
              ) : 'Submit Enquiry'}
            </button>
            <p className="eq-footer-note">We will contact you within 24 hours.</p>
          </div>
        </form>
      </div>
    </section>
  );
}

function ChevronIcon() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1L5 5L9 1" stroke="#999" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TickIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" stroke="#1a6b3a" strokeWidth="1" />
      <path d="M5 8L7 10L11 6" stroke="#1a6b3a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" stroke="#a83232" strokeWidth="1" />
      <path d="M8 5v3.5" stroke="#a83232" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.75" fill="#a83232" />
    </svg>
  );
}
