import { useState, useMemo } from 'react'
import { useStoryStore } from '../../store/storyStore'

export default function StorySearch() {
  const nodes = useStoryStore((state) => state.nodes)
  const characters = useStoryStore((state) => state.characters)
  const locations = useStoryStore((state) => state.locations)
  const items = useStoryStore((state) => state.items)
  const chapters = useStoryStore((state) => state.chapters)

  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'dialogue' | 'choice' | 'branch' | 'variable'>('all')
  const [filterChapter, setFilterChapter] = useState<string>('all')

  // Search function
  const searchResults = useMemo(() => {
    if (!query.trim()) return []

    const searchTerm = query.toLowerCase()
    const results: Array<{
      type: 'node' | 'character' | 'location' | 'item'
      id: string
      title: string
      subtitle?: string
      content?: string
      nodeType?: string
    }> = []

    // Search nodes
    nodes.forEach(node => {
      if (filterType !== 'all' && node.type !== filterType) return
      
      if (filterChapter !== 'all') {
        const chapter = chapters.find(c => c.id === filterChapter)
        if (!chapter || !chapter.nodeIds.includes(node.id)) return
      }

      let matched = false
      let matchedContent = ''

      // Search in node data
      if (node.data.label?.toLowerCase().includes(searchTerm)) {
        matched = true
        matchedContent = node.data.label
      }
      if (node.data.text?.toLowerCase().includes(searchTerm)) {
        matched = true
        matchedContent = node.data.text
      }
      if (node.data.characterName?.toLowerCase().includes(searchTerm)) {
        matched = true
      }
      if (node.data.prompt?.toLowerCase().includes(searchTerm)) {
        matched = true
        matchedContent = node.data.prompt
      }
      if (node.data.condition?.toLowerCase().includes(searchTerm)) {
        matched = true
        matchedContent = node.data.condition
      }
      if (node.data.key?.toLowerCase().includes(searchTerm)) {
        matched = true
      }
      if (node.data.notes?.toLowerCase().includes(searchTerm)) {
        matched = true
      }
      if (node.data.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))) {
        matched = true
      }

      // Search in choices
      if (node.data.choices) {
        node.data.choices.forEach((choice: any) => {
          if (choice.text?.toLowerCase().includes(searchTerm)) {
            matched = true
            matchedContent = choice.text
          }
        })
      }

      if (matched) {
        results.push({
          type: 'node',
          id: node.id,
          title: node.data.label || node.data.characterName || node.type,
          subtitle: node.type,
          content: matchedContent,
          nodeType: node.type,
        })
      }
    })

    // Search characters
    characters.forEach(character => {
      if (
        character.name.toLowerCase().includes(searchTerm) ||
        character.bio?.toLowerCase().includes(searchTerm) ||
        character.traits.some(t => t.toLowerCase().includes(searchTerm))
      ) {
        results.push({
          type: 'character',
          id: character.id,
          title: character.name,
          subtitle: 'Character',
          content: character.bio,
        })
      }
    })

    // Search locations
    locations.forEach(location => {
      if (
        location.name.toLowerCase().includes(searchTerm) ||
        location.description?.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          type: 'location',
          id: location.id,
          title: location.name,
          subtitle: 'Location',
          content: location.description,
        })
      }
    })

    // Search items
    items.forEach(item => {
      if (
        item.name.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.variableName?.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          type: 'item',
          id: item.id,
          title: item.name,
          subtitle: 'Item',
          content: item.description,
        })
      }
    })

    return results
  }, [query, nodes, characters, locations, items, chapters, filterType, filterChapter])

  const getIcon = (type: string) => {
    switch (type) {
      case 'node': return '📄'
      case 'character': return '👤'
      case 'location': return '📍'
      case 'item': return '📦'
      default: return '•'
    }
  }

  const getNodeTypeColor = (nodeType?: string) => {
    switch (nodeType) {
      case 'start': return 'text-green-400'
      case 'dialogue': return 'text-blue-400'
      case 'choice': return 'text-purple-400'
      case 'branch': return 'text-yellow-400'
      case 'variable': return 'text-cyan-400'
      case 'end': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }

  const handleResultClick = (result: typeof searchResults[0]) => {
    // TODO: Implement navigation to node/asset
    console.log('Navigate to:', result)
  }

  return (
    <div className="h-full flex flex-col bg-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white mb-3">🔍 Search</h2>
        
        {/* Search Input */}
        <div className="relative mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes, characters, locations..."
            className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="dialogue">Dialogue</option>
            <option value="choice">Choice</option>
            <option value="branch">Branch</option>
            <option value="variable">Variable</option>
          </select>
          
          <select
            value={filterChapter}
            onChange={(e) => setFilterChapter(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Chapters</option>
            {chapters.map(chapter => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {!query.trim() ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-slate-400 text-sm">
              Type to search across your story
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🤷</div>
            <p className="text-slate-400 text-sm">
              No results found for "{query}"
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-slate-500 mb-3">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </div>
            
            {searchResults.map((result, index) => (
              <button
                key={`${result.type}-${result.id}-${index}`}
                onClick={() => handleResultClick(result)}
                className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl flex-shrink-0">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium text-sm truncate">
                        {result.title}
                      </h3>
                      <span className={`text-xs ${getNodeTypeColor(result.nodeType)}`}>
                        {result.subtitle}
                      </span>
                    </div>
                    {result.content && (
                      <p className="text-slate-400 text-xs line-clamp-2">
                        {result.content}
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 text-slate-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
