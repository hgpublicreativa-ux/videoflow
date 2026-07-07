# 🎬 VideoFlow - START HERE

**Tu aplicación de procesamiento de videos está lista.**

## Archivos Creados (25+)

```
✅ Backend Services (lib/)
  - google-drive.ts     → Google Drive API
  - openai.ts           → Transcription + Analysis
  - ffmpeg.ts           → Audio extraction
  - processor.ts        → Main orchestrator
  - config-loader.ts    → Project management
  - types.ts            → TypeScript types

✅ API Routes (pages/api/)
  - process.ts          → Manual processing
  - cron.ts             → Scheduled execution
  - status.ts           → Health check
  - projects.ts         → CRUD operations
  - projects/toggle.ts  → Activate/pause
  - auth/callback.ts    → Google OAuth

✅ Frontend (pages/)
  - index.tsx           → Dashboard UI
  - _app.tsx            → App wrapper
  - _document.tsx       → HTML config

✅ Styles (styles/)
  - home.module.css     → Dashboard styles
  - globals.css         → Global styles

✅ Configuration
  - package.json        → Dependencies
  - tsconfig.json       → TypeScript config
  - next.config.js      → Next.js config
  - .env.example        → Environment variables
  - .gitignore          → Git rules
  - Procfile            → Railway config
  - config/projects.json.example

✅ Documentation (6 guides)
  - README.md           → Full documentation
  - SETUP_GUIDE.md      → Step-by-step setup
  - DEPLOYMENT.md       → Railway instructions
  - QUICKSTART.md       → 5-minute start
  - PROJECT_STRUCTURE.md → Code organization
  - LICENSE             → MIT License
```

## Arquitectura (Simple & Barata)

```
Frontend (React UI)
        ↓
Next.js API Routes
        ↓
Services (Google Drive + OpenAI + FFmpeg)
        ↓
Google Drive (rename & move files)
```

**Por qué es barata:**
- No usa base de datos pesada
- Procesa secuencialmente (no paralelo)
- Se ejecuta 2x/día (no siempre activo)
- Limpia archivos temporales
- Railway cobra solo por lo que uses

**Costo estimado:** $6-10/mes

## 3 Pasos Rápidos

### 1️⃣ Configurar Localmente (15 min)

```bash
# Clonar (ya tienes los archivos)
cd videoflow

# Variables de entorno
cp .env.example .env
# Editar .env con tus claves de OpenAI y Google

# Instalar
npm install

# Ejecutar
npm run dev
# Abre http://localhost:3000
```

Lee: [SETUP_GUIDE.md](./SETUP_GUIDE.md)

### 2️⃣ Subir a GitHub (5 min)

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/videoflow.git
git push -u origin main
```

### 3️⃣ Desplegar en Railway (10 min)

1. Ir a [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Seleccionar tu repositorio
4. Agregar variables de entorno
5. Listo, auto-deploy cada push

Lee: [DEPLOYMENT.md](./DEPLOYMENT.md)

## Flujo de Procesamiento

1. **Usuario hace clic** en "Procesar ahora" (o cron automático)
2. **App obtiene proyectos activos** desde config.json
3. **Para cada proyecto:**
   - Revisa carpeta de entrada en Drive
   - Si vacía → salta
   - Si hay videos:
     - Descarga video temporalmente
     - Extrae audio con FFmpeg
     - Transcribe con OpenAI Whisper
     - Analiza con GPT-4o-mini
     - Renombra archivo: "Participantes - Situación.mp4"
     - Mueve a carpeta final (si confianza alta)
     - O a revisión (si confianza baja)
     - Limpia archivos temporales
4. **Resumen de resultados** en UI

## APIs Disponibles

```
POST /api/process
  Body: { projectName?: "nombre_proyecto" }
  → Procesa uno o todos

POST /api/cron
  Header: x-cron-secret: tu-secret
  → Ejecución automática (segura)

GET /api/status
  → Estado de la app

GET /api/projects
  → Listar todos los proyectos

POST /api/projects
  Body: { nombre, activo, driveAccount, ... }
  → Crear proyecto

PUT /api/projects
  Body: { nombre, ...updates }
  → Actualizar

DELETE /api/projects
  Body: { projectName }
  → Eliminar

POST /api/projects/toggle
  Body: { projectName }
  → Activar/pausar
```

## Configuración de Proyectos

Archivo: `config/projects.json`

```json
[
  {
    "nombre": "Farándula Ecuador",
    "activo": true,
    "driveAccount": "cuenta1",
    "inputFolderId": "ID_CARPETA_ENTRADA",
    "finalFolderId": "ID_CARPETA_FINAL",
    "reviewFolderId": "ID_CARPETA_REVISION",
    "errorFolderId": "ID_CARPETA_ERROR"
  },
  {
    "nombre": "Fútbol",
    "activo": false,
    "driveAccount": "cuenta2",
    "inputFolderId": "...",
    "finalFolderId": "...",
    "reviewFolderId": "...",
    "errorFolderId": "..."
  }
]
```

**Cómo obtener IDs de carpetas:**
1. Abre Google Drive
2. Abre una carpeta
3. URL: `https://drive.google.com/drive/folders/AQUI_ESTA_EL_ID`

## Variables de Entorno

Crear archivo `.env`:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback (local)
                  =https://videoflow-xxxx.railway.app/api/auth/callback (production)

# App
APP_BASE_URL=http://localhost:3000 (local)
           =https://videoflow-xxxx.railway.app (production)

# Security
CRON_SECRET=randomsecurestring

# Environment
NODE_ENV=development (local)
       =production (railway)
```

## Comandos

```bash
# Desarrollo
npm run dev          # Inicia servidor local
npm run build        # Compila para producción
npm start            # Ejecuta compilado

# Git
git push origin main # Auto-deploy en Railway

# Pruebas
curl localhost:3000/api/status
curl https://videoflow-xxxx.railway.app/api/status
```

## Scheduleo Automático

App puede procesar automáticamente **2 veces al día**:
- 10:00 AM
- 8:00 PM

Usar [EasyCron.com](https://www.easycron.com/) (gratis):
1. Crear cuenta
2. "Add Cron Job"
3. URL: `https://videoflow-xxxx.railway.app/api/cron`
4. Header: `x-cron-secret: tu-secret`
5. Schedule: `0 10 * * *` y `0 20 * * *`

## Nombres de Archivo Generados

Formato: `[Participantes] - [Situación].mp4`

**Ejemplos válidos:**
- ✅ Samantha Grey e Isaac Delgado - El público desea que formalicen su relación.mp4
- ✅ Antonella Moscoso - Responde a críticas sobre su salida de Ecuavisa.mp4
- ✅ Flor María Palomeque - Viaja a México para apoyar a Ecuador en el Mundial.mp4

**Ejemplos inválidos:**
- ❌ Video editado 1.mp4
- ❌ Entrevista viral.mp4
- ❌ Farándula Ecuador.mp4

Si la IA genera nombre genérico → video va a carpeta de revisión.

## Documentación

| Archivo | Propósito |
|---------|-----------|
| [README.md](./README.md) | Documentación completa |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Instalación paso a paso |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Despliegue en Railway |
| [QUICKSTART.md](./QUICKSTART.md) | 5 minutos para empezar |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Organización del código |

## Stack Tecnológico

```
Frontend:      Next.js 15 + React 19
Backend:       Next.js API Routes
Procesamiento: FFmpeg + OpenAI API
Storage:       Google Drive API
Deploy:        Railway + GitHub
Config:        JSON file (no DB)
```

## Optimización para Railway

✅ Procesa solo cuando hay videos  
✅ Ejecuta secuencialmente (no paralelo)  
✅ Se detiene cuando termina (no always-on)  
✅ Limpia archivos temporales  
✅ Costo predecible y bajo  

## Checklist para Comenzar

- [ ] Leer este archivo
- [ ] Leer [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- [ ] Obtener OpenAI API key
- [ ] Obtener Google OAuth credentials
- [ ] Configurar `.env` localmente
- [ ] Ejecutar `npm install && npm run dev`
- [ ] Probar en http://localhost:3000
- [ ] Crear GitHub repo
- [ ] Subir código a GitHub
- [ ] Crear Railway account
- [ ] Desplegar desde GitHub
- [ ] Configurar variables en Railway
- [ ] Actualizar Google OAuth redirect URI
- [ ] Crear proyectos en UI
- [ ] Crear carpetas en Google Drive
- [ ] Agregar IDs de carpetas
- [ ] Probar procesamiento manual
- [ ] Configurar EasyCron para scheduleo automático
- [ ] ¡Listo! 🚀

## Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| FFmpeg no encontrado | `brew install ffmpeg` |
| API key inválida | Verificar en platform.openai.com |
| Google OAuth error | Verificar redirect URI exacto |
| Videos no procesan | Ver logs locales con `npm run dev` |
| Scheduled jobs no corren | Verificar header `x-cron-secret` |

## Soporte

- 📚 [Documentación](./README.md)
- 🚀 [Railway Docs](https://docs.railway.app/)
- 🤖 [OpenAI Docs](https://platform.openai.com/docs/)
- 📁 [Google Drive API](https://developers.google.com/drive)

---

**Siguiente: Lee [SETUP_GUIDE.md](./SETUP_GUIDE.md) para instalación.**

¡Tu VideoFlow está listo! 🎬
