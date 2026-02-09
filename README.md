# GenAI Galaxy Animate

A professional multi-tool creation suite combining frame-by-frame animation, vector graphics, character rigging with motion capture, and interactive story building—all in one browser-based application.

## 🌟 Overview

GenAI Galaxy Animate is an **Adobe Creative Suite-style** environment with four specialized studios:

1. **🎨 Raster Animation Studio** (Available Now) - Photoshop-meets-Animate for frame-by-frame bitmap animation
2. **📐 Vector Studio** (Coming Soon) - Illustrator-style vector graphics with tweening
3. **🎭 Character Studio** (Coming Soon) - Character rigging with webcam face/body puppeteering  
4. **📖 Story Builder** (Coming Soon) - Arcweave-inspired node-based interactive storytelling

## 🎨 Current Features (Raster Animation Studio)

- **Drawing Tools**: Brush and eraser with adjustable size and color
- **Frame-by-Frame Animation**: Multi-frame animation with playback controls (12-60 FPS)
- **Onion Skin**: See previous frame as 30% opacity overlay for smooth animation
- **Timeline**: Actual canvas thumbnails for each frame
- **Dark Mode**: Eye-friendly dark theme (default)
- **Keyboard Shortcuts**: Professional workflow with shortcuts
- **Project Management**: Dashboard with project cards, localStorage persistence
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

## 🗂️ Project Structure

```
src/
├── pages/            # Route pages
│   ├── Dashboard.tsx         # Main menu/project management
│   └── RasterStudio.tsx      # Raster animation workspace
├── components/       # React components by studio
│   ├── raster/
│   │   ├── Canvas.tsx        # Konva drawing canvas
│   │   ├── Toolbar.tsx       # Drawing tools & controls
│   │   └── Timeline.tsx      # Frame timeline with thumbnails
│   └── WebcamPuppet.tsx      # Face tracking (for Character Studio)
├── store/
│   ├── projectStore.ts       # Project CRUD with localStorage
│   └── useAnimationStore.ts  # Raster animation state
├── types/
│   └── index.ts      # TypeScript interfaces
├── utils/
│   ├── puppetMapper.ts       # Face → rig transformations (planned)
│   └── gifExporter.ts        # GIF export logic (planned)
├── App.tsx           # Router & route config
└── main.tsx          # Entry point
```

## 🎯 Roadmap

### ✅ Phase 1: Foundation (Complete)
- Project setup with Vite + React 19 + TypeScript
- Tailwind CSS v4 configuration
- Zustand store architecture
- Dashboard landing page with project management
- React Router for multi-page navigation

### ✅ Phase 2: Raster Animation Core (Complete)
- Konva canvas integration
- Brush and eraser tools with size/color controls
- Frame-by-frame animation system
- Timeline with actual drawing thumbnails
- Onion skin feature (previous frame overlay)
- Playback engine (12-60 FPS)
- Project persistence with localStorage

### ✅ Phase 3: Multi-Tool Architecture (Complete)
- Dashboard as main entry point
- Project type system (raster/vector/character/story)
- Routing structure for studio modules
- Component organization (pages/, components/raster/)
- projectStore with CRUD operations

### 🚧 Phase 4: Raster Studio Enhancement (Current Sprint)
- [ ] Selection tools (rectangle, lasso, magic wand)
- [ ] Transform tool (move, scale, rotate selected area)
- [ ] Shape primitives (rectangle, ellipse, line, polygon)
- [ ] Text tool with font selector
- [ ] Color picker with eyedropper
- [ ] Layers panel (unlimited layers per frame)
- [ ] Layer blend modes
- [ ] GIF/video export with progress modal
- [ ] Canvas zoom/pan controls

### 📋 Phase 5: Vector Studio (Planned)
- [ ] SVG canvas with react-konva or Fabric.js
- [ ] Pen tool (Bézier curves)
- [ ] Shape tools (paths, stars, polygons)
- [ ] Tweening engine (shape morphing, position, rotation, scale)
- [ ] Easing curves editor
- [ ] Symbol/component system (reusable vector assets)
- [ ] Export as SVG, JSON, or video

### 📋 Phase 6: Character Studio (Planned)
- [ ] Character rig builder (bone hierarchy)
- [ ] Webcam integration (face + body tracking)
- [ ] MediaPipe Holistic (face 468 + pose 33 + hands 21×2 landmarks)
- [ ] IK solver (2-bone and multi-bone)
- [ ] Puppet control mapping UI
- [ ] Performance recording as keyframe animation
- [ ] Export as video or reusable rig file

### 📋 Phase 7: Story Builder (Planned)
- [ ] Node-based canvas (Arcweave/Twine-style)
- [ ] Story node types (scene, dialogue, choice, variable)
- [ ] Connection lines with conditional logic
- [ ] Import animations from other studios as assets
- [ ] Play mode for interactive story testing
- [ ] Export as JSON, HTML5 game, or interactive video

### 🚀 Phase 8: Polish & Deploy (Future)
- [ ] PWA setup (vite-plugin-pwa)
- [ ] Mobile/tablet touch optimization
- [ ] Keyboard shortcut configuration
- [ ] Theme system (light/dark/custom)
- [ ] Build & deploy to Cloudflare Pages
- [ ] Custom domain: animate.genaigalaxy.com

## 📝 Notes

### Project Management

Projects are stored in browser localStorage with:
- Unique ID (nanoid)
- Project type (raster/vector/character/story)
- Canvas dimensions & FPS
- Thumbnail image (base64)
- Created/updated timestamps

Each studio type has isolated state management and dedicated routes.

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
- localStorage handles project persistence automatically
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

Contributions welcome! Current priorities:

**Raster Studio Enhancements**
- Selection tools (rectangle, lasso)
- Transform controls
- Layers panel with blend modes
- GIF/video export

**New Studios**
- Vector Studio (SVG canvas + tweening)
- Character Studio (webcam puppeteering)
- Story Builder (node-based narrative)

**General Improvements**
- Mobile/touch optimization
- Keyboard shortcut customization
- Performance optimizations
- Test coverage

---

**Built with ❤️ by GenAI Galaxy**  
Powered by React 19, Vite 7, Konva.js, Zustand, and MediaPipe

**Repository:** [github.com/TheSeeker713/Animate.GenaiGalaxy](https://github.com/TheSeeker713/Animate.GenaiGalaxy)
