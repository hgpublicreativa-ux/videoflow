# VideoFlow 🎬

Automated video processor for Google Drive. Transcribes videos, identifies participants and situations, renames files intelligently, and moves them to correct folders.

## Features

✅ **Google Drive Integration** — Connect and manage multiple accounts  
✅ **Audio Transcription** — OpenAI Whisper for Spanish transcription  
✅ **Smart Naming** — AI-generated file names with participants and situation  
✅ **Multi-Project Support** — Handle multiple Google Drive accounts  
✅ **Automatic Processing** — Scheduled execution (2x daily) or manual trigger  
✅ **Smart Routing** — Move videos to appropriate folders based on confidence  
✅ **Resource Optimized** — Designed for low-cost deployment on Railway  

## Tech Stack

- **Frontend:** Next.js + React
- **Backend:** Next.js API Routes
- **APIs:** OpenAI (Whisper + GPT-4o-mini), Google Drive API
- **Processing:** FFmpeg (audio extraction)
- **Config:** JSON + environment variables
- **Deployment:** Railway + GitHub

## Prerequisites

1. **Node.js** >= 18.0.0
2. **FFmpeg** installed on system
3. **Google Cloud Project** with Drive API enabled
4. **OpenAI API Key**

### Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/videoflow.git
cd videoflow
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# OpenAI API
OPENAI_API_KEY=sk-...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Production URL
APP_BASE_URL=http://localhost:3000

# Security
CRON_SECRET=your_random_secret_key_here

# Config path
CONFIG_PATH=./config/projects.json

# Node environment
NODE_ENV=development
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google Drive API**
4. Create **OAuth 2.0 Credentials** (Desktop application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback`
6. Copy **Client ID** and **Client Secret** to `.env`

### 4. Create Projects Configuration

Create `config/projects.json`:

```json
[
  {
    "nombre": "Farándula Ecuador",
    "activo": true,
    "driveAccount": "account1",
    "inputFolderId": "FOLDER_ID_1",
    "finalFolderId": "FOLDER_ID_2",
    "reviewFolderId": "FOLDER_ID_3",
    "errorFolderId": "FOLDER_ID_4"
  }
]
```

**How to get Folder IDs:**
1. Open Google Drive
2. Navigate to your folder
3. Copy the ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID`

## Local Development

### Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### POST `/api/process`
Process all projects or a specific project.

**Body:**
```json
{
  "projectName": "Optional - process specific project"
}
```

### POST `/api/cron`
Scheduled processing endpoint (requires `x-cron-secret` header).

**Headers:**
```
x-cron-secret: your_cron_secret
```

### GET `/api/status`
Check application status.

### GET `/api/projects`
List all projects.

### POST `/api/projects`
Create a new project.

### PUT `/api/projects`
Update a project.

### DELETE `/api/projects`
Delete a project.

### POST `/api/projects/toggle`
Toggle project active/inactive status.

## Processing Flow

1. **Trigger** — Manual button or automatic schedule (2x/day)
2. **Load Projects** — Get all active projects
3. **List Videos** — Check each input folder for videos
4. **Skip Empty** — If folder empty, move to next project
5. **Download Video** — Temporary download from Drive
6. **Extract Audio** — Use FFmpeg to get audio file
7. **Transcribe** — OpenAI Whisper API (Spanish)
8. **Analyze** — OpenAI GPT-4o-mini identifies:
   - Participants (people mentioned)
   - Situation (main topic)
   - Confidence level (high/medium/low)
9. **Validate** — Check if name is not generic
10. **Rename & Move** — If confidence is high → final folder
11. **Quality Review** — If confidence is low → review folder
12. **Error Handling** — If error → error folder
13. **Cleanup** — Delete temporary files
14. **Next Project** — Repeat for all projects

## File Naming Rules

Generated names follow this pattern:

```
[Participants] - [Situation].mp4
```

**Examples:**

✅ Correcto:
- `Samantha Grey e Isaac Delgado - El público desea que formalicen su relación.mp4`
- `Antonella Moscoso - Responde a críticas sobre su salida de Ecuavisa.mp4`
- `Flor María Palomeque - Viaja a México para apoyar a Ecuador en el Mundial.mp4`

❌ Incorrecto:
- `Video editado 1.mp4`
- `Entrevista viral.mp4`
- `Farándula Ecuador.mp4`

## Deployment on Railway

### 1. Create Railway Account

Go to [railway.app](https://railway.app) and sign up.

### 2. Connect GitHub Repository

1. Push your code to GitHub
2. In Railway, click "New Project"
3. Select "Deploy from GitHub"
4. Authorize Railway to access your repositories
5. Select your `videoflow` repository
6. Railway auto-detects Node.js and creates service

### 3. Configure Environment Variables

In Railway dashboard:

1. Go to your project
2. Click "Variables"
3. Add all variables from `.env`:
   - `OPENAI_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI=https://videoflow-xyz.railway.app/api/auth/callback`
   - `APP_BASE_URL=https://videoflow-xyz.railway.app`
   - `CRON_SECRET=your_secure_random_key`
   - `CONFIG_PATH=./config/projects.json`
   - `NODE_ENV=production`

Replace `videoflow-xyz` with your actual Railway domain.

### 4. Deploy

Push to GitHub and Railway auto-deploys:

```bash
git push origin main
```

### 5. Configure Scheduled Execution

#### Option A: External Cron Service (Recommended)

Use [EasyCron](https://www.easycron.com/) or [cron-job.org](https://cron-job.org/):

1. Create account (free)
2. Add new cron job:
   - **URL:** `https://your-railway-domain.railway.app/api/cron`
   - **Method:** POST
   - **Header:** `x-cron-secret: your_cron_secret`
   - **Schedule:** `0 10 * * *` (10 AM) and `0 20 * * *` (8 PM)

#### Option B: Railway Cron Jobs (Premium)

Railway Pro allows scheduled jobs via `Procfile`:

1. Create `Procfile` in root:
```
web: npm start
cron: node scripts/cron-job.js
```

2. Create `scripts/cron-job.js`:
```javascript
const cron = require('node-cron');
const axios = require('axios');

cron.schedule('0 10 * * *', async () => {
  console.log('Running scheduled processing...');
  try {
    await axios.post(
      `${process.env.APP_BASE_URL}/api/cron`,
      {},
      {
        headers: {
          'x-cron-secret': process.env.CRON_SECRET,
        },
      }
    );
    console.log('Scheduled processing completed');
  } catch (error) {
    console.error('Scheduled processing error:', error);
  }
});

cron.schedule('0 20 * * *', async () => {
  // Same as above for 8 PM
});
```

### 6. Verify Deployment

Test your Railway instance:

```bash
curl https://your-railway-domain.railway.app/api/status
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

## GitHub Setup

### 1. Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: VideoFlow MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/videoflow.git
git push -u origin main
```

### 2. GitHub Actions (Optional - Auto-deployment)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

Add `RAILWAY_TOKEN` secret to GitHub repository settings.

## Project Configuration Format

```json
[
  {
    "nombre": "Project name",
    "activo": true,
    "driveAccount": "account_identifier",
    "inputFolderId": "Google Drive folder ID for input videos",
    "finalFolderId": "Folder for successfully processed videos",
    "reviewFolderId": "Folder for videos requiring manual review",
    "errorFolderId": "Folder for videos with processing errors"
  }
]
```

## Troubleshooting

### FFmpeg not found

```bash
# Check installation
ffmpeg -version

# On macOS with Homebrew
brew install ffmpeg

# Specify path in .env
FFMPEG_PATH=/usr/local/bin/ffmpeg
```

### Google Drive API errors

1. Verify credentials in `.env`
2. Check Google Cloud Console API is enabled
3. Ensure redirect URI matches exactly
4. Check folder IDs are correct and shared with auth account

### OpenAI API errors

1. Verify API key is valid
2. Check account has available credits
3. Verify model names (gpt-4o-mini, whisper-1)
4. Check rate limits

### Railway deployment issues

1. Check build logs in Railway dashboard
2. Verify environment variables are set
3. Ensure `.env` file is not in git
4. Check Node.js version compatibility

## Cost Estimation

| Service | Cost | Usage |
|---------|------|-------|
| **OpenAI Whisper** | ~$0.02/min audio | 3 videos/day × 2 min × $0.02 = ~$1.20/month |
| **OpenAI GPT-4o-mini** | ~$0.15/1M tokens | ~100 tokens per video = ~$0.005/month |
| **Railway** | $5/month (starter) | Free tier available for MVP |
| **Google Drive** | Free | 15GB storage included |
| **Total** | ~$6/month | 3 videos/day processing |

## Security Notes

- Never commit `.env` files with real credentials
- Use environment variables for all secrets
- Rotate `CRON_SECRET` regularly
- Limit Google OAuth scopes to Drive only
- Use HTTPS in production (Railway provides this)
- Validate all user inputs
- Sanitize file names before using in Drive API

## Performance Tips

- Process during off-peak hours (configured 10 AM, 8 PM)
- Limit concurrent projects (process sequentially)
- Delete temporary files immediately
- Use WAV format for audio (smaller than other formats)
- Monitor Railway resource usage in dashboard
- Archive old config backups

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Create Pull Request

## License

MIT License - see LICENSE file for details

## Support

- 📚 [Documentation](./README.md)
- 🐛 [Report Issues](https://github.com/YOUR_USERNAME/videoflow/issues)
- 💬 [Discussions](https://github.com/YOUR_USERNAME/videoflow/discussions)

## Roadmap

- [ ] Multi-language support (Spanish, English, Portuguese)
- [ ] Video thumbnail generation
- [ ] Batch processing optimization
- [ ] Database integration (optional)
- [ ] Webhooks for external integrations
- [ ] Dashboard analytics
- [ ] Parallel processing
- [ ] Custom naming rules per project
- [ ] Video quality validation

---

**Made with ❤️ for creators and production teams**
