# VideoFlow Deployment Guide

Complete step-by-step guide to deploy VideoFlow on Railway.

## Prerequisites

- GitHub account with repository
- Railway account (free tier available)
- OpenAI API key
- Google Cloud Project with Drive API enabled

## Step 1: Prepare GitHub Repository

### 1.1 Initialize Git

```bash
cd videoflow
git init
git add .
git commit -m "Initial commit: VideoFlow MVP"
git branch -M main
```

### 1.2 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/videoflow.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 2: Create Railway Project

### 2.1 Sign Up to Railway

Go to [railway.app](https://railway.app) and create account.

### 2.2 Create New Project

1. Click **"New Project"** button
2. Select **"Deploy from GitHub"**
3. Click **"Configure GitHub App"**
4. Authorize Railway to access your repositories
5. Select `videoflow` repository
6. Click **"Deploy"**

Railway automatically detects Node.js and creates the service.

### 2.3 Configure Domain

Railway assigns a temporary domain. To use custom domain:

1. Go to project settings
2. Click **"Domains"**
3. Add your custom domain (requires DNS configuration)

For now, use Railway's auto-generated domain: `videoflow-xxxx.railway.app`

## Step 3: Configure Environment Variables

### 3.1 Add Variables to Railway

1. In Railway dashboard, open your project
2. Click **"Variables"** tab
3. Add each variable with "New Variable" button

### 3.2 Required Variables

```
OPENAI_API_KEY = sk-your-actual-key-here
GOOGLE_CLIENT_ID = your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = your-client-secret
GOOGLE_REDIRECT_URI = https://videoflow-xxxx.railway.app/api/auth/callback
APP_BASE_URL = https://videoflow-xxxx.railway.app
CRON_SECRET = randomSecureStringHere12345
CONFIG_PATH = ./config/projects.json
NODE_ENV = production
```

Replace `videoflow-xxxx` with your actual Railway domain.

### 3.3 Get Your Variables

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy and paste into Railway

#### Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (create if needed)
3. Go to "Credentials" → "OAuth 2.0 Client IDs"
4. Copy `Client ID` and `Client Secret`
5. **Add authorized redirect URI:** `https://videoflow-xxxx.railway.app/api/auth/callback`
6. Paste into Railway

#### CRON_SECRET

Generate random string:

```bash
openssl rand -base64 32
```

Or use any secure random string (minimum 20 characters).

## Step 4: Deploy Application

Railway auto-deploys when pushing to GitHub:

```bash
git add .
git commit -m "Configure environment"
git push origin main
```

Monitor deployment in Railway dashboard:
- Check **"Deployments"** tab
- Wait for green status ✅
- View logs in **"Logs"** section

## Step 5: Create Projects Configuration

### 5.1 Add Projects via UI

1. Open your Railway domain in browser: `https://videoflow-xxxx.railway.app`
2. Click **"+ Add Project"** button
3. Fill in project details:
   - **Project Name:** "Farándula Ecuador"
   - **Drive Account:** "account1"
   - **Input Folder ID:** Get from Drive
   - **Final Folder ID:** Get from Drive
   - **Review Folder ID:** Get from Drive
   - **Error Folder ID:** Get from Drive
4. Click **"Create Project"**

### 5.2 Get Google Drive Folder IDs

1. Open Google Drive
2. Create or open folders:
   - Input folder (for pending videos)
   - Final folder (for processed videos)
   - Review folder (for low-confidence videos)
   - Error folder (for failed videos)
3. Open each folder and copy ID from URL:
   ```
   https://drive.google.com/drive/folders/FOLDER_ID_HERE
   ```

## Step 6: Configure Scheduled Execution

VideoFlow can process automatically 2x daily (10 AM and 8 PM).

### Option A: External Cron Service (Easiest)

Use [EasyCron.com](https://www.easycron.com/) (free):

1. Sign up to EasyCron
2. Click **"Add Cron Job"**
3. Fill in details:
   - **URL:** `https://videoflow-xxxx.railway.app/api/cron`
   - **HTTP Method:** POST
   - **Custom Headers:** Add header
     - Name: `x-cron-secret`
     - Value: Your CRON_SECRET from Railway
   - **Cron Expression:** `0 10 * * *` (10 AM UTC)
   - **Timezone:** Select your timezone

4. Repeat for second execution:
   - **Cron Expression:** `0 20 * * *` (8 PM UTC)

### Option B: Use Node Cron Library

Create `scripts/cron.js` (requires Railway Pro):

```javascript
const axios = require('axios');
const cron = require('node-cron');

const baseUrl = process.env.APP_BASE_URL;
const cronSecret = process.env.CRON_SECRET;

// Run at 10 AM
cron.schedule('0 10 * * *', async () => {
  console.log('Running scheduled processing...');
  try {
    await axios.post(`${baseUrl}/api/cron`, {}, {
      headers: { 'x-cron-secret': cronSecret }
    });
    console.log('✅ Scheduled processing completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
});

// Run at 8 PM
cron.schedule('0 20 * * *', async () => {
  console.log('Running scheduled processing...');
  try {
    await axios.post(`${baseUrl}/api/cron`, {}, {
      headers: { 'x-cron-secret': cronSecret }
    });
    console.log('✅ Scheduled processing completed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
});

console.log('Cron scheduler started');
```

Update `Procfile`:
```
web: npm start
cron: node scripts/cron.js
```

Update `package.json`:
```json
"scripts": {
  "cron": "node scripts/cron.js"
}
```

## Step 7: Test Deployment

### 7.1 Check Status

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
  "timestamp": "2024-01-01T10:30:00.000Z"
}
```

### 7.2 Manual Processing Test

1. Go to UI: `https://videoflow-xxxx.railway.app`
2. Click **"▶ Process All Now"** button
3. Watch for results
4. Check Google Drive folders for moved videos

## Step 8: Monitor and Maintain

### 8.1 View Logs

In Railway dashboard:
1. Open project
2. Click **"Logs"** tab
3. Monitor in real-time

### 8.2 Monitor Costs

Railway shows resource usage and costs:
1. Open project
2. Click **"Analytics"** tab
3. Monitor CPU, Memory, and Network

Typical costs for VideoFlow:
- CPU usage only during processing (2x/day)
- Memory: minimal
- Network: minimal
- **Total:** $0-5/month on free tier

### 8.3 Update Application

Changes auto-deploy when pushing to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway rebuilds and deploys automatically.

## Troubleshooting

### Deployment Failed

Check Railway logs:
1. Go to **"Deployments"** tab
2. Click on failed deployment
3. View build logs
4. Common issues:
   - Missing environment variables
   - Node.js version mismatch
   - FFmpeg not available (need to configure)

**Fix FFmpeg on Railway:**

Create `nixpacks.toml` in root:
```toml
[build]
pkgManager = "npm"
aptPkgs = ["ffmpeg"]
```

### Google Drive API Errors

1. Verify OAuth credentials are correct
2. Check redirect URI matches exactly
3. Ensure Drive API is enabled in Google Cloud
4. Check folder IDs exist and are accessible

### OpenAI API Errors

1. Verify API key is valid and has credits
2. Check rate limits (free tier is limited)
3. Upgrade to paid plan if needed

### Scheduled Jobs Not Running

1. Check EasyCron job status
2. Verify `x-cron-secret` header matches
3. Check Railway logs for API errors
4. Test manually first: click "Process All Now" button

## Performance Tuning

### Reduce Costs

- Process only during off-peak hours
- Set schedule to 1x daily instead of 2x
- Limit to essential projects only
- Monitor resource usage in Railway

### Improve Speed

- Extract audio only (not full video)
- Use WAV format (faster transcription)
- Process projects sequentially (not parallel)
- Clean temporary files aggressively

## Security Checklist

- [ ] GOOGLE_REDIRECT_URI matches exactly
- [ ] CRON_SECRET is random and secure (30+ chars)
- [ ] Environment variables are set (not in code)
- [ ] `.env` file is in `.gitignore`
- [ ] Private config files excluded from git
- [ ] API keys rotated regularly
- [ ] HTTPS enforced (Railway default)

## Next Steps

1. ✅ Deploy application
2. ✅ Configure projects
3. ✅ Test processing
4. ✅ Enable scheduled execution
5. Monitor logs and costs
6. Iterate on naming rules
7. Add more projects as needed

## Support

- 📚 [Full Documentation](./README.md)
- 🚀 [Railway Docs](https://docs.railway.app/)
- 🤖 [OpenAI Docs](https://platform.openai.com/docs/)
- 📁 [Google Drive API](https://developers.google.com/drive)

## Cost Summary

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Railway | $0-5 | Free tier usually sufficient |
| OpenAI Whisper | $0.60 | 3 videos/day × 2 min × $0.02/min |
| OpenAI GPT | $0.01 | ~100 tokens per video |
| Google Drive | Free | 15GB included |
| **Total** | ~$0.61 | Ultra-low cost MVP |

**Deployment is complete! 🎉**

Monitor your projects and videos are automatically processed 2x daily.
