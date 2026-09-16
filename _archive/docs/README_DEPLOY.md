Quick deploy guide — Frontend (Vercel) + Backend (Railway / Render / Heroku)

1) Push your repo to GitHub
   - git add .
   - git commit -m "ready for deploy"
   - git push origin main

2) Backend (recommended: Railway or Render)
   - Option A — Railway (recommended):
     • Create new project > Deploy from GitHub > select this repo
     • Set Root Directory: `server`
     • Build command: `npm ci && npm run build`
     • Start command: `npm start`
     • Add environment variables from your `.env` (HUGGINGFACE, OPENAI, etc.) in Railway settings
     • Deploy — copy the generated service URL (e.g. https://my-backend.up.railway.app)

   - Option B — Render / Heroku:
     • Create a new Web Service, point to `server` folder
     • Use Node environment, build `npm run build`, start `npm start` (or use Dockerfile)

   - Important: Make sure `server/dist/index.js` is produced by `npm run build` and that `server/Procfile` exists (for Heroku-like platforms).

3) Frontend — Vercel
   - Go to vercel.com > New Project > Import Git Repository
   - Project root: repository root (this repo)
   - Build command: `npm run build`
   - Output Directory: `build`
   - Set Environment Variable in Vercel: `REACT_APP_API_BASE` = `https://<your-backend-url>`
   - Deploy. After build, the frontend will be public at https://<your-project>.vercel.app

4) Local test before pushing
   - In root: `npm run build` (creates `build/`)
   - Serve locally to test: `npx serve build` or `npx http-server build`

5) Notes
   - If you prefer the backend also on Vercel you must convert the Express APIs into Vercel Serverless Functions (in `api/`), or deploy the `server/dist/index.js` as a single Node server (current `vercel.json` may be configured for that but Node long-running servers are not ideal on Vercel).
   - Keep model files (large .h5) out of the Vercel deployment (we added `.vercelignore`).

If you want, I can:
- Prepare a small GitHub Actions workflow to auto-deploy frontend to Vercel and backend to Render/Railway on push
- Convert server endpoints to Vercel Serverless Functions (if you prefer single-platform Vercel)

---

Automated CI/CD (what I added):

- A GitHub Actions workflow: `.github/workflows/deploy.yml` — builds the frontend (`npm run build`) and deploys it to Vercel using the Vercel CLI; builds the `server` and triggers a Render deploy via the Render API.

Required GitHub repository secrets:

- `VERCEL_TOKEN` — Personal Vercel token (used by the Vercel CLI deploy).
- `RENDER_API_KEY` — Render API key (to trigger backend deploys).
- `RENDER_SERVICE_ID` — Render service id for your backend service.

How to use:

1. Push this repo to GitHub (main branch).
2. In the repository settings -> Secrets, add the required secrets above.
3. On push to `main`, the workflow will run, building and deploying frontend and triggering backend deploy.

If you want, I can also:
- Convert the backend to Render's recommended deployment configuration (Dockerfile or Start command) and add a health-check workflow.
- Add a separate workflow to deploy backend to Railway instead (requires `RAILWAY_TOKEN`).
