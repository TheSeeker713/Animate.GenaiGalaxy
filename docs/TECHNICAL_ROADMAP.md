# Technical Implementation Roadmap
**Last Updated:** February 9, 2026  
**Version:** 2.0  
**For:** GenAI Galaxy Animate Character Studio

---

## 📋 Overview

This document provides detailed technical specifications for implementing the Character Studio. Read [MASTER_PLAN.md](./MASTER_PLAN.md) first for business context and feature overview.

---

## 🏗️ Architecture Deep Dive

### Dual-Render Pipeline (Why Two Layers?)

**Problem:** Canvas 2D is precise but slow. WebGL is fast but complex for editing.

**Solution:** Split concerns:

```typescript
// EDITING MODE (Konva.js)
class CharacterEditor {
  canvas: Konva.Stage
  
  // User interactions:
  - Place bones with mouse clicks
  - Paint mesh weights with brush
  - Drag layer transforms
  - Fine-tune joint constraints
  
  // Benefits:
  - Familiar Canvas 2D API
  - Pixel-perfect precision
  - Easy hit detection
  - Simple transforms
}

// PLAYBACK MODE (Pixi.js + Spine)
class CharacterRenderer {
  app: PIXI.Application
  character: PIXI.spine.Spine
  
  // Performance features:
  - GPU-accelerated skinning
  - 60 FPS guaranteed
  - Physics simulation
  - Real-time face tracking
  
  // Benefits:
  - 10x faster rendering
  - 100x more vertices
  - Smooth animations
  - Professional quality
}
```

**Workflow:**
1. User edits in Konva (precise, interactive)
2. Click "Preview" → Export to Spine JSON
3. Pixi.js loads Spine data
4. Character animates at 60 FPS
5. Recording captures Spine animation
6. Export as video/GIF/sprite sheet

---

## 📦 Dependencies to Add

```bash
# Character Studio Core
npm install pixi.js@8.0.0
npm install @pixi-spine/runtime-4.2
npm install gl-matrix
npm install matter-js

# Smoothing & Math
npm install kalman-filter
npm install bezier-js

# Import/Export
npm install psd.js
npm install jszip

# Optional (Phase 2+)
npm install @tensorflow/tfjs  # For AI features
npm install comlink  # Web Worker communication
```

---

## 🎭 Phase 1: Template System (Weeks 1-2)

### Goal
Launch with 10 base character templates that users can instantly customize.

### 1.1 Template Data Structure

```typescript
// src/types/characterTemplate.ts
export interface CharacterTemplate {
  id: string  // e.g., "anime-girl-casual-v1"
  version: string  // Template version for updates
  name: string
  description: string
  thumbnail: string  // CDN URL
  
  // Categorization
  category: 'humanoid' | 'animal' | 'abstract' | 'stylized'
  subcategory: string  // e.g., 'male', 'female', 'non-binary', 'dragon'
  artStyle: 'vector' | 'raster' | 'pixel'
  complexity: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]  // ['anime', 'vtuber', 'female', 'casual']
  
  // Visual assets
  layers: TemplateLayer[]
  bounds: { width: number, height: number }
  
  // Rigging
  skeleton: TemplateSkeleton
  meshes: TemplateMesh[]
  
  // Morphing
  morphTargets: MorphTarget[]
  defaultMorphState: { [targetId: string]: number }
  
  // Asset variations
  swappableAssets: {
    eyes: SwappableAsset[]
    mouths: SwappableAsset[]
    hair: SwappableAsset[]
    accessories: SwappableAsset[]
  }
  
  // Expressions
  expressions: ExpressionPreset[]
  
  // Metadata
  author: string
  createdAt: string
  modifiedAt: string
}

export interface TemplateLayer {
  id: string
  name: string
  type: 'body-part' | 'expression' | 'accessory' | 'effect'
  
  // Asset data
  imageData: string  // base64 PNG/SVG or CDN URL
  imageType: 'png' | 'svg'
  
  // Transform
  position: { x: number, y: number }
  scale: { x: number, y: number }
  rotation: number
  opacity: number
  visible: boolean
  zIndex: number
  
  // Layer hierarchy
  parentLayerId?: string
  childLayerIds: string[]
  
  // Rig binding
  boundToBone?: string  // Bone ID this layer follows
  
  // Morphing
  morphable: boolean
  morphNodes?: MorphNode[]  // Key deformation points
  
  // Mesh skinning
  hasMesh: boolean
  meshId?: string
}

export interface TemplateSkeleton {
  bones: TemplateBone[]
  rootBoneId: string
  ikChains: IKChain[]
  constraints: BoneConstraint[]
}

export interface TemplateBone {
  id: string
  name: string
  parentId: string | null
  
  // Base transform (in template space)
  position: { x: number, y: number }
  rotation: number  // degrees
  length: number
  
  // Constraints
  minAngle?: number
  maxAngle?: number
  
  // IK
  isIKTarget: boolean
  ikPriority: number
  
  // Morphing
  stretchable: boolean  // Auto-adjust length on morphs
  morphMultipliers: {
    [morphTargetId: string]: {
      lengthMultiplier?: number
      positionOffset?: { x: number, y: number }
    }
  }
}

export interface TemplateMesh {
  id: string
  layerId: string
  
  // Mesh geometry
  vertices: { x: number, y: number }[]
  triangles: [number, number, number][]  // Vertex indices
  uvs: { u: number, v: number }[]
  
  // Skinning weights
  weights: BoneWeight[]
}

export interface BoneWeight {
  vertexIndex: number
  influences: {
    boneId: string
    weight: number  // 0-1, sum to 1 per vertex
  }[]
}

export interface SwappableAsset {
  id: string
  name: string
  thumbnail: string
  imageData: string
  category: 'eyes' | 'mouths' | 'hair' | 'accessories'
  style: string  // Match template art style
  
  // Transform hints
  position: { x: number, y: number }
  scale: { x: number, y: number }
  
  // Compatibility
  tags: string[]
}

export interface ExpressionPreset {
  id: string
  name: string
  thumbnail: string
  
  // Which layers to swap
  layerSwaps: {
    [layerId: string]: {
      imageData: string  // New image for this expression
    }
  }
  
  // Bone adjustments
  boneAdjustments: {
    [boneId: string]: {
      rotation?: number
      position?: { x: number, y: number }
    }
  }
  
  // Morph adjustments
  morphAdjustments: {
    [morphTargetId: string]: number
  }
}
```

### 1.2 Template Library Structure

```
src/templates/
├── index.ts                    # Template registry
├── humanoid/
│   ├── anime-girl-casual.json
│   ├── anime-boy-gamer.json
│   ├── realistic-human.json
│   └── fantasy-elf.json
├── animal/
│   ├── furry-fox.json
│   └── dragon.json
├── abstract/
│   ├── cartoon-mascot.json
│   └── geometric-blob.json
└── stylized/
    ├── chibi-cute.json
    └── pixel-art-hero.json
```

**Template Registry (index.ts):**
```typescript
import animeGirlCasual from './humanoid/anime-girl-casual.json'
import animeBoyGamer from './humanoid/anime-boy-gamer.json'
// ... import all templates

export const TEMPLATE_LIBRARY: CharacterTemplate[] = [
  animeGirlCasual,
  animeBoyGamer,
  // ... all templates
]

export const getTemplateById = (id: string): CharacterTemplate | undefined => {
  return TEMPLATE_LIBRARY.find(t => t.id === id)
}

export const getTemplatesByCategory = (category: string): CharacterTemplate[] => {
  return TEMPLATE_LIBRARY.filter(t => t.category === category)
}

export const searchTemplates = (query: string): CharacterTemplate[] => {
  const lowerQuery = query.toLowerCase()
  return TEMPLATE_LIBRARY.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}
```

### 1.3 Template Gallery UI

```typescript
// src/components/character/TemplateGallery.tsx
import { useState, useMemo } from 'react'
import { TEMPLATE_LIBRARY, searchTemplates } from '@/templates'

export function TemplateGallery({ onSelect }: { onSelect: (template: CharacterTemplate) => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular')
  
  const filteredTemplates = useMemo(() => {
    let templates = searchQuery 
      ? searchTemplates(searchQuery)
      : TEMPLATE_LIBRARY
    
    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory)
    }
    
    // Sort
    switch (sortBy) {
      case 'name':
        return templates.sort((a, b) => a.name.localeCompare(b.name))
      case 'recent':
        return templates.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      case 'popular':
      default:
        // TODO: Implement popularity metric
        return templates
    }
  }, [searchQuery, selectedCategory, sortBy])
  
  return (
    <div className="template-gallery">
      {/* Search & Filters */}
      <div className="filters">
        <input 
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="humanoid">Humanoid</option>
          <option value="animal">Animal</option>
          <option value="abstract">Abstract</option>
          <option value="stylized">Stylized</option>
        </select>
        
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
          <option value="popular">Popular</option>
          <option value="recent">Recent</option>
          <option value="name">Name</option>
        </select>
      </div>
      
      {/* Template Grid */}
      <div className="template-grid">
        {filteredTemplates.map(template => (
          <TemplateCard 
            key={template.id}
            template={template}
            onSelect={() => onSelect(template)}
          />
        ))}
      </div>
      
      {/* Quick Actions */}
      <div className="quick-actions">
        <button onClick={() => onSelect(null)}>
          ✨ Start from Scratch
        </button>
        <button onClick={() => {/* Import PSD */}}>
          📁 Import PSD/SVG
        </button>
      </div>
    </div>
  )
}

function TemplateCard({ template, onSelect }: { template: CharacterTemplate, onSelect: () => void }) {
  return (
    <div className="template-card" onClick={onSelect}>
      <img src={template.thumbnail} alt={template.name} />
      <h3>{template.name}</h3>
      <p>{template.description}</p>
      
      <div className="metadata">
        <span className="category">{template.category}</span>
        <span className="complexity">
          {'⭐'.repeat(template.complexity === 'beginner' ? 1 : template.complexity === 'intermediate' ? 2 : 3)}
        </span>
      </div>
      
      <div className="tags">
        {template.tags.slice(0, 3).map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    </div>
  )
}
```

### 1.4 Template Loading System

```typescript
// src/stores/characterStore.ts
import { create } from 'zustand'
import { CharacterTemplate } from '@/types/characterTemplate'

interface CharacterState {
  // Current character
  currentCharacter: Character | null
  
  // Template being edited
  baseTemplate: CharacterTemplate | null
  
  // Actions
  loadTemplate: (template: CharacterTemplate) => Promise<void>
  createFromScratch: () => void
  saveCharacter: () => Promise<void>
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  currentCharacter: null,
  baseTemplate: null,
  
  loadTemplate: async (template) => {
    set({ baseTemplate: template })
    
    // Create character from template
    const character: Character = {
      id: generateId(),
      name: `${template.name} - My Character`,
      templateId: template.id,
      createdAt: new Date(),
      modifiedAt: new Date(),
      
      // Clone layers
      layers: template.layers.map(layer => ({
        ...layer,
        id: generateId()  // New IDs for instance
      })),
      
      // Clone skeleton
      skeleton: {
        bones: template.skeleton.bones.map(bone => ({ ...bone })),
        rootBoneId: template.skeleton.rootBoneId,
        ikChains: [...template.skeleton.ikChains],
        constraints: [...template.skeleton.constraints]
      },
      
      // Clone meshes
      meshes: template.meshes.map(mesh => ({ ...mesh })),
      
      // Initialize morph state
      morphState: { ...template.defaultMorphState },
      
      // Empty recordings
      recordings: []
    }
    
    set({ currentCharacter: character })
  },
  
  createFromScratch: () => {
    const character: Character = {
      id: generateId(),
      name: 'Untitled Character',
      templateId: null,
      createdAt: new Date(),
      modifiedAt: new Date(),
      layers: [],
      skeleton: {
        bones: [],
        rootBoneId: '',
        ikChains: [],
        constraints: []
      },
      meshes: [],
      morphState: {},
      recordings: []
    }
    
    set({ currentCharacter: character, baseTemplate: null })
  },
  
  saveCharacter: async () => {
    const { currentCharacter } = get()
    if (!currentCharacter) return
    
    // Save to localStorage (MVP)
    // Later: Save to Cloudflare R2
    localStorage.setItem(
      `character-${currentCharacter.id}`,
      JSON.stringify(currentCharacter)
    )
    
    // Update project list
    const projects = useProjectStore.getState().projects
    const existingIndex = projects.findIndex(p => p.id === currentCharacter.id)
    
    if (existingIndex >= 0) {
      projects[existingIndex].modifiedAt = new Date()
    } else {
      projects.push({
        id: currentCharacter.id,
        name: currentCharacter.name,
        type: 'character',
        thumbnail: '', // TODO: Generate thumbnail
        createdAt: currentCharacter.createdAt,
        modifiedAt: new Date()
      })
    }
    
    set({ currentCharacter: { ...currentCharacter, modifiedAt: new Date() } })
  }
}))
```

### 1.5 assets to Create (Designers)

**10 Base Templates:**
1. **Anime Girl (Casual)** - Upper body, front-facing, 15 bones
2. **Anime Boy (Gamer)** - Upper body, headphones, 15 bones
3. **Cartoon Mascot** - Simple, 12 bones, beginner-friendly
4. **Realistic Human** - Full body, 25 bones, advanced
5. **Fantasy Elf** - Upper body, pointed ears, 18 bones
6. **Chibi Character** - Big head, 10 bones, cute style
7. **Pixel Art Hero** - Retro style, 12 bones, 16x16 base
8. **Furry Fox** - Anthropomorphic, tail, 20 bones
9. **Sci-Fi Cyborg** - Mechanical parts, 30 bones, advanced
10. **Blank Canvas** - Just a stick figure, 8 bones, for advanced users

**Per Template, Need:**
- Main character image (PNG with transparency, 1024x1024)
- Layer breakdown (separate PNG for each body part)
- Thumbnail (256x256)
- 3-5 swappable eyes
- 8-10 mouth shapes (rest, A, E, I, O, U, smile, frown, etc.)
- 5-8 hair variations
- 10-15 expression presets

**Asset Specifications:**
- Resolution: 1024x1024 canvas size
- Transparent backgrounds (PNG)
- Organized layers (PSD source files)
- Neutral pose (T-pose or standing straight)
- Consistent art style per template
- Clean lineart, flat colors (easy to recolor)

---

## 🎨 Phase 2: Morphing System (Weeks 3-4)

### Goal
Allow users to reshape templates using sliders + direct manipulation.

### 2.1 Morph Target Implementation

```typescript
// src/types/morph.ts
export interface MorphTarget {
  id: string
  name: string
  description: string
  category: 'body' | 'face' | 'style'
  
  // Slider constraints
  minValue: number
  maxValue: number
  defaultValue: number
  step: number
  
  // Visual preview
  previewImages?: {
    min: string
    default: string
    max: string
  }
  
  // Which layers are affected
  affectedLayers: string[]
  
  // Deformation instructions
  deformations: MorphDeformation[]
  
  // Skeleton adjustments
  boneAdjustments?: MorphBoneAdjustment[]
}

export interface MorphDeformation {
  layerId: string
  type: 'scale' | 'translate' | 'rotate' | 'vertex-warp' | 'bezier'
  
  // Simple transforms (Phase 2.1)
  scale?: { x: number, y: number }  // Multiplier per morph unit
  translate?: { x: number, y: number }  // Offset per morph unit
  rotate?: number  // Degrees per morph unit
  
  // Advanced (Phase 2.2)
  vertexDeltas?: VertexDelta[]
  bezierControlPoints?: { x: number, y: number }[]
}

export interface VertexDelta {
  vertexIndex: number
  deltaX: number
  deltaY: number
}

export interface MorphBoneAdjustment {
  boneId: string
  lengthMultiplier?: number
  positionOffset?: { x: number, y: number }
  rotationOffset?: number
}

// Example morph targets
export const CORE_MORPH_TARGETS: MorphTarget[] = [
  {
    id: 'body-build',
    name: 'Body Build',
    description: 'Adjust from slim to muscular',
    category: 'body',
    minValue: -1,
    maxValue: 1,
    defaultValue: 0,
    step: 0.1,
    affectedLayers: ['torso', 'left-arm', 'right-arm'],
    deformations: [
      {
        layerId: 'torso',
        type: 'scale',
        scale: { x: 0.3, y: 0 }  // At value=1, scale torso width by 1.3x
      },
      {
        layerId: 'left-arm',
        type: 'scale',
        scale: { x: 0.4, y: 0 }
      },
      {
        layerId: 'right-arm',
        type: 'scale',
        scale: { x: 0.4, y: 0 }
      }
    ],
    boneAdjustments: [
      {
        boneId: 'left-upper-arm',
        lengthMultiplier: 1.2  // At value=1
      },
      {
        boneId: 'right-upper-arm',
        lengthMultiplier: 1.2
      }
    ]
  },
  
  {
    id: 'height',
    name: 'Height',
    description: 'Adjust character height',
    category: 'body',
    minValue: 0.5,
    maxValue: 2.0,
    defaultValue: 1.0,
    step: 0.1,
    affectedLayers: ['spine', 'left-leg', 'right-leg'],
    deformations: [
      {
        layerId: 'spine',
        type: 'scale',
        scale: { x: 0, y: 1.0 }  // Value acts as direct multiplier
      }
    ],
    boneAdjustments: [
      {
        boneId: 'spine',
        lengthMultiplier: 1.0  // Value acts as direct multiplier
      },
      {
        boneId: 'left-upper-leg',
        lengthMultiplier: 0.8
      },
      {
        boneId: 'right-upper-leg',
        lengthMultiplier: 0.8
      }
    ]
  },
  
  {
    id: 'head-size',
    name: 'Head Size',
    description: 'Adjust head size',
    category: 'face',
    minValue: 0.5,
    maxValue: 2.0,
    defaultValue: 1.0,
    step: 0.1,
    affectedLayers: ['head'],
    deformations: [
      {
        layerId: 'head',
        type: 'scale',
        scale: { x: 1.0, y: 1.0 }  // Uniform scale
      }
    ],
    boneAdjustments: [
      {
        boneId: 'head',
        lengthMultiplier: 1.0
      }
    ]
  },
  
  {
    id: 'chibi-factor',
    name: 'Chibi Style',
    description: 'Realistic to chibi proportions',
    category: 'style',
    minValue: 0,
    maxValue: 1,
    defaultValue: 0,
    step: 0.1,
    affectedLayers: ['head', 'torso', 'arms', 'legs'],
    deformations: [
      {
        layerId: 'head',
        type: 'scale',
        scale: { x: 0.8, y: 0.8 }  // Head grows as chibi increases
      },
      {
        layerId: 'torso',
        type: 'scale',
        scale: { x: 0, y: -0.4 }  // Torso shrinks
      },
      {
        layerId: 'left-arm',
        type: 'scale',
        scale: { x: -0.3, y: -0.3 }  // Arms shrink
      },
      {
        layerId: 'right-arm',
        type: 'scale',
        scale: { x: -0.3, y: -0.3 }
      }
    ]
  }
]
```

### 2.2 Morph Application Logic

```typescript
// src/utils/morphEngine.ts
export function applyMorphToCharacter(
  character: Character,
  morphState: { [morphTargetId: string]: number }
): Character {
  const morphedCharacter = cloneDeep(character)
  
  // Apply layer deformations
  morphedCharacter.layers = morphedCharacter.layers.map(layer => {
    let morphedLayer = { ...layer }
    
    for (const [targetId, value] of Object.entries(morphState)) {
      const target = getMorphTarget(targetId)
      if (!target) continue
      
      const deform = target.deformations.find(d => d.layerId === layer.id)
      if (!deform) continue
      
      // Apply simple transforms
      if (deform.scale) {
        morphedLayer.scale = {
          x: layer.scale.x * (1 + deform.scale.x * value),
          y: layer.scale.y * (1 + deform.scale.y * value)
        }
      }
      
      if (deform.translate) {
        morphedLayer.position = {
          x: layer.position.x + deform.translate.x * value,
          y: layer.position.y + deform.translate.y * value
        }
      }
      
      if (deform.rotate) {
        morphedLayer.rotation += deform.rotate * value
      }
    }
    
    return morphedLayer
  })
  
  // Apply bone adjustments
  morphedCharacter.skeleton.bones = morphedCharacter.skeleton.bones.map(bone => {
    let morphedBone = { ...bone }
    
    for (const [targetId, value] of Object.entries(morphState)) {
      const target = getMorphTarget(targetId)
      if (!target || !target.boneAdjustments) continue
      
      const adjustment = target.boneAdjustments.find(a => a.boneId === bone.id)
      if (!adjustment) continue
      
      if (adjustment.lengthMultiplier !== undefined) {
        morphedBone.length = bone.length * (1 + (adjustment.lengthMultiplier - 1) * value)
      }
      
      if (adjustment.positionOffset) {
        morphedBone.position = {
          x: bone.position.x + adjustment.positionOffset.x * value,
          y: bone.position.y + adjustment.positionOffset.y * value
        }
      }
      
      if (adjustment.rotationOffset !== undefined) {
        morphedBone.rotation += adjustment.rotationOffset * value
      }
    }
    
    return morphedBone
  })
  
  return morphedCharacter
}

// Debounced version for real-time slider updates
export const applyMorphDebounced = debounce(applyMorphToCharacter, 150)
```

### 2.3 Morph UI Panel

```typescript
// src/components/character/MorphPanel.tsx
import { useCharacterStore } from '@/stores/characterStore'
import { CORE_MORPH_TARGETS } from '@/utils/morphEngine'

export function MorphPanel() {
  const { currentCharacter, updateMorphState } = useCharacterStore()
  
  if (!currentCharacter) return null
  
  const categories = {
    body: CORE_MORPH_TARGETS.filter(t => t.category === 'body'),
    face: CORE_MORPH_TARGETS.filter(t => t.category === 'face'),
    style: CORE_MORPH_TARGETS.filter(t => t.category === 'style')
  }
  
  return (
    <div className="morph-panel">
      <h2>⚙️ Customize Character</h2>
      
      {/* Body Morphs */}
      <MorphCategory
        title="💪 Body Type"
        targets={categories.body}
        currentState={currentCharacter.morphState}
        onChange={updateMorphState}
      />
      
      {/* Face Morphs */}
      <MorphCategory
        title="🙂 Head & Face"
        targets={categories.face}
        currentState={currentCharacter.morphState}
        onChange={updateMorphState}
      />
      
      {/* Style Morphs */}
      <MorphCategory
        title="🎨 Art Style"
        targets={categories.style}
        currentState={currentCharacter.morphState}
        onChange={updateMorphState}
      />
      
      {/* Quick Actions */}
      <div className="morph-actions">
        <button onClick={() => randomizeMorphs()}>
          🎲 Randomize
        </button>
        <button onClick={() => resetMorphs()}>
          ↺ Reset All
        </button>
      </div>
    </div>
  )
}

function MorphCategory({ title, targets, currentState, onChange }) {
  return (
    <div className="morph-category">
      <h3>{title}</h3>
      
      {targets.map(target => (
        <MorphSlider
          key={target.id}
          target={target}
          value={currentState[target.id] || target.defaultValue}
          onChange={(value) => onChange(target.id, value)}
        />
      ))}
    </div>
  )
}

function MorphSlider({ target, value, onChange }) {
  return (
    <div className="morph-slider">
      <label>
        <span>{target.name}</span>
        <input
          type="range"
          min={target.minValue}
          max={target.maxValue}
          step={target.step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
        />
        <span className="value">{value.toFixed(1)}</span>
      </label>
      
      {target.description && (
        <p className="description">{target.description}</p>
      )}
    </div>
  )
}
```

### 2.4 Randomize & Blend Functions

```typescript
// src/utils/morphHelpers.ts
export function randomizeMorphs(
  targets: MorphTarget[],
  variance: number = 0.5
): { [targetId: string]: number } {
  const randomState: { [targetId: string]: number } = {}
  
  targets.forEach(target => {
    const range = target.maxValue - target.minValue
    const randomValue = target.minValue + Math.random() * range * variance
    randomState[target.id] = clamp(randomValue, target.minValue, target.maxValue)
  })
  
  return randomState
}

export function blendTemplates(
  templateA: CharacterTemplate,
  templateB: CharacterTemplate,
  ratio: number  // 0 = all A, 1 = all B
): Character {
  // Interpolate morph values
  const blendedMorphs: { [targetId: string]: number } = {}
  
  const allTargets = new Set([
    ...Object.keys(templateA.defaultMorphState),
    ...Object.keys(templateB.defaultMorphState)
  ])
  
  allTargets.forEach(targetId => {
    const valueA = templateA.defaultMorphState[targetId] || 0
    const valueB = templateB.defaultMorphState[targetId] || 0
    blendedMorphs[targetId] = lerp(valueA, valueB, ratio)
  })
  
  // Merge layers (union of both)
  const blendedLayers = [
    ...templateA.layers.map(l => ({ ...l, opacity: 1 - ratio })),
    ...templateB.layers.map(l => ({ ...l, opacity: ratio }))
  ]
  
  // Skeleton: Use templateA as base, interpolate bone lengths
  const blendedSkeleton = interpolateSkeleton(
    templateA.skeleton,
    templateB.skeleton,
    ratio
  )
  
  return {
    id: generateId(),
    name: `${templateA.name} × ${templateB.name}`,
    templateId: null,
    createdAt: new Date(),
    modifiedAt: new Date(),
    layers: blendedLayers,
    skeleton: blendedSkeleton,
    meshes: [],  // TODO: Interpolate meshes
    morphState: blendedMorphs,
    recordings: []
  }
}

function interpolateSkeleton(
  skeletonA: TemplateSkeleton,
  skeletonB: TemplateSkeleton,
  ratio: number
): TemplateSkeleton {
  // Match bones by name
  const bonesA = new Map(skeletonA.bones.map(b => [b.name, b]))
  const bonesB = new Map(skeletonB.bones.map(b => [b.name, b]))
  
  const blendedBones: TemplateBone[] = []
  
  bonesA.forEach((boneA, name) => {
    const boneB = bonesB.get(name)
    
    if (boneB) {
      // Interpolate matching bones
      blendedBones.push({
        ...boneA,
        length: lerp(boneA.length, boneB.length, ratio),
        position: {
          x: lerp(boneA.position.x, boneB.position.x, ratio),
          y: lerp(boneA.position.y, boneB.position.y, ratio)
        },
        rotation: lerpAngle(boneA.rotation, boneB.rotation, ratio)
      })
    } else {
      // Only in A, fade out
      blendedBones.push({ ...boneA })
    }
  })
  
  // Add bones only in B, fade in
  bonesB.forEach((boneB, name) => {
    if (!bonesA.has(name)) {
      blendedBones.push({ ...boneB })
    }
  })
  
  return {
    bones: blendedBones,
    rootBoneId: skeletonA.rootBoneId,
    ikChains: [],  // TODO: Blend IK chains
    constraints: []
  }
}
```

---

## ⏱️ Implementation Timeline

### Week 1-2: Template & Gallery
- [ ] Define template data structures
- [ ] Create 10 base templates (work with designers)
- [ ] Build template gallery UI
- [ ] Implement template loading
- [ ] Test instant template selection

### Week 3-4: Morphing System
- [ ] Define morph target structure
- [ ] Implement morph application logic
- [ ] Build morph UI panel with sliders
- [ ] Add randomize & reset functions
- [ ] Template blending (advanced)

### Week 5-6: Auto-Rigging
- [ ] Bone hierarchy system
- [ ] Auto-rig from templates
- [ ] Morph-adaptive skeleton
- [ ] Manual rig editing UI
- [ ] 2-bone IK solver

### Week 7-8: Asset Swapping
- [ ] Asset browser UI
- [ ] Swappable layer system
- [ ] Color customization
- [ ] Import external assets (PNG/SVG/PSD)

### Week 9-10: Face Tracking
- [ ] Enhance MediePipe integration
- [ ] 20 blend shape system
- [ ] Face → character mapping
- [ ] Kalman filter smoothing
- [ ] Performance recording

### Week 11: Export System
- [ ] Spine JSON exporter
- [ ] GIF/MP4 export (enhance existing)
- [ ] VRM exporter (basic)
- [ ] PSD exporter
- [ ] Project file save/load

### Week 12: Polish & Testing
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Keyboard shortcuts
- [ ] Tutorial system
- [ ] Beta testing

---

## 🎯 Success Criteria

**Week 4 Checkpoint:**
- ✅ User can select template
- ✅ User can morph character with sliders
- ✅ Changes visible in real-time
- ✅ Can save customized character

**Week 8 Checkpoint:**
- ✅ Character auto-rigs correctly
- ✅ Can swap eyes/mouth/hair
- ✅ Can import custom layers
- ✅ Morph + rig work together

**Week 12 Final:**
- ✅ 30 seconds from landing to animated character
- ✅ Face tracking controls character smoothly
- ✅ Can record 30-second performance
- ✅ Export to Spine JSON, GIF, MP4
- ✅ 60 FPS playback on mid-range hardware

---

## 📚 Resources & References

### Libraries Documentation
- [Pixi.js v8 Docs](https://pixijs.com/8.x/guides)
- [Spine Runtime Docs](http://esotericsoftware.com/spine-runtimes-guide)
- [MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision/face_landmarker)
- [Kalman Filter.js](https://www.npmjs.com/package/kalman-filter)

### Competitors to Study
- Adobe Character Animator (rigging workflow)
- Live2D Cubism (mesh deformation)
- VTube Studio (face tracking mapping)
- Spine (export format, animation system)

### Art Resources (For Designers)
- [Kenney Game Assets](https://kenney.nl/) (free sprites for reference)
- [OpenGameArt](https://opengameart.org/) (CC0 templates)
- [Itch.io Asset Packs](https://itch.io/game-assets) (purchasable templates)

---

**Next Steps:**
1. Review this roadmap with team
2. Assign designers to create 10 base templates
3. Start Week 1 implementation (template system)
4. Set up weekly demo checkpoints

**Questions? See [MASTER_PLAN.md](./MASTER_PLAN.md) for business context.**
