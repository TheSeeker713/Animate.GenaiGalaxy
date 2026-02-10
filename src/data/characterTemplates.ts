import type { CharacterTemplate } from '@/types/character'

// Initial 10 character templates for launch
export const CHARACTER_TEMPLATES: CharacterTemplate[] = [
  {
    id: 'anime-girl-casual',
    version: '1.0',
    name: 'Anime Girl (Casual)',
    description: 'Upper body anime-style female character, perfect for VTubing',
    thumbnail: '/templates/anime-girl-casual.png',
    category: 'humanoid',
    subcategory: 'female',
    artStyle: 'vector',
    complexity: 'beginner',
    tags: ['anime', 'vtuber', 'female', 'casual', 'beginner-friendly'],
    
    layers: [],
    bounds: { width: 1024, height: 1024 },
    
    skeleton: {
      bones: [],
      rootBoneId: 'root',
      ikChains: [],
      constraints: []
    },
    
    meshes: [],
    
    morphTargets: [
      {
        id: 'head-size',
        name: 'Head Size',
        description: 'Adjust head size',
        category: 'face',
        minValue: 0.7,
        maxValue: 1.5,
        defaultValue: 1.0,
        step: 0.1,
        affectedLayers: ['head'],
        deformations: [
          {
            layerId: 'head',
            type: 'scale',
            scale: { x: 1, y: 1 }
          }
        ]
      }
    ],
    
    defaultMorphState: {
      'head-size': 1.0
    },
    
    swappableAssets: {
      eyes: [],
      mouths: [],
      hair: [],
      accessories: []
    },
    
    expressions: [],
    
    author: 'GenAI Galaxy',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  },
  
  {
    id: 'anime-boy-gamer',
    version: '1.0',
    name: 'Anime Boy (Gamer)',
    description: 'Upper body anime-style male character with headphones',
    thumbnail: '/templates/anime-boy-gamer.png',
    category: 'humanoid',
    subcategory: 'male',
    artStyle: 'vector',
    complexity: 'beginner',
    tags: ['anime', 'vtuber', 'male', 'gamer', 'streaming'],
    
    layers: [],
    bounds: { width: 1024, height: 1024 },
    skeleton: {
      bones: [],
      rootBoneId: 'root',
      ikChains: [],
      constraints: []
    },
    meshes: [],
    morphTargets: [],
    defaultMorphState: {},
    swappableAssets: {
      eyes: [],
      mouths: [],
      hair: [],
      accessories: []
    },
    expressions: [],
    author: 'GenAI Galaxy',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  },
  
  {
    id: 'cartoon-mascot',
    version: '1.0',
    name: 'Cartoon Mascot',
    description: 'Simple, friendly cartoon character perfect for brands',
    thumbnail: '/templates/cartoon-mascot.png',
    category: 'abstract',
    subcategory: 'mascot',
    artStyle: 'vector',
    complexity: 'beginner',
    tags: ['cartoon', 'mascot', 'brand', 'cute', 'simple'],
    
    layers: [],
    bounds: { width: 1024, height: 1024 },
    skeleton: {
      bones: [],
      rootBoneId: 'root',
      ikChains: [],
      constraints: []
    },
    meshes: [],
    morphTargets: [],
    defaultMorphState: {},
    swappableAssets: {
      eyes: [],
      mouths: [],
      hair: [],
      accessories: []
    },
    expressions: [],
    author: 'GenAI Galaxy',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  },
  
  {
    id: 'realistic-human',
    version: '1.0',
    name: 'Realistic Human',
    description: 'Full body realistic human character for advanced users',
    thumbnail: '/templates/realistic-human.png',
    category: 'humanoid',
    subcategory: 'realistic',
    artStyle: 'raster',
    complexity: 'advanced',
    tags: ['realistic', 'human', 'professional', 'full-body'],
    
    layers: [],
    bounds: { width: 1024, height: 2048 },
    skeleton: {
      bones: [],
      rootBoneId: 'root',
      ikChains: [],
      constraints: []
    },
    meshes: [],
    morphTargets: [],
    defaultMorphState: {},
    swappableAssets: {
      eyes: [],
      mouths: [],
      hair: [],
      accessories: []
    },
    expressions: [],
    author: 'GenAI Galaxy',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  },
  
  {
    id: 'fantasy-elf',
    version: '1.0',
    name: 'Fantasy Elf',
    description: 'Upper body fantasy elf with pointed ears',
    thumbnail: '/templates/fantasy-elf.png',
    category: 'humanoid',
    subcategory: 'fantasy',
    artStyle: 'vector',
    complexity: 'intermediate',
    tags: ['fantasy', 'elf', 'rpg', 'magic'],
    
    layers: [],
    bounds: { width: 1024, height: 1024 },
    skeleton: {
      bones: [],
      rootBoneId: 'root',
      ikChains: [],
      constraints: []
    },
    meshes: [],
    morphTargets: [],
    defaultMorphState: {},
    swappableAssets: {
      eyes: [],
      mouths: [],
      hair: [],
      accessories: []
    },
    expressions: [],
    author: 'GenAI Galaxy',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  },
  
  {
    id: 'chibi-cute',
    version: '1.0',
    name: 'Chibi Character',
    description: 'Adorable chibi-style character with big head',
    thumbnail: '/templates/chibi-cute.png',
    category: 'stylized',
    subcategory: 'chibi',
    artStyle: 'vector',
    complexity: 'beginner',
    tags: ['chibi', 'cute', 'kawaii', 'anime'],
    
    layers: [],
    bounds: { width: 1024, height: 1024 },
    skeleton: {
      bones: [],
      rootBoneId: 'root',
      ikChains: [],
      constraints: []
    },
    meshes: [],
    morphTargets: [],
    defaultMorphState: {},
    swappableAssets: {
      eyes: [],
      mouths: [],
      hair: [],
      accessories: []
    },
    expressions: [],
    author: 'GenAI Galaxy',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  },
  
  {
    id: 'pixel-art-hero',
    version: '1.0',
    name: 'Pixel Art Hero',
    description: 'Retro pixel art character perfect for games',
    thumbnail: '/templates/pixel-art-hero.png',
    category: 'stylized',
    subcategory: 'pixel',
    artStyle: 'pixel',
    complexity: 'beginner',
    tags: ['pixel-art', 'retro', 'game', '8-bit'],
    
    layers: [],
    bounds: { width: 512, height: 512 },
    skeleton: {
      bones: [],
      rootBoneId: 'root',
      ikChains: [],
      constraints: []
    },
    meshes: [],
    morphTargets: [],
    defaultMorphState: {},
    swappableAssets: {
      eyes: [],
      mouths: [],
      hair: [],
      accessories: []
    },
    expressions: [],
    author: 'GenAI Galaxy',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  },
  
  {
    id: 'furry-fox',
    version: '1.0',
    name: 'Furry Fox',
    description: 'Anthropomorphic fox character with tail',
    thumbnail: '/templates/furry-fox.png',
    category: 'animal',
    subcategory: 'fox',
    artStyle: 'vector',
    complexity: 'intermediate',
    tags: ['furry', 'animal', 'fox', 'anthropomorphic'],
    
    layers: [],
    bounds: { width: 1024, height: 1024 },
    skeleton: {
      bones: [],
      rootBoneId: 'root',
      ikChains: [],
      constraints: []
    },
    meshes: [],
    morphTargets: [],
    defaultMorphState: {},
    swappableAssets: {
      eyes: [],
      mouths: [],
      hair: [],
      accessories: []
    },
    expressions: [],
    author: 'GenAI Galaxy',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  },
  
  {
    id: 'sci-fi-cyborg',
    version: '1.0',
    name: 'Sci-Fi Cyborg',
    description: 'Futuristic cyborg with mechanical parts',
    thumbnail: '/templates/sci-fi-cyborg.png',
    category: 'humanoid',
    subcategory: 'cyborg',
    artStyle: 'vector',
    complexity: 'advanced',
    tags: ['sci-fi', 'cyborg', 'futuristic', 'robot'],
    
    layers: [],
    bounds: { width: 1024, height: 1024 },
    skeleton: {
      bones: [],
      rootBoneId: 'root',
      ikChains: [],
      constraints: []
    },
    meshes: [],
    morphTargets: [],
    defaultMorphState: {},
    swappableAssets: {
      eyes: [],
      mouths: [],
      hair: [],
      accessories: []
    },
    expressions: [],
    author: 'GenAI Galaxy',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  },
  
  {
    id: 'blank-canvas',
    version: '1.0',
    name: 'Blank Canvas',
    description: 'Start from scratch with no template',
    thumbnail: '/templates/blank-canvas.png',
    category: 'abstract',
    subcategory: 'custom',
    artStyle: 'vector',
    complexity: 'advanced',
    tags: ['custom', 'advanced', 'blank', 'scratch'],
    
    layers: [],
    bounds: { width: 1024, height: 1024 },
    skeleton: {
      bones: [],
      rootBoneId: 'root',
      ikChains: [],
      constraints: []
    },
    meshes: [],
    morphTargets: [],
    defaultMorphState: {},
    swappableAssets: {
      eyes: [],
      mouths: [],
      hair: [],
      accessories: []
    },
    expressions: [],
    author: 'GenAI Galaxy',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString()
  }
]

export const getTemplateById = (id: string): CharacterTemplate | undefined => {
  return CHARACTER_TEMPLATES.find(t => t.id === id)
}

export const getTemplatesByCategory = (category: string): CharacterTemplate[] => {
  return CHARACTER_TEMPLATES.filter(t => t.category === category)
}

export const searchTemplates = (query: string): CharacterTemplate[] => {
  const lowerQuery = query.toLowerCase()
  return CHARACTER_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}
