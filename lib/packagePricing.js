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

const normalizePricingOption = (option, index) => {
  const label = String(option?.label || '').trim();
  const paymentType = String(option?.paymentType || '').trim().toLowerCase();
  const basePrice = toOptionalNumber(option?.basePrice);
  const durationDays = toOptionalNumber(option?.durationDays);

  if (!label || !['quarterly', 'annual'].includes(paymentType) || basePrice === undefined || durationDays === undefined) {
    return null;
  }

  return {
    ...(option?._id ? { _id: option._id } : {}),
    key: slugify(option?.key || label || `option_${index + 1}`),
    label,
    paymentType,
    basePrice,
    discountAmount: toNumber(option?.discountAmount, 0),
    adminFee: toNumber(option?.adminFee, 0),
    durationDays: Math.max(1, toNumber(option?.durationDays, 1)),
    adminFeePolicy: option?.adminFeePolicy === 'every_annual' ? 'every_annual' : 'first_quarter_of_year',
    isActive: option?.isActive === undefined ? true : Boolean(option?.isActive),
  };
};

const buildLegacyPricingOptions = (raw = {}) => {
  const options = [];

  const basePrice = toOptionalNumber(raw.price);
  const days = toOptionalNumber(raw.days);
  if (basePrice !== undefined && days !== undefined && days > 0) {
    options.push({
      key: 'standard',
      label: raw.name ? `${String(raw.name).trim()} Plan` : 'Standard Plan',
      paymentType: days >= 365 ? 'annual' : 'quarterly',
      basePrice,
      discountAmount: 0,
      adminFee: 0,
      durationDays: Math.max(1, toNumber(days, 1)),
      adminFeePolicy: days >= 365 ? 'every_annual' : 'first_quarter_of_year',
      isActive: true,
    });
  }

  const quarterlyPrice = toOptionalNumber(raw.quarterlyPrice);
  if (quarterlyPrice !== undefined) {
    options.push({
      key: 'quarterly',
      label: 'Quarterly Plan',
      paymentType: 'quarterly',
      basePrice: quarterlyPrice,
      discountAmount: 0,
      adminFee: 0,
      durationDays: 90,
      adminFeePolicy: 'first_quarter_of_year',
      isActive: true,
    });
  }

  const annualPrice = toOptionalNumber(raw.annualPrice);
  if (annualPrice !== undefined) {
    options.push({
      key: 'annual',
      label: 'Annual Plan',
      paymentType: 'annual',
      basePrice: annualPrice,
      discountAmount: 0,
      adminFee: 0,
      durationDays: 365,
      adminFeePolicy: 'every_annual',
      isActive: true,
    });
  }

  return options;
};

export const normalizePackagePricingInput = (raw = {}, options = {}) => {
  const { partial = false } = options;
  const normalized = {
    ...raw,
  };

  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'mode')) {
    normalized.mode = String(raw.mode || 'Online').trim() || 'Online';
  }

  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'name')) {
    normalized.name = String(raw.name || '').trim();
  }

  if (!partial || Object.prototype.hasOwnProperty.call(raw, 'description')) {
    normalized.description = String(raw.description || '').trim();
  }

  if (Array.isArray(raw.features)) {
    normalized.features = raw.features
      .map((feature) => String(feature || '').trim())
      .filter(Boolean);
  }

  if (Array.isArray(raw.pricingOptions)) {
    normalized.pricingOptions = raw.pricingOptions
      .map((option, index) => normalizePricingOption(option, index))
      .filter(Boolean);
  } else if (!partial) {
    normalized.pricingOptions = buildLegacyPricingOptions(raw);
  } else {
    const hasLegacyPricingFields = ['price', 'days', 'annualPrice', 'quarterlyPrice'].some((key) =>
      Object.prototype.hasOwnProperty.call(raw, key)
    );
    if (hasLegacyPricingFields) {
      normalized.pricingOptions = buildLegacyPricingOptions({ ...raw, name: raw.name ?? normalized.name });
    }
  }

  delete normalized.price;
  delete normalized.days;
  delete normalized.annualPrice;
  delete normalized.quarterlyPrice;

  return normalized;
};

export const buildPackagePricingOptions = (pkg = {}) => {
  const sourceOptions = Array.isArray(pkg.pricingOptions) && pkg.pricingOptions.length > 0
    ? pkg.pricingOptions
    : buildLegacyPricingOptions(pkg);

  return sourceOptions
    .map((option, index) => {
      const normalized = normalizePricingOption(option, index);
      if (!normalized) return null;

      const finalPrice = Math.max(0, normalized.basePrice - normalized.discountAmount + normalized.adminFee);
      return {
        ...normalized,
        _id: option?._id || normalized?._id,
        price: finalPrice,
      };
    })
    .filter(Boolean);
};

export const resolvePackagePriceOption = (pkg = {}, selectedKey) => {
  const activeOptions = buildPackagePricingOptions(pkg).filter((option) => option.isActive);
  const options = activeOptions.length ? activeOptions : buildPackagePricingOptions(pkg);

  if (!options.length) {
    return {
      key: 'standard',
      label: 'Standard Plan',
      paymentType: 'quarterly',
      basePrice: 0,
      discountAmount: 0,
      adminFee: 0,
      durationDays: 90,
      adminFeePolicy: 'first_quarter_of_year',
      isActive: true,
      price: 0,
    };
  }

  const matched = selectedKey ? options.find((option) => option.key === selectedKey) : null;
  if (matched) return matched;

  return [...options].sort((a, b) => a.price - b.price)[0];
};

export const getPackageDisplayPrice = (pkg = {}) => resolvePackagePriceOption(pkg).price;

export const getPackageDisplayDurationDays = (pkg = {}) => resolvePackagePriceOption(pkg).durationDays;

export const getPackageOriginalPrice = (pkg = {}, selectedKey) => {
  const option = resolvePackagePriceOption(pkg, selectedKey);
  return Math.max(0, Number(option?.price || 0) + Number(option?.discountAmount || 0));
};

export const resolvePackagePriceOptionById = (pkg = {}, pricingOptionId) => {
  const options = buildPackagePricingOptions(pkg);
  if (!pricingOptionId) return resolvePackagePriceOption(pkg);

  const normalizedId = String(pricingOptionId);
  const matched = options.find((option) => option?._id && String(option._id) === normalizedId);
  return matched || resolvePackagePriceOption(pkg);
};
