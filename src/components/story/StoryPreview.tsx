import { useEffect, useState } from 'react'
import { useStoryStore } from '../../store/storyStore'
import type { DialogueNodeData, ChoiceNodeData, VariableNodeData, EndNodeData } from '../../types/story'

export default function StoryPreview() {
  const {
    nodes,
    edges,
    previewMode,
    currentNodeId,
    playbackHistory,
    playbackVariables,
    exitPreview,
    navigateToNode,
    goBack,
  } = useStoryStore()

  const [displayedText, setDisplayedText] = useState('')
  const [isTextComplete, setIsTextComplete] = useState(false)
  const [typingSpeed] = useState(30) // ms per character

  const currentNode = nodes.find((n) => n.id === currentNodeId)

  // Type-writer effect for dialogue
  useEffect(() => {
    if (!currentNode || currentNode.type !== 'dialogue') {
      setIsTextComplete(true)
      return
    }

    const dialogueData = currentNode.data as DialogueNodeData
    const fullText = dialogueData.text || ''
    
    setDisplayedText('')
    setIsTextComplete(false)

    let index = 0
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.substring(0, index + 1))
        index++
      } else {
        setIsTextComplete(true)
        clearInterval(interval)
      }
    }, typingSpeed)

    return () => clearInterval(interval)
  }, [currentNode, typingSpeed])

  const skipTyping = () => {
    if (currentNode && currentNode.type === 'dialogue') {
      const dialogueData = currentNode.data as DialogueNodeData
      setDisplayedText(dialogueData.text || '')
      setIsTextComplete(true)
    }
  }

  const handleContinue = () => {
    if (!currentNode) return

    // Find the next connected node
    const outgoingEdges = edges.filter((e) => e.source === currentNodeId)
    
    if (outgoingEdges.length > 0) {
      navigateToNode(outgoingEdges[0].target)
    }
  }

  const handleChoice = (choiceId: string) => {
    const outgoingEdges = edges.filter((e) => e.source === currentNodeId && e.sourceHandle === choiceId)
    
    if (outgoingEdges.length > 0) {
      navigateToNode(outgoingEdges[0].target)
    }
  }

  const handleBranchEvaluation = (condition: string) => {
    try {
      // Simple evaluation - in production, use a safe eval library
      const evalFunc = new Function(...Object.keys(playbackVariables), `return ${condition}`)
      const result = evalFunc(...Object.values(playbackVariables))
      
      const handleId = result ? 'true' : 'false'
      const outgoingEdges = edges.filter((e) => e.source === currentNodeId && e.sourceHandle === handleId)
      
      if (outgoingEdges.length > 0) {
        navigateToNode(outgoingEdges[0].target)
      }
    } catch (error) {
      console.error('Branch evaluation error:', error)
      // Default to false path
      const outgoingEdges = edges.filter((e) => e.source === currentNodeId && e.sourceHandle === 'false')
      if (outgoingEdges.length > 0) {
        navigateToNode(outgoingEdges[0].target)
      }
    }
  }

  const handleVariableOperation = (data: VariableNodeData) => {
    const currentValue = playbackVariables[data.key]
    let newValue: any

    switch (data.operation) {
      case 'set':
        newValue = data.value
        break
      case 'add':
        newValue = (Number(currentValue) || 0) + Number(data.value)
        break
      case 'subtract':
        newValue = (Number(currentValue) || 0) - Number(data.value)
        break
      case 'toggle':
        newValue = !currentValue
        break
      default:
        newValue = data.value
    }

    // Update variable in store
    useStoryStore.setState((state) => ({
      playbackVariables: {
        ...state.playbackVariables,
        [data.key]: newValue,
      },
    }))

    // Continue to next node
    handleContinue()
  }

  // Auto-handle non-interactive nodes
  useEffect(() => {
    if (!currentNode) return

    if (currentNode.type === 'branch') {
      const branchData = currentNode.data as any
      setTimeout(() => handleBranchEvaluation(branchData.condition), 500)
    } else if (currentNode.type === 'variable') {
      const variableData = currentNode.data as VariableNodeData
      setTimeout(() => handleVariableOperation(variableData), 500)
    }
  }, [currentNodeId]) // eslint-disable-line

  if (!previewMode || !currentNode) {
    return null
  }

  const renderNode = () => {
    switch (currentNode.type) {
      case 'start':
        return (
          <div className="text-center">
            <div className="text-6xl mb-6">📖</div>
            <h1 className="text-3xl font-bold text-white mb-4">
              {(currentNode.data as any).label || 'Story Start'}
            </h1>
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
            >
              Begin Story →
            </button>
          </div>
        )

      case 'dialogue':
        const dialogueData = currentNode.data as DialogueNodeData
        return (
          <div className="space-y-6">
            {/* Character Info */}
            <div className="flex items-center gap-4">
              {dialogueData.characterId && (
                <div className="w-20 h-20 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                  {/* Character thumbnail would go here */}
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    👤
                  </div>
                </div>
              )}
              <div>
                <div className="text-xl font-bold text-white">
                  {dialogueData.characterName || 'Character'}
                </div>
                {dialogueData.expression && (
                  <div className="text-sm text-slate-400">
                    {dialogueData.expression}
                  </div>
                )}
              </div>
            </div>

            {/* Dialogue Box */}
            <div 
              className="bg-slate-800/90 rounded-xl p-6 border-2 border-blue-500/30 min-h-32 cursor-pointer"
              onClick={!isTextComplete ? skipTyping : undefined}
            >
              <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                {displayedText}
                {!isTextComplete && (
                  <span className="inline-block w-2 h-5 bg-white ml-1 animate-pulse"></span>
                )}
              </p>
            </div>

            {/* Continue Button */}
            {isTextComplete && (
              <div className="flex justify-end">
                <button
                  onClick={handleContinue}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                >
                  Continue →
                </button>
              </div>
            )}

            {!isTextComplete && (
              <div className="text-center text-sm text-slate-400">
                Click to skip typing...
              </div>
            )}
          </div>
        )

      case 'choice':
        const choiceData = currentNode.data as ChoiceNodeData
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-6">
                {choiceData.prompt || 'Choose your path'}
              </h2>
            </div>

            <div className="space-y-3">
              {choiceData.choices.map((choice, index) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice.id)}
                  className="w-full p-4 bg-purple-600/20 hover:bg-purple-600/40 border-2 border-purple-500/50 hover:border-purple-400 rounded-lg text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="text-white text-lg group-hover:text-purple-200 transition-colors">
                      {choice.text}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )

      case 'end':
        const endData = currentNode.data as EndNodeData
        const endTypeInfo = {
          victory: { icon: '🏆', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500' },
          defeat: { icon: '💀', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500' },
          neutral: { icon: '🏁', color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500' },
        }
        const info = endTypeInfo[endData.endType || 'neutral']

        return (
          <div className="text-center">
            <div className={`inline-block p-8 rounded-2xl border-4 ${info.bg} ${info.border} mb-6`}>
              <div className="text-8xl mb-4">{info.icon}</div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {endData.label || 'The End'}
              </h1>
              <div className={`text-lg ${info.color} capitalize`}>
                {endData.endType || 'neutral'} ending
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-8">
              <button
                onClick={goBack}
                disabled={playbackHistory.length <= 1}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Go Back
              </button>
              <button
                onClick={exitPreview}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
              >
                Exit Preview
              </button>
            </div>
          </div>
        )

      case 'branch':
        return (
          <div className="text-center">
            <div className="inline-block p-6 bg-orange-500/20 border-2 border-orange-500 rounded-xl">
              <div className="text-4xl mb-2">🌿</div>
              <div className="text-white font-medium">Evaluating condition...</div>
              <div className="text-sm text-slate-400 mt-2">
                {(currentNode.data as any).condition}
              </div>
            </div>
          </div>
        )

      case 'variable':
        const variableData = currentNode.data as VariableNodeData
        return (
          <div className="text-center">
            <div className="inline-block p-6 bg-cyan-500/20 border-2 border-cyan-500 rounded-xl">
              <div className="text-4xl mb-2">⚙️</div>
              <div className="text-white font-medium">Setting variable...</div>
              <code className="text-sm text-cyan-400 mt-2 block font-mono">
                {variableData.key} = {String(variableData.value)}
              </code>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center text-white">
            <p>Unknown node type: {currentNode.type}</p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <button
            onClick={goBack}
            disabled={playbackHistory.length <= 1}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Go back"
          >
            ← Back
          </button>
          <div className="text-sm text-slate-400">
            Step {playbackHistory.length}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Variable Display */}
          {Object.keys(playbackVariables).length > 0 && (
            <div className="px-3 py-1.5 bg-slate-700 rounded-lg text-xs">
              <span className="text-slate-400 mr-2">Variables:</span>
              {Object.entries(playbackVariables).map(([key, value]) => (
                <span key={key} className="text-cyan-400 font-mono mr-3">
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={exitPreview}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
          >
            Exit Preview
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-3xl w-full">
          {renderNode()}
        </div>
      </div>
    </div>
  )
}
