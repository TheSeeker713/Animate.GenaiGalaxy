# GenAI Galaxy Animate

A browser-based animation tool with webcam face puppeteering, built with React, Vite, Konva.js, and MediaPipe.

## 🎨 Features

- **Drawing Tools**: Brush and eraser with adjustable size and color
- **Animation Timeline**: Multi-frame animation with playback controls (12-60 FPS)
- **Face Puppeteering** 🎭: Use your webcam and face movements to control drawing (MVP implemented)
- **Layers**: Up to 5 layers per frame with opacity control
- **Onion Skin**: See previous frames for reference
- **GIF Export**: Export animations as looping GIFs
- **Dark Mode**: Eye-friendly dark theme (default)
- **Keyboard Shortcuts**: Fast workflow with shortcuts
- **LocalStorage**: Auto-save your work

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

## ⌨️ Keyboard Shortcuts

- `B` - Brush tool
- `E` - Eraser tool  
- `P` - Toggle puppet mode
- `Space` - Play/Pause animation
- `Q` - Previous frame
- `W` - Next frame
- `Ctrl+Z` - Undo
- `Ctrl+Y` / `Ctrl+Shift+Z` - Redo

## 🎭 Face Puppeteering (MVP)

The face puppet mode is currently implemented with:

- ✅ Real-time face landmark detection (468 points)
- ✅ Visual debug overlay showing detected features
- ✅ Head tilt calculation from eye positions
- ✅ Mouth openness detection
- ✅ Eyebrow raise tracking
- 🚧 Drawing transformation (in progress)
- 🚧 Recording puppet sequences as keyframes (planned)

### How Face Puppet Works

1. Click the **🎭 Puppet** button to enable puppet mode
2. Allow camera permissions when prompted
3. The webcam preview appears in the top-right with face landmarks overlay
4. Your face movements are tracked in real-time:
   - **Head tilt** → will rotate brush angle (Coming soon)
   - **Mouth open** → will increase brush size (Coming soon)
   - **Eyebrow raise** → color shift effects (Coming soon)

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
├── components/       # React components
│   ├── Canvas.tsx    # Main drawing canvas (Konva)
│   ├── Toolbar.tsx   # Drawing tools & controls
│   ├── Timeline.tsx  # Frame management & playback
│   └── WebcamPuppet.tsx # Face tracking integration
├── store/
│   └── useAnimationStore.ts # Zustand state management
├── types/
│   └── index.ts      # TypeScript interfaces
├── utils/
│   ├── puppetMapper.ts  # Face → drawing transformations
│   └── gifExporter.ts   # GIF export logic
├── App.tsx           # Main app shell
└── main.tsx          # Entry point
```

## 🎯 Roadmap

### ✅ Phase 1: Foundation (Complete)
- Project setup with Vite + React + TypeScript
- Tailwind CSS configuration
- Zustand store architecture
- Basic UI layout (toolbar, canvas, timeline)

### ✅ Phase 2: Drawing Core (Complete)
- Konva canvas integration
- Brush and eraser tools
- Undo/redo system
- Toolbar UI with controls

### ✅ Phase 3: Face Puppet MVP (Complete)
- Webcam component with react-webcam
- MediaPipe FaceLandmarker integration
- Real-time face tracking (30fps)
- Debug overlay visualization
- Puppet transformation utilities

### 🚧 Phase 4: Animation Features (In Progress)
- [ ] Frame thumbnail previews
- [ ] Layer panel UI
- [ ] Onion skin rendering
- [ ] Playback engine optimization
- [ ] Apply puppet transforms to drawing

### 📋 Phase 5: Advanced Features (Planned)
- [ ] Simple rigging system (joints)
- [ ] 2-bone IK solver
- [ ] Puppet recording to keyframes
- [ ] GIF export modal with progress
- [ ] LocalStorage persistence
- [ ] Canvas zoom/pan

### 🚀 Phase 6: Polish & Deploy (Planned)
- [ ] PWA setup (vite-plugin-pwa)
- [ ] Mobile touch optimization
- [ ] Performance throttling for MediaPipe
- [ ] Build & deploy to Cloudflare Pages
- [ ] Custom domain: animate.genaigalaxy.com

## 📝 Notes

### MediaPipe Model Loading

The app loads MediaPipe models from CDN:
- WASM files: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm`
- Face model: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`

First load may take a few seconds. Models are cached after initial download.

### Performance Tips

- Face tracking is throttled to ~30 FPS for performance
- Use `Show/Hide Debug` toggle to disable landmark overlay if needed
- Recommended: Chrome/Edge for best GPU acceleration

### Browser Compatibility

- ✅ Chrome 90+ (recommended)
- ✅ Edge 90+
- ✅ Safari 15+ (may need camera permission prompt)
- ⚠️ Firefox 88+ (MediaPipe support may vary)
- ✅ Mobile Chrome (Android)
- ✅ Mobile Safari (iOS 15+)

## 🐛 Troubleshooting

**Camera not showing?**
- Check browser permissions (click lock icon in address bar)
- Make sure you're on HTTPS or localhost
- Try refreshing the page

**Face tracking not working?**
- Ensure good lighting
- Face camera directly
- Wait a few seconds for model to load
- Check browser console for errors

**Drawing not appearing?**
- Try switching tools (B for brush, E for eraser)
- Check if puppet mode is active (disable to draw normally)
- Clear browser cache and reload

## 📄 License

MIT License - feel free to use for your own projects!

## 🤝 Contributing

This is an MVP build. Contributions welcome! Areas that need work:
- Applying puppet transforms to actual drawing
- Recording puppet sequences
- GIF export implementation
- Layer management UI
- Performance optimizations

---

Built with ❤️ by GenAI Galaxy | Powered by MediaPipe & Konva.js
