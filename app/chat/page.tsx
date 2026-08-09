'use client'

import { Bot, FileText, Loader2, Send, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useTypewriter } from '@/components/motion/primitives'
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

/**
 * While a response is still revealing, a partially-shown `**bold**` span would
 * render its literal asterisks. Closing the open marker keeps the text
 * formatting correctly as it grows.
 */
function balanceBold(text: string): string {
  const markers = (text.match(/\*\*/g) ?? []).length
  return markers % 2 === 1 ? `${text}**` : text
}

function MessageBubble({ message, stream = false }: { message: ChatMessage; stream?: boolean }) {
  const isUser = message.role === 'user'
  /*
    /api/chat returns the whole answer in one response — it is not a streaming
    endpoint — so this reveals text already in hand rather than pretending to
    receive tokens. Only the newest assistant message passes `stream`, so
    scrolling through history never replays it.
  */
  const { shown, done } = useTypewriter(message.content, { enabled: stream && !isUser })
  const visible = stream && !isUser ? balanceBold(shown) : message.content

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
         <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FFFAEC] border border-[#F5CA50]/30 text-[#D4A017] shadow-sm">
           <Bot className="size-4" />
         </div>
      )}
      <div className={cn('flex flex-col gap-1.5', isUser ? 'items-end' : 'items-start')}>
        {message.referencedDoc && (
          <span className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-600 uppercase tracking-wide border border-gray-200">
            <FileText className="size-3 text-gray-400" />
            Source: {message.referencedDoc}
          </span>
        )}
        <div
          className={cn(
            'max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm',
            isUser
              ? 'rounded-tr-sm bg-[#FFFAEC] text-gray-900 border border-[#F5CA50]/30 font-medium'
              : 'rounded-tl-sm bg-white text-gray-800 border border-gray-100 font-medium',
          )}
        >
          {visible.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
          {stream && !isUser && !done && (
            <span
              aria-hidden="true"
              className="ml-0.5 inline-block h-[14px] w-[6px] translate-y-[2px] rounded-[2px] bg-[#D4A017]"
              style={{ animation: 'blink 1.1s step-end infinite' }}
            />
          )}
        </div>
        <span className="text-[11px] font-bold text-gray-400 px-1">{message.timestamp}</span>
      </div>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FFFAEC] border border-[#F5CA50]/30 text-[#D4A017] shadow-sm">
        <Bot className="size-4" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm h-11 flex items-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-gray-400 animate-bounce"
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
  /** Newest assistant reply — the only one that reveals progressively. */
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  async function sendMessage(content: string) {
    const message = content.trim()
    if (!message || isTyping) return

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
      if (!response.ok) throw new Error(await readError(response, 'The assistant could not answer that.'))
      const { userMessage, assistantMessage } = (await response.json()) as {
        userMessage: ApiChatMessage
        assistantMessage: ApiChatMessage
      }
      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== optimisticId),
        toMessage(userMessage),
        toMessage(assistantMessage),
      ])
      setStreamingId(assistantMessage.id)
    } catch (sendError) {
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
    <DashboardShell mainClassName="flex flex-col p-0 h-[calc(100vh-64px)]">
      <div className="flex flex-1 flex-col overflow-hidden max-w-[1000px] mx-auto w-full relative pt-6 md:pt-8">
        
        {/* Messages area */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 md:px-8 pb-32">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center my-auto">
              <div className="flex size-20 items-center justify-center rounded-3xl bg-[#FFFAEC] text-[#D4A017] shadow-sm mb-6 border border-[#F5CA50]/30 shadow-[#F5CA50]/10">
                <Sparkles className="size-10" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">How can I help you?</h1>
              <p className="mt-3 text-[15px] font-medium text-gray-500 max-w-sm text-center">
                I'm your Praxis AI Assistant. I can analyze documents, summarize workflows, and answer questions about your data.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} stream={msg.id === streamingId} />
              ))}
              {isTyping && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar Fixed to Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pb-6 pt-10 px-4 md:px-8">
          
          {/* Suggested Prompts */}
          {isEmpty && (
            <div className="mb-4 flex flex-wrap justify-center gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-bold text-gray-600 transition-all hover:border-[#F5CA50] hover:bg-[#FFFAEC] hover:text-[#D4A017] shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-xl bg-red-50 border border-red-100 p-3 text-[13px] font-bold text-red-600 max-w-3xl mx-auto">
              {error}
            </div>
          )}
          
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg max-w-3xl mx-auto focus-within:ring-2 focus-within:ring-[#F5CA50]/50 focus-within:border-[#F5CA50] transition-all"
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
              rows={1}
              className="flex-1 resize-none bg-transparent px-3 py-3 text-[14.5px] font-medium text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-normal"
              style={{ maxHeight: 160, minHeight: 48 }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isTyping || !inputValue.trim()}
              className="size-11 shrink-0 rounded-xl bg-[#F5CA50] text-[#111111] hover:brightness-95 disabled:bg-gray-100 disabled:text-gray-400"
            >
              {isTyping ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
            </Button>
          </form>
          <p className="mt-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wide">
            Praxis AI may make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}
