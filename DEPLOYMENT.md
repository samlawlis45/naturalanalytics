# Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Step 1: Database Setup
1. Create a PostgreSQL database (Neon.tech recommended)
2. Get your DATABASE_URL connection string

### Step 2: Deploy
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your Vercel app URL)
   - `NEXTAUTH_SECRET` (random 32+ char string)
   - `OPENAI_API_KEY`
   - `SCHEDULER_TOKEN`

### Step 3: Initialize
After deployment:
```bash
# Database will auto-migrate during build
# Create admin user in database:
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### Environment Variables Template
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
OPENAI_API_KEY=sk-your-openai-key
SCHEDULER_TOKEN=generate-with-openssl-rand-base64-32
```

See repository README for detailed deployment instructions.