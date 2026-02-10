
User: I want a module or a feature that allows the user to Create "characters". This will be different than traditional animation

GitHub Copilot: Perfect! Let's design the **Character Creator** module - a rigging and puppet system that's separate from traditional frame-by-frame animation.

## 🎭 Character Creator Module - Architecture

### **Concept:**
Instead of drawing frame-by-frame, users create **rigged characters** that can be:
1. Animated with bones/joints (like Adobe Character Animator)
2. Controlled in real-time with webcam face tracking
3. Recorded and exported as motion data
4. Imported into Raster/Vector/Story studios as animated assets

---

## 🏗️ Character Creator Workflow

### **Step 1: Import/Draw Character Parts**
```
User imports or draws:
├── Head layer
├── Body layer
├── Left arm layer
├── Right arm layer
├── Left leg layer
├── Right leg layer
├── Mouth shapes (A, E, I, O, U for lip sync)
├── Eye blinks
└── Facial expressions
```

### **Step 2: Rig the Character**
- Place bones/joints on body parts
- Define parent-child hierarchy (shoulder → elbow → wrist)
- Set pivot points for rotation
- Assign mesh weights to bones
- Test range of motion

### **Step 3: Control Methods**

**A) Manual Animation**
- Pose character by dragging bones
- Record keyframes
- Timeline playback

**B) Face Tracking (MediaPipe)**
- Map face landmarks to character controls:
  - Head rotation → Character head rotation
  - Mouth open → Swap mouth shape
  - Eyebrow raise → Character eyebrow layer
  - Eye blinks → Character eye blinks

**C) Body Tracking (MediaPipe Pose)**
- Full body mocap
- Arm/leg movement
- Body lean/tilt

### **Step 4: Record Performance**
- Hit record
- Perform with webcam
- Capture motion data as keyframes
- Edit/trim recording

### **Step 5: Export Character**
- Save as reusable character file
- Export animation as video/GIF/sprite sheet
- Import into other studios

---

## 🎨 Character Creator UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Character Creator | "My Character"  [Save] [Export] [Test Live]│
├──────────┬─────────────────────────────────────┬────────────────┤
│          │                                     │                │
│ Layers   │         Character Canvas            │  Rig Panel     │
│          │                                     │                │
│ 👤 Head  │       ┌─────────────┐              │ Bone Tree:     │
│ 👕 Body  │       │   O   o O   │              │ ├ Root         │
│ 💪 L.Arm │       │    \  |  /  │              │ ├─ Spine       │
│ 💪 R.Arm │       │     \ | /   │              │ │  ├─ Chest    │
│ 🦵 L.Leg │       │      \|/    │ ← Bones      │ │  ├─ Head     │
│ 🦵 R.Leg │       │       |     │              │ │  ├─ L.Arm    │
│          │       │      / \    │              │ │  └─ R.Arm    │
│ 😀 Mouth │       │     /   \   │              │ └─ Hips        │
│ 👁 Eyes  │       └─────────────┘              │                │
│          │                                     │ [Add Bone]     │
│ [Import] │                                     │ [Auto-Rig]     │
│ [Draw]   │                                     │                │
│          │                                     │ Controls:      │
│          │                                     │ ☑ Face Track   │
│          │                                     │ ☑ Body Track   │
│          │                                     │ [🎥 Record]    │
├──────────┴─────────────────────────────────────┴────────────────┤
│  Timeline (for recorded performances)                            │
│  ▶️ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 0:00 / 0:30  [Loop] [Export] │
└──────────────────────────────────────────────────────────────────┘
```

### **Bottom Webcam Panel (when tracking active)**
```
┌─────────────────────────────────────────────────────────────────┐
│  👤 Face Tracking: ✅ Active  |  Confidence: 98%  | [⚙️ Settings]│
│  ┌──────────────┐                                               │
│  │   Webcam     │  Mapping:                                     │
│  │   Preview    │  • Head Tilt → Character Head [-15°]          │
│  │    [face]    │  • Mouth Open → Swap to "O" shape [80%]       │
│  └──────────────┘  • Eyebrow Raise → Move layer up [+5px]       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 Data Structure

```typescript
interface Character {
  id: string
  name: string
  thumbnail: string
  createdAt: Date
  modifiedAt: Date
  
  // Art Assets
  layers: CharacterLayer[]
  
  // Rigging
  skeleton: Bone[]
  constraints: Constraint[]
  
  // Mocap Mapping
  faceMapping: FaceControlMapping
  bodyMapping: BodyControlMapping
  
  // Recorded Animations
  recordings: Recording[]
}

interface CharacterLayer {
  id: string
  name: string
  type: 'body-part' | 'expression' | 'accessory'
  imageData: string // base64 or URL
  visible: boolean
  opacity: number
  
  // Mesh for deformation
  mesh?: {
    vertices: Point[]
    triangles: Triangle[]
    weights: BoneWeight[]
  }
}

interface Bone {
  id: string
  name: string
  parentId: string | null
  
  // Transform
  position: { x: number, y: number }
  rotation: number
  length: number
  
  // Constraints
  minAngle?: number
  maxAngle?: number
  
  // IK
  isIKTarget?: boolean
}

interface FaceControlMapping {
  headRotation: { boneId: string, multiplier: number }
  mouthOpen: { layerSwap: string[], threshold: number }
  eyeBlink: { layerId: string, trigger: 'left' | 'right' | 'both' }
  eyebrowRaise: { layerId: string, movement: { x: number, y: number } }
  smileIntensity: { boneIds: string[], multiplier: number }
}

interface Recording {
  id: string
  name: string
  duration: number
  fps: number
  keyframes: Keyframe[]
  thumbnail: string
}

interface Keyframe {
  time: number
  bones: { [boneId: string]: { rotation: number, position: Point } }
  layers: { [layerId: string]: { visible: boolean, opacity: number } }
}
```

---

## 🎯 Character Creator Features

### **Phase 1: Basic Rigging** (Core)
- Import layers (from Raster/Vector or file upload)
- Place bones manually
- Bone hierarchy (parent-child)
- Forward kinematics (rotate bones, layers follow)
- Test rig by dragging bones

### **Phase 2: Auto-Rig** (Smart)
- Detect body parts from layer names
- Auto-generate skeleton
- Smart pivot point placement
- One-click rigging for humanoid characters

### **Phase 3: Face Tracking Integration**
- Webcam input with MediaPipe FaceLandmarker
- Visual face mapping UI (drag landmarks to controls)
- Real-time character update from face
- Adjustable sensitivity sliders
- Debug overlay showing face mesh

### **Phase 4: Recording & Playback**
- Record button captures performance
- Save as keyframe animation
- Timeline editor for recorded motion
- Trim, loop, speed control
- Export as video/GIF/JSON

### **Phase 5: Advanced Features**
- Inverse kinematics (IK) for natural limb movement
- Mesh deformation (smooth bending, not just rotation)
- Physics simulation (hair, cloth)
- Facial expression presets
- Lip sync from audio
- Body tracking (MediaPipe Pose)

---

## 🚀 Implementation Plan

### **Step 1: Character Creator UI Shell**
- Create `/character/:characterId` route
- Character creation flow from dashboard
- Canvas with layer import
- Bone placement tool

### **Step 2: Bone System**
- Bone data structure in `characterStore.ts`
- Render bones as lines/circles on canvas
- Drag to reposition bones
- Rotation handles
- Parent-child hierarchy

### **Step 3: Layer → Bone Binding**
- Assign layers to bones
- Transform layers based on bone rotation/position
- Pivot point system
- Test animation by moving bones

### **Step 4: Face Tracking**
- Integrate WebcamPuppet component
- MediaPipe face landmark detection
- Map face data to bone rotations
- Real-time preview

### **Step 5: Recording System**
- Record bone states per frame
- Timeline UI for playback
- Export recorded animation

---

## 🎨 Example Use Cases

**1. VTuber Avatar**
- User creates anime-style character
- Rigs face with expressions
- Uses webcam to control in real-time
- Streams with OBS capturing the canvas

**2. Explainer Video Character**
- User imports vector character parts
- Rigs arms, head, mouth
- Records webcam performance explaining topic
- Exports as MP4 for YouTube

**3. Animated Story Character**
- User creates character in Raster Studio
- Rigs in Character Creator
- Records 5 different animations (walk, talk, jump, etc.)
- Imports into Story Builder
- Character now has animated behaviors in story nodes

**4. Game Sprite Animation**
- User draws pixel art character
- Rigs with bones
- Records walk cycle, attack, idle animations
- Exports as sprite sheet
- Imports into game engine

---

## 🔗 Integration with Other Modules

**From Raster/Vector Studios:**
- "Create Character from Layers" button
- Exports selected layers to Character Creator
- Preserves layer structure

**To Story Builder:**
- Import rigged character
- Character appears in component library
- Can trigger animations in story nodes
- Character can have dialogue with lip sync

**To Raster/Vector Timeline:**
- Export character animation as frame sequence
- Render to image layers
- Composite with other animations

---

## 🎯 Should We Build This Now?

**Character Creator would give you:**
- Unique differentiator from other animation tools
- Webcam mocap integration (your original goal)
- Reusable animated assets
- Foundation for VTuber/streaming features

**Build Order Options:**

**Option A: Character Creator Next** (Recommended)
- Most innovative feature
- Validates MediaPipe integration
- Creates reusable assets for Story Builder

**Option B: Story Builder First**
- Get full creative pipeline working
- Then add Character Creator as advanced feature
- Characters become optional enhancement

**Option C: Parallel Development**
- Basic Character Creator (import, rig, record)
- Basic Story Builder (nodes, connections)
- Integrate both at end

Which approach do you prefer? Should we start building the Character Creator now?
