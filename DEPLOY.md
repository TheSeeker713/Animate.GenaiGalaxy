# Deployment Guide - Cloudflare Pages

## Prerequisites

1. **Build the Project**
   ```bash
   npm run build
   ```
   This creates a `dist/` folder with production-ready files.

2. **Install Wrangler (Cloudflare CLI)**
   ```bash
   npm install -g wrangler
   # OR use npx (no global install needed)
   npx wrangler --version
   ```

## Option 1: Direct Deploy (One-time)

Deploy directly from your local machine:

```bash
npm run build
npx wrangler pages deploy dist --project-name=genai-galaxy-animate
```

First time? You'll be prompted to:
1. Log in to Cloudflare account
2. Select or create a Pages project
3. Confirm deployment

Your site will be live at: `https://genai-galaxy-animate.pages.dev`

## Option 2: GitHub Integration (Recommended)

### Setup GitHub Repo

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - GenAI Galaxy Animate MVP"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/genai-galaxy-animate.git
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Pages** → **Create a project**
   - Click **Connect to Git**
   - Authorize GitHub and select your repo
   - Configure build settings:
     - **Framework preset**: Vite
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
   - Click **Save and Deploy**

3. **Auto-Deploy Setup** ✅
   - Every push to `main` branch triggers automatic deployment
   - Pull requests create preview deployments

## Custom Domain: animate.genaigalaxy.com

### Add Custom Domain to Cloudflare Pages

1. **In Cloudflare Dashboard**:
   - Go to your **Pages project**
   - Click **Custom domains** tab
   - Click **Set up a custom domain**

2. **Add Domain**:
   - Enter: `animate.genaigalaxy.com`
   - Click **Continue**

3. **Configure DNS** (if domain is on Cloudflare):
   - Cloudflare auto-creates CNAME record:
     ```
     Type: CNAME
     Name: animate
     Target: genai-galaxy-animate.pages.dev
     Proxy: ✅ Proxied (Orange cloud)
     ```
   - Click **Activate domain**

4. **Wait for DNS Propagation**:
   - Usually 1-5 minutes
   - SSL certificate auto-provisions
   - Check status in Custom domains tab

5. **Verify**:
   - Visit `https://animate.genaigalaxy.com`
   - Should redirect to HTTPS automatically

### If Domain is External (Not on Cloudflare)

Add this CNAME record at your DNS provider:
```
Type: CNAME
Name: animate
Value: genai-galaxy-animate.pages.dev
TTL: Auto or 3600
```

Then in Cloudflare Pages, add the domain and follow validation steps.

## Environment Variables (If Needed)

For future cloud features (D1 database, R2 storage):

1. In Pages project → **Settings** → **Environment variables**
2. Add variables for production/preview environments
3. Redeploy to apply changes

## Build Optimization

### Reduce Bundle Size

The MediaPipe WASM files are large (~5MB). To optimize:

1. **Consider Code Splitting** (future):
   ```typescript
   const WebcamPuppet = lazy(() => import('./components/WebcamPuppet'))
   ```

2. **Check Bundle Size**:
   ```bash
   npm run build
   # Look at dist/ folder size
   ```

3. **Analyze Bundle** (optional):
   ```bash
   npm install -D rollup-plugin-visualizer
   # Add to vite.config.ts
   npm run build
   ```

### Caching Strategy

Cloudflare Pages automatically:
- Caches static assets (JS, CSS, images)
- Serves from global CDN
- Invalidates cache on new deploys

## Testing Production Build Locally

Before deploying:

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` to test production build.

## Rollback / Version History

Cloudflare Pages keeps deployment history:

1. Go to Pages project → **Deployments**
2. See all previous deploys
3. Click **...** menu → **Rollback to this deployment**

## Monitoring

### View Deployment Logs
- Cloudflare Dashboard → Pages → Your Project → **Deployments**
- Click any deployment to see build logs

### Analytics (Optional)
- Enable **Web Analytics** in Cloudflare Pages settings
- Track visitors, performance, errors

## Common Issues

### Build Fails on Cloudflare
- **Check Node version**: Cloudflare uses Node 18+ by default
- **Missing dependencies**: Ensure `package.json` is committed
- **Build command**: Verify it's `npm run build` in settings

### Camera Not Working on HTTPS
- MediaPipe requires HTTPS for webcam access
- Cloudflare Pages provides free SSL automatically
- Test locally with `https://localhost:5173` (requires dev SSL cert)

### Large Bundle Size Warning
- MediaPipe WASM files are ~2-5MB (normal)
- Cloudflare compresses files automatically (Brotli/gzip)
- Actual transfer size is ~1-2MB

## Next Steps

After successful deployment:

1. ✅ Test all features on live site
2. ✅ Verify webcam permissions work on HTTPS
3. ✅ Test on mobile devices
4. ✅ Share link: `https://animate.genaigalaxy.com`
5. 🚀 Optional: Set up monitoring/analytics

---

**Questions?** Check [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
