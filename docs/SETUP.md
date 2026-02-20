# ConcertIndustry.com — Complete Setup Guide
### For the Non-Technical Founder

This guide walks you through everything needed to get ConcertIndustry.com live on the internet, step by step.

---

## PART 1: What You're Setting Up

You're building on four services:

| Service | What It Does | Cost |
|---|---|---|
| **Vercel** | Hosts your website | Free tier available |
| **Supabase** | Database + user accounts | Free tier available |
| **OpenAI** | Powers the AI answers | Pay-per-use (~$0.01-0.05/query) |
| **Stripe** | Takes payments | 2.9% + $0.30 per transaction |

---

## PART 2: Prerequisites

Before starting, install these on your Mac:

### 2.1 Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS version** (the one labeled "Recommended for most users")
3. Run the installer

### 2.2 Install Git
1. Open Terminal (press Cmd+Space, type "Terminal")
2. Run: `git --version`
3. If not installed, macOS will prompt you to install it. Say yes.

### 2.3 Verify everything works
Open Terminal and run:
```bash
node --version   # Should show v18 or higher
npm --version    # Should show v9 or higher
git --version    # Should show something like 2.39.0
```

---

## PART 3: Set Up Supabase (Database)

### 3.1 Create a Supabase account
1. Go to https://supabase.com
2. Click "Start your project" → sign up with GitHub or email
3. Create a new project:
   - Project name: `concertindustry`
   - Database password: Create a strong password and **save it somewhere**
   - Region: Choose the one closest to you (e.g., US East)
4. Wait 2–3 minutes for the project to set up

### 3.2 Enable pgvector extension
1. In your Supabase dashboard, click **Database** in the left sidebar
2. Click **Extensions**
3. Search for "vector"
4. Click the toggle to enable **vector** extension

### 3.3 Run the database schema
1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file: `supabase/migrations/001_initial_schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**
7. You should see "Success" — if you see errors, check that the vector extension is enabled

### 3.4 Get your API keys
1. In Supabase dashboard, click **Project Settings** (gear icon at bottom left)
2. Click **API**
3. Copy these values — you'll need them later:
   - **Project URL** (looks like: https://abcdefghij.supabase.co)
   - **anon public** key (a long string starting with "eyJ...")
   - **service_role** key (another long string — keep this private!)

---

## PART 4: Set Up OpenAI

### 4.1 Create an OpenAI account
1. Go to https://platform.openai.com
2. Sign up or log in
3. Click your profile (top right) → **API keys**
4. Click **Create new secret key**
5. Give it a name: "ConcertIndustry"
6. Copy the key (it starts with "sk-") — **save it now, you can't see it again**

### 4.2 Add credits
1. Go to **Billing** in the OpenAI dashboard
2. Add $20–50 in credits to start
3. You can set a spending limit under **Usage limits**

---

## PART 5: Set Up Stripe (Payments)

### 5.1 Create a Stripe account
1. Go to https://stripe.com
2. Create an account and complete verification

### 5.2 Create your products
1. In Stripe dashboard, click **Products** → **Add product**
2. Create **Pro Monthly**:
   - Name: "Pro Monthly"
   - Pricing: $9.00, recurring, monthly
   - Click **Save product**
   - Copy the **Price ID** (starts with "price_")
3. Create **Pro Annual**:
   - Name: "Pro Annual"
   - Pricing: $79.00, recurring, yearly
   - Click **Save product**
   - Copy the **Price ID**

### 5.3 Get API keys
1. In Stripe dashboard → **Developers** → **API keys**
2. Copy your **Publishable key** (starts with "pk_")
3. Copy your **Secret key** (starts with "sk_")
4. For now use **test mode** keys (they start with pk_test_ and sk_test_)
   Switch to live keys when you're ready to take real payments

### 5.4 Set up webhooks (for subscription management)
We'll come back to this after deployment (Step 7).

---

## PART 6: Install and Run Locally

### 6.1 Open the project folder
```bash
cd /Users/henrybordeaux/concertindustry
```

### 6.2 Install dependencies
```bash
npm install
```
This downloads all the code libraries. Takes 1–3 minutes.

### 6.3 Create your environment file
```bash
cp .env.local.example .env.local
```

Now open `.env.local` in a text editor and fill in all your keys:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

OPENAI_API_KEY=sk-your-openai-key

STRIPE_SECRET_KEY=sk_test_your-stripe-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_placeholder_update_after_deploy

STRIPE_PRICE_MONTHLY=price_your-monthly-price-id
STRIPE_PRICE_ANNUAL=price_your-annual-price-id

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6.4 Start the app
```bash
npm run dev
```

Open your browser and go to: http://localhost:3000

You should see the landing page! Try creating an account and asking a question.

---

## PART 7: Ingest Your Knowledge Documents

This step loads your touring documents into the AI's knowledge base.

### 7.1 Prepare your documents
1. Convert any PDFs to text files (use a tool like https://www.ilovepdf.com/pdf_to_word then save as .txt)
2. Place all .txt and .md files in the `docs/` folder in your project

### 7.2 Run the ingestion script
With your app running (`npm run dev` in one terminal), open a **second terminal** and run:
```bash
npm run ingest /path/to/your/documents
```

For example, if your documents are in the "TM Training Data" folder:
```bash
npm run ingest "/Users/henrybordeaux/Downloads/TM Training Data"
```

The script will:
- Process each document one at a time
- Split it into chunks
- Generate AI embeddings (this costs a tiny amount on OpenAI)
- Store everything in your Supabase database

This may take 5–20 minutes depending on how many documents you have.

### 7.3 Verify ingestion worked
1. Go to your Supabase dashboard → **Table Editor**
2. Click on **doc_chunks** table
3. You should see rows with `chunk_text` and `embedding` columns filled in
4. Test it: Go to your app → Knowledge page → Search for "settlement"

---

## PART 8: Deploy to Vercel (Go Live)

### 8.1 Create a Vercel account
1. Go to https://vercel.com
2. Sign up with GitHub (easiest)

### 8.2 Push your code to GitHub
```bash
# First time setup:
git init
git add .
git commit -m "Initial commit — ConcertIndustry.com v1"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/concertindustry.git
git push -u origin main
```

### 8.3 Deploy on Vercel
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Connect your GitHub account and select your repo
4. Click "Deploy" — Vercel auto-detects Next.js

### 8.4 Add environment variables to Vercel
1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable from your `.env.local` file
4. Important: Change `NEXT_PUBLIC_APP_URL` to your actual Vercel URL (e.g., https://concertindustry.vercel.app)
5. Click **Save**
6. Click **Redeploy** to apply the new env variables

### 8.5 Set up Stripe webhooks (now that you have a URL)
1. In Stripe dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. URL: `https://your-vercel-url.vercel.app/api/stripe/webhook`
4. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with "whsec_")
7. Add it to Vercel env vars as `STRIPE_WEBHOOK_SECRET`
8. Redeploy

### 8.6 Set up your custom domain
1. In Vercel project → **Settings** → **Domains**
2. Add `concertindustry.com` (or your domain)
3. Follow Vercel's DNS instructions
4. Update `NEXT_PUBLIC_APP_URL` to `https://www.concertindustry.com`

---

## PART 9: Switch to Stripe Live Mode

When you're ready to take real payments:
1. In `.env.local` and Vercel env vars, replace test keys with live keys:
   - `sk_test_...` → `sk_live_...`
   - `pk_test_...` → `pk_live_...`
2. Create a new webhook endpoint in Stripe **live mode** (same steps as above)
3. Create the products in live mode and update the price IDs
4. Redeploy

---

## TROUBLESHOOTING

### "Cannot connect to database"
- Check that your Supabase URL and keys are correct in `.env.local`
- Make sure the SQL schema ran successfully

### "OpenAI error: Invalid API key"
- Check the key starts with "sk-" and is copied correctly
- Make sure your OpenAI account has billing set up

### "Stripe webhook not working"
- The webhook secret must match what's in your env variables
- Check Stripe dashboard → Webhooks → Recent deliveries for error details

### Users can't sign up
- Check that Supabase Auth is enabled (Supabase dashboard → Authentication → Settings)
- Make sure "Enable email signup" is on

### Re-ingesting documents
- You can run `npm run ingest` again at any time — it will update existing documents

---

## MONTHLY MAINTENANCE

1. **Monitor OpenAI costs**: Check platform.openai.com/usage monthly
2. **Check Supabase storage**: Free tier includes 500MB — conversation logs grow over time
3. **Monitor Stripe**: Check for failed payments that need attention
4. **Review conversation logs**: In Supabase → `conversation_logs` table — look for starred answers to promote to knowledge base

---

## CONTACT & SUPPORT

For technical questions about this codebase, the key files to understand are:
- `src/app/api/ai/chat/route.ts` — AI query handler (the core logic)
- `src/lib/openai.ts` — System prompt builder (tune AI behavior here)
- `src/lib/usage.ts` — Free tier enforcement (metering logic)
- `supabase/migrations/001_initial_schema.sql` — Full database schema
