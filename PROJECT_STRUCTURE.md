# VideoFlow Project Structure

```
videoflow/
├── 📄 package.json                    # Dependencies & scripts
├── 📄 tsconfig.json                   # TypeScript config
├── 📄 next.config.js                  # Next.js config
├── 📄 .env.example                    # Environment variables template
├── 📄 .gitignore                      # Git ignore rules
├── 📄 Procfile                        # Railway process definition
├── 📄 README.md                       # Full documentation
├── 📄 DEPLOYMENT.md                   # Railway deployment guide
├── 📄 QUICKSTART.md                   # 5-minute setup
├── 📄 PROJECT_STRUCTURE.md            # This file
│
├── 📁 lib/                            # Backend services
│   ├── types.ts                       # TypeScript interfaces
│   ├── google-drive.ts                # Google Drive API service
│   ├── openai.ts                      # OpenAI API service
│   ├── ffmpeg.ts                      # FFmpeg audio extraction
│   ├── config-loader.ts               # Project configuration manager
│   └── processor.ts                   # Main processing orchestrator
│
├── 📁 pages/                          # Next.js pages & API routes
│   ├── _app.tsx                       # App wrapper
│   ├── _document.tsx                  # HTML document
│   ├── index.tsx                      # Main UI page
│   │
│   └── 📁 api/                        # API routes
│       ├── process.ts                 # POST /api/process (manual)
│       ├── cron.ts                    # POST /api/cron (scheduled)
│       ├── status.ts                  # GET /api/status
│       ├── projects.ts                # GET/POST/PUT/DELETE projects
│       │
│       ├── 📁 auth/
│       │   └── callback.ts            # GET /api/auth/callback (OAuth)
│       │
│       └── 📁 projects/
│           └── toggle.ts              # POST /api/projects/toggle
│
├── 📁 styles/                         # CSS files
│   ├── globals.css                    # Global styles
│   └── home.module.css                # Page-specific styles
│
├── 📁 config/                         # Configuration
│   ├── projects.json                  # Project definitions (runtime)
│   └── projects.json.example          # Project template
│
├── 📁 public/                         # Static files (empty by default)
│   └── (favicon, images, etc.)
│
└── 📁 scripts/ (optional)             # Utility scripts
    └── cron.js                        # Local cron scheduler (Railway Pro)
```

## Key Files Explained

### Backend Services (lib/)

**types.ts** — TypeScript interfaces for type safety
- `Project` — Project configuration
- `ProcessingResult` — Processing output
- `VideoMetadata` — AI analysis results
- `ExecutionLog` — Processing history

**google-drive.ts** — Google Drive API wrapper
- `listVideosInFolder()` — Find videos in Drive folder
- `renameFile()` — Rename file in Drive
- `moveFile()` — Move file between folders
- `downloadFile()` — Temporary download
- `sanitizeFileName()` — Clean invalid characters

**openai.ts** — OpenAI API wrapper
- `transcribeAudio()` — Whisper transcription
- `analyzeTranscription()` — GPT-4o-mini analysis
- `isGenericName()` — Validate generated names

**ffmpeg.ts** — Audio extraction service
- `extractAudio()` — Extract WAV from video
- `getVideoDuration()` — Get video length

**config-loader.ts** — Project configuration manager
- `loadProjects()` — Read projects.json
- `addProject()` — Create new project
- `updateProject()` — Edit project
- `toggleProjectActive()` — Enable/disable

**processor.ts** — Main orchestrator
- `processAllProjects()` — Process all active projects
- `processProject()` — Process single project
- `processVideo()` — Process single video file

### API Routes (pages/api/)

**process.ts** — Manual processing
- Request: `POST /api/process` with optional `projectName`
- Response: Processing results

**cron.ts** — Scheduled processing
- Request: `POST /api/cron` with `x-cron-secret` header
- Response: Processing results
- Security: Validates cron secret

**status.ts** — Health check
- Request: `GET /api/status`
- Response: Active/total projects

**projects.ts** — Project management CRUD
- GET — List all projects
- POST — Create project
- PUT — Update project
- DELETE — Remove project

**projects/toggle.ts** — Activate/deactivate project
- Request: `POST /api/projects/toggle`
- Body: `{ projectName: "name" }`

**auth/callback.ts** — Google OAuth callback
- Request: `GET /api/auth/callback?code=...`
- Response: Refresh token for secure storage

### Frontend (pages/)

**index.tsx** — Main UI dashboard
- Project list with status
- Add/edit/delete projects
- Process all / Process project buttons
- Results summary

**_app.tsx** — Next.js app wrapper
- Global styles & providers

**_document.tsx** — HTML document
- Meta tags & favicon

### Styles (styles/)

**globals.css** — Global CSS resets

**home.module.css** — Page-specific styles
- .container — Main wrapper
- .header — Title & description
- .controls — Action buttons
- .projects — Project list
- .projectCard — Individual project
- .results — Processing results

### Configuration (config/)

**projects.json** — Runtime project configuration
```json
[
  {
    "nombre": "Project Name",
    "activo": true,
    "driveAccount": "account1",
    "inputFolderId": "...",
    "finalFolderId": "...",
    "reviewFolderId": "...",
    "errorFolderId": "..."
  }
]
```

## Processing Flow Diagram

```
User clicks "Process All Now"
         ↓
    /api/process
         ↓
  ConfigLoader.getActiveProjects()
         ↓
  For each project:
    - GoogleDrive.listVideosInFolder()
    - If empty → skip
    - For each video:
      - GoogleDrive.downloadFile()
      - FFmpeg.extractAudio()
      - OpenAI.transcribeAudio()
      - OpenAI.analyzeTranscription()
      - If confidence HIGH:
        - GoogleDrive.renameFile()
        - GoogleDrive.moveFile(final)
      - Else:
        - GoogleDrive.moveFile(review)
         ↓
    Return ProcessingResult[]
         ↓
   Update UI with results
```

## Environment Variables

```
Development (.env):
  NODE_ENV=development
  APP_BASE_URL=http://localhost:3000
  GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

Production (Railway):
  NODE_ENV=production
  APP_BASE_URL=https://videoflow-xxxx.railway.app
  GOOGLE_REDIRECT_URI=https://videoflow-xxxx.railway.app/api/auth/callback

Secrets (both):
  OPENAI_API_KEY=sk-...
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
  CRON_SECRET=...
```

## Database (Optional)

Current design uses **no database**:
- ✅ Cheaper
- ✅ Faster
- ✅ Simpler to deploy
- ✅ JSON file for config

Projects stored in `config/projects.json`.

To add database (PostgreSQL, MongoDB):
1. Update `ConfigLoader` to use database
2. Update API routes to use database
3. Add database connection to Railway

## Performance Optimizations

1. **Sequential Processing** — One video at a time (not parallel)
2. **Lazy Loading** — Extract only audio, not full video
3. **Cleanup** — Delete temp files immediately
4. **Early Exit** — Skip empty folders
5. **Resource Limits** — No background workers
6. **Scheduled** — 2x/day, not continuous monitoring

## Security Measures

1. **OAuth2** — Google Drive authentication
2. **Environment Variables** — All secrets external
3. **CRON_SECRET** — Validates scheduled requests
4. **Sanitization** — Clean file names from Drive
5. **Validation** — Check folder IDs exist
6. **HTTPS** — Railway enforces TLS
7. **Rate Limiting** — OpenAI API limits applied

## Scaling Roadmap

**Current (MVP):**
- Sequential processing
- No database
- Single Railway dyno
- 2x/day execution

**Future:**
- Parallel video processing
- Database for audit logs
- Multiple workers/queues
- Real-time progress updates
- Custom naming rules per project
- Video quality validation
- Thumbnail generation
- Analytics dashboard

## Dependencies

**Runtime:**
- next@15 — Framework
- react@19 — UI
- axios@1.7 — HTTP client
- openai@4.52 — OpenAI API
- googleapis@140 — Google Drive API
- fluent-ffmpeg@2.1 — Audio extraction
- node-cron@3 — Scheduling (optional)
- dotenv@16.3 — Environment variables

**Development:**
- typescript@5.3 — Type safety
- @types/* — Type definitions

**Total Package Size:** ~500MB with node_modules

## File Sizes

- Source code: ~100KB
- Configuration: ~1KB
- Styles: ~5KB
- Build output: ~2MB

## Build & Deploy

```bash
# Development
npm run dev            # Start local server
npm run build          # Build production
npm start              # Run production build

# Git
git add .
git commit -m "Message"
git push origin main   # Auto-deploys to Railway

# Testing
curl localhost:3000/api/status
```

---

**Clean, modular, and ready to scale.** 🚀
