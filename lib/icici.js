import crypto from 'crypto';

const HASH_FIELD_ORDER = [
  'addlParam1',
  'addlParam2',
  'aggregatorID',
  'amount',
  'currencyCode',
  'customerEmailID',
  'customerMobileNo',
  'customerName',
  'merchantId',
  'merchantTxnNo',
  'payType',
  'returnURL',
  'transactionType',
  'txnDate',
];

const HASH_MODE_PROFILES = {
  sha256: { algorithm: 'sha256', keyPlacement: 'none', fieldOrder: 'fixed' },
  sha256_append_key: { algorithm: 'sha256', keyPlacement: 'suffix', fieldOrder: 'fixed' },
  sha256_key_prefix: { algorithm: 'sha256', keyPlacement: 'prefix', fieldOrder: 'fixed' },
  hmac_sha256: { algorithm: 'hmac_sha256', keyPlacement: 'none', fieldOrder: 'fixed' },
  sha256_sorted: { algorithm: 'sha256', keyPlacement: 'none', fieldOrder: 'sorted' },
  sha256_sorted_append_key: { algorithm: 'sha256', keyPlacement: 'suffix', fieldOrder: 'sorted' },
  sha256_sorted_key_prefix: { algorithm: 'sha256', keyPlacement: 'prefix', fieldOrder: 'sorted' },
  hmac_sha256_sorted: { algorithm: 'hmac_sha256', keyPlacement: 'none', fieldOrder: 'sorted' },
};

const toPlainString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const sanitizeMobile = (value) => {
  const digits = toPlainString(value).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return digits;
  if (digits.length > 10) return digits.slice(-10);
  return digits;
};

const formatTxnDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: process.env.ICICI_TXN_TIMEZONE || 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  return `${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}${parts.second}`;
};

export const generateIciciMerchantTxnNo = (prefix = 'ORD') => {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${Date.now()}${randomPart}`.slice(0, 24);
};

const getHashFieldOrder = (payload, fieldOrder = 'fixed') => {
  if (fieldOrder === 'sorted') {
    return Object.keys(payload)
      .filter((field) => field !== 'secureHash')
      .sort((a, b) => a.localeCompare(b));
  }

  return HASH_FIELD_ORDER;
};

export const buildIciciHashText = (payload, fieldOrder = 'fixed') =>
  getHashFieldOrder(payload, fieldOrder).map((field) => toPlainString(payload[field])).join('');

export const buildIciciSecureHash = (payload, secureKey, mode = process.env.ICICI_HASH_MODE || 'sha256_append_key') => {
  const profile = HASH_MODE_PROFILES[mode] || HASH_MODE_PROFILES.sha256_append_key;
  const hashText = buildIciciHashText(payload, profile.fieldOrder);

  switch (profile.algorithm) {
    case 'hmac_sha256':
      return crypto.createHmac('sha256', secureKey).update(hashText).digest('hex');
    case 'sha256':
    default: {
      const source =
        profile.keyPlacement === 'prefix'
          ? `${secureKey}${hashText}`
          : profile.keyPlacement === 'suffix'
            ? `${hashText}${secureKey}`
            : hashText;

      return crypto.createHash('sha256').update(source).digest('hex');
    }
  }
};

export const buildIciciInitiateSalePayload = ({
  merchantTxnNo,
  amount,
  customerName,
  customerEmailID,
  customerMobileNo,
  addlParam1 = '',
  addlParam2 = '',
  returnURL,
  hashMode = process.env.ICICI_HASH_MODE || 'sha256_append_key',
}) => {
  const basePayload = {
    merchantId: process.env.ICICI_MERCHANT_ID,
    aggregatorID: process.env.ICICI_AGGREGATOR_ID,
    merchantTxnNo,
    amount: Number(amount).toFixed(2),
    currencyCode: process.env.ICICI_CURRENCY_CODE || '356',
    payType: process.env.ICICI_PAY_TYPE || '0',
    customerEmailID: toPlainString(customerEmailID),
    transactionType: process.env.ICICI_TRANSACTION_TYPE || 'SALE',
    returnURL:
      returnURL ||
      process.env.ICICI_RETURN_URL ||
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/payments/icici/return`,
    txnDate: formatTxnDate(),
    customerMobileNo: sanitizeMobile(customerMobileNo),
    customerName: toPlainString(customerName || 'Student'),
    addlParam1: toPlainString(addlParam1),
    addlParam2: toPlainString(addlParam2),
  };

  const secureKey = process.env.ICICI_SECURE_KEY;
  if (!secureKey) {
    throw new Error('Missing ICICI_SECURE_KEY');
  }

  return {
    ...basePayload,
    secureHash: buildIciciSecureHash(basePayload, secureKey, hashMode),
  };
};

export const initiateIciciSale = async (payload) => {
  const endpoint =
    process.env.ICICI_INITIATE_SALE_URL ||
    'https://pgpayuat.icicibank.com/tsp/pg/api/v2/initiateSale';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const rawText = await response.text();
  let data;

  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (error) {
    data = { raw: rawText };
  }

  if (data && typeof data === 'object' && rawText) {
    data._rawText = rawText;
  }

  if (!response.ok) {
    const errorMessage = data?.responseMessage || data?.message || `ICICI initiateSale failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
};

export const getIciciResponseMessage = (response) =>
  response?.responseDescription || response?.responseMessage || response?.message || response?.errorMessage || null;

export const isIciciHashMismatchResponse = (response) => {
  const message = getIciciResponseMessage(response);
  return Boolean(
    response?.responseCode === 'P1006' ||
      (message && /secure\s*hash\s*does\s*not\s*match/i.test(message))
  );
};

const getIciciHashRetryModes = () => {
  const configuredMode = process.env.ICICI_HASH_MODE || 'sha256_append_key';
  const extraModes = toPlainString(process.env.ICICI_HASH_FALLBACK_MODES)
    .split(',')
    .map((mode) => mode.trim())
    .filter(Boolean);

  return Array.from(
    new Set([
      configuredMode,
      'sha256_key_prefix',
      'sha256_sorted_key_prefix',
      'sha256_sorted_append_key',
      'hmac_sha256',
      'hmac_sha256_sorted',
      ...extraModes,
    ])
  );
};

export const initiateIciciSaleWithFallback = async (payloadInput) => {
  let lastResponse = null;
  let lastPayload = null;
  let lastHashMode = null;

  for (const hashMode of getIciciHashRetryModes()) {
    const payload = buildIciciInitiateSalePayload({
      ...payloadInput,
      hashMode,
    });

    const response = await initiateIciciSale(payload);
    lastResponse = response;
    lastPayload = payload;
    lastHashMode = hashMode;

    if (!isIciciHashMismatchResponse(response)) {
      return {
        response,
        payload,
        hashMode,
      };
    }
  }

  return {
    response: lastResponse,
    payload: lastPayload,
    hashMode: lastHashMode,
  };
};

const findFirstStringByKeys = (value, keysToMatch) => {
  if (!value || typeof value !== 'object') return null;

  const queue = [value];
  const normalizedKeys = keysToMatch.map((key) => key.toLowerCase());
  const visited = new Set();

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);

    for (const [key, nestedValue] of Object.entries(current)) {
      const normalizedKey = key.toLowerCase();

      if (typeof nestedValue === 'string' && normalizedKeys.includes(normalizedKey) && nestedValue.trim()) {
        return nestedValue.trim();
      }

      if (nestedValue && typeof nestedValue === 'object') {
        queue.push(nestedValue);
      }
    }
  }

  return null;
};

const findFirstStringMatching = (value, matcher) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed && matcher(trimmed) ? trimmed : null;
  }

  if (!value || typeof value !== 'object') return null;

  const queue = [value];
  const visited = new Set();

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      for (const item of current) {
        if (typeof item === 'string') {
          const trimmed = item.trim();
          if (trimmed && matcher(trimmed)) {
            return trimmed;
          }
        } else if (item && typeof item === 'object') {
          queue.push(item);
        }
      }
      continue;
    }

    for (const nestedValue of Object.values(current)) {
      if (typeof nestedValue === 'string') {
        const trimmed = nestedValue.trim();
        if (trimmed && matcher(trimmed)) {
          return trimmed;
        }
      } else if (nestedValue && typeof nestedValue === 'object') {
        queue.push(nestedValue);
      }
    }
  }

  return null;
};

const extractPattern = (source, pattern) => {
  if (!source || typeof source !== 'string') return null;
  const match = source.match(pattern);
  return match?.[1] ? match[1].trim() : null;
};

export const buildIciciRedirectUrl = (iciciResponse) => {
  if (!iciciResponse || (typeof iciciResponse !== 'object' && typeof iciciResponse !== 'string')) {
    return null;
  }

  const directUrl =
    findFirstStringByKeys(iciciResponse, [
      'redirectUrl',
      'redirectURL',
      'paymentUrl',
      'paymentURL',
      'paymentLink',
      'paymentPageUrl',
      'paymentPageURL',
      'gatewayUrl',
      'gatewayURL',
      'link',
      'url',
    ]) ||
    findFirstStringMatching(
      iciciResponse,
      (value) => /^https?:\/\//i.test(value) && !/\/api\/payments\/icici\/return\b/i.test(value)
    ) ||
    null;

  if (directUrl && /^https?:\/\//i.test(directUrl)) {
    return directUrl;
  }

  const redirectUri =
    findFirstStringByKeys(iciciResponse, ['redirectURI', 'redirectUri', 'redirect_url', 'redirect']) || null;

  const tranCtx =
    findFirstStringByKeys(iciciResponse, ['tranCtx', 'tranctxt', 'transactionContext', 'txnCtx', 'context']) || null;

  const rawText =
    (typeof iciciResponse === 'object' && (iciciResponse._rawText || iciciResponse.raw)) ||
    (typeof iciciResponse === 'string' ? iciciResponse : '');

  const rawRedirectUri =
    extractPattern(rawText, /"redirectURI"\s*:\s*"([^"]+)"/i) ||
    extractPattern(rawText, /"redirectUrl"\s*:\s*"([^"]+)"/i) ||
    extractPattern(rawText, /"paymentUrl"\s*:\s*"([^"]+)"/i) ||
    extractPattern(rawText, /action\s*=\s*["']([^"']+)["']/i) ||
    null;

  const rawTranCtx =
    extractPattern(rawText, /"tranCtx"\s*:\s*"([^"]+)"/i) ||
    extractPattern(rawText, /name\s*=\s*["']tranCtx["'][^>]*value\s*=\s*["']([^"']+)["']/i) ||
    null;

  const finalRedirectUri = redirectUri || rawRedirectUri;
  const finalTranCtx = tranCtx || rawTranCtx;

  if (!finalRedirectUri) {
    return null;
  }

  if (!finalTranCtx) {
    return finalRedirectUri;
  }

  const separator = finalRedirectUri.includes('?') ? '&' : '?';
  return `${finalRedirectUri}${separator}tranCtx=${encodeURIComponent(finalTranCtx)}`;
};
