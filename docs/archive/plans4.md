
#### **2.2 Morph UI Panel**

**Sidebar Panel (Right Side):**
```
┌──────────────────────────────────────┐
│  ⚙️ Morph & Customize                │
├──────────────────────────────────────┤
│                                      │
│  💪 Body Type                        │
│  ├─ Build [-1 Slim ●──── Buff 1]    │
│  ├─ Height [0.5 Short ●─ Tall 2.0]  │
│  └─ Proportions [0 ●──────── 1]     │
│                                      │
│  🙂 Head & Face                      │
│  ├─ Head Size [0.5 ●──── 2.0]       │
│  ├─ Eye Spacing [0.5 ●─── 1.5]      │
│  └─ Jaw Width [0.7 ●───── 1.3]      │
│                                      │
│  🎨 Art Style                        │
│  ├─ Chibi ↔ Realistic [0 ●── 1]    │
│  ├─ Smooth ↔ Angular [0 ●── 1]     │
│  └─ Edge Softness [0 ●──── 1]       │
│                                      │
│  [🎲 Randomize] [↺ Reset All]       │
│                                      │
│  ─────────────────────────────────  │
│  🔧 Advanced Tools                   │
│  ├─ ☑ Warp Brush (Freeform)         │
│  ├─ ☐ Inflate/Deflate               │
│  ├─ ☐ Mirror Edits (Symmetry)       │
│  └─ ☐ Morph Timeline (Expressions)   │
│                                      │
│  [🔀 Blend Templates...]             │
└──────────────────────────────────────┘
```

**On-Canvas Direct Manipulation:**
- When any layer is selected, show morph handles (small circles) at key points
- Drag handles to deform that specific area
- Snapping hints (grid, symmetry line)
- Visual feedback (transform bounding box, before/after ghost overlay)

#### **2.3 Morph Engine Implementation**

**Simple Morph Application (MVP - Week 2.1):**
```typescript
// Apply morph to layer
function applyMorphToLayer(
  layer: CharacterLayer,
  morphState: { [targetId: string]: number }
): CharacterLayer {
  let transformedLayer = { ...layer };
  
  // For each active morph target
  for (const [targetId, value] of Object.entries(morphState)) {
    const target = getMorphTarget(targetId);
    const deform = target.deformations.find(d => d.layerId === layer.id);
    
    if (deform && deform.scale) {
      // Simple scaling (works for raster/vector)
      transformedLayer.scale = {
        x: transformedLayer.scale.x * (1 + deform.scale.x * value),
        y: transformedLayer.scale.y * (1 + deform.scale.y * value)
      };
    }
    
    if (deform && deform.translate) {
      transformedLayer.position = {
        x: transformedLayer.position.x + deform.translate.x * value,
        y: transformedLayer.position.y + deform.translate.y * value
      };
    }
  }
  
  return transformedLayer;
}
```

**Advanced Morph (Week 2.2):**
- Bezier curve deformation for smooth organic changes
- Vertex-level warping for vectors (move SVG path points)
- Mesh deformation for rasters (using displacement maps or WebGL)

**Blend Multiple Templates:**
```typescript
// Mix two templates (50/50, 70/30, etc.)
function blendTemplates(
  templateA: CharacterTemplate,
  templateB: CharacterTemplate,
  ratio: number // 0 = all A, 1 = all B
): Character {
  // Interpolate morph values
  const blendedMorphs = {};
  for (const targetId in templateA.morphTargets) {
    const valA = templateA.currentMorphState[targetId] || 0;
    const valB = templateB.currentMorphState[targetId] || 0;
    blendedMorphs[targetId] = lerp(valA, valB, ratio);
  }
  
  // Merge layers (union of both)
  const blendedLayers = [...templateA.layers, ...templateB.layers];
  
  // Skeleton is tricky—use templateA as base, adjust lengths
  const blendedSkeleton = interpolateSkeleton(
    templateA.skeleton,
    templateB.skeleton,
    ratio
  );
  
  return {
    // ... character with blended data
  };
}
```

#### **2.4 Real-Time Preview & Performance**

**Optimization Strategies:**
- Morph calculations cached per layer per target
- Debounce slider updates (150ms) to avoid constant re-render
- Use Konva's transformer for simple scale/translate (fast)
- Lazy compute vertex warps only when "Apply" clicked
- WebGL shader for complex deformations (future)

**Preview Modes:**
```
┌─────────────────────────────────────┐
│ Preview: [○ Neutral] [○ Pose 1] ... │
│ [▶️ Test Animation] 3s loop          │
└─────────────────────────────────────┘
```
- Neutral: Default T-pose or standing
- Pose 1-3: Common poses (waving, sitting, action)
- Test Animation: Quick wiggle to check rig fluidity

---

### **Phase 3: Smart Auto-Rigging with Morph Adaptation** (Week 3)

#### **3.1 Auto-Rig Intelligence**

**Base Template Skeleton:**
- Every template ships with a default skeleton
- When user morphs, skeleton auto-adjusts

**Adjustment Rules:**
```typescript
interface RigAdaptationRule {
  morphTargetId: string;
  affectedBones: {
    boneId: string;
    lengthMultiplier?: (value: number) => number;
    positionOffset?: (value: number) => Point;
    angleConstraint?: (value: number) => { min: number, max: number };
  }[];
}

// Example: Height morph stretches legs
const heightRule: RigAdaptationRule = {
  morphTargetId: 'height',
  affectedBones: [
    {
      boneId: 'left-thigh',
      lengthMultiplier: (val) => 0.5 + val * 0.5 // 0.5-2.0 range
    },
    {
      boneId: 'right-thigh',
      lengthMultiplier: (val) => 0.5 + val * 0.5
    },
    {
      boneId: 'spine',
      lengthMultiplier: (val) => 0.8 + val * 0.4
    }
  ]
};
```

**Auto-Rig When Morphs Applied:**
```typescript
function adaptSkeletonToMorphs(
  skeleton: Skeleton,
  morphState: { [targetId: string]: number }
): Skeleton {
  const adaptedSkeleton = cloneDeep(skeleton);
  
  for (const [targetId, value] of Object.entries(morphState)) {
    const rule = getRigAdaptationRule(targetId);
    if (!rule) continue;
    
    for (const adjustment of rule.affectedBones) {
      const bone = adaptedSkeleton.bones.find(b => b.id === adjustment.boneId);
      if (!bone) continue;
      
      if (adjustment.lengthMultiplier) {
        bone.length *= adjustment.lengthMultiplier(value);
      }
      
      if (adjustment.positionOffset) {
        const offset = adjustment.positionOffset(value);
        bone.position.x += offset.x;
        bone.position.y += offset.y;
      }
      
      if (adjustment.angleConstraint) {
        const { min, max } = adjustment.angleConstraint(value);
        bone.minAngle = min;
        bone.maxAngle = max;
      }
    }
  }
  
  return adaptedSkeleton;
}
```

#### **3.2 Manual Rig Editing (Power Users)**

**Rig Panel with Morph Awareness:**
```
┌──────────────────────────────────────┐
│  🦴 Skeleton                         │
├──────────────────────────────────────┤
│  ├─ Root                             │
│  ├─ Spine (Auto-adjusted: +20%)     │
│  │  ├─ Chest                         │
│  │  │  ├─ Head                       │
│  │  │  ├─ L.Shoulder → L.Elbow → ... │
│  │  │  └─ R.Shoulder → R.Elbow → ... │
│  └─ Hips                             │
│     ├─ L.Thigh (Morphed: 150%)      │
│     └─ R.Thigh (Morphed: 150%)      │
│                                      │
│  [➕ Add Bone] [✏️ Edit] [🔗 IK]     │
│  [⚡ Re-Auto-Rig] (resets manual)    │
└──────────────────────────────────────┘
```

**Non-Destructive Workflow:**
- User can override auto-rig adjustments
- "Lock" icon on bones to prevent auto-adjustment
- "Reset to Template" button to undo manual tweaks

---

### **Phase 4: Asset Integration & Customization** (Week 4)

#### **4.1 Asset Browser & Library**

**Swappable Asset System:**
```typescript
interface AssetLibrary {
  eyes: SwappableAsset[];
  mouths: SwappableAsset[];
  hair: SwappableAsset[];
  clothing: SwappableAsset[];
  accessories: SwappableAsset[];
  expressions: SwappableAsset[]; // Whole face swaps
}

// UI: Drag-and-drop or click to replace
```

**Asset Browser Modal:**
```
┌────────────────────────────────────────────────────┐
│  📦 Asset Library    [🔍 Search] [Filter: Eyes]   │
├────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │ Eye1 │ │ Eye2 │ │ Eye3 │ │ Eye4 │ │ +New │    │
│  │ [👁️] │ │ [👁️] │ │ [👁️] │ │ [👁️] │ │      │    │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
│  Cartoon   Anime    Pixel    Glow     Draw        │
│                                                    │
│  [Apply to Character]  [Preview]                  │
└────────────────────────────────────────────────────┘
```

**Create Custom Assets:**
- "Draw New" button opens embedded Raster/Vector tool
- Mini-editor in modal (simplified toolbar)
- Save to personal library
- Auto-tag by type (detected or user-specified)

#### **4.2 Import External Assets**

**Supported Formats:**
- PNG/JPG (raster layers)
- SVG (vector layers)
- PSD (multi-layer import via psd.js)
- Sprite sheets (auto-slice into layers)

**Smart Import Flow:**
```
User drags image file
  ↓
AI/Rule-based detection:
  "This looks like a head—place on head layer?"
  ↓
User confirms or adjusts
  ↓
Auto-scale to template bounds
  ↓
Suggest morph nodes (if vector) or convert to raster
  ↓
Bind to nearest bone
```

#### **4.3 Color Customization**

**Color Picker per Layer:**
```
┌──────────────────────────────────────┐
│  🎨 Colors                           │
├──────────────────────────────────────┤
│  Skin Tone: [████] #FFC1A1          │
│  Hair:      [████] #3D2314          │
│  Clothing:  [████] #4A90E2          │
│  Eyes:      [████] #228B22          │
│                                      │
│  [Save Palette] [Load from Image]   │
└──────────────────────────────────────┘
```

**Advanced Color Tools:**
- Hue shift entire character
- Gradient fills (linear/radial)
- Patterns (stripes, dots)
- Extract palette from imported image

---

### **Phase 5: Expression & Mouth Shape Management** (Week 5)

#### **5.1 Swappable Expressions**

**Expression Library per Template:**
```typescript
interface ExpressionSet {
  neutral: string; // Layer imageData
  happy: string;
  sad: string;
  angry: string;
  surprised: string;
  scared: string;
  custom: ExpressionAsset[];
}

// User can:
// - Pick from preset expressions
// - Draw custom expression in Raster tool
// - Morph between expressions (blend shapes)
```

**Expression UI:**
```
┌──────────────────────────────────────┐
│  😊 Expressions                      │
├──────────────────────────────────────┤
│  [😐] Neutral (Current)              │
│  [😀] Happy  [🙁] Sad  [😡] Angry    │
│  [😲] Surprised  [😨] Scared         │
│                                      │
│  [➕ Create Custom Expression]       │
│  [🔀 Blend Between: Happy + Angry]   │
└──────────────────────────────────────┘
```

#### **5.2 Mouth Shapes for Lip Sync**

**Phoneme Mouth Shapes (A, E, I, O, U, Rest):**
```typescript
interface MouthShapeSet {
  rest: string;
  a: string; // "Apple"
  e: string; // "Egg"
  i: string; // "Eat"
  o: string; // "Open"
  u: string; // "Ooh"
  m: string; // "Mmm" (lips closed)
  f: string; // "Fff"
}
```

**Lip Sync Tool (Phase 5.2):**
- Import audio file
- Auto-detect phonemes with Web Audio API or ML (e.g., Wav2Lip lite)
- Generate mouth shape keyframes
- Fine-tune in timeline

**UI:**
```
┌──────────────────────────────────────┐
│  👄 Mouth Shapes                     │
├──────────────────────────────────────┤
│  [🔇] Rest   [🅰️] A   [🅴] E   [🅸] I │
│  [🅾️] O   [🇺] U   [Ⓜ️] M   [🅵] F    │
│                                      │
│  [🎤 Auto Lip Sync from Audio]       │
│  ├─ Upload: myvoice.mp3              │
│  └─ [Generate Timeline]              │
└──────────────────────────────────────┘
```

---

### **Phase 6: Randomization & Procedural Generation** (Week 6 - Polish)

#### **6.1 Randomize Button**

**Smart Randomization:**
```typescript
function randomizeCharacter(
  template: CharacterTemplate,
  options: RandomizeOptions
): Character {
  const randomMorphs = {};
  
  // Randomly adjust morphs within reasonable bounds
  for (const target of template.morphTargets) {
    const range = target.maxValue - target.minValue;
    const randomValue = target.minValue + Math.random() * range * options.variance;
    randomMorphs[target.id] = randomValue;
  }
  
  // Randomly select swappable assets
  const randomEyes = sample(template.swappableAssets.eyes);
  const randomMouth = sample(template.swappableAssets.mouths);
  const randomHair = sample(template.swappableAssets.hair);
  
  // Apply random colors (within style palette)
  const randomColors = generateColorPalette(template.artStyle);
  
  return {
    // ... character with random configuration
  };
}

interface RandomizeOptions {
  variance: number; // 0-1, how wild the variation
  keepColors: boolean;
  keepExpressions: boolean;
  seed?: number; // For reproducible randoms
}
```

**UI:**
```
┌──────────────────────────────────────┐
│  🎲 Randomize Character              │
├──────────────────────────────────────┤
│  Variance: [─────●──] 60%           │
│  ☑ Randomize Body                   │
│  ☑ Randomize Face                   │
│  ☑ Randomize Colors                 │
│  ☐ Keep Expressions                 │
│                                      │
│  Seed: [______] (optional)           │
│  [🎲 Generate!]  [↺ Revert]         │
└──────────────────────────────────────┘
```

**Use Cases:**
- Generate NPC crowd variations quickly
- Inspire creativity (surprise me!)
- A/B test character designs

#### **6.2 Template Blending**

**Blend Two Templates:**
```
User selects: "Cartoon Male" + "Dragon"
  ↓
UI shows blend slider: [Human ●────── Dragon]
  ↓
At 0%: Full human
At 50%: Humanoid dragon (wings, tail, horns)
At 100%: Full dragon
  ↓
User fine-tunes, keeps human face + dragon body
```

**Blend Algorithm:**
- Morph interpolation (lerp all targets)
- Layer union (combine layers from both)
- Skeleton merge (use human base, add dragon limbs)
- Color palette fusion

---

### **Phase 7: Character Preview & Testing** (Week 7)

#### **7.1 Preview Modes**

**Test Rig Functionality:**
```
┌──────────────────────────────────────┐
│  ▶️ Preview & Test                   │
├──────────────────────────────────────┤
│  Pose:                               │
│  [○ Neutral] [○ Wave] [○ Sit]        │
│  [○ Run] [○ Jump] [○ Custom]         │
│                                      │
│  Animation:                          │
│  [▶️ Test Wiggle] 3s loop            │
│  [▶️ Walk Cycle] (if rigged)         │
│  [▶️ Idle Breathing]                 │
│                                      │
│  [🎥 Record Test] → Save as GIF      │
└──────────────────────────────────────┘
```

**3D-Style Preview (Fake Depth):**
- Rotate character in place (shift layers slightly for parallax)
- Helps visualize depth hierarchy
- "Turntable" mode: Auto-rotate 360°

#### **7.2 Performance Checklist**

**Auto-Validation:**
```
✅ All layers have at least one bone connection
✅ No bones exceed 360° rotation
⚠️ Warning: Head bone has 5 children (may slow down)
✅ Morph targets applied successfully
✅ Auto-rig adapted to morphs
```

**Export Readiness:**
```
Character is ready to:
☑ Animate manually (keyframe)
☑ Control with face tracking
☐ Control with body tracking (no legs rigged)
☑ Export to Raster/Vector Studio
☑ Use in Story Builder
```
