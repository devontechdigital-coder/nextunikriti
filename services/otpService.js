import twilio from 'twilio';
import axios from 'axios';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (Optional based on configuration)
const initFirebase = () => {
  if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (e) {
      console.error('Failed to initialize Firebase Admin', e);
    }
  }
};

class OTPService {
  constructor() {
    this.provider = process.env.OTP_PROVIDER || 'mock'; // twilio | msg91 | firebase | mock
    if (this.provider === 'firebase') initFirebase();
    if (this.provider === 'twilio') {
      this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
  }

  async sendOTP(phone, code) {
    try {
      switch (this.provider) {
        case 'twilio':
          return await this.sendTwilioOTP(phone, code);
        case 'msg91':
          return await this.sendMsg91OTP(phone, code);
        case 'firebase':
          return await this.sendFirebaseOTP(phone, code);
        default:
          return await this.sendMockOTP(phone, code);
      }
    } catch (error) {
      console.error(`[OTP Service Error - ${this.provider}]:`, error.message);
      throw new Error(`Failed to send OTP via ${this.provider}`);
    }
  }

  async sendTwilioOTP(phone, code) {
    if (!this.twilioClient) throw new Error('Twilio client not initialized');
    const message = await this.twilioClient.messages.create({
      body: `Your LMS login code is: ${code}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    return { success: true, providerId: message.sid };
  }

  async sendMsg91OTP(phone, code) {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    if (!authKey || !templateId) throw new Error('MSG91 credentials missing');

    const response = await axios.post('https://control.msg91.com/api/v5/otp', {
      template_id: templateId,
      mobile: phone.replace('+', ''), // MSG91 usually expects number without +
      authkey: authKey,
      otp: code
    });
    return { success: true, providerId: response.data.request_id };
  }

  async sendFirebaseOTP(phone, code) {
    // Note: Firebase Identity Platform / Auth typically handles SMS sending directly 
    // client-side via reCAPTCHA, so server-side SMS is restricted depending on the billing tier.
    // If using Firebase Admin custom messaging or a separate extension:
    console.warn('Firebase server-side OTP sending requires specific extensions or custom tokens. Ensure this matches your Firebase architecture.');
    // Simulated or custom implementation here:
    return { success: true, providerId: 'firebase-mock-id' };
  }

  async sendMockOTP(phone, code) {
    // Used for local development to avoid SMS costs
    console.log(`\n\n[MOCK OTP] Sent code ${code} to ${phone}\n\n`);
    return { success: true, providerId: 'mock-id' };
  }
}

export const otpService = new OTPService();
