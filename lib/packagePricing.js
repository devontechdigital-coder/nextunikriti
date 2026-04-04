const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toOptionalNumber = (value) => {
  if (value === null || value === undefined || value === '') return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'option';

export const normalizePackagePricingInput = (raw = {}, options = {}) => {
  const { partial = false } = options;
  const pricingOptions = Array.isArray(raw.pricingOptions)
    ? raw.pricingOptions
        .map((option, index) => {
          const label = String(option?.label || '').trim();
          const price = toOptionalNumber(option?.price);
          if (!label || price === undefined) return null;

          return {
            key: slugify(option?.key || label || `option_${index + 1}`),
            label,
            price,
            days: toNumber(option?.days, 0),
            isDefault: Boolean(option?.isDefault),
          };
        })
        .filter(Boolean)
    : [];

  const normalized = {
    ...raw,
  };

  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'mode')) {
    normalized.mode = String(raw.mode || 'Online').trim() || 'Online';
  }

  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'price')) {
    normalized.price = toNumber(raw.price, 0);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'days')) {
    normalized.days = toNumber(raw.days, 0);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'annualPrice')) {
    normalized.annualPrice = toOptionalNumber(raw.annualPrice) ?? null;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'quarterlyPrice')) {
    normalized.quarterlyPrice = toOptionalNumber(raw.quarterlyPrice) ?? null;
  }

  if (Array.isArray(raw.pricingOptions)) {
    normalized.pricingOptions = pricingOptions;
  }

  return normalized;
};

export const buildPackagePricingOptions = (pkg = {}) => {
  const options = [];

  options.push({
    key: 'standard',
    label: pkg.name ? `${pkg.name} Plan` : 'Standard Plan',
    price: toNumber(pkg.price, 0),
    days: toNumber(pkg.days, 0),
    isDefault: !pkg.pricingOptions?.some((option) => option?.isDefault),
    source: 'standard',
  });

  if (pkg.quarterlyPrice !== null && pkg.quarterlyPrice !== undefined && pkg.quarterlyPrice !== '') {
    options.push({
      key: 'quarterly',
      label: 'Quarterly Plan',
      price: toNumber(pkg.quarterlyPrice, 0),
      days: 90,
      isDefault: false,
      source: 'quarterly',
    });
  }

  if (pkg.annualPrice !== null && pkg.annualPrice !== undefined && pkg.annualPrice !== '') {
    options.push({
      key: 'annual',
      label: 'Annual Plan',
      price: toNumber(pkg.annualPrice, 0),
      days: 365,
      isDefault: false,
      source: 'annual',
    });
  }

  if (Array.isArray(pkg.pricingOptions)) {
    pkg.pricingOptions.forEach((option, index) => {
      if (!option) return;
      options.push({
        key: slugify(option.key || option.label || `option_${index + 1}`),
        label: String(option.label || `Option ${index + 1}`),
        price: toNumber(option.price, 0),
        days: toNumber(option.days, 0),
        isDefault: Boolean(option.isDefault),
        source: 'dynamic',
      });
    });
  }

  const deduped = [];
  const seen = new Set();
  for (const option of options) {
    if (seen.has(option.key)) continue;
    seen.add(option.key);
    deduped.push(option);
  }

  return deduped;
};

export const resolvePackagePriceOption = (pkg = {}, selectedKey) => {
  const options = buildPackagePricingOptions(pkg);
  if (!options.length) {
    return {
      key: 'standard',
      label: 'Standard Plan',
      price: toNumber(pkg.price, 0),
      days: toNumber(pkg.days, 0),
      isDefault: true,
      source: 'standard',
    };
  }

  const matched = selectedKey ? options.find((option) => option.key === selectedKey) : null;
  if (matched) return matched;

  return options.find((option) => option.isDefault) || options[0];
};
