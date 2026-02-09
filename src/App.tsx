import { useEffect } from 'react'
import { useAnimationStore } from './store/useAnimationStore'
import Toolbar from './components/Toolbar'
import Canvas from './components/Canvas'
import Timeline from './components/Timeline'
import WebcamPuppet from './components/WebcamPuppet'

function App() {
  const { darkMode, toggleDarkMode, currentTool, puppetMode } = useAnimationStore()

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { setTool, togglePlay, setCurrentFrame, currentFrameIndex, frames, togglePuppetMode, undo, redo } = useAnimationStore.getState()
      
      // Prevent shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'b':
          setTool('brush')
          break
        case 'e':
          if (!e.ctrlKey && !e.metaKey) {
            setTool('eraser')
          }
          break
        case 'p':
          if (!e.ctrlKey && !e.metaKey) {
            togglePuppetMode()
          }
          break
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'q':
          if (currentFrameIndex > 0) {
            setCurrentFrame(currentFrameIndex - 1)
          }
          break
        case 'w':
          if (currentFrameIndex < frames.length - 1) {
            setCurrentFrame(currentFrameIndex + 1)
          }
          break
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
          }
          break
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            redo()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* Header with Toolbar */}
        <header className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">GenAI Galaxy Animate</h1>
              <button
                onClick={toggleDarkMode}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
            <Toolbar />
          </div>
        </header>

        {/* Main Canvas Area */}
        <main className="flex-1 relative overflow-hidden">
          <Canvas />
          {puppetMode && <WebcamPuppet />}
        </main>

        {/* Timeline at Bottom */}
        <footer className="border-t border-gray-200 dark:border-gray-700">
          <Timeline />
        </footer>
      </div>
    </div>
  )
}

export default App

