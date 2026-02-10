import { useState, useMemo } from 'react'
import { CHARACTER_TEMPLATES, searchTemplates } from '@/data/characterTemplates'
import type { CharacterTemplate } from '@/types/character'

interface TemplateGalleryProps {
  onSelect: (template: CharacterTemplate) => void
  onClose: () => void
}

export default function TemplateGallery({ onSelect, onClose }: TemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular')
  
  const filteredTemplates = useMemo(() => {
    let templates = searchQuery 
      ? searchTemplates(searchQuery)
      : CHARACTER_TEMPLATES
    
    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory)
    }
    
    if (selectedComplexity !== 'all') {
      templates = templates.filter(t => t.complexity === selectedComplexity)
    }
    
    // Sort
    switch (sortBy) {
      case 'name':
        return [...templates].sort((a, b) => a.name.localeCompare(b.name))
      case 'recent':
        return [...templates].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      case 'popular':
      default:
        return templates
    }
  }, [searchQuery, selectedCategory, selectedComplexity, sortBy])
  
  const complexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return '⭐'
      case 'intermediate': return '⭐⭐'
      case 'advanced': return '⭐⭐⭐'
      default: return ''
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold">Choose Your Starting Point</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-400">
            Start with a pre-rigged template or create from scratch
          </p>
        </div>
        
        {/* Filters */}
        <div className="p-6 border-b border-gray-700 bg-gray-850">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white placeholder-gray-400"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
            >
              <option value="all">All Categories</option>
              <option value="humanoid">Humanoid</option>
              <option value="animal">Animal</option>
              <option value="abstract">Abstract</option>
              <option value="stylized">Stylized</option>
            </select>
            
            {/* Complexity Filter */}
            <select
              value={selectedComplexity}
              onChange={(e) => setSelectedComplexity(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner ⭐</option>
              <option value="intermediate">Intermediate ⭐⭐</option>
              <option value="advanced">Advanced ⭐⭐⭐</option>
            </select>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
            >
              <option value="popular">Popular</option>
              <option value="recent">Recent</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
        
        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">🔍</div>
              <p>No templates match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => onSelect(template)}
                  complexityIcon={complexityIcon(template.complexity)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-700 bg-gray-850">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Create blank character
                  const blankTemplate = CHARACTER_TEMPLATES.find(t => t.id === 'blank-canvas')
                  if (blankTemplate) onSelect(blankTemplate)
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
              >
                ✨ Start from Scratch
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TemplateCardProps {
  template: CharacterTemplate
  onSelect: () => void
  complexityIcon: string
}

function TemplateCard({ template, onSelect, complexityIcon }: TemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className="group bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all text-left"
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-gray-600 flex items-center justify-center text-6xl">
        {/* Placeholder - will be replaced with actual images */}
        {template.category === 'humanoid' && '👤'}
        {template.category === 'animal' && '🦊'}
        {template.category === 'abstract' && '⭕'}
        {template.category === 'stylized' && '✨'}
      </div>
      
      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition">
          {template.name}
        </h3>
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
          {template.description}
        </p>
        
        {/* Metadata */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-600 rounded">
              {template.artStyle}
            </span>
            <span title={template.complexity}>
              {complexityIcon}
            </span>
          </div>
          <span className="text-gray-500 capitalize">
            {template.category}
          </span>
        </div>
        
        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
