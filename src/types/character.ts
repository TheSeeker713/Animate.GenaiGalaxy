// Character Studio Type Definitions

export interface Point {
  x: number
  y: number
}

export interface Transform {
  position: Point
  rotation: number
  scale: Point
}

// ============================================
// TEMPLATE SYSTEM
// ============================================

export interface CharacterTemplate {
  id: string
  version: string
  name: string
  description: string
  thumbnail: string
  
  // Categorization
  category: 'humanoid' | 'animal' | 'abstract' | 'stylized'
  subcategory: string
  artStyle: 'vector' | 'raster' | 'pixel'
  complexity: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  
  // Visual assets
  layers: TemplateLayer[]
  bounds: { width: number; height: number }
  
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
  imageData: string // base64 PNG/SVG or URL
  imageType: 'png' | 'svg'
  
  // Transform
  position: Point
  scale: Point
  rotation: number
  opacity: number
  visible: boolean
  zIndex: number
  
  // Layer hierarchy
  parentLayerId?: string
  childLayerIds: string[]
  
  // Rig binding
  boundToBone?: string
  
  // Morphing
  morphable: boolean
  morphNodes?: MorphNode[]
  
  // Mesh skinning
  hasMesh: boolean
  meshId?: string
}

export interface MorphNode {
  id: string
  position: Point
  influence: number
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
  
  // Base transform
  position: Point
  rotation: number
  length: number
  
  // Constraints
  minAngle?: number
  maxAngle?: number
  
  // IK
  isIKTarget: boolean
  ikPriority: number
  
  // Morphing
  stretchable: boolean
  morphMultipliers: {
    [morphTargetId: string]: {
      lengthMultiplier?: number
      positionOffset?: Point
    }
  }
}

export interface IKChain {
  id: string
  name: string
  bones: string[] // Bone IDs in chain
  targetBoneId: string
  poleBoneId?: string
}

export interface BoneConstraint {
  id: string
  boneId: string
  type: 'rotation' | 'position' | 'scale'
  min?: number
  max?: number
}

export interface TemplateMesh {
  id: string
  layerId: string
  
  // Mesh geometry
  vertices: Point[]
  triangles: [number, number, number][]
  uvs: { u: number; v: number }[]
  
  // Skinning weights
  weights: BoneWeight[]
}

export interface BoneWeight {
  vertexIndex: number
  influences: {
    boneId: string
    weight: number
  }[]
}

export interface SwappableAsset {
  id: string
  name: string
  thumbnail: string
  imageData: string
  category: 'eyes' | 'mouths' | 'hair' | 'accessories'
  style: string
  
  // Transform hints
  position: Point
  scale: Point
  
  tags: string[]
}

export interface ExpressionPreset {
  id: string
  name: string
  thumbnail: string
  
  // Layer swaps
  layerSwaps: {
    [layerId: string]: {
      imageData: string
    }
  }
  
  // Bone adjustments
  boneAdjustments: {
    [boneId: string]: {
      rotation?: number
      position?: Point
    }
  }
  
  // Morph adjustments
  morphAdjustments: {
    [morphTargetId: string]: number
  }
}

// ============================================
// MORPH SYSTEM
// ============================================

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
  
  // Affected layers
  affectedLayers: string[]
  
  // Deformation instructions
  deformations: MorphDeformation[]
  
  // Skeleton adjustments
  boneAdjustments?: MorphBoneAdjustment[]
}

export interface MorphDeformation {
  layerId: string
  type: 'scale' | 'translate' | 'rotate' | 'vertex-warp' | 'bezier'
  
  // Simple transforms
  scale?: Point
  translate?: Point
  rotate?: number
  
  // Advanced
  vertexDeltas?: VertexDelta[]
  bezierControlPoints?: Point[]
}

export interface VertexDelta {
  vertexIndex: number
  deltaX: number
  deltaY: number
}

export interface MorphBoneAdjustment {
  boneId: string
  lengthMultiplier?: number
  positionOffset?: Point
  rotationOffset?: number
}

// ============================================
// CHARACTER INSTANCE
// ============================================

export interface Character {
  id: string
  name: string
  templateId: string | null
  thumbnail: string
  createdAt: Date
  modifiedAt: Date
  
  // Art assets
  layers: CharacterLayer[]
  
  // Rigging
  skeleton: Skeleton
  
  // Current morph state
  morphState: { [morphTargetId: string]: number }
  
  // Recorded animations
  recordings: Recording[]
}

export interface CharacterLayer {
  id: string
  name: string
  type: 'body-part' | 'expression' | 'accessory' | 'effect'
  imageData: string
  visible: boolean
  opacity: number
  
  // Transform
  position: Point
  scale: Point
  rotation: number
  zIndex: number
  
  // Mesh for deformation
  mesh?: {
    vertices: Point[]
    triangles: [number, number, number][]
    uvs: { u: number; v: number }[]
    weights: BoneWeight[]
  }
}

export interface Skeleton {
  bones: Bone[]
  rootBoneId: string | null
  ikChains: IKChain[]
  constraints: BoneConstraint[]
}

export interface Bone {
  id: string
  name: string
  parentId: string | null
  
  // Transform
  position: Point
  rotation: number
  length: number
  scale: Point
  
  // Constraints
  minAngle?: number
  maxAngle?: number
  
  // IK
  isIKTarget: boolean
}

export interface Recording {
  id: string
  name: string
  duration: number
  fps: number
  keyframes: Keyframe[]
  thumbnail: string
  createdAt: Date
}

export interface Keyframe {
  time: number
  bones: { 
    [boneId: string]: { 
      rotation: number
      position: Point
      scale: Point
    } 
  }
  layers: { 
    [layerId: string]: { 
      visible: boolean
      opacity: number 
    } 
  }
  blendShapes?: { [shapeId: string]: number }
}

// ============================================
// FACE TRACKING
// ============================================

export interface FaceControlMapping {
  headRotation: {
    boneId: string
    multiplier: number
  }
  mouthOpen: {
    blendShape: string
    threshold: number
  }
  eyeBlink: {
    left: { blendShape: string }
    right: { blendShape: string }
  }
  smile: {
    blendShapes: string[]
    multiplier: number
  }
}

export interface CharacterPose {
  bones: Bone[]
  blendShapes: { [shapeId: string]: number }
  timestamp: number
}

// ============================================
// EXPORT FORMATS
// ============================================

export interface ExportOptions {
  format: 'gif' | 'mp4' | 'png-sequence' | 'spine-json' | 'vrm' | 'psd' | 'project'
  quality?: number
  fps?: number
  resolution?: { width: number; height: number }
  transparent?: boolean
  loop?: boolean
}
