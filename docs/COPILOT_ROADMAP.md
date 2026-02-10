# GitHub Copilot Roadmap Bible
**Project:** GenAI Galaxy Animate - Character Animation Platform  
**Purpose:** Comprehensive context for AI-assisted development  
**Last Updated:** February 10, 2026  
**Version:** 1.0

> **For AI Assistants:** This document provides complete project context, coding standards, architecture decisions, and development workflows. Always reference this before making code changes.

---

## 🎯 Project Mission

**Break Adobe's subscription stranglehold.** Build professional-grade character creation tools that creators can OWN, not rent.

**Core Values:**
1. Creator freedom over corporate profit
2. Function over form (UI polish comes after solid foundations)
3. Privacy-first (local storage by default)
4. Export freedom (all formats, no lock-in)
5. Transparent pricing (no dark patterns)

---

## 🏗️ Architecture Overview

### Tech Stack (Current)
```
Frontend: React 19 + TypeScript 5.9.3 + Vite 7.3.1
Styling: Tailwind CSS v4
Routing: React Router 7
State: Zustand (lightweight, no Redux complexity)
Rendering: Konva.js (Canvas 2D) - Current editor layer
Storage: localStorage (MVP), IndexedDB (future)
```

### Project Structure
```
src/
├── pages/                    # Route components
│   ├── Dashboard.tsx        # Main hub with 4 studios
│   ├── RasterStudio.tsx     # Frame-by-frame animation ✅
│   ├── VectorStudio.tsx     # Vector drawing & tweening ✅
│   └── CharacterStudio.tsx  # Character rigging & animation ✅
├── components/
│   ├── raster/              # Raster studio components
│   │   ├── Canvas.tsx       # Drawing canvas with visual feedback
│   │   ├── Timeline.tsx     # Frame scrubbing
│   │   ├── Toolbar.tsx      # Drawing tools
│   │   ├── LayersPanel.tsx  # Layer management
│   │   └── ExportModal.tsx  # GIF export
│   ├── vector/              # Vector studio components
│   │   ├── VectorCanvas.tsx     # Shape canvas
│   │   ├── VectorToolbar.tsx    # Shape tools
│   │   └── PropertiesPanel.tsx  # Shape properties
│   └── character/           # Character studio components
│       ├── TemplateGallery.tsx   # Template selection ✅
│       ├── CharacterCanvas.tsx   # Rigging canvas ✅
│       ├── MorphPanel.tsx        # Morph sliders ✅
│       └── ExportModal.tsx       # Multi-format export ✅
├── store/                   # Zustand state management
│   ├── useAnimationStore.ts     # Raster animation state
│   ├── vectorStore.ts           # Vector drawing state
│   ├── characterStore.ts        # Character rigging state ✅
│   └── projectStore.ts          # Global app state
├── types/                   # TypeScript definitions
│   ├── index.ts             # Shared types
│   ├── vector.ts            # Vector-specific types
│   └── character.ts         # Character types (Bone, MorphTarget, etc.)
├── data/
│   └── characterTemplates.ts    # 10 base templates
├── utils/                   # Helper functions
│   ├── gifExporter.ts       # GIF export logic
│   ├── imageLoader.ts       # Image caching singleton ✅
│   └── puppetMapper.ts      # Face tracking mapper (future)
└── App.tsx                  # Root component with routing
```

### Dual-Render Pipeline (Future)
```
┌──────────────────────────────────────┐
│   EDITOR LAYER (Konva.js)           │  ← Current implementation ✅
│   • Canvas 2D for precision         │
│   • Interactive bone placement      │
│   • Layer transforms                │
│   • Morph sliders                   │
└──────────────────────────────────────┘
                ↓ Export Spine JSON
┌──────────────────────────────────────┐
│   PLAYBACK LAYER (Pixi.js + Spine)  │  ← Milestone 6 🔜
│   • WebGL for 60 FPS               │
│   • Physics simulation              │
│   • Face tracking rendering         │
└──────────────────────────────────────┘
```

---

## 📋 Current Implementation Status

### ✅ COMPLETED Features

#### 1. Raster Animation Studio
- **Files:** `src/pages/RasterStudio.tsx`, `src/components/raster/*`
- **Store:** `src/store/useAnimationStore.ts`
- **Features:**
  - Frame-by-frame drawing with Canvas 2D
  - Tools: Brush, Eraser, Rectangle, Circle, Line
  - Layer system with visibility toggles
  - Timeline with scrubbing and playback (FPS control)
  - Onion skinning (prev/next frame overlay)
  - GIF export with gif.js
  - Visual feedback: Brush cursor preview, dimension displays, tool overlays
  - Auto-save to localStorage

#### 2. Vector Studio
- **Files:** `src/pages/VectorStudio.tsx`, `src/components/vector/*`
- **Store:** `src/store/vectorStore.ts`
- **Features:**
  - Shape drawing: Rectangle, Circle, Line, Polygon, Star, Hexagon
  - Properties panel: Stroke, fill, dimensions, rotation
  - Timeline with keyframe tweening
  - Visual feedback: Stroke cursor, snap-to-grid, dimension labels
  - Transform handles

#### 3. Character Studio - Core Systems
- **Files:** `src/pages/CharacterStudio.tsx`, `src/components/character/*`
- **Store:** `src/store/characterStore.ts`
- **Features:**
  - **Template System:** 10 base templates, gallery UI with filter/search
  - **Canvas:** Konva Stage/Layer, zoom/pan, grid, skeleton view
  - **Bone Manipulation:** Click, drag, visual feedback (hover colors, size changes)
  - **Morph System:** Category tabs (Body/Face/Style), sliders with progress bars, randomize/reset buttons
  - **Export:** PNG (2x pixel ratio), Spine JSON 4.0, Project file (JSON)
  - **Undo/Redo:** History stack (20 steps), Ctrl+Z/Ctrl+Y shortcuts, visual buttons
  - **Auto-Save:** 2-second debounce, visual status indicator
  - **Layer Transforms:** 8-point resize handles, rotation
  - **forwardRef Pattern:** Stage ref exposed for export

---

## 🔑 Key Architectural Patterns

### 1. Zustand State Management
**Pattern:**
```typescript
// src/store/characterStore.ts
import { create } from 'zustand'

interface CharacterStore {
  // State
  currentCharacter: Character | null
  selectedBoneId: string | null
  history: Character[]
  historyIndex: number
  
  // Actions
  updateCharacter: (character: Character) => void
  undo: () => void
  redo: () => void
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  // Initial state
  currentCharacter: null,
  selectedBoneId: null,
  history: [],
  historyIndex: -1,
  
  // Actions
  updateCharacter: (character) => {
    const { autoSaveEnabled, saveCharacter } = get()
    addToHistory(character, get, set)
    set({ currentCharacter: character })
    if (autoSaveEnabled) {
      triggerAutoSave(saveCharacter)
    }
  },
  
  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      set({ 
        currentCharacter: JSON.parse(JSON.stringify(history[newIndex])),
        historyIndex: newIndex
      })
    }
  }
}))
```

**Usage in Components:**
```typescript
// Extract only what you need
const { currentCharacter, undo, redo, canUndo } = useCharacterStore()

// Call actions directly
<button onClick={undo} disabled={!canUndo()}>Undo</button>
```

**Rules:**
- ✅ Extract only needed state/actions (avoid full store)
- ✅ Use `get()` inside actions for current state
- ✅ Call `set()` to update state
- ✅ Keep actions simple, delegate complex logic to helpers
- ❌ Don't mutate state directly (always use `set()`)

---

### 2. Auto-Save with Debounce
**Pattern:**
```typescript
// Helper function outside store
let saveTimeout: NodeJS.Timeout | null = null
function triggerAutoSave(saveFunction: () => void) {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    saveFunction()
    saveTimeout = null
  }, 2000) // 2-second delay
}

// In store action
updateCharacter: (character) => {
  addToHistory(character, get, set)
  set({ currentCharacter: character })
  
  const { autoSaveEnabled, saveCharacter } = get()
  if (autoSaveEnabled) {
    triggerAutoSave(saveCharacter)
  }
}
```

**When to Apply:**
- Any user input that modifies state (sliders, text inputs, bone dragging)
- Prevents excessive localStorage writes
- 2-second delay is optimal (responsive but not spammy)

---

### 3. History Stack (Undo/Redo)
**Pattern:**
```typescript
// Helper function
function addToHistory(character: Character, get: any, set: any) {
  const { history, historyIndex, maxHistory } = get()
  
  // Remove future history if we're in the middle
  const newHistory = history.slice(0, historyIndex + 1)
  
  // Add deep clone to prevent mutations
  newHistory.push(JSON.parse(JSON.stringify(character)))
  
  // Limit size
  if (newHistory.length > maxHistory) {
    newHistory.shift()
  } else {
    set({ historyIndex: historyIndex + 1 })
  }
  
  set({ history: newHistory })
}
```

**When to Call:**
- Before every state mutation that should be undoable
- Bone position changes
- Morph slider adjustments
- Layer transforms
- Character property updates

**Rules:**
- ✅ Always deep clone (JSON.parse/stringify for simple objects)
- ✅ Limit history size (20 steps default)
- ✅ Remove future history on new action after undo
- ❌ Don't add to history for UI state (selected tool, panel visibility)

---

### 4. forwardRef for Component Refs
**Pattern:**
```typescript
// Component that needs to expose a ref
import { forwardRef, useImperativeHandle, useRef } from 'react'
import Konva from 'konva'

interface CharacterCanvasProps {
  character: Character
}

const CharacterCanvas = forwardRef<Konva.Stage, CharacterCanvasProps>(
  (props, ref) => {
    const stageRef = useRef<Konva.Stage>(null)
    
    // Expose stage ref to parent
    useImperativeHandle(ref, () => stageRef.current!)
    
    return (
      <Stage ref={stageRef} width={800} height={600}>
        {/* Canvas content */}
      </Stage>
    )
  }
)

CharacterCanvas.displayName = 'CharacterCanvas'
export default CharacterCanvas

// Parent component usage
const CharacterStudio = () => {
  const canvasStageRef = useRef<Konva.Stage>(null)
  
  const handleExport = () => {
    const stage = canvasStageRef.current
    if (stage) {
      const dataURL = stage.toDataURL({ pixelRatio: 2 })
      // Export logic
    }
  }
  
  return <CharacterCanvas ref={canvasStageRef} character={character} />
}
```

**When to Use:**
- Exposing internal refs to parent (e.g., Konva Stage for export)
- DOM node access from parent component
- Imperative APIs (play, pause, reset)

**Rules:**
- ✅ Use `forwardRef` wrapper
- ✅ Use `useImperativeHandle` to control what's exposed
- ✅ Set `displayName` for React DevTools
- ❌ Don't overuse - prefer props and callbacks

---

### 5. Image Caching
**Pattern:**
```typescript
// src/utils/imageLoader.ts
class ImageLoaderService {
  private static instance: ImageLoaderService
  private cache: Map<string, HTMLImageElement> = new Map()
  private loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map()

  static getInstance(): ImageLoaderService {
    if (!ImageLoaderService.instance) {
      ImageLoaderService.instance = new ImageLoaderService()
    }
    return ImageLoaderService.instance
  }

  async loadImage(src: string): Promise<HTMLImageElement> {
    // Check cache first
    if (this.cache.has(src)) {
      return this.cache.get(src)!
    }

    // Check if already loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!
    }

    // Load new image
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.cache.set(src, img)
        this.loadingPromises.delete(src)
        resolve(img)
      }
      img.onerror = reject
      img.src = src
    })

    this.loadingPromises.set(src, promise)
    return promise
  }
}

export const imageLoader = ImageLoaderService.getInstance()

// Usage
const img = await imageLoader.loadImage('/assets/character/head.png')
```

**When to Use:**
- Loading character layer images
- Template thumbnails
- Any repeated image loading

**Benefits:**
- Prevents duplicate network requests
- Faster subsequent loads
- Singleton ensures single cache instance

---

## 🎨 Coding Standards

### TypeScript Rules
```typescript
// ✅ GOOD: Strict typing
interface Character {
  id: string
  name: string
  layers: CharacterLayer[]
  skeleton: Skeleton
  morphState: Record<string, number>
}

// ✅ GOOD: Explicit return types
function loadTemplate(template: CharacterTemplate): Character {
  return { ...template, morphState: {} }
}

// ❌ BAD: Any types
function processData(data: any): any { }

// ❌ BAD: Implicit any
function getData() { }
```

**Enforce:**
- `"strict": true` in tsconfig.json
- No `any` types (use `unknown` if needed)
- Explicit return types on functions
- Interface over type alias for objects

---

### File Naming Conventions
```
✅ GOOD:
- CharacterStudio.tsx (PascalCase for components)
- useAnimationStore.ts (camelCase for hooks/utilities)
- character.ts (lowercase for types/data)
- gifExporter.ts (camelCase for utilities)

❌ BAD:
- character_studio.tsx (snake_case)
- UseAnimationStore.ts (wrong casing)
- Character.ts (types should be lowercase)
```

---

### Import Organization
```typescript
// 1. React imports
import { useState, useEffect, useRef } from 'react'

// 2. Third-party imports
import { Stage, Layer } from 'react-konva'
import Konva from 'konva'

// 3. Internal imports with @/ alias
import { useCharacterStore } from '@/store/characterStore'
import { Character, Bone } from '@/types/character'
import { imageLoader } from '@/utils/imageLoader'

// 4. Relative imports (only for same-directory files)
import { TemplateCard } from './TemplateCard'
```

**Rules:**
- ✅ Use `@/` alias for src imports
- ✅ Group by category
- ✅ One blank line between groups
- ❌ Don't mix relative and alias paths

---

### Component Structure
```typescript
// 1. Imports
import { useState } from 'react'
import { useCharacterStore } from '@/store/characterStore'

// 2. Interface/Type definitions
interface CharacterCanvasProps {
  width: number
  height: number
}

// 3. Component
export default function CharacterCanvas({ width, height }: CharacterCanvasProps) {
  // 3a. Hooks (state, effects, refs)
  const [zoom, setZoom] = useState(1)
  const stageRef = useRef<Konva.Stage>(null)
  const { currentCharacter } = useCharacterStore()
  
  // 3b. Derived state / Memoized values
  const layers = currentCharacter?.layers || []
  
  // 3c. Event handlers
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    // Zoom logic
  }
  
  const handleDragEnd = (boneId: string, e: KonvaEventObject<DragEvent>) => {
    // Update bone position
  }
  
  // 3d. Effects
  useEffect(() => {
    // Load images
  }, [currentCharacter])
  
  // 3e. Render
  return (
    <div className="canvas-container">
      <Stage ref={stageRef} width={width} height={height}>
        {/* Canvas content */}
      </Stage>
    </div>
  )
}
```

---

## 🚨 Common Pitfalls & Solutions

### 1. Event Handler Syntax Errors
```typescript
// ❌ BAD: Missing event parameter
onMouseEnter={() => setHovered(true)}  // OK for simple cases
onMouseLeave(() => setHovered(false))  // ERROR! Missing event param

// ✅ GOOD: Always include event parameter in Konva
onMouseEnter={(e) => setHovered(true)}
onMouseLeave={(e) => setHovered(false)}
```

**Fix:** Always include `(e)` parameter in Konva event handlers, even if unused.

---

### 2. State Mutation
```typescript
// ❌ BAD: Direct mutation
const updateBone = (boneId: string) => {
  currentCharacter.skeleton.bones[0].position.x = 100  // Mutates state!
  set({ currentCharacter })
}

// ✅ GOOD: Immutable update
const updateBone = (boneId: string) => {
  const updated = {
    ...currentCharacter,
    skeleton: {
      ...currentCharacter.skeleton,
      bones: currentCharacter.skeleton.bones.map(bone =>
        bone.id === boneId
          ? { ...bone, position: { ...bone.position, x: 100 } }
          : bone
      )
    }
  }
  set({ currentCharacter: updated })
}
```

**Fix:** Always create new objects/arrays with spread operator.

---

### 3. Missing Cleanup in useEffect
```typescript
// ❌ BAD: Event listener never removed
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown)
}, [])

// ✅ GOOD: Cleanup function
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [handleKeyDown])
```

**Fix:** Always return cleanup function for side effects.

---

### 4. Unnecessary Re-renders
```typescript
// ❌ BAD: Extracts entire store
const store = useCharacterStore()
// Re-renders on ANY store change

// ✅ GOOD: Extract only needed state
const currentCharacter = useCharacterStore(state => state.currentCharacter)
const undo = useCharacterStore(state => state.undo)
// Only re-renders when currentCharacter or undo changes
```

**Fix:** Use selector functions to extract specific state.

---

## 📝 Development Workflow

### Standard Feature Implementation Flow
```
1. Create todo list with manage_todo_list
   - Break feature into 3-7 actionable tasks
   - Mark as "not-started"

2. For each todo:
   a. Mark as "in-progress"
   b. Implement code
   c. Run get_errors to check for compilation errors
   d. Fix any errors
   e. Test manually in browser (dev server)
   f. Mark as "completed"

3. Final checks:
   a. Run get_errors on entire src folder
   b. Fix any issues
   c. Test all affected features
   
4. Documentation:
   a. Update docs/MILESTONES.md with completed work
   b. Update docs/COPILOT_ROADMAP.md with new patterns/lessons
   
5. Commit & Push:
   a. git add .
   b. git commit -m "feat: descriptive message"
   c. git push origin main
```

### Commit Message Format
```
feat: Add bone manipulation system with visual feedback
^--^  ^-------------------------------------------^
│     │
│     └─⫸ Summary (imperative, lowercase)
│
└─⫸ Type: feat | fix | docs | style | refactor | test | chore

Body (optional):
- Bone hover effects with color changes
- Drag and drop for bone repositioning
- Auto-save integration

Footer (optional):
Closes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting (no code change)
- `refactor`: Code change (no feature change)
- `test`: Adding tests
- `chore`: Maintenance (dependencies, config)

---

## 🎯 Next Implementation Priorities

### Immediate (This Sprint)
1. ✅ Documentation updates (MILESTONES.md, MASTER_PLAN.md, TECHNICAL_ROADMAP.md)
2. ✅ Create COPILOT_ROADMAP.md (this file)
3. 🔜 Establish workflow: error check → test → document → commit

### Milestone 5: Face Tracking (Next 2 Weeks)
**Dependencies to Add:**
```bash
npm install @mediapipe/tasks-vision
npm install kalman-filter
```

**Files to Create:**
- `src/utils/faceTracker.ts` - MediaPipe wrapper
- `src/utils/landmarkMapper.ts` - Map landmarks to bones/morphs
- `src/utils/kalmanFilter.ts` - Smooth jittery tracking
- `src/components/character/WebcamPanel.tsx` - Webcam controls
- `src/components/character/FaceTrackingOverlay.tsx` - Debug visualization

**Implementation Steps:**
1. MediaPipe Face Mesh integration (468 landmarks)
2. Request webcam access and display video
3. Landmark detection loop (30 FPS)
4. Map landmarks to character:
   - Eyes → Eye morphs + blink
   - Eyebrows → Eyebrow height morph
   - Mouth → Mouth morphs (width, height, smile)
   - Head → Root bone rotation (pitch, yaw, roll)
5. Kalman filter smoothing
6. Recording system (save tracked animations)
7. Export to video with tracked performance

**Expected Output:**
- User enables webcam
- Character mirrors facial expressions in real-time
- Smooth animations (no jitter)
- Recording captures performance
- Export as MP4 or GIF

---

### Milestone 6: Pixi.js + Spine (Weeks 7-8)
**Dependencies to Add:**
```bash
npm install pixi.js@8.0.0
npm install @pixi-spine/runtime-4.2
npm install matter-js
npm install gl-matrix
```

**Architecture:**
```
CharacterStudio.tsx
├─ Edit Mode (Konva) ← Current
│  └─ CharacterCanvas.tsx
│
└─ Playback Mode (Pixi) ← NEW
   └─ CharacterPreview.tsx
      ├─ Pixi Application
      ├─ Spine character
      └─ Physics simulation
```

**Implementation Steps:**
1. Export Konva character to Spine JSON 4.0 ✅ (Already done!)
2. Create `CharacterPreview.tsx` with Pixi.js
3. Load Spine JSON and render with Pixi Spine
4. Implement mode toggle (Edit ↔ Playback)
5. Add physics with matter.js (hair, cloth)
6. Animation timeline for playback
7. Recording system for Pixi canvas

**Expected Output:**
- Click "Preview" in editor
- Character switches to Pixi rendering at 60 FPS
- Hair bounces, cloth sways with physics
- Play recorded animations
- Export video from Pixi canvas

---

## 🚧 Known Limitations & Workarounds

### 1. localStorage 5MB Limit
**Problem:** Base64 images in localStorage hit 5MB limit with ~10 characters.

**Current Workaround:** Acceptable for MVP (users can have 5-10 characters).

**Future Fix:** Migrate to IndexedDB (50-100MB+ capacity).

**Implementation Plan (Future):**
```typescript
// src/utils/indexedDB.ts
import { openDB, DBSchema } from 'idb'

interface CharacterDB extends DBSchema {
  characters: {
    key: string
    value: Character
  }
  images: {
    key: string
    value: Blob
  }
}

export const db = await openDB<CharacterDB>('animate-db', 1, {
  upgrade(db) {
    db.createObjectStore('characters')
    db.createObjectStore('images')
  }
})

// Store large images as Blobs instead of base64
export async function saveCharacterImage(id: string, blob: Blob) {
  await db.put('images', blob, id)
}
```

---

### 2. History Memory Usage
**Problem:** Storing full character snapshots uses ~1-2MB per entry.

**Current Workaround:** Limit to 20 steps (20-40MB max, acceptable).

**Future Fix:** Implement delta/patch system (store only changes).

**Implementation Plan (Future):**
```typescript
import { compare } from 'fast-json-patch'

// Instead of full snapshot
addToHistory(currentCharacter)

// Store diff
const diff = compare(previousCharacter, currentCharacter)
addDiffToHistory(diff)

// Apply on undo
const restored = applyPatch(previousCharacter, diff)
```

---

### 3. No Template Images
**Problem:** Templates reference placeholder image URLs (404s).

**Current Workaround:** Use solid color rectangles for layers.

**Blocking:** MVP launch requires professional artwork.

**Action Plan:**
1. Commission 50+ character designs from artists
2. Create style guide (anime, realistic, chibi, pixel art)
3. Asset pipeline: PSD → PNG → JSON
4. CDN hosting for images

---

## 🔒 Security & Privacy Considerations

### Current (MVP)
- ✅ All data stored locally (no server)
- ✅ No user accounts or tracking
- ✅ Webcam access requires user permission
- ✅ No telemetry or analytics

### Future (Post-MVP)
- Optional cloud sync (encrypted at rest)
- Anonymous crash reporting (opt-in)
- Usage analytics (opt-in, anonymized)
- Account system for cloud features

**Rules:**
- Privacy-first always
- No data collection without explicit consent
- Export user data on request
- Delete user data on request

---

## 📚 Helpful Resources

### Documentation
- **React 19:** https://react.dev/
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Konva.js:** https://konvajs.org/docs/
- **Pixi.js:** https://pixijs.com/guides
- **Spine:** http://esotericsoftware.com/spine-json-format
- **MediaPipe:** https://developers.google.com/mediapipe

### Code Examples
- Konva transforms: https://konvajs.org/docs/select_and_transform/
- Pixi Spine: https://github.com/pixijs/spine-v8
- MediaPipe Face: https://developers.google.com/mediapipe/solutions/vision/face_landmarker/web_js

---

## 🎓 Learning Resources for AI

### When Implementing New Features
1. **Search codebase first:** Use `grep_search` to find existing patterns
2. **Read existing code:** Similar features show best practices
3. **Check types:** TypeScript definitions in `src/types/`
4. **Review store:** Zustand stores show state management patterns
5. **Follow conventions:** Match naming, structure, and style

### When Stuck
1. **Check MILESTONES.md:** See what's already done
2. **Check TECHNICAL_ROADMAP.md:** See planned implementation
3. **Search GitHub Issues:** Common problems may be documented
4. **Ask user:** Clarify requirements before guessing

---

## 🔄 Session Checklist (Every Session)

### Start of Session
- [ ] Read MILESTONES.md for current status
- [ ] Read last few git commits
- [ ] Check for any new TODOs in code

### During Development
- [ ] Create todo list for complex features
- [ ] Mark todos in-progress/completed
- [ ] Run get_errors after each change
- [ ] Test in browser manually

### End of Session
- [ ] Run get_errors on entire src folder
- [ ] Fix all TypeScript errors
- [ ] Test all affected features
- [ ] Update MILESTONES.md with completed work
- [ ] Update COPILOT_ROADMAP.md with new patterns
- [ ] Commit with descriptive message
- [ ] Push to GitHub

---

## 📊 Success Metrics

### Code Quality
- ✅ Zero TypeScript errors
- ✅ No console warnings in browser
- ✅ No `any` types in codebase
- 🔜 80%+ test coverage (post-MVP)
- 🔜 Lighthouse score >90 (post-MVP)

### Performance
- ✅ Editor (Konva): 30-60 FPS acceptable
- 🔜 Playback (Pixi): 60 FPS locked
- 🔜 Face tracking: 30 FPS minimum
- 🔜 Template loading: <500ms

### User Experience
- ✅ Auto-save works (2-second debounce)
- ✅ Undo/redo works (Ctrl+Z/Y)
- ✅ Export works (PNG, Spine JSON)
- 🔜 Face tracking is smooth and responsive
- 🔜 UI is polished and professional

---

## 🎯 Final Notes for AI Assistants

### Philosophy Reminders
1. **Function over form:** Build solid foundations before UI polish
2. **Test early, test often:** Catch errors before they compound
3. **Document as you go:** Update MILESTONES.md after every feature
4. **Small commits:** Easier to debug and review
5. **Ask when uncertain:** Don't guess critical implementation details

### Decision Framework
**When choosing between approaches:**
1. **Simplicity** > Cleverness
2. **Readability** > Performance (until performance is proven bottleneck)
3. **TypeScript safety** > JavaScript flexibility
4. **User privacy** > Convenience
5. **Standard patterns** > Custom solutions

### Common Questions Answered
**Q: Should I create a new file or modify existing?**  
A: Modify if adding to existing feature, create if new feature.

**Q: Should I use inline styles or Tailwind classes?**  
A: Tailwind classes (utility-first approach).

**Q: Should I optimize for performance now?**  
A: Only if it's a known bottleneck. Readability first for MVP.

**Q: Should I add tests?**  
A: Not yet (post-MVP). Manual testing is fine for now.

**Q: Should I ask the user or make a decision?**  
A: Make reasonable defaults for UI/styling, ask for core logic/features.

---

**End of Copilot Roadmap Bible**  
*Always update this document when new patterns emerge*  
*Version history tracked in git commits*
