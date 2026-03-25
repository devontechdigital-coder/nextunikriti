# Deployment Guide for NextLMS

## Prerequisites
- Node.js 18+
- MongoDB cluster (Atlas or local)
- Google Cloud Platform Account (Storage Bucket + Service Account JSON)
- Stripe Account (Secret Key & Webhook Secret)
- Razorpay Account (Key ID & Secret)
- Twilio / MSG91 (for OTP services)

## Environment Variables
Create a `.env.local` file with the following variables:
```env
MONGODB_URI=mongodb+srv://<user>:<pwd>@cluster...
JWT_SECRET=supersecretjwtkeyforlmsplatform
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

GCP_PROJECT_ID=your-project-id
GCP_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GCP_BUCKET_NAME=lms-secure-videos

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_SECRET=...
```

## Local Development
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`

## Production Deployment (Vercel)
The easiest way to deploy a Next.js App Router application is visually via Vercel.
1. Push this repository to GitHub/GitLab/Bitbucket.
2. Go to [Vercel](https://vercel.com/) and create a new Project from your repository.
3. Import the `Environment Variables` defined above into the Vercel dashboard.
4. Click **Deploy**. Vercel will automatically configure the build settings (`npm run build`).

## Production Deployment (Docker / VPS)
If you prefer deploying on a VPS (e.g. AWS EC2, DigitalOcean):
1. Build the project: `npm run build`
2. Start the production server: `npm run start`
**(Optional) PM2 Setup:**
`pm2 start npm --name "nextlms" -- start`

## Additional Configuration
- Remember to configure CORS on your Google Cloud Storage bucket to allow uploads and streaming from your `NEXT_PUBLIC_BASE_URL`.
- Ensure webhooks are configured correctly in Stripe/Razorpay dashboard pointing to `https://yourdomain.com/api/payments/verify`.
