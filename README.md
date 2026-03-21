# GenAI Galaxy Animate

A professional multi-tool creation suite combining frame-by-frame animation, vector graphics, character rigging with motion capture, and interactive story building—all in one browser-based application.

## 🌟 Overview

GenAI Galaxy Animate is an **Adobe Creative Suite-style** environment with four specialized studios:

1. **🎨 Raster Animation Studio** — Frame-by-frame bitmap animation (Konva), timeline, layers, GIF export
2. **📐 Vector Studio** — Vector shapes and paths (react-konva), frames/layers (pen tool: polyline MVP)
3. **🎭 Character Studio** — Templates, rig/morph editing, webcam panel, PNG / Spine-style JSON export
4. **📖 Story Builder** — React Flow node graph, asset DBs, search, preview, IndexedDB persistence

## 🎨 Current Features (Raster Animation Studio)

- **Drawing Tools**: Brush and eraser with adjustable size and color
- **Frame-by-Frame Animation**: Multi-frame animation with playback controls (12-60 FPS)
- **Onion Skin**: See previous frame as 30% opacity overlay for smooth animation
- **Timeline**: Actual canvas thumbnails for each frame
- **Dark Mode**: Eye-friendly dark theme (default)
- **Keyboard Shortcuts**: Professional workflow with shortcuts
- **Project Management**: Dashboard with project cards; index in localStorage (Zustand persist); stories in IndexedDB (Dexie); characters in IndexedDB / localStorage fallback
- **Auto-Save**: Drawing data persists automatically per-frame

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint (ESLint)
npm run lint

# Unit tests (Vitest)
npm run test
```

## ⌨️ Keyboard Shortcuts (Raster Studio)

- `B` - Brush tool
- `E` - Eraser tool  
- `Space` - Play/Pause animation
- `Q` - Previous frame
- `W` - Next frame
- `O` - Toggle onion skin
- `D` - Toggle dark mode
- `` ` `` (backtick) - Back to Dashboard

## 🏗️ Architecture

The app uses a **dashboard-first architecture** with project management:

- **Dashboard** (`/`) - Main menu for creating/opening projects
- **Raster Studio** (`/raster/:projectId`) - Frame-by-frame animation workspace
- **Vector Studio** (`/vector/:projectId`) - Coming soon
- **Character Studio** (`/character/:projectId`) - Coming soon
- **Story Builder** (`/story/:projectId`) - Coming soon

Each studio type has its own:
- Project settings (dimensions, FPS, etc.)
- Specialized toolset
- Dedicated canvas/UI layout
- Export capabilities

## 🎭 Planned: Character Studio

The Character Studio will integrate webcam face/body puppeteering:

- Real-time face landmark detection (468 points)  
- Body pose tracking (33 landmarks)
- Character rigging system with bone hierarchy
- IK (Inverse Kinematics) for natural movement
- Recording puppet performances as keyframes
- Export as video or reusable rig

### Puppet Control Mapping (Planned)
- **Head tilt** → Character head rotation
- **Mouth open** → Jaw/mouth shapes
- **Eyebrow raise** → Expression blending
- **Body pose** → Full body animation

## 📦 Tech Stack

- **React 19** - UI framework
- **Vite 7** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Konva.js** - Canvas rendering
- **MediaPipe Tasks Vision** - Face tracking AI
- **Zustand** - State management
- **gif.js** - GIF export

## 🗂️ Project structure (summary)

```
src/
├── pages/           # Dashboard, RasterStudio, VectorStudio, CharacterStudio, StoryBuilder, …
├── components/      # raster/, vector/, character/, story/, common/
├── store/           # Zustand stores (project, animation, vector, character, story)
├── utils/           # gifExporter, storyDb (Dexie), validators, eventBus, …
├── App.tsx          # Routes (lazy-loaded studio pages)
└── main.tsx
```

## 📚 Documentation index

| Document | Purpose |
|----------|---------|
| [docs/README.md](docs/README.md) | Index of business and technical docs |
| [docs/MILESTONES.md](docs/MILESTONES.md) | Milestones and product backlog |
| [docs/TECHNICAL_ROADMAP.md](docs/TECHNICAL_ROADMAP.md) | Character Studio technical phases (deep dive) |
| [docs/CHARACTER_STUDIO_PROGRESS.md](docs/CHARACTER_STUDIO_PROGRESS.md) | Character feature checklist |
| [docs/STORY_BUILDER_PLAN.md](docs/STORY_BUILDER_PLAN.md) | Story Builder design notes |
| [docs/DEPLOY.md](docs/DEPLOY.md) | Deployment |
| [docs/COPILOT_ROADMAP.md](docs/COPILOT_ROADMAP.md) | AI-assistant context and conventions |

## 🎯 Roadmap (by track)

**Platform (done / ongoing)**  
- Unified routing (`/` and `/dashboard`); lazy-loaded routes; ESLint + Vitest + GitHub Actions CI  
- Dashboard project index for raster, vector, story, and character (upsert on save; story sync from Dexie on load)  
- IndexedDB story data + cascade delete when removing a story project  

**Raster — done (core)**  
- Frame-by-frame drawing, timeline, onion skin, layers, playback, GIF export path  

**Raster — next**  
- Selection/transform tools, advanced zoom/pan UX, blend modes polish  

**Vector — done (MVP)**  
- Shape tools, grid/snap, pen polyline paths  

**Vector — next**  
- Bézier editing, tweening/easing, SVG/video export  

**Character — done (MVP)**  
- Templates, canvas/morph/bones, save, PNG + Spine JSON export, webcam panel  

**Character — next**  
- Full GIF/video export, face→rig mapping polish, recording pipeline  

**Story — done (MVP)**  
- Node graph, inspectors, asset DBs, search→focus node, preview, Dexie persistence  

**Story — next**  
- Rich export formats, cross-studio asset imports, collaboration (needs backend)  

**Polish & deploy — future**  
- PWA, touch optimization, configurable shortcuts, themed deploy ([docs/DEPLOY.md](docs/DEPLOY.md)), optional cloud sync  

### Future development (6–18 months)

1. **Stability** — Project bundles (export/import), migration tooling  
2. **Collaboration** — Shared projects (requires backend)  
3. **Mobile** — Touch-first pass on Konva/React Flow  
4. **Product** — Align hosting and tiers with [docs/MASTER_PLAN.md](docs/MASTER_PLAN.md) when scope is fixed

## 📝 Notes

### Project management and storage

- **Dashboard index** (`projectStore`, persisted): id, type, name, thumbnail, dimensions, timestamps — used for Recent Projects and deletes  
- **Raster / vector**: primarily frame/project data in localStorage / store (see stores)  
- **Stories**: graph and assets in **IndexedDB** (Dexie); index rows stay in sync when you save or open the dashboard  
- **Characters**: large payloads in **IndexedDB** with localStorage fallback (`character-{id}`)

### Raster Animation Details

- Frames store both line data (Konva shapes) and image data (canvas snapshot)
- Thumbnails are automatically generated from canvas content
- Onion skin shows previous frame at 30% opacity
- Drawing persists when switching between frames

### Future: MediaPipe Integration (Character Studio)

When Character Studio is built, it will load MediaPipe models from CDN:
- WASM files: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm`
- Face model: `face_landmarker.task` (468 landmarks)
- Pose model: `pose_landmarker.task` (33 body points)
- Hand model: `hand_landmarker.task` (21 points per hand)

### Performance Tips

- Konva canvas is optimized for smooth drawing at 60 FPS
- Frame thumbnails are generated on-demand and cached
- Persisted data uses localStorage and IndexedDB depending on studio (see above)
- Recommended: Chrome/Edge for best GPU acceleration

### Browser Compatibility

- ✅ Chrome 90+ (recommended)
- ✅ Edge 90+
- ✅ Safari 15+
- ✅ Firefox 88+
- ✅ Mobile Chrome (Android)
- ✅ Mobile Safari (iOS 15+)

## 🐛 Troubleshooting

**Dashboard not showing projects?**
- Check browser localStorage isn't disabled
- Try creating a new project
- Clear cache and reload

**Drawing not appearing?**
- Switch tools (B for brush, E for eraser)
- Check brush size isn't too small
- Try toggling dark mode
- Clear browser cache

**Frames not saving?**
- Drawing data auto-saves when switching frames
- Check browser console for errors
- Ensure localStorage has space available

**Back button not working?**
- Press `` ` `` (backtick) key to return to dashboard
- Or navigate to `http://localhost:5173/` manually

## 📄 License

MIT License - feel free to use for your own projects!

## 🤝 Contributing

Contributions welcome. See the **Roadmap** section above for per-track next steps; run `npm run lint` and `npm run test` before submitting PRs.

---

**Built with ❤️ by GenAI Galaxy**  
Powered by React 19, Vite 7, Konva.js, Zustand, and MediaPipe

**Repository:** [github.com/TheSeeker713/Animate.GenaiGalaxy](https://github.com/TheSeeker713/Animate.GenaiGalaxy)
