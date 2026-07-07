# VideoFlow Quick Start

Get VideoFlow running in 5 minutes.

## Local Setup (2 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Create `.env`

Copy from example:
```bash
cp .env.example .env
```

Add your keys to `.env`:
```env
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
APP_BASE_URL=http://localhost:3000
CRON_SECRET=randomsecret12345
NODE_ENV=development
```

### 3. Create Config

```bash
mkdir -p config
cp config/projects.json.example config/projects.json
```

Edit `config/projects.json` with your folder IDs.

### 4. Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Minimal Test (1 minute)

1. Add at least one project in the UI
2. Add some test videos to input folder in Drive
3. Click "▶ Process All Now"
4. Check Drive for renamed videos

## Deploy to Railway (2 minutes)

```bash
# Push to GitHub
git add .
git commit -m "Ready to deploy"
git push origin main

# Then in Railway dashboard:
# 1. Connect GitHub repo
# 2. Add environment variables
# 3. Deploy automatically

# Test production
curl https://videoflow-xxxx.railway.app/api/status
```

## Next: Enable Scheduling

Use [EasyCron.com](https://www.easycron.com/):
- URL: `https://videoflow-xxxx.railway.app/api/cron`
- Header: `x-cron-secret: your-secret`
- Schedule: `0 10 * * *` and `0 20 * * *`

## Done! 🎉

Your video processor is running.
