'use client'

import { Bot, FileText, Loader2, Send, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getChatHistory, suggestedPrompts, type ChatMessage } from '@/lib/mock-data/chat'

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
  const initialMessages = getChatHistory()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function sendMessage(content: string) {
    if (!content.trim()) return
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsTyping(true)

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `I've analyzed your request: **"${content.trim()}"**. This is a mock AI response. In production, the assistant will search across your documents, workflows, and data to provide accurate, grounded answers with citations.`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        referencedDoc: Math.random() > 0.5 ? 'Q3_Invoice_Batch.pdf' : undefined,
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
    }, 1400)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(inputValue)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  const isEmpty = messages.length === 0

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
                onClick={() => sendMessage(prompt)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input box */}
        <div className="mt-3">
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
