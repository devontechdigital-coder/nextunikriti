import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';

export const DEFAULT_PHONE_COUNTRY = 'IN';

export const PHONE_COUNTRY_OPTIONS = getCountries()
  .map((countryCode) => {
    const callingCode = getCountryCallingCode(countryCode);

    return {
      code: countryCode,
      name: countryCode,
      callingCode,
      label: `${countryCode} (+${callingCode})`,
    };
  })
  .sort((a, b) => {
    if (a.code === DEFAULT_PHONE_COUNTRY) return -1;
    if (b.code === DEFAULT_PHONE_COUNTRY) return 1;
    return a.code.localeCompare(b.code);
  });

export function formatPhoneInput(value, countryCode = DEFAULT_PHONE_COUNTRY) {
  const formatter = new AsYouType(countryCode);
  return formatter.input(String(value || ''));
}

export function normalizePhoneNumber(value, countryCode = DEFAULT_PHONE_COUNTRY) {
  const parsedPhone = parsePhoneNumberFromString(String(value || '').trim(), countryCode);

  if (!parsedPhone || !parsedPhone.isValid()) {
    return null;
  }

  return parsedPhone.number;
}

export function isValidPhoneNumberForCountry(value, countryCode = DEFAULT_PHONE_COUNTRY) {
  return Boolean(normalizePhoneNumber(value, countryCode));
}

export function formatPhoneDisplay(value) {
  const parsedPhone = parsePhoneNumberFromString(String(value || '').trim());
  return parsedPhone ? parsedPhone.formatInternational() : value;
}
