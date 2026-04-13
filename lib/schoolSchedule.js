export const SCHOOL_DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function createEmptySchoolSlot() {
  return {
    startTime: '',
    endTime: '',
  };
}

export function createDefaultSchoolSchedule() {
  return SCHOOL_DAYS_OF_WEEK.map((dayOfWeek) => ({
    dayOfWeek,
    isOpen: false,
    slots: [createEmptySchoolSlot()],
  }));
}

function normalizeSlots(slots = []) {
  const normalized = (Array.isArray(slots) ? slots : [])
    .filter(Boolean)
    .map((slot) => ({
      startTime: slot.startTime || '',
      endTime: slot.endTime || '',
    }));

  return normalized.length ? normalized : [createEmptySchoolSlot()];
}

export function normalizeSchoolSchedule(schedule = []) {
  const byDay = new Map(
    (Array.isArray(schedule) ? schedule : [])
      .filter(Boolean)
      .map((entry) => {
        const slots = Array.isArray(entry.slots) && entry.slots.length
          ? entry.slots
          : ((entry.startTime || entry.endTime) ? [{ startTime: entry.startTime || '', endTime: entry.endTime || '' }] : []);

        return [
          entry.dayOfWeek,
          {
            dayOfWeek: entry.dayOfWeek,
            isOpen: Boolean(entry.isOpen),
            slots: normalizeSlots(slots),
          },
        ];
      })
  );

  return SCHOOL_DAYS_OF_WEEK.map((dayOfWeek) => {
    const entry = byDay.get(dayOfWeek);
    if (!entry) {
      return {
        dayOfWeek,
        isOpen: false,
        slots: [createEmptySchoolSlot()],
      };
    }

    return {
      dayOfWeek,
      isOpen: entry.isOpen,
      slots: entry.isOpen ? normalizeSlots(entry.slots) : [createEmptySchoolSlot()],
    };
  });
}

export function validateSchoolSchedule(schedule = []) {
  for (const entry of normalizeSchoolSchedule(schedule)) {
    if (!entry.isOpen) continue;

    for (let index = 0; index < entry.slots.length; index += 1) {
      const slot = entry.slots[index];
      if (!slot.startTime || !slot.endTime) {
        return `Please add start and end time for ${entry.dayOfWeek} slot ${index + 1}.`;
      }
      if (slot.startTime >= slot.endTime) {
        return `${entry.dayOfWeek} slot ${index + 1}: start time must be before end time.`;
      }
    }

    const sortedSlots = [...entry.slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let index = 1; index < sortedSlots.length; index += 1) {
      if (sortedSlots[index].startTime < sortedSlots[index - 1].endTime) {
        return `${entry.dayOfWeek}: time slots cannot overlap.`;
      }
    }
  }

  return null;
}
