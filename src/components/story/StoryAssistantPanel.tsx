import { useState } from 'react'
import { useStoryStore } from '../../store/storyStore'
import { brainstormStoryBeats, isLocalAiConfigured } from '../../utils/localAiClient'
import { showToast } from '../../store/toastStore'
import { reportError } from '../../utils/reportError'

type Props = {
  open: boolean
  onClose: () => void
}

export default function StoryAssistantPanel({ open, onClose }: Props) {
  const currentStory = useStoryStore((s) => s.currentStory)
  const nodes = useStoryStore((s) => s.nodes)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const run = async () => {
    if (!isLocalAiConfigured()) {
      showToast('Configure VITE_LOCAL_AI_URL in .env.local (see docs/LOCAL_AI_AND_MODELS.md).', 'warning')
      return
    }
    if (!currentStory || !question.trim()) {
      showToast('Enter a question for the assistant.', 'warning')
      return
    }
    setLoading(true)
    setAnswer('')
    try {
      const text = await brainstormStoryBeats({
        storyTitle: currentStory.name,
        premise: currentStory.description,
        nodeCount: nodes.length,
        question: question.trim(),
      })
      setAnswer(text)
    } catch (e) {
      reportError(e, { context: 'StoryAssistantPanel' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div
        className="bg-slate-900 border border-slate-600 rounded-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-xl"
        role="dialog"
        aria-labelledby="story-assistant-title"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 id="story-assistant-title" className="text-lg font-semibold text-white">
            Local story assistant
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto flex-1 text-sm text-slate-300">
          <p className="text-slate-500 text-xs">
            Background intelligence: asks your local LLM (Ollama, etc.) about structure and
            beats. No cloud — requires{' '}
            <code className="text-cyan-400">VITE_LOCAL_AI_URL</code>.
          </p>
          <label className="block text-slate-400 text-xs mb-1">Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-white text-sm"
            placeholder="e.g. What are three ways this chapter could branch?"
          />
          {answer && (
            <div className="rounded-lg bg-slate-800/80 border border-slate-600 p-3 whitespace-pre-wrap text-slate-200">
              {answer}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg bg-slate-700 text-white text-sm"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => void run()}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm disabled:opacity-50"
          >
            {loading ? 'Thinking…' : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  )
}
