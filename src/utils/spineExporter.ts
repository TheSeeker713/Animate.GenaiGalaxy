/**
 * Spine JSON 4.0 Exporter
 * Converts Character data to Spine skeleton format for Pixi.js playback
 */

import type { Character, Bone, CharacterLayer } from '../types/character'

export interface SpineJSON {
  skeleton: {
    hash: string
    spine: string
    x: number
    y: number
    width: number
    height: number
    images: string
    audio: string
  }
  bones: SpineBone[]
  slots: SpineSlot[]
  skins: SpineSkins
  animations: Record<string, any>
}

export interface SpineBone {
  name: string
  parent?: string
  length?: number
  rotation?: number
  x?: number
  y?: number
  scaleX?: number
  scaleY?: number
  shearX?: number
  shearY?: number
  transform?: string
  color?: string
}

export interface SpineSlot {
  name: string
  bone: string
  attachment?: string
  color?: string
  blend?: string
}

export interface SpineSkins {
  default: {
    [slotName: string]: {
      [attachmentName: string]: SpineAttachment
    }
  }
}

export interface SpineAttachment {
  type?: 'region' | 'mesh' | 'linkedmesh' | 'boundingbox' | 'path' | 'point' | 'clipping'
  name?: string
  path?: string
  x?: number
  y?: number
  scaleX?: number
  scaleY?: number
  rotation?: number
  width?: number
  height?: number
  color?: string
  // Mesh-specific fields
  uvs?: number[]
  triangles?: number[]
  vertices?: number[]
  hull?: number
  edges?: number[]
}

/**
 * Convert Character to Spine JSON 4.0
 */
export function characterToSpineJSON(character: Character): SpineJSON {
  const skeleton = character.skeleton
  const layers = character.layers
  const morphState = character.morphState

  // Build bones array (hierarchical)
  const spineBones: SpineBone[] = []
  
  // Root bone first
  const rootBone = skeleton.bones.find(b => !b.parentId)
  if (rootBone) {
    spineBones.push(convertBoneToSpineBone(rootBone, skeleton.bones))
    
    // Add children recursively
    addChildBones(rootBone.id, skeleton.bones, spineBones)
  }

  // Build slots (one per layer, attached to root bone or specific bone)
  const spineSlots: SpineSlot[] = layers.map((layer, index) => ({
    name: layer.name || `layer_${index}`,
    bone: skeleton.rootBoneId || 'root',
    attachment: layer.name || `layer_${index}`,
    color: 'ffffffff',
    blend: layer.blendMode === 'multiply' ? 'multiply' : 'normal'
  }))

  // Build skins (attachments for each slot)
  const defaultSkin: SpineSkins['default'] = {}
  
  layers.forEach((layer, index) => {
    const slotName = layer.name || `layer_${index}`
    const attachmentName = layer.name || `layer_${index}`
    
    defaultSkin[slotName] = {
      [attachmentName]: createLayerAttachment(layer)
    }
  })

  const spineJSON: SpineJSON = {
    skeleton: {
      hash: character.id,
      spine: '4.0.64',
      x: 0,
      y: 0,
      width: character.bounds?.width || 512,
      height: character.bounds?.height || 512,
      images: './images/',
      audio: ''
    },
    bones: spineBones,
    slots: spineSlots,
    skins: {
      default: defaultSkin
    },
    animations: {
      idle: createIdleAnimation(character)
    }
  }

  return spineJSON
}

/**
 * Convert our Bone format to Spine bone format
 */
function convertBoneToSpineBone(bone: Bone, allBones: Bone[]): SpineBone {
  const parentBone = allBones.find(b => b.id === bone.parentId)
  
  return {
    name: bone.name,
    parent: parentBone?.name,
    length: bone.length || 50,
    rotation: bone.rotation || 0,
    x: bone.position.x,
    y: bone.position.y,
    scaleX: 1,
    scaleY: 1
  }
}

/**
 * Recursively add child bones
 */
function addChildBones(parentId: string, allBones: Bone[], spineBones: SpineBone[]) {
  const children = allBones.filter(b => b.parentId === parentId)
  children.forEach(child => {
    spineBones.push(convertBoneToSpineBone(child, allBones))
    addChildBones(child.id, allBones, spineBones)
  })
}

/**
 * Create attachment for a layer
 */
function createLayerAttachment(layer: CharacterLayer): SpineAttachment {
  return {
    type: 'region',
    name: layer.name || layer.id,
    path: layer.name || layer.id,
    x: layer.transform?.x || 0,
    y: layer.transform?.y || 0,
    scaleX: layer.transform?.scaleX || 1,
    scaleY: layer.transform?.scaleY || 1,
    rotation: layer.transform?.rotation || 0,
    width: layer.bounds?.width || 256,
    height: layer.bounds?.height || 256,
    color: 'ffffffff'
  }
}

/**
 * Create a simple idle animation (breathing effect)
 */
function createIdleAnimation(character: Character): any {
  const rootBoneId = character.skeleton.rootBoneId || 'root'
  
  return {
    bones: {
      [rootBoneId]: {
        translate: [
          {
            time: 0,
            x: 0,
            y: 0
          },
          {
            time: 1.0,
            x: 0,
            y: -3,
            curve: [0.25, 0, 0.75, 1]
          },
          {
            time: 2.0,
            x: 0,
            y: 0
          }
        ]
      }
    }
  }
}

/**
 * Generate texture atlas for Spine (maps layer names to image paths)
 */
export function generateSpineAtlas(layers: CharacterLayer[]): string {
  let atlas = ''
  
  layers.forEach(layer => {
    const name = layer.name || layer.id
    atlas += `${name}.png\n`
    atlas += `  size: ${layer.bounds?.width || 512}, ${layer.bounds?.height || 512}\n`
    atlas += `  format: RGBA8888\n`
    atlas += `  filter: Linear, Linear\n`
    atlas += `  repeat: none\n`
    atlas += `  ${name}\n`
    atlas += `    rotate: false\n`
    atlas += `    xy: 0, 0\n`
    atlas += `    size: ${layer.bounds?.width || 512}, ${layer.bounds?.height || 512}\n`
    atlas += `    orig: ${layer.bounds?.width || 512}, ${layer.bounds?.height || 512}\n`
    atlas += `    offset: 0, 0\n`
    atlas += `    index: -1\n\n`
  })
  
  return atlas
}
