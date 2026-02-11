import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/store/projectStore'

type CanvasType = 'standard' | 'square' | 'vertical' | 'custom'

interface CanvasPreset {
  name: string
  width: number
  height: number
  ratio: string
  icon: string
}

const CANVAS_PRESETS: Record<CanvasType, CanvasPreset[]> = {
  standard: [
    { name: '1920×1080 (Full HD)', width: 1920, height: 1080, ratio: '16:9', icon: '🖥️' },
    { name: '1280×720 (HD)', width: 1280, height: 720, ratio: '16:9', icon: '📺' },
    { name: '3840×2160 (4K)', width: 3840, height: 2160, ratio: '16:9', icon: '🎬' },
  ],
  square: [
    { name: '1080×1080 (Instagram)', width: 1080, height: 1080, ratio: '1:1', icon: '📱' },
    { name: '1000×1000', width: 1000, height: 1000, ratio: '1:1', icon: '⬜' },
    { name: '512×512', width: 512, height: 512, ratio: '1:1', icon: '🎨' },
  ],
  vertical: [
    { name: '1080×1920 (Stories)', width: 1080, height: 1920, ratio: '9:16', icon: '📱' },
    { name: '1080×1350 (Instagram Portrait)', width: 1080, height: 1350, ratio: '4:5', icon: '📸' },
  ],
  custom: []
}

export default function RasterOnboarding() {
  const navigate = useNavigate()
  const { projects, createProject } = useProjectStore()
  
  const [mode, setMode] = useState<'create' | 'open'>('create')
  const [canvasType, setCanvasType] = useState<CanvasType>('standard')
  const [selectedPreset, setSelectedPreset] = useState<CanvasPreset>(CANVAS_PRESETS.standard[0])
  const [customWidth, setCustomWidth] = useState(1920)
  const [customHeight, setCustomHeight] = useState(1080)
  const [fps, setFps] = useState(24)
  const [projectName, setProjectName] = useState('New Raster Project')
  
  const handleCreateProject = () => {
    const width = canvasType === 'custom' ? customWidth : selectedPreset.width
    const height = canvasType === 'custom' ? customHeight : selectedPreset.height
    
    const project = createProject({
      name: projectName,
      type: 'raster',
      thumbnail: '',
      width,
      height,
      fps
    })
    
    navigate(`/raster/${project.id}`)
  }
  
  const handleOpenProject = (projectId: string) => {
    navigate(`/raster/${projectId}`)
  }
  
  const recentRasterProjects = projects.filter(p => p.type === 'raster').slice(0, 12)
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-slate-400 hover:text-white transition"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-3xl font-bold">Raster Animation Studio</h1>
                <p className="text-slate-400 text-sm mt-1">Frame-by-frame bitmap animation</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-12">
        {/* Mode Selector */}
        <div className="flex gap-4 mb-12">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 p-6 rounded-xl border-2 transition-all ${
              mode === 'create'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className="text-4xl mb-2">✨</div>
            <h2 className="text-xl font-bold mb-1">Create New Project</h2>
            <p className="text-slate-400 text-sm">Start with a blank canvas</p>
          </button>
          
          <button
            onClick={() => setMode('open')}
            className={`flex-1 p-6 rounded-xl border-2 transition-all ${
              mode === 'open'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className="text-4xl mb-2">📂</div>
            <h2 className="text-xl font-bold mb-1">Open Existing Project</h2>
            <p className="text-slate-400 text-sm">Continue where you left off</p>
          </button>
        </div>

        {/* Create New Project */}
        {mode === 'create' && (
          <div className="space-y-8">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-cyan-500 focus:outline-none"
                placeholder="My Awesome Animation"
              />
            </div>

            {/* Canvas Type Selector */}
            <div>
              <label className="block text-sm font-medium mb-4">Canvas Type</label>
              <div className="grid grid-cols-4 gap-4">
                {(['standard', 'square', 'vertical', 'custom'] as CanvasType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setCanvasType(type)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      canvasType === type
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-2xl mb-2">
                      {type === 'standard' && '🖥️'}
                      {type === 'square' && '⬜'}
                      {type === 'vertical' && '📱'}
                      {type === 'custom' && '⚙️'}
                    </div>
                    <div className="text-sm font-medium capitalize">{type}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Presets */}
            {canvasType !== 'custom' && (
              <div>
                <label className="block text-sm font-medium mb-4">Resolution</label>
                <div className="grid grid-cols-3 gap-4">
                  {CANVAS_PRESETS[canvasType].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setSelectedPreset(preset)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedPreset === preset
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{preset.icon}</span>
                        <span className="text-sm font-medium text-cyan-400">{preset.ratio}</span>
                      </div>
                      <div className="font-medium mb-1">{preset.name}</div>
                      <div className="text-xs text-slate-400">{preset.width} × {preset.height}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Dimensions */}
            {canvasType === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Width (px)</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                    min={1}
                    max={7680}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Height (px)</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                    min={1}
                    max={4320}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* FPS */}
            <div>
              <label className="block text-sm font-medium mb-2">Frame Rate</label>
              <div className="grid grid-cols-5 gap-4">
                {[12, 24, 30, 60].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setFps(rate)}
                    className={`py-3 rounded-lg border-2 transition-all ${
                      fps === rate
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-bold">{rate} FPS</div>
                    <div className="text-xs text-slate-400">
                      {rate === 12 && 'Low'}
                      {rate === 24 && 'Standard'}
                      {rate === 30 && 'Smooth'}
                      {rate === 60 && 'Ultra'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Create Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleCreateProject}
                className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-bold text-lg transition-all"
              >
                Create Project →
              </button>
            </div>
          </div>
        )}

        {/* Open Existing Project */}
        {mode === 'open' && (
          <div>
            {recentRasterProjects.length === 0 ? (
              <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-bold mb-2">No raster projects yet</h3>
                <p className="text-slate-400 mb-6">Create your first project to get started!</p>
                <button
                  onClick={() => setMode('create')}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition"
                >
                  Create New Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {recentRasterProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleOpenProject(project.id)}
                    className="group bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500 transition-all overflow-hidden text-left"
                  >
                    <div className="aspect-video bg-slate-900 flex items-center justify-center">
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-4xl">🎨</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold mb-1 truncate group-hover:text-cyan-400 transition">{project.name}</h3>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{project.width} × {project.height}</span>
                        <span>{project.fps} FPS</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
