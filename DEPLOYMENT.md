# 🚀 NaturalAnalytics Deployment Guide

This guide will help you deploy NaturalAnalytics to production using Vercel.

## 📋 Prerequisites

Before deploying, make sure you have:

- [ ] A GitHub account
- [ ] A Vercel account (free tier available)
- [ ] A PostgreSQL database (Neon, Supabase, or Railway recommended)
- [ ] An OpenAI API key
- [ ] A Stripe account (for billing)
- [ ] A Google OAuth app (optional, for authentication)

## 🗄️ Database Setup

### Option 1: Neon (Recommended)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (it will look like: `postgresql://username:password@host/database?sslmode=require`)
4. Save this as your `DATABASE_URL`

### Option 2: Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings > Database
3. Copy the connection string
4. Save this as your `DATABASE_URL`

### Option 3: Railway

1. Go to [railway.app](https://railway.app) and create a new project
2. Add a PostgreSQL service
3. Copy the connection string from the service details
4. Save this as your `DATABASE_URL`

## 🔑 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# NextAuth
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-random-secret-key"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe (Required for billing)
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
STRIPE_PRO_PRICE_ID="your-stripe-pro-price-id"
STRIPE_ENTERPRISE_PRICE_ID="your-stripe-enterprise-price-id"

# App Configuration
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
```

### Getting API Keys

#### OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account and add billing information
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

#### NextAuth Secret
Generate a random secret:
```bash
openssl rand -base64 32
```

#### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs
5. Add authorized redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/google`
6. Copy Client ID and Client Secret

#### Stripe Setup
1. Go to [stripe.com](https://stripe.com) and create an account
2. Go to Products and create two products:
   - Pro Plan ($99/month)
   - Enterprise Plan ($499/month)
3. Copy the Price IDs from each product
4. Go to Webhooks and add endpoint:
   - URL: `https://your-domain.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
5. Copy the webhook secret

## 🚀 Vercel Deployment

### Step 1: Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository and click "Import"

### Step 2: Configure Environment Variables

1. In your Vercel project dashboard, go to Settings > Environment Variables
2. Add all the environment variables from your `.env.local` file
3. Make sure to set the correct `NEXTAUTH_URL` for your domain

### Step 3: Deploy

1. Vercel will automatically build and deploy your project
2. The build process will:
   - Install dependencies
   - Run `npm run build`
   - Deploy to Vercel's edge network

### Step 4: Database Migration

After deployment, you need to run database migrations:

1. Go to your Vercel project dashboard
2. Go to Functions tab
3. Create a new serverless function to run migrations:

```typescript
// api/migrate.ts
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    // Add any other setup queries here
    res.status(200).json({ message: 'Migration completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

Or run migrations locally and push to your database:

```bash
npx prisma db push
npx prisma db seed
```

## 🔧 Post-Deployment Setup

### 1. Update Stripe Webhook URL

1. Go to your Stripe dashboard
2. Go to Webhooks
3. Update the webhook URL to your Vercel domain:
   - `https://your-domain.vercel.app/api/stripe/webhook`

### 2. Test the Application

1. Visit your deployed URL
2. Test the sign-up flow
3. Test the demo functionality
4. Test the pricing and checkout flow

### 3. Set up Custom Domain (Optional)

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update environment variables with new domain

## 📊 Monitoring and Analytics

### Vercel Analytics
- Built-in analytics available in Vercel dashboard
- Monitor performance, usage, and errors

### Database Monitoring
- Use your database provider's monitoring tools
- Set up alerts for high usage or errors

### Application Monitoring
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- PostHog for product analytics

## 🔒 Security Checklist

- [ ] All environment variables are set correctly
- [ ] Database is properly secured
- [ ] Stripe webhooks are configured
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] API routes are protected
- [ ] Rate limiting is implemented (consider Upstash)

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
- Check that all dependencies are in `package.json`
- Ensure TypeScript errors are resolved
- Check Vercel build logs for specific errors

#### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database provider status
- Ensure database allows connections from Vercel IPs

#### Authentication Issues
- Verify `NEXTAUTH_URL` matches your domain
- Check OAuth provider configurations
- Ensure redirect URIs are correct

#### Stripe Issues
- Verify webhook URL is correct
- Check webhook events are enabled
- Verify API keys are correct

### Getting Help

- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)
- Check Prisma documentation: [prisma.io/docs](https://prisma.io/docs)

## 🎉 Success!

Once deployed, your NaturalAnalytics platform will be live and ready for users!

### Next Steps

1. **Marketing**: Set up landing pages, SEO, and social media
2. **Analytics**: Implement user tracking and conversion funnels
3. **Support**: Set up customer support channels
4. **Scaling**: Monitor usage and scale as needed

### Domain Ecosystem Setup

Remember your domain strategy:
- `naturalanalytics.ai` - Main platform
- `visualizations.app` - Design-focused spinoff
- `instantdashboards.ai` - Speed-focused spinoff
- `visibility.app` - Monitoring-focused spinoff
- `dashboardengine.ai` - API infrastructure

Each can be deployed as separate Vercel projects pointing to the same backend!
