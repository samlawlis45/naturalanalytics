# 🚀 NaturalAnalytics Setup Guide

## **Step 1: Environment Variables (Required)**

Create a `.env.local` file in your project root with these variables:

```env
# Database (Required)
DATABASE_URL="postgresql://username:password@localhost:5432/naturalanalytics?schema=public"

# OpenAI (Required for natural language queries)
OPENAI_API_KEY="your-openai-api-key-here"

# NextAuth (Required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe (Required for billing)
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
STRIPE_PRO_PRICE_ID="price_1234567890"
STRIPE_ENTERPRISE_PRICE_ID="price_0987654321"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## **Step 2: Get API Keys**

### **OpenAI API Key** (Required)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account and add billing
3. Go to API Keys → Create new key
4. Copy the key (starts with `sk-`)

### **NextAuth Secret** (Required)
Generate a random secret:
```bash
openssl rand -base64 32
```

### **Stripe Setup** (Required for billing)
1. Go to [stripe.com](https://stripe.com) → Create account
2. Go to Products → Create two products:
   - Pro Plan ($99/month)
   - Enterprise Plan ($499/month)
3. Copy the Price IDs from each product
4. Go to Webhooks → Add endpoint:
   - URL: `https://your-domain.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, etc.

### **Google OAuth** (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:3000/api/auth/callback/google`

## **Step 3: Database Setup**

### **Option A: Neon (Recommended - Free)**
1. Go to [neon.tech](https://neon.tech)
2. Create free account
3. Create new project
4. Copy connection string
5. Update `DATABASE_URL` in `.env.local`

### **Option B: Supabase (Free)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database
4. Copy connection string

### **Option C: Local PostgreSQL**
```bash
# Install PostgreSQL
brew install postgresql
brew services start postgresql

# Create database
createdb naturalanalytics
```

## **Step 4: Run Database Migrations**

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

## **Step 5: Test the Application**

```bash
# Start development server
npm run dev
```

Visit: http://localhost:3000

## **Step 6: Deploy to Vercel**

### **Option A: Deploy from GitHub**
1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import GitHub repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### **Option B: Deploy with Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY
# ... add all other variables
```

## **Step 7: Production Database**

After deployment, update your database URL in Vercel environment variables to point to your production database.

## **Step 8: Custom Domain (Optional)**

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your domain

## **🎉 Success!**

Your NaturalAnalytics platform is now live and ready for users!

### **Quick Test Checklist:**
- [ ] Landing page loads
- [ ] Demo page works (natural language queries)
- [ ] Visual builder works
- [ ] Authentication works (sign up/sign in)
- [ ] Pricing page loads
- [ ] Stripe checkout works (test mode)

### **Next Steps:**
- Set up monitoring (Sentry, LogRocket)
- Configure analytics (PostHog, Google Analytics)
- Set up customer support
- Start marketing and user acquisition
