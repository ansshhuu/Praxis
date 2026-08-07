'use client'

import { Bot, FileText, Loader2, Send, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { suggestedPrompts } from '@/lib/mock-data/chat'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  referencedDoc?: string
}

/** Wire format returned by /api/chat. */
interface ApiChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function toMessage(message: ApiChatMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: formatTime(message.createdAt),
  }
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      {/* Referenced doc chip */}
      {message.referencedDoc && (
        <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
          <FileText className="size-3" />
          referencing: {message.referencedDoc}
        </span>
      )}
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-card text-foreground border border-border',
        )}
      >
        {/* Render markdown-lite bold */}
        {message.content.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </div>
      <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bot className="size-4" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load the persisted conversation once on mount.
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/chat')
        if (!response.ok) throw new Error(await readError(response, 'Could not load chat history.'))
        const { messages: history } = (await response.json()) as { messages: ApiChatMessage[] }
        if (!cancelled) setMessages(history.map(toMessage))
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  async function sendMessage(content: string) {
    const message = content.trim()
    if (!message || isTyping) return

    // Show the user's own message straight away; the server copy replaces it
    // once the request resolves and carries the real id and timestamp.
    const optimisticId = `pending-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: optimisticId, role: 'user', content: message, timestamp: formatTime(new Date().toISOString()) },
    ])
    setInputValue('')
    setIsTyping(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        throw new Error(await readError(response, 'The assistant could not answer that.'))
      }

      const { userMessage, assistantMessage } = (await response.json()) as {
        userMessage: ApiChatMessage
        assistantMessage: ApiChatMessage
      }

      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== optimisticId),
        toMessage(userMessage),
        toMessage(assistantMessage),
      ])
    } catch (sendError) {
      // The message stays on screen — it was really sent — and the failure is
      // surfaced above the input rather than faked as an assistant reply.
      setError((sendError as Error).message)
    } finally {
      setIsTyping(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void sendMessage(inputValue)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(inputValue)
    }
  }

  const isEmpty = !isLoading && messages.length === 0

  return (
    <DashboardShell mainClassName="flex flex-col p-0">
      <div className="flex flex-1 flex-col overflow-hidden px-4 pb-4 pt-4 md:px-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">AI Chat</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask questions about your documents, workflows, and data
          </p>
        </div>

        {/* Messages area */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-background/50 p-4 min-h-0">
          {isEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-12">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-8" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">How can I help you today?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  I have access to all your documents, workflows, and platform data.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isTyping && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts (shown above input on empty state) */}
        {isEmpty && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                id={`suggested-prompt-${prompt.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => void sendMessage(prompt)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input box */}
        <div className="mt-3">
          {error && (
            <p className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 rounded-xl border border-border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring"
          >
            <textarea
              ref={inputRef}
              id="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              style={{ maxHeight: 120, minHeight: 36 }}
            />
            <Button
              type="submit"
              size="icon"
              id="chat-send-button"
              disabled={isTyping || !inputValue.trim()}
              className="size-9 shrink-0 rounded-lg"
            >
              {isTyping ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            EAWMP AI may make mistakes. Always verify important information.
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}
