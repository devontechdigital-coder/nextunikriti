import crypto from 'crypto';

/* ------------------ CONFIG ------------------ */

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

const HASH_MODE = process.env.ICICI_HASH_MODE || 'sha256_append_key';

/* ------------------ HELPERS ------------------ */

const toPlainString = (v) => (v == null ? '' : String(v));

const sanitizeMobile = (value) => {
  const digits = toPlainString(value).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const formatTxnDate = () => {
  const d = new Date();
  return d.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
};

/* ------------------ TXN ID ------------------ */

export const generateIciciMerchantTxnNo = (prefix = 'ORD') => {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
};

/* ------------------ HASH ------------------ */

const buildHashString = (payload) =>
  HASH_FIELD_ORDER.map((f) => toPlainString(payload[f])).join('');

const buildSecureHash = (payload, key) => {
  const text = buildHashString(payload);

  if (HASH_MODE === 'sha256_key_prefix') {
    return crypto.createHash('sha256').update(key + text).digest('hex');
  }

  if (HASH_MODE === 'hmac_sha256') {
    return crypto.createHmac('sha256', key).update(text).digest('hex');
  }

  // default: append key
  return crypto.createHash('sha256').update(text + key).digest('hex');
};

/* ------------------ PAYLOAD ------------------ */

export const buildPayload = ({
  merchantTxnNo,
  amount,
  customerName,
  customerEmailID,
  customerMobileNo,
  returnURL,
}) => {
  const payload = {
    merchantId: process.env.ICICI_MERCHANT_ID,
    aggregatorID: process.env.ICICI_AGGREGATOR_ID,
    merchantTxnNo,
    amount: Number(amount).toFixed(2),
    currencyCode: '356',
    payType: '0',
    customerEmailID: toPlainString(customerEmailID),
    transactionType: 'SALE',
    returnURL:
      returnURL ||
      process.env.ICICI_RETURN_URL ||
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/icici/return`,
    txnDate: formatTxnDate(),
    customerMobileNo: sanitizeMobile(customerMobileNo),
    customerName: toPlainString(customerName || 'User'),
    addlParam1: '',
    addlParam2: '',
  };

  const key = process.env.ICICI_SECURE_KEY;
  if (!key) throw new Error('Missing ICICI_SECURE_KEY');

  return {
    ...payload,
    secureHash: buildSecureHash(payload, key),
  };
};

/* ------------------ API CALL ------------------ */

export const initiateIciciSale = async (payload) => {
  const res = await fetch(
    process.env.ICICI_INITIATE_SALE_URL ||
      'https://pgpayuat.icicibank.com/tsp/pg/api/v2/initiateSale',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    }
  );

  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(data?.responseMessage || 'ICICI error');
  }

  return data;
};

/* ------------------ RESPONSE HELPERS ------------------ */

const getMessage = (res) =>
  res?.responseDescription ||
  res?.responseMessage ||
  res?.message ||
  '';

const isHashError = (res) =>
  res?.responseCode === 'P1006' ||
  /secure\s*hash/i.test(getMessage(res));

const isDuplicateError = (res) =>
  /merchant reference number should be unique/i.test(getMessage(res));

/* ------------------ MAIN FUNCTION ------------------ */

export const initiatePayment = async (input) => {
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const merchantTxnNo = generateIciciMerchantTxnNo();

      const payload = buildPayload({
        ...input,
        merchantTxnNo,
      });

      console.log('TXN:', merchantTxnNo);

      const res = await initiateIciciSale(payload);

      // SUCCESS CASE
      if (!isHashError(res) && !isDuplicateError(res)) {
        return {
          success: true,
          data: res,
          merchantTxnNo,
        };
      }

      // retry on known issues
      if (isHashError(res) || isDuplicateError(res)) {
        continue;
      }

      return {
        success: false,
        error: getMessage(res),
      };
    } catch (err) {
      lastError = err;
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Payment failed',
  };
};