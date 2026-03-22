/**
 * OpenAI-compatible local LLM bridge (Ollama, LM Studio, llama.cpp server, etc.)
 * Set VITE_LOCAL_AI_URL (e.g. http://127.0.0.1:11434) and optional VITE_LOCAL_AI_MODEL.
 */

export function isLocalAiConfigured(): boolean {
  return Boolean(getBaseUrl())
}

function getBaseUrl(): string {
  const u = import.meta.env.VITE_LOCAL_AI_URL as string | undefined
  return typeof u === 'string' ? u.replace(/\/$/, '') : ''
}

export function getLocalAiModel(): string {
  return (import.meta.env.VITE_LOCAL_AI_MODEL as string | undefined) || 'llama3.2'
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; max_tokens?: number }
): Promise<string> {
  const base = getBaseUrl()
  if (!base) {
    throw new Error('Local AI is not configured. Set VITE_LOCAL_AI_URL in .env')
  }
  const model = getLocalAiModel()
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.65,
      max_tokens: options?.max_tokens ?? 500,
    }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Local AI HTTP ${res.status}`)
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = json.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response from local AI')
  return text.trim()
}

/** Short dialogue line suggestions (autotext agent). */
export async function suggestDialogueContinuation(context: {
  characterName?: string
  excerpt: string
  storyTitle?: string
}): Promise<string> {
  const sys = `You are a narrative writing assistant. Continue or enrich the following dialogue in the same voice. Output ONLY the new spoken line(s), no quotes or labels, under 120 words.`
  const user = [
    context.storyTitle ? `Story: ${context.storyTitle}` : '',
    context.characterName ? `Character: ${context.characterName}` : '',
    'Current text:',
    context.excerpt.slice(-2000),
  ]
    .filter(Boolean)
    .join('\n')
  return chatCompletion(
    [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    { max_tokens: 350, temperature: 0.75 }
  )
}

/** Background “intelligence”: brainstorm beats / answer writer questions. */
export async function brainstormStoryBeats(context: {
  storyTitle: string
  premise?: string
  nodeCount: number
  question: string
}): Promise<string> {
  const sys = `You help authors plan branching interactive fiction. Be concise, use bullet lists when helpful.`
  const user = [
    `Title: ${context.storyTitle}`,
    context.premise ? `Premise: ${context.premise}` : '',
    `Graph size: ~${context.nodeCount} nodes.`,
    `Request: ${context.question}`,
  ]
    .filter(Boolean)
    .join('\n')
  return chatCompletion(
    [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    { max_tokens: 600, temperature: 0.7 }
  )
}
