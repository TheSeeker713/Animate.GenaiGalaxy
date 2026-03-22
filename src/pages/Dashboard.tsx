import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import { showToast } from '../store/toastStore'
import { getAllStories } from '../utils/storyDb'

export default function Dashboard() {
  const navigate = useNavigate()
  const { projects, createProject, deleteProject } = useProjectStore()
  const [showAllProjects, setShowAllProjects] = useState(false)
  const [infoModal, setInfoModal] = useState<'settings' | 'help' | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const stories = await getAllStories()
        if (cancelled) return
        for (const s of stories) {
          useProjectStore.getState().upsertProjectIndex({
            id: s.id,
            name: s.name,
            type: 'story',
            thumbnail: '',
            width: 1920,
            height: 1080,
            fps: 24,
          })
        }
      } catch {
        /* IndexedDB may be unavailable in private mode */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const displayedProjects = showAllProjects ? projects : projects.slice(0, 8)

  const handleCreateProject = (type: 'raster' | 'vector' | 'character' | 'story') => {
    // Navigate to appropriate studio/onboarding
    switch (type) {
      case 'raster':
        navigate('/raster')
        break
      case 'vector': {
        const result = createProject({
          name: `New ${type} Project`,
          type,
          thumbnail: '',
          width: 1920,
          height: 1080,
          fps: 24,
        })
        if (result.success && result.data) {
          navigate(`/vector/${result.data.id}`)
        }
        break
      }
      case 'character':
        navigate('/character/new')
        break
      case 'story':
        navigate('/story/new')
        break
    }
  }

  const handleOpenProject = (projectId: string, type: string) => {
    switch (type) {
      case 'raster':
        navigate(`/raster/${projectId}`)
        break
      case 'vector':
        navigate(`/vector/${projectId}`)
        break
      case 'character':
        navigate(`/character/${projectId}`)
        break
      case 'story':
        navigate(`/story/${projectId}`)
        break
      default:
        showToast(`${type} Studio is not available.`, 'warning')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                GenAI Galaxy Animate
              </h1>
              <p className="text-slate-400 text-sm mt-1">Multi-Tool Creation Suite</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setInfoModal('settings')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded transition"
              >
                ⚙️ Settings
              </button>
              <button
                type="button"
                onClick={() => setInfoModal('help')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded transition"
              >
                ❓ Help
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-8 py-12">
        {/* Create New Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Raster Animation Card */}
            <button
              onClick={() => handleCreateProject('raster')}
              className="group p-6 bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 border-2 border-cyan-500/30 rounded-xl hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
            >
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-xl font-bold mb-2">Raster Animation</h3>
              <p className="text-slate-400 text-sm">
                Frame-by-frame bitmap animation with Photoshop-level tools
              </p>
              <div className="mt-4 text-xs text-slate-500">
                ✓ Available now
              </div>
            </button>

            {/* Vector Animation Card */}
            <button
              onClick={() => handleCreateProject('vector')}
              className="group p-6 bg-gradient-to-br from-green-600/20 to-green-800/20 border-2 border-green-500/30 rounded-xl hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20 transition-all"
            >
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-xl font-bold mb-2">Vector Animation</h3>
              <p className="text-slate-400 text-sm">
                Scalable graphics with motion tweening and smooth transitions
              </p>
              <div className="mt-4 text-xs text-green-400">
                ✓ Available now
              </div>
            </button>

            {/* Character Studio Card */}
            <button
              onClick={() => handleCreateProject('character')}
              className="group p-6 bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-2 border-purple-500/30 rounded-xl hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all"
            >
              <div className="text-5xl mb-4">🎭</div>
              <h3 className="text-xl font-bold mb-2">Character Studio</h3>
              <p className="text-slate-400 text-sm">
                Motion capture with face tracking and rigged puppets
              </p>
              <div className="mt-4 text-xs text-purple-400">
                ✓ In Development
              </div>
            </button>

            {/* Story Builder Card */}
            <button
              onClick={() => handleCreateProject('story')}
              className="group p-6 bg-gradient-to-br from-pink-600/20 to-pink-800/20 border-2 border-pink-500/30 rounded-xl hover:border-pink-400 hover:shadow-lg hover:shadow-pink-500/20 transition-all"
            >
              <div className="text-5xl mb-4">📖</div>
              <h3 className="text-xl font-bold mb-2">Story Builder</h3>
              <p className="text-slate-400 text-sm">
                Interactive narrative designer with branching stories
              </p>
              <div className="mt-4 text-xs text-pink-400">
                ✓ Available now
              </div>
            </button>
          </div>
        </section>

        {/* Recent Projects */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Projects</h2>
            {projects.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllProjects((v) => !v)}
                className="text-cyan-400 hover:text-cyan-300 text-sm"
              >
                {showAllProjects ? 'Show less' : 'View all →'}
              </button>
            )}
          </div>

          {displayedProjects.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700">
              <div className="text-6xl mb-4">🎬</div>
              <h3 className="text-xl font-bold mb-2">No projects yet</h3>
              <p className="text-slate-400">Create your first project to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedProjects.map((project) => (
                <div
                  key={project.id}
                  className="group bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-500 transition-all overflow-hidden"
                >
                  <button
                    onClick={() => handleOpenProject(project.id, project.type)}
                    className="w-full"
                  >
                    <div className="aspect-video bg-gray-900 flex items-center justify-center">
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-4xl">
                          {project.type === 'raster' && '🎨'}
                          {project.type === 'vector' && '✨'}
                          {project.type === 'character' && '🎭'}
                          {project.type === 'story' && '📖'}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm mb-1 truncate">{project.name}</h3>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="capitalize">{project.type}</span>
                        <span>{formatDate(project.modifiedAt)}</span>
                      </div>
                    </div>
                  </button>
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Delete "${project.name}"?`)) {
                          void deleteProject(project.id)
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {infoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="info-modal-title"
        >
          <div className="max-w-md w-full rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <h2 id="info-modal-title" className="text-lg font-bold mb-3">
              {infoModal === 'settings' ? 'Settings' : 'Help'}
            </h2>
            {infoModal === 'settings' ? (
              <p className="text-slate-300 text-sm leading-relaxed">
                Project data is stored in this browser (local storage and IndexedDB). Clear site data only if you intend to remove local projects. Keyboard shortcuts vary by studio; see the README for Raster Studio shortcuts.
              </p>
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed">
                Create a project from the cards above, or open a recent project from the grid. Use the dashboard button in each studio to return here. For full documentation, see the repository README and the docs folder.
              </p>
            )}
            <button
              type="button"
              onClick={() => setInfoModal(null)}
              className="mt-4 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
