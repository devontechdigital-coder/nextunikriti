'use client';

import { Button, Form } from 'react-bootstrap';
import { createEmptySchoolSlot, normalizeSchoolSchedule } from '@/lib/schoolSchedule';

export default function WeeklyScheduleEditor({ value = [], onChange }) {
  const schedule = normalizeSchoolSchedule(value);

  const updateEntry = (dayOfWeek, nextEntry) => {
    const nextSchedule = schedule.map((entry) => (
      entry.dayOfWeek === dayOfWeek
        ? nextEntry
        : entry
    ));

    onChange(normalizeSchoolSchedule(nextSchedule));
  };

  const updateSlot = (dayOfWeek, slotIndex, field, fieldValue) => {
    const entry = schedule.find((item) => item.dayOfWeek === dayOfWeek);
    if (!entry) return;

    const nextSlots = entry.slots.map((slot, index) => (
      index === slotIndex ? { ...slot, [field]: fieldValue } : slot
    ));

    updateEntry(dayOfWeek, { ...entry, slots: nextSlots });
  };

  const addSlot = (dayOfWeek) => {
    const entry = schedule.find((item) => item.dayOfWeek === dayOfWeek);
    if (!entry) return;
    updateEntry(dayOfWeek, { ...entry, slots: [...entry.slots, createEmptySchoolSlot()] });
  };

  const removeSlot = (dayOfWeek, slotIndex) => {
    const entry = schedule.find((item) => item.dayOfWeek === dayOfWeek);
    if (!entry) return;
    const nextSlots = entry.slots.filter((_, index) => index !== slotIndex);
    updateEntry(dayOfWeek, {
      ...entry,
      slots: nextSlots.length ? nextSlots : [createEmptySchoolSlot()],
    });
  };

  return (
    <div className="d-flex flex-column gap-3">
      {schedule.map((entry) => (
        <div key={entry.dayOfWeek} className="border rounded-3 p-3 bg-white">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <div className="fw-bold">{entry.dayOfWeek}</div>
            <div className="d-flex align-items-center gap-3">
              <Form.Check
                type="switch"
                id={`school-day-${entry.dayOfWeek}`}
                label={entry.isOpen ? 'Open' : 'Closed'}
                checked={entry.isOpen}
                onChange={(e) => updateEntry(entry.dayOfWeek, {
                  ...entry,
                  isOpen: e.target.checked,
                  slots: e.target.checked ? entry.slots : [createEmptySchoolSlot()],
                })}
              />
              <Button
                type="button"
                size="sm"
                variant="outline-dark"
                disabled={!entry.isOpen}
                onClick={() => addSlot(entry.dayOfWeek)}
              >
                Add Slot
              </Button>
            </div>
          </div>

          <div className="d-flex flex-column gap-2">
            {entry.slots.map((slot, slotIndex) => (
              <div key={`${entry.dayOfWeek}-${slotIndex}`} className="row align-items-center g-2">
                <div className="col-md-5">
                  <Form.Control
                    type="time"
                    value={slot.startTime}
                    disabled={!entry.isOpen}
                    onChange={(e) => updateSlot(entry.dayOfWeek, slotIndex, 'startTime', e.target.value)}
                  />
                </div>
                <div className="col-md-5">
                  <Form.Control
                    type="time"
                    value={slot.endTime}
                    disabled={!entry.isOpen}
                    onChange={(e) => updateSlot(entry.dayOfWeek, slotIndex, 'endTime', e.target.value)}
                  />
                </div>
                <div className="col-md-2 d-grid">
                  <Button
                    type="button"
                    variant="outline-danger"
                    disabled={!entry.isOpen || entry.slots.length === 1}
                    onClick={() => removeSlot(entry.dayOfWeek, slotIndex)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
