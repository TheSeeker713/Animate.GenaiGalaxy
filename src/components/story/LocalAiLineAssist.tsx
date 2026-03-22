import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { isLocalAiConfigured, suggestDialogueContinuation } from '../../utils/localAiClient'
import { showToast } from '../../store/toastStore'
import { reportError } from '../../utils/reportError'

type Props = {
  editor: Editor | null
  characterName?: string
  storyTitle?: string
  getPlainText: () => string
}

export function LocalAiLineAssist({
  editor,
  characterName,
  storyTitle,
  getPlainText,
}: Props) {
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!isLocalAiConfigured()) {
      showToast(
        'Set VITE_LOCAL_AI_URL (e.g. Ollama http://127.0.0.1:11434) in .env.local.',
        'warning'
      )
      return
    }
    if (!editor) return
    setLoading(true)
    try {
      const excerpt = getPlainText()
      const suggestion = await suggestDialogueContinuation({
        characterName,
        storyTitle,
        excerpt,
      })
      editor.chain().focus().insertContent(` ${suggestion}`).run()
      showToast('Inserted AI suggestion', 'success')
    } catch (e) {
      reportError(e, { context: 'LocalAiLineAssist' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading || !editor}
        className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 disabled:opacity-50 border border-slate-600"
        title="Uses local OpenAI-compatible server (see docs/LOCAL_AI_AND_MODELS.md)"
      >
        {loading ? '…' : 'AI: suggest line'}
      </button>
    </div>
  )
}
