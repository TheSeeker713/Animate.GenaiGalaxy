# GenAI Galaxy Animate - Master Plan
## Character Creator Suite

**Last Updated:** February 9, 2026  
**Status:** Active Development  
**Mission:** Free creators from subscription-based tools with professional-grade, web-based character animation software.

---

## 🎯 Executive Summary

GenAI Galaxy Animate is a comprehensive character creation and animation suite built for the web, designed to compete with and surpass Adobe Character Animator, Live2D Cubism, and VTube Studio. Our competitive advantage: **professional features at ethical pricing** with a DaVinci Resolve-inspired business model (excellent free tier + optional paid upgrades).

### Core Value Propositions
1. **Zero Subscription Lock-In** - Own your tools forever with one-time purchase options
2. **Instant Gratification** - 30 seconds from landing to animated character (vs Adobe's 3+ minutes)
3. **Web-Native** - No installation required, works in browser with optional desktop app
4. **AI-Assisted** - Smart auto-rigging, morphing, and animation tools
5. **Universal Exports** - Spine JSON, VRM, GIF, MP4, PSD - compatible with everything
6. **Creator Economy** - 85-95% revenue share on marketplace vs Adobe's 33%

---

## 🏗️ Technical Architecture

### Technology Stack (Current Implementation)

**Frontend Framework:**
- React 19 with TypeScript 5.9.3
- Vite 7.3.1 (fast HMR, optimized builds)
- Tailwind CSS v4 (dark mode support)
- react-router-dom 7 (multi-page navigation)

**State Management:**
- Zustand (lightweight, performant)
- Separate stores: `animationStore`, `vectorStore`, `characterStore`, `projectStore`

**Rendering Engines:**
- **Konva.js** - Interactive editor UI (Canvas 2D)
  - Layer manipulation
  - Bone placement
  - Weight painting
  - Precise controls
- **Pixi.js v8** - Performance layer (WebGL) **[TO BE ADDED]**
  - 60 FPS character playback
  - Real-time face tracking rendering
  - Physics simulation
  - 10x faster than Canvas 2D

**Animation & Rigging:**
- **@pixi-spine/runtime-4.2** - Skeletal animation system **[TO BE ADDED]**
- gl-matrix - Fast matrix/vector math **[TO BE ADDED]**
- Custom IK solver (2-bone IK for arms/legs)

**Face/Body Tracking:**
- **@mediapipe/tasks-vision** - Face landmark detection (468 points)
- MediaPipe Pose - Full body tracking (33 landmarks) **[FUTURE]**
- Kalman filter - Smooth jittery tracking **[TO BE ADDED]**

**Physics & Effects:**
- matter-js - 2D physics for hair/cloth **[TO BE ADDED]**

**Export & Import:**
- gif.js - GIF export with workers (IMPLEMENTED ✅)
- psd.js - Photoshop PSD import/export **[TO BE ADDED]**
- Custom Spine JSON exporter **[TO BE ADDED]**

---

## 🎨 Studio Modules Overview

### 1. Dashboard (IMPLEMENTED ✅)
- Project management (create, open, delete)
- 4 studio cards: Raster, Vector, Character, Story
- Recent projects list
- Dark mode toggle

### 2. Raster Animation Studio (IMPLEMENTED ✅)
- Frame-by-frame drawing with brush/eraser
- Layer management with visibility/lock
- Onion skinning
- Timeline with scrubbing
- Zoom/pan controls
- GIF export
- Shape tools (rectangle, circle)

15. **Simple Puppet Mapping (Face → Canvas)**
    - Create src/utils/puppetMapper.ts
    - Map face data to drawing transformations:
      - **Head tilt**: Calculate angle from eye landmarks → rotate canvas cursor/brush
      - **Mouth open**: Measure lip distance → adjust brush size multiplier
      - **Eyebrows**: Y-position → color saturation shift (optional fun effect)
    - In Canvas component, apply these transformations in real-time when `puppetMode` active

16. **Test & Validate Face Puppet MVP**
    - At this checkpoint: User can draw, then toggle puppet mode, see face tracking, and have head tilt affect drawing angle
    - Verify 30fps performance on desktop
    - Test camera permissions on mobile Safari/Chrome

---

### **Phase 4: Animation Features — Timeline & Playback**

17. **Frame Data Structure**
    - In Zustand store, add:
      - `frames: Array<{ id: string, layers: Layer[], timestamp: number }>`
      - `Layer = { id: string, name: string, visible: boolean, opacity: number, imageData: string }` (dataURL)
    - Initialize with 1 blank frame

18. **Timeline UI Component**
    - Create src/components/Timeline.tsx
    - Horizontal scrollable container with frame thumbnails
    - Each thumbnail: mini canvas preview (64x64px) of composited frame
    - Highlight current frame
    - Click thumbnail to jump to frame

19. **Frame Management Actions**
    - Add buttons in Timeline:
      - **Add Frame**: Duplicate current frame or create blank
      - **Delete Frame**: Remove current (min 1 frame)
      - **Duplicate Frame**: Copy all layers
    - Update Zustand with `addFrame()`, `deleteFrame()`, `duplicateFrame()`, `setCurrentFrame(index)`

20. **Playback Engine**
    - Create src/utils/playbackEngine.ts
    - Use `requestAnimationFrame` + timestamp tracking for accurate FPS
    - Loop through frames at `1000/fps` ms per frame
    - Update `currentFrameIndex` in Zustand during playback
    - Support loop toggle

21. **Playback Controls**
    - In Timeline component, add:
      - Play/Pause button (spacebar shortcut)
      - FPS slider (12-60 fps)
      - Loop checkbox
      - Previous/Next frame buttons (Q/W keys)
    - Connect to Zustand `isPlaying`, `fps`

---

### **Phase 5: Advanced Features — Layers, Rigging, Onion Skin**

22. **Layer Management**
    - Create src/components/LayerPanel.tsx (sidebar or modal)
    - Display layer list for current frame (max 5 layers)
    - Buttons: Add Layer, Delete Layer, Reorder (drag-and-drop or up/down arrows)
    - Toggle visibility, adjust opacity slider per layer
    - Update Zustand `frames[currentFrameIndex].layers`

23. **Multi-Layer Canvas Rendering**
    - In Canvas component, render all visible layers stacked
    - Use Konva `Image` nodes or composite via `toDataURL`
    - Apply opacity transformations
    - Draw to selected layer only

24. **Onion Skin Feature**
    - In Zustand, add `onionSkinEnabled: boolean`
    - In Canvas, when enabled:
      - Draw previous 1-2 frames at 40% opacity below current frame
      - Use different tint color (e.g., red for previous, blue for next)
    - Add toggle button in Toolbar

25. **Rigging System (Basic)**
    - Add to Zustand: `rigs: Array<{ name: string, joints: Joint[] }>`
    - `Joint = { id: string, x: number, y: number, parentId: string | null, rotation: number }`
    - In Canvas, add "Add Joint" tool (click to place joint markers)
    - Draw joints as circles with parent connections (lines)

26. **2-Bone IK Solver**
    - Create src/utils/ikSolver.ts
    - Implement basic inverse kinematics for 2-joint chains
    - Use law of cosines to calculate joint angles
    - Apply IK when puppet mode updates rig target positions

27. **Puppet Rig Recording**
    - When puppet mode active, continuously update rig joint positions from face landmarks
    - Map face points to rig joints (e.g., nose tip → head joint, mouth corners → jaw joints)
    - Add "Record" button to capture rig state sequence as keyframes
    - Store keyframes in current frame's layer metadata

---

### **Phase 6: Export, Polish & PWA**

28. **GIF Export Implementation**
    - Create src/utils/gifExporter.ts
    - Use `gif.js` Web Worker for background encoding
    - Loop through all frames, capture composited canvas as image
    - Set delay per frame: `1000 / fps`
    - Add options modal: loop count, quality
    - Trigger browser download with generated blob

29. **Export UI**
    - Add "Export GIF" button in Toolbar
    - Show progress modal during rendering (gif.js emits progress events)
    - Handle large exports (50+ frames) gracefully

30. **LocalStorage Persistence**
    - In Zustand store, add persist middleware OR custom `useEffect`
    - Save entire state on changes: `frames`, `layers`, `rigs`, `fps`
    - Convert canvas `imageData` to dataURL for storage
    - On app load, restore from localStorage key `genaigalaxy-animate-project`
    - Add manual "Save" / "Load" buttons (optional, since auto-save is active)

31. **Keyboard Shortcuts**
    - Implement global key listener in src/App.tsx:
      - `Q`: Previous frame
      - `W`: Next frame
      - `Space`: Play/Pause
      - `Ctrl+Z`: Undo
      - `Ctrl+Y` / `Ctrl+Shift+Z`: Redo
      - `B`: Brush tool
      - `E`: Eraser tool
      - `P`: Toggle puppet mode
    - Show shortcut help menu (modal or tooltip)

32. **Canvas Zoom & Pan**
    - Add zoom (mouse wheel): scale Konva stage
    - Add pan (middle mouse drag or Spacebar+drag)
    - Reset zoom button

33. **Mobile Touch Support**
    - Test touch events on Canvas (onTouchStart, onTouchMove, onTouchEnd)
    - Adjust toolbar for mobile (compact layout, larger tap targets)
    - Handle mobile camera orientation

34. **MediaPipe Performance Throttling**
    - Cap face detection at 30fps even if higher display refresh rate
    - Use `setInterval` fallback if `requestAnimationFrame` causes jank
    - Add performance mode toggle (lower resolution, skip frames)

35. **Dark Mode Styling**
    - Apply Tailwind dark mode classes throughout
    - Use `bg-gray-900 text-white` for dark, `bg-white text-gray-900` for light
    - Theme toggle persists to localStorage

36. **PWA Setup**
    - Install: `npm i vite-plugin-pwa -D`
    - Add to vite.config.ts: `VitePWA({ ... })`
    - Create public/manifest.json:
      - `name: "GenAI Galaxy Animate"`
      - `short_name: "Animate"`
      - `start_url: "/"`
      - Add icon assets (192x192, 512x512)
    - Enable offline support with service worker

---

### **Phase 7: Deployment to Cloudflare Pages**

37. **Build Configuration**
    - Verify vite.config.ts output dir is `dist`
    - Test production build: `npm run build`
    - Check bundle size (MediaPipe WASM files are large, ~2-5MB)

38. **Cloudflare Pages Setup**
    - Install Wrangler: `npm i -g wrangler` or use `npx`
    - Create wrangler.toml (optional for Pages, but useful for local dev):
      ```toml
      name = "genai-galaxy-animate"
      compatibility_date = "2024-01-01"
      pages_build_output_dir = "dist"
      ```

39. **Deploy to Cloudflare Pages**
    - Run: `npm run build && npx wrangler pages deploy dist --project-name=genai-galaxy-animate`
    - Or connect GitHub repo in Cloudflare dashboard for auto-deploys
    - Note the deployed URL (e.g., `genai-galaxy-animate.pages.dev`)

40. **Configure Custom Domain**
    - In Cloudflare dashboard:
      - Pages project → Custom domains → Add domain
      - Enter `animate.genaigalaxy.com`
      - Create CNAME record: `animate` → `genai-galaxy-animate.pages.dev` (Proxied ✅)
    - Wait for DNS propagation (~5 mins)
    - Verify HTTPS certificate auto-provisioned

41. **Final Testing**
    - Test on production URL: `https://animate.genaigalaxy.com`
    - Verify all features:
      - Drawing tools work
      - Webcam permissions granted
      - Face puppet mode functional
      - Timeline playback smooth
      - GIF export downloads successfully
      - PWA installable
    - Test on mobile (iOS Safari, Android Chrome)

---

### **Verification**

**Local Development:**
- Run `npm run dev` after each phase
- Check browser console for errors
- Test keyboard shortcuts
- Verify Zustand DevTools if installed

**MVP Checkpoint (After Phase 3):**
- Can draw on canvas with brush/eraser ✅
- Webcam shows face tracking overlay ✅
- Head tilt affects drawing angle in puppet mode ✅

**Full Feature Verification (After Phase 6):**
- Create 10-frame animation with 2 layers ✅
- Export as GIF, play in external viewer ✅
- Refresh browser, verify localStorage restored project ✅
- Install PWA, test offline ✅

**Production Verification:**
- HTTPS loads on custom domain ✅
- MediaPipe WASM files load correctly ✅
- GIF export works on mobile ✅
============================================



**Phase 7: Connect Face Tracking to Drawing**
- ⬜ Apply head tilt rotation to brush angle in real-time
- ⬜ Map mouth openness to brush size multiplier
- ⬜ Optional: Eyebrow raise affects color saturation
- ⬜ Test puppet drawing with face movements
- ⬜ Record button to capture puppet movements as frames
- ⬜ Puppet recording to keyframes/timeline

**Phase 8: Layer System**
- ⬜ Layer panel UI (sidebar or modal)
- ⬜ Display layers for current frame (max 5)
- ⬜ Add/delete/reorder layer controls
- ⬜ Layer visibility toggle per layer
- ⬜ Opacity slider per layer (0-100%)
- ⬜ Multi-layer canvas rendering
- ⬜ Draw to selected layer only
- ⬜ Layer compositing

**Phase 9: Advanced Animation**
- ⬜ Onion skin for next frame (forward preview)
- ⬜ Multiple onion skin frames (2 prev + 1 next)
- ⬜ Onion skin color tinting (red=prev, blue=next)
- ⬜ Frame rate optimization for smoother playback
- ⬜ Loop toggle (currently always loops)

**Phase 10: Rigging System (Optional/Advanced)**
- ⬜ Joint placement tool (click to add joints)
- ⬜ Joint data structure in store
- ⬜ Parent-child joint relationships
- ⬜ Visual joint connections (skeleton)
- ⬜ 2-bone IK solver implementation
- ⬜ Map face landmarks to rig joints
- ⬜ Rig recording as keyframes

**Phase 11: GIF Export**
- ⬜ Export modal UI with options
- ⬜ Quality slider (1-100)
- ⬜ Loop count selector (forever, no repeat, N times)
- ⬜ Resolution options
- ⬜ Progress bar during rendering
- ⬜ gif.js worker integration
- ⬜ Frame-by-frame GIF encoding
- ⬜ Download trigger with filename
- ⬜ Test large exports (50+ frames)

**Phase 12: Persistence**
- ⬜ LocalStorage auto-save implementation
- ⬜ Project save/load buttons
- ⬜ Export project as JSON
- ⬜ Import project from JSON
- ⬜ Save/restore all frames, layers, settings
- ⬜ Handle large project sizes

**Phase 13: Canvas Controls**
- ⬜ Zoom in/out (mouse wheel)
- ⬜ Pan canvas (spacebar + drag or middle mouse)
- ⬜ Reset zoom/pan button
- ⬜ Zoom percentage display
- ⬜ Fit to screen option

**Phase 14: Polish & Performance**
- ⬜ Mobile-optimized toolbar layout
- ⬜ Larger touch targets for mobile
- ⬜ MediaPipe performance mode toggle
- ⬜ Frame skip option for low-end devices
- ⬜ Keyboard shortcuts help modal
- ⬜ Loading states for MediaPipe models
- ⬜ Error boundaries for graceful failures
- ⬜ Canvas size presets (480p, 720p, 1080p)

**Phase 15: PWA & Deployment**
- ⬜ vite-plugin-pwa installation
- ⬜ Service worker configuration
- ⬜ manifest.json with app icons
- ⬜ Offline support
- ⬜ App icon assets (192x192, 512x512)
- ⬜ Production build optimization
- ⬜ Deploy to Cloudflare Pages
- ⬜ Configure custom domain: animate.genaigalaxy.com
- ⬜ Test on production HTTPS
- ⬜ Mobile device testing (iOS/Android)

**Testing & Bug Fixes**
- ⬜ Test full animation workflow (draw → frames → play → export)
- ⬜ Test face puppet mode end-to-end
- ⬜ Cross-browser testing (Chrome, Safari, Firefox, Edge)
- ⬜ Mobile browser testing
- ⬜ Performance profiling
- ⬜ Accessibility improvements

=====================================
