
## 🎭 **Phase 2: Smart Morphing & Customization** (Week 3-4)

### **2.1 Morph System Architecture**

**Based on Research: Optimal Morph Structure**

```typescript
interface MorphTarget {
  id: string
  name: string
  category: 'body' | 'face' | 'style'
  minValue: number
  maxValue: number
  defaultValue: number
  
  // Affects which bones/vertices
  deformations: Array<{
    type: 'bone-scale' | 'bone-translate' | 'vertex-displace'
    targetId: string // bone ID or vertex index
    influence: (value: number) => Transform
  }>
  
  // Visual preview images
  preview: {
    min: string // at minValue
    neutral: string // at defaultValue
    max: string // at maxValue
  }
}

// Example morph targets
const MORPH_LIBRARY: MorphTarget[] = [
  {
    id: 'body-type',
    name: 'Body Build',
    category: 'body',
    minValue: -1, // slim
    maxValue: 1, // muscular
    defaultValue: 0, // average
    deformations: [
      {
        type: 'bone-scale',
        targetId: 'torso',
        influence: (v) => ({ scaleX: 1 + v * 0.3, scaleY: 1 })
      },
      {
        type: 'bone-scale',
        targetId: 'left-upper-arm',
        influence: (v) => ({ scaleX: 1 + v * 0.4, scaleY: 1 })
      }
      // ... more bones
    ]
  },
  {
    id: 'height',
    name: 'Height',
    category: 'body',
    minValue: 0.7, // short
    maxValue: 1.3, // tall
    defaultValue: 1.0,
    deformations: [
      {
        type: 'bone-scale',
        targetId: 'spine',
        influence: (v) => ({ scaleY: v })
      },
      {
        type: 'bone-scale',
        targetId: 'left-thigh',
        influence: (v) => ({ scaleY: v })
      }
    ]
  },
  {
    id: 'head-size',
    name: 'Head Size',
    category: 'face',
    minValue: 0.7,
    maxValue: 1.5,
    defaultValue: 1.0,
    deformations: [
      {
        type: 'bone-scale',
        targetId: 'head',
        influence: (v) => ({ scaleX: v, scaleY: v })
      }
    ]
  },
  {
    id: 'chibi-factor',
    name: 'Chibi Style',
    category: 'style',
    minValue: 0, // realistic
    maxValue: 1, // full chibi
    defaultValue: 0,
    deformations: [
      {
        type: 'bone-scale',
        targetId: 'head',
        influence: (v) => ({ scaleX: 1 + v * 0.8, scaleY: 1 + v * 0.8 })
      },
      {
        type: 'bone-scale',
        targetId: 'torso',
        influence: (v) => ({ scaleY: 1 - v * 0.4 })
      },
      {
        type: 'bone-scale',
        targetId: 'left-upper-arm',
        influence: (v) => ({ scaleX: 1 - v * 0.3, scaleY: 1 - v * 0.3 })
      }
    ]
  }
]
```

### **2.2 Morph UI Panel (Black Desert Online-Inspired)**

```
┌─────────────────────────────────────────────────────────┐
│  ⚙️ Customize Character                                 │
├─────────────────────────────────────────────────────────┤
│  [Presets] [Body] [Face] [Style] [Colors] [Advanced]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💪 Body                                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Build:    Slim ●─────────────── Muscular       │  │
│  │ Height:   Short ──────●──────── Tall            │  │
│  │ Proportions: Even ──────●────── Exaggerated     │  │
│  │ [🎲 Randomize Body] [↺ Reset]                   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  🙂 Face                                                │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Head Size: Small ──────●──────── Large          │  │
│  │ Eye Size:  Small ────────●────── Large          │  │
│  │ Eye Spacing: Close ───────●───── Wide           │  │
│  │ Mouth Size: Small ──────●──────── Wide          │  │
│  │ [🎲 Randomize Face] [↺ Reset]                   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  🎨 Style                                               │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Chibi Factor: Realistic ●────── Full Chibi      │  │
│  │ Edge Style: Smooth ──────●────── Angular        │  │
│  │ [🎲 Random Style] [↺ Reset]                     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [🎲 RANDOMIZE ALL] [↺ Reset to Template]              │
│  [💾 Save as Custom Template]                          │
└─────────────────────────────────────────────────────────┘
```

### **2.3 Preset System (Skyrim-Inspired)**

```typescript
interface CharacterPreset {
  id: string
  name: string
  basedOn: string // template ID
  morphValues: { [morphId: string]: number }
  colors: ColorPalette
  thumbnail: string
  author: string
}

const PRESET_LIBRARY: CharacterPreset[] = [
  {
    id: 'cute-idol',
    name: 'Cute Idol',
    basedOn: 'anime-girl-casual',
    morphValues: {
      'head-size': 1.2,
      'eye-size': 1.3,
      'chibi-factor': 0.3
    },
    colors: {
      hair: '#ff6b9d',
      eyes: '#4ecdc4',
      skin: '#ffd1ba'
    },
    thumbnail: '/presets/cute-idol.png',
    author: 'community'
  },
  // ... 20-30 more presets
]

// Quick preset application
function applyPreset(character: Character, preset: CharacterPreset) {
  // Apply all morph values at once
  Object.entries(preset.morphValues).forEach(([morphId, value]) => {
    applyMorph(character, morphId, value)
  })
  
  // Apply color palette
  applyColors(character, preset.colors)
  
  // Smooth transition (0.5s)
  animateToCurrentState(character, 500)
}
```

---

## 🦴 **Phase 3: Advanced Rigging & Auto-Generation** (Week 5-6)

### **3.1 Bone Hierarchy (Industry Standard - 17 Bones)**

```typescript
const STANDARD_HUMANOID_RIG = {
  root: {
    position: { x: 0, y: 0 },
    children: {
      pelvis: {
        position: { x: 0, y: 0 },
        children: {
          spine1: {
            position: { x: 0, y: 50 },
            children: {
              spine2: {
                position: { x: 0, y: 80 },
                children: {
                  neck: {
                    position: { x: 0, y: 120 },
                    children: {
                      head: {
                        position: { x: 0, y: 150 },
                        constraints: { minAngle: -45, maxAngle: 45 }
                      }
                    }
                  },
                  leftShoulder: {
                    position: { x: -20, y: 110 },
                    children: {
                      leftUpperArm: {
                        position: { x: -40, y: 110 },
                        children: {
                          leftForearm: {
                            position: { x: -70, y: 110 },
                            children: {
                              leftHand: {
                                position: { x: -100, y: 110 }
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  rightShoulder: { /* mirror left */ }
                }
              }
            }
          },
          leftUpperLeg: { /* legs for full-body */ },
          rightUpperLeg: { /* legs for full-body */ }
        }
      }
    }
  }
}
```

### **3.2 Auto-Rig from Image (MediaPipe Pose)**

```typescript
async function autoRigFromImage(image: HTMLImageElement): Promise<Skeleton> {
  // Use MediaPipe Pose to detect key points
  const pose = await poseDetector.estimatePoses(image)
  
  if (!pose || pose.length === 0) {
    throw new Error('No person detected in image. Try a clearer photo.')
  }
  
  const keypoints = pose[0].keypoints
  
  // Map pose landmarks to our bone hierarchy
  const skeleton: Skeleton = {
    bones: [
      {
        id: 'root',
        name: 'Root',
        position: keypoints.find(k => k.name === 'left_hip').position // Center of hips
      },
      {
        id: 'neck',
        name: 'Neck',
        position: keypoints.find(k => k.name === 'nose').position,
        parentId: 'root'
      },
      {
        id: 'head',
        name: 'Head',
        position: {
          x: keypoints.find(k => k.name === 'nose').position.x,
          y: keypoints.find(k => k.name === 'nose').position.y - 30 // Offset for head top
        },
        parentId: 'neck'
      },
      // ... map all other bones
    ]
  }
  
  // Calculate bone lengths from detected positions
  skeleton.bones.forEach(bone => {
    if (bone.parentId) {
      const parent = skeleton.bones.find(b => b.id === bone.parentId)
      bone.length = distance(bone.position, parent.position)
    }
  })
  
  return skeleton
}
```

### **3.3 2-Bone IK for Arms** (From Research)

```typescript
function solveTwoBoneIK(
  shoulder: Vector2,
  target: Vector2, // where user wants hand
  upperArmLength: number,
  forearmLength: number
): { elbowPos: Vector2, handPos: Vector2 } {
  
  const distance = shoulder.distanceTo(target)
  const maxReach = upperArmLength + forearmLength
  
  // If target is unreachable, stretch
  if (distance >= maxReach) {
    const direction = target.subtract(shoulder).normalize()
    return {
      elbowPos: shoulder.add(direction.multiply(upperArmLength)),
      handPos: target
    }
  }
  
  // Use law of cosines to find elbow angle
  const a = upperArmLength
  const b = forearmLength
  const c = distance
  
  const angleAtElbow = Math.acos((a * a + b * b - c * c) / (2 * a * b))
  const angleAtShoulder = Math.acos((a * a + c * c - b * b) / (2 * a * c))
  
  // Calculate elbow position
  const shoulderToTarget = target.subtract(shoulder)
  const shoulderAngle = Math.atan2(shoulderToTarget.y, shoulderToTarget.x)
  
  const elbowAngle = shoulderAngle + angleAtShoulder
  const elbowPos = {
    x: shoulder.x + Math.cos(elbowAngle) * upperArmLength,
    y: shoulder.y + Math.sin(elbowAngle) * upperArmLength
  }
  
  return { elbowPos, handPos: target }
}
```

---

## 🎥 **Phase 4: Face Tracking & Performance** (Week 7-8)

### **4.1 Enhanced Face Tracking (With Kalman Filter)**

```typescript
// Smooth jittery tracking data
class TrackingSmooth {
  private filters: Map<string, KalmanFilter> = new Map()
  
  smooth(landmark: string, value: number): number {
    if (!this.filters.has(landmark)) {
      this.filters.set(landmark, new KalmanFilter({
        processNoise: 0.01, // How much we trust the model
        measurementNoise: 0.1, // How much we trust the measurement
        estimationError: 1
      }))
    }
    
    return this.filters.get(landmark).update(value)
  }
}

// Apply to face tracking
async function trackFace(video: HTMLVideoElement) {
  const smoother = new TrackingSmooth()
  
  const results = await faceLandmarker.detectForVideo(video, Date.now())
  
  if (results.faceLandmarks && results.faceLandmarks.length > 0) {
    const landmarks = results.faceLandmarks[0]
    
    // Calculate parameters smooth
    const headRotY = smoother.smooth('headRotY', calculateHeadRotation(landmarks).y)
    const mouthOpen = smoother.smooth('mouthOpen', calculateMouthOpen(landmarks))
    const leftEyeBlink = smoother.smooth('leftEye', calculateEyeBlink(landmarks, 'left'))
    const rightEyeBlink = smoother.smooth('rightEye', calculateEyeBlink(landmarks, 'right'))
    
    // Map to character
    return {
      headRotation: { x: 0, y: headRotY, z: 0 },
      mouthOpen: Math.min(mouthOpen, 1.0),
      leftEyeBlink,
      rightEyeBlink,
      expressionWeights: calculateExpressionWeights(landmarks)
    }
  }
}
```

### **4.2 Expression Blend Shape System** (ARKit Standard - Simplified)

```typescript
// 20 core blend shapes (subset of ARKit's 52)
const CORE_BLEND_SHAPES = [
  'jaw_open',             // Mouth open
  'mouth_smile_left',     // Smile left corner
  'mouth_smile_right',    // Smile right corner
  'mouth_frown_left',     // Frown
  'mouth_frown_right',
  'mouth_pucker',         // Kiss lips
  'eye_blink_left',       // Close left eye
  'eye_blink_right',      // Close right eye
  'eye_wide_left',        // Surprise eyes
  'eye_wide_right',
  'brow_inner_up',        // Sad eyebrows
  'brow_outer_up_left',   // Raise eyebrow
  'brow_outer_up_right',
  'brow_down_left',       // Angry eyebrows
  'brow_down_right',
  'cheek_puff',           // Puff cheeks
  'cheek_squint_left',    // Smile squint
  'cheek_squint_right',
  'nose_sneer_left',      // Nose scrunch
  'nose_sneer_right'
]

// Map face landmarks to blend shapes
function calculateBlendShapes(landmarks: FaceLandmark[]): BlendShapeWeights {
  const weights: { [shape: string]: number } = {}
  
  // Jaw open (mouth height)
  const mouthTop = landmarks[13] // Upper lip
  const mouthBottom = landmarks[14] // Lower lip
  weights['jaw_open'] = (mouthBottom.y - mouthTop.y) / 20 // Normalize
  
  // Smile (mouth corner movement)
  const mouthLeft = landmarks[61]
  const mouthRight = landmarks[291]
  const neutralMouthWidth = 0.1  // Calibrated neutral
  const currentMouthWidth = Math.abs(mouthRight.x - mouthLeft.x)
  weights['mouth_smile_left'] = Math.max(0, (currentMouthWidth - neutralMouthWidth) * 5)
  weights['mouth_smile_right'] = weights['mouth_smile_left']
  
  // Eye blink (eye aspect ratio)
  const leftEyeHeight = calculateEyeAspectRatio(landmarks, 'left')
  const rightEyeHeight = calculateEyeAspectRatio(landmarks, 'right')
  weights['eye_blink_left'] = 1 - leftEyeHeight
  weights['eye_blink_right'] = 1 - rightEyeHeight
  
  // ... calculate all 20 blend shapes
  
  return weights
}

// Apply blend shapes to character
function applyBlendShapesToCharacter(
  character: PIXI.spine.Spine,
  blendShapes: BlendShapeWeights
) {
  // Map blend shapes to Spine bones
  character.skeleton.findBone('jaw').rotation = blendShapes['jaw_open'] * 25
  character.skeleton.findBone('mouth-left').rotation = blendShapes['mouth_smile_left'] * 10
  character.skeleton.findBone('mouth-right').rotation = blendShapes['mouth_smile_right'] * 10
  
  // Swap mouth textures for phonemes
  if (blendShapes['jaw_open'] > 0.7) {
    character.skeleton.setAttachment('mouth-slot', 'mouth-A')
  } else if (blendShapes['mouth_smile_left'] > 0.5) {
    character.skeleton.setAttachment('mouth-slot', 'mouth-E')
  } else {
    character.skeleton.setAttachment('mouth-slot', 'mouth-rest')
  }
  
  // Eyes
  if (blendShapes['eye_blink_left'] > 0.8) {
    character.skeleton.setAttachment('left-eye-slot', 'eye-closed')
  }
  // ... etc
}
```

### **4.3 Performance Recording System**

```typescript
class PerformanceRecorder {
  private frames: RecordedFrame[] = []
  private recording: boolean = false
  private startTime: number = 0
  
  start() {
    this.frames = []
    this.startTime = Date.now()
    this.recording = true
    console.log('🔴 Recording started')
  }
  
  captureFrame(pose: CharacterPose) {
    if (!this.recording) return
    
    const frame: RecordedFrame = {
      time: Date.now() - this.startTime,
      bones: {},
      blendShapes: {}
    }
    
    // Capture all bone transforms
    pose.bones.forEach(bone => {
      frame.bones[bone.id] = {
        position: { ...bone.position },
        rotation: bone.rotation,
        scale: { ...bone.scale }
      }
    })
    
    // Capture blend shape weights
    frame.blendShapes = { ...pose.blendShapes }
    
    this.frames.push(frame)
  }
  
  stop(): Animation {
    this.recording = false
    console.log(`⏹️ Recording stopped: ${this.frames.length} frames`)
    
    // Compress to keyframes (remove redundant frames)
    const keyframes = this.compressToKeyframes(this.frames)
    
    return {
      name: `Recording ${new Date().toISOString()}`,
      duration: this.frames[this.frames.length - 1].time,
      fps: this.frames.length / (this.duration / 1000),
      keyframes,
      metadata: {
        recordedAt: new Date(),
        frameCount: this.frames.length,
        keyframeCount: keyframes.length,
        compressionRatio: keyframes.length / this.frames.length
      }
    }
  }
  
  private compressToKeyframes(frames: RecordedFrame[]): Keyframe[] {
    const keyframes: Keyframe[] = [frames[0]] // Always keep first frame
    
    for (let i = 1; i < frames.length - 1; i++) {
      const prev = frames[i - 1]
      const current = frames[i]
      const next = frames[i + 1]
      
      // Keep frame if significant change detected
      if (this.hasSignificantChange(prev, current, next)) {
        keyframes.push(current)
      }
    }
    
    keyframes.push(frames[frames.length - 1]) // Always keep last frame
    
    return keyframes
  }
  
  private hasSignificantChange(prev: RecordedFrame, current: RecordedFrame, next: RecordedFrame): boolean {
    // Check if motion direction changes (indicates keyframe)
    for (const boneId in current.bones) {
      const prevPos = prev.bones[boneId].position
      const currPos = current.bones[boneId].position
      const nextPos = next.bones[boneId].position
      
      const velocity1 = { x: currPos.x - prevPos.x, y: currPos.y - prevPos.y }
      const velocity2 = { x: nextPos.x - currPos.x, y: nextPos.y - currPos.y }
      
      // Dot product to detect direction change
      const dotProduct = velocity1.x * velocity2.x + velocity1.y * velocity2.y
      
      if (dotProduct < 0) {
        return true // Direction changed, keep as keyframe
      }
      
      // Or if movement is large
      const distance = Math.sqrt(velocity1.x ** 2 + velocity1.y ** 2)
      if (distance > 2) { // pixels
        return true
      }
    }
    
    return false
  }
}
```

---
