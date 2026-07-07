# VideoFlow Setup Guide

Complete step-by-step guide to get VideoFlow running.

## Phase 1: Local Development (15 minutes)

### Step 1.1: Install Prerequisites

```bash
# Check Node.js version
node --version  # Must be >= 18.0.0

# Install FFmpeg
# macOS:
brew install ffmpeg

# Ubuntu/Debian:
sudo apt-get install ffmpeg

# Windows:
# Download from https://ffmpeg.org/download.html
```

### Step 1.2: Clone and Setup

```bash
cd ~/Desktop
git clone https://github.com/YOUR_USERNAME/videoflow.git
cd videoflow
npm install
```

### Step 1.3: Get API Keys

#### OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy: `sk-...`

#### Google OAuth Credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create new project (or use existing)
3. Enable **Google Drive API**:
   - Search "Google Drive API"
   - Click "Enable"
4. Create **OAuth 2.0 Credentials**:
   - Go to "Credentials" tab
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Desktop application**
   - Name: "VideoFlow Local"
   - Click "Create"
5. Copy **Client ID** and **Client Secret**

### Step 1.4: Configure Environment

```bash
cp .env.example .env
nano .env  # or use your editor
```

Add your keys:

```env
OPENAI_API_KEY=sk-your-key-here
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
APP_BASE_URL=http://localhost:3000
CRON_SECRET=randomsecurestringhere
NODE_ENV=development
```

### Step 1.5: Create Test Configuration

```bash
mkdir -p config
cat > config/projects.json << 'EOF'
[
  {
    "nombre": "Test Project",
    "activo": true,
    "driveAccount": "test",
    "inputFolderId": "YOUR_INPUT_FOLDER_ID",
    "finalFolderId": "YOUR_FINAL_FOLDER_ID",
    "reviewFolderId": "YOUR_REVIEW_FOLDER_ID",
    "errorFolderId": "YOUR_ERROR_FOLDER_ID"
  }
]
EOF
```

**How to get folder IDs:**
1. Open [Google Drive](https://drive.google.com)
2. Create 4 folders:
   - "VideoFlow Input"
   - "VideoFlow Final"
   - "VideoFlow Review"
   - "VideoFlow Error"
3. For each folder:
   - Open it
   - Copy URL: `https://drive.google.com/drive/folders/FOLDER_ID`
   - Extract FOLDER_ID
4. Replace in `projects.json`

### Step 1.6: Start Local Server

```bash
npm run dev
```

Output should show:
```
> ready - started server on 0.0.0.0:3000
```

Open [http://localhost:3000](http://localhost:3000)

### Step 1.7: Test Locally

1. Click **"+ Add Project"** (optional, already configured)
2. Add 1-2 test videos to "VideoFlow Input" folder in Drive
3. Click **"▶ Process All Now"**
4. Watch for results
5. Check Google Drive for renamed videos in final folder

**Success indicators:**
- ✅ Videos appear in final folder
- ✅ Names include participants and situation
- ✅ Results show "Processing completed"

## Phase 2: GitHub Repository (5 minutes)

### Step 2.1: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name: `videoflow`
4. Description: "Automated video processor for Google Drive"
5. Public (for free tier) or Private (if you want)
6. **Do NOT initialize** README/gitignore/license (we have them)
7. Click "Create repository"

### Step 2.2: Push to GitHub

```bash
# In your videoflow directory
git init
git add .
git commit -m "Initial commit: VideoFlow MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/videoflow.git
git push -u origin main
```

**Replace:**
- `YOUR_USERNAME` with your GitHub username

Verify:
1. Go to your GitHub repo
2. Should see all files
3. File count should match 25+ files

## Phase 3: Railway Deployment (10 minutes)

### Step 3.1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up (free account)
3. Email verification

### Step 3.2: Connect Repository

1. Click "New Project"
2. Select "Deploy from GitHub"
3. Click "Configure GitHub App"
4. Authorize Railway
5. Select your `videoflow` repository
6. Click "Deploy"

**Wait:** Railway builds (2-3 minutes)

### Step 3.3: Add Environment Variables

In Railway dashboard:

1. Open your project
2. Go to **"Variables"** tab
3. Add each variable:

```
OPENAI_API_KEY = sk-your-key-here
GOOGLE_CLIENT_ID = your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = your-client-secret
GOOGLE_REDIRECT_URI = https://videoflow-xxxx.railway.app/api/auth/callback
APP_BASE_URL = https://videoflow-xxxx.railway.app
CRON_SECRET = randomsecurestringhere
CONFIG_PATH = ./config/projects.json
NODE_ENV = production
```

**Where to find your domain:**
- Railway dashboard → Settings → Domains
- Or look for "Deployment" tab

### Step 3.4: Update Google OAuth

Update authorized redirect URIs in Google Cloud:

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Select your project
3. Go to **Credentials**
4. Click your OAuth 2.0 Client ID
5. Add authorized redirect URI:
   ```
   https://videoflow-xxxx.railway.app/api/auth/callback
   ```
   (Replace `videoflow-xxxx` with your actual domain)
6. Click "Save"

### Step 3.5: Test Production

```bash
curl https://videoflow-xxxx.railway.app/api/status
```

Expected response:
```json
{
  "success": true,
  "status": "OK",
  "projectsActive": 1,
  "projectsTotal": 1,
  "timestamp": "2024-01-01T10:30:00Z"
}
```

Open in browser: `https://videoflow-xxxx.railway.app`

## Phase 4: Enable Scheduled Processing (5 minutes)

### Step 4.1: Choose Scheduling Method

#### Option A: EasyCron (Easiest, Recommended)

1. Go to [easycron.com](https://www.easycron.com/)
2. Sign up (free)
3. Click "Add a cron job"
4. Fill in:
   - **URL:** `https://videoflow-xxxx.railway.app/api/cron`
   - **Method:** POST
   - **Custom Headers:** Add one:
     - Name: `x-cron-secret`
     - Value: Your CRON_SECRET
   - **Cron Expression:** `0 10 * * *` (10 AM)
5. Click "Save"
6. Repeat for second job:
   - **Cron Expression:** `0 20 * * *` (8 PM)

#### Option B: cron-job.org (Alternative)

1. Go to [cron-job.org](https://cron-job.org/)
2. Sign up
3. Create new cron job
4. Fill in:
   - **URL:** `https://videoflow-xxxx.railway.app/api/cron`
   - **Execution times:** 10:00 and 20:00
   - **Custom headers:** `x-cron-secret: your-secret`

### Step 4.2: Test Scheduling

Manually trigger to test:

1. Go to your EasyCron job
2. Click "Run Now"
3. Check Railway logs for success message
4. Verify videos processed in Google Drive

## Complete! 🎉

Your VideoFlow is now:
- ✅ Running locally
- ✅ Deployed on Railway
- ✅ Connected to Google Drive
- ✅ Processing videos automatically 2x/day

## Maintenance

### Monitor Logs

**Local:**
```bash
npm run dev  # See console output
```

**Production (Railway):**
- Dashboard → Logs tab
- Real-time view of processing

### Update Configuration

Edit `config/projects.json` to:
- Add new projects
- Change folder IDs
- Pause projects

Changes take effect immediately.

### Update Code

1. Make changes locally
2. Test locally
3. Commit and push:
   ```bash
   git add .
   git commit -m "Description"
   git push origin main
   ```
4. Railway auto-deploys

### Monitor Costs

Railway dashboard → Analytics:
- CPU usage
- Memory usage
- Network usage
- Monthly estimate

VideoFlow usually costs **$0-5/month**.

## Troubleshooting

### Videos not processing

1. Check local logs: `npm run dev`
2. Check Railway logs
3. Verify folder IDs are correct
4. Check videos exist in input folder
5. Test manually: click "Process All Now"

### Google Drive API errors

1. Verify credentials in environment variables
2. Check Drive API is enabled in Google Cloud
3. Verify redirect URI matches exactly
4. Add more scopes if needed

### OpenAI API errors

1. Verify API key is valid
2. Check account has credits
3. Check rate limits

### Scheduled jobs not running

1. Test manually first (click button)
2. Verify EasyCron job shows "Success"
3. Check `x-cron-secret` header is correct
4. Check Railway logs for API errors

## Next Steps

1. ✅ Add more projects
2. ✅ Monitor processing quality
3. ✅ Adjust naming rules if needed
4. ✅ Scale to production

## Support

- 📚 [Full README](./README.md)
- 📋 [Project Structure](./PROJECT_STRUCTURE.md)
- 🚀 [Deployment Guide](./DEPLOYMENT.md)
- ⚡ [Quick Start](./QUICKSTART.md)

---

**You're all set! Start processing videos! 🎬**
