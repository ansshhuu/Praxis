'use client'

import { Camera, Loader2, Mic, ScanLine, Square, Volume2 } from 'lucide-react'
import { useRef, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface VoiceCommand {
  intent: string
  action: string
  target: string | null
  parameters: Record<string, unknown>
  confidence: number
}

interface AnalyzeResult {
  description: string
  objects: { label: string; confidence: number }[]
  classification: string[]
  barcodes: string[]
}

interface OcrResult {
  text: string
  confidence: number
  words: number
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

function VoiceLab() {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [command, setCommand] = useState<VoiceCommand | null>(null)
  const [ttsText, setTtsText] = useState('')
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await transcribe(blob)
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch {
      setError('Microphone access was denied or is unavailable.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  async function transcribe(blob: Blob) {
    setIsTranscribing(true)
    try {
      const form = new FormData()
      form.append('audio', blob, 'recording.webm')
      const response = await fetch('/api/voice/transcribe', { method: 'POST', body: form })
      if (!response.ok) {
        setError(await readError(response, 'Transcription failed'))
        return
      }
      const { transcript: text } = (await response.json()) as { transcript: string }
      setTranscript(text)
    } catch (transcribeError) {
      setError((transcribeError as Error).message)
    } finally {
      setIsTranscribing(false)
    }
  }

  async function parseCommand() {
    if (!transcript.trim()) return
    try {
      const response = await fetch('/api/voice/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Could not parse command'))
        return
      }
      setCommand((await response.json()) as VoiceCommand)
    } catch (commandError) {
      setError((commandError as Error).message)
    }
  }

  async function synthesize() {
    if (!ttsText.trim() || isSynthesizing) return
    setIsSynthesizing(true)
    setError(null)
    try {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ttsText }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Synthesis failed'))
        return
      }
      const blob = await response.blob()
      setAudioUrl(URL.createObjectURL(blob))
    } catch (synthesizeError) {
      setError((synthesizeError as Error).message)
    } finally {
      setIsSynthesizing(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Voice Recorder & Transcriber</CardTitle>
          <CardDescription>Record a command and transcribe it to structured intent.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            className={cn('font-bold', isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#F5CA50] text-[#111111] hover:brightness-95')}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <Square className="size-4" /> : <Mic className="size-4" />}
            {isRecording ? 'Stop recording' : 'Start recording'}
          </Button>
          {isTranscribing && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="size-4 animate-spin" /> <span className="text-[13px] font-medium">Transcribing…</span>
            </div>
          )}
          {transcript && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-[13.5px] font-medium text-gray-700">{transcript}</div>
              <Button variant="outline" size="sm" className="self-start" onClick={parseCommand}>
                Parse as command
              </Button>
            </div>
          )}
          {command && (
            <div className="rounded-xl border border-[#F5CA50]/30 bg-[#FFFAEC] p-3 text-[12.5px] font-mono text-gray-700">
              <p><span className="font-bold">intent:</span> {command.intent}</p>
              <p><span className="font-bold">action:</span> {command.action}</p>
              <p><span className="font-bold">target:</span> {command.target ?? 'none'}</p>
              <p><span className="font-bold">confidence:</span> {Math.round(command.confidence * 100)}%</p>
            </div>
          )}
          {error && <p className="text-[13px] font-bold text-red-500">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Text-to-Speech Preview</CardTitle>
          <CardDescription>Synthesize and preview speech from text.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea value={ttsText} onChange={(e) => setTtsText(e.target.value)} placeholder="Type something to hear it spoken…" rows={5} />
          <Button className="self-start bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95" disabled={!ttsText.trim() || isSynthesizing} onClick={synthesize}>
            {isSynthesizing ? <Loader2 className="size-4 animate-spin" /> : <Volume2 className="size-4" />}
            Synthesize speech
          </Button>
          {audioUrl && <audio controls src={audioUrl} className="w-full" />}
        </CardContent>
      </Card>
    </div>
  )
}

function VisionLab() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null)
  const [ocr, setOcr] = useState<OcrResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isReadingText, setIsReadingText] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function pickFile(picked: File) {
    setFile(picked)
    setPreview(URL.createObjectURL(picked))
    setAnalysis(null)
    setOcr(null)
  }

  async function runAnalyze() {
    if (!file || isAnalyzing) return
    setIsAnalyzing(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('image', file)
      const response = await fetch('/api/vision/analyze', { method: 'POST', body: form })
      if (!response.ok) {
        setError(await readError(response, 'Analysis failed'))
        return
      }
      setAnalysis((await response.json()) as AnalyzeResult)
    } catch (analyzeError) {
      setError((analyzeError as Error).message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function runOcr() {
    if (!file || isReadingText) return
    setIsReadingText(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('image', file)
      const response = await fetch('/api/vision/ocr', { method: 'POST', body: form })
      if (!response.ok) {
        setError(await readError(response, 'OCR failed'))
        return
      }
      setOcr((await response.json()) as OcrResult)
    } catch (ocrError) {
      setError((ocrError as Error).message)
    } finally {
      setIsReadingText(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Computer Vision Analyzer</CardTitle>
        <CardDescription>OCR text extraction, object detection and barcode reading.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-8 transition-colors hover:border-[#F5CA50]/50 hover:bg-[#FFFAEC]"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Selected preview" className="max-h-40 rounded-lg object-contain" />
            ) : (
              <Camera className="size-6 text-gray-400" />
            )}
            <p className="text-[13px] font-bold text-gray-900">{file ? file.name : 'Drop an image or click to browse'}</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" disabled={!file || isAnalyzing} onClick={runAnalyze}>
              {isAnalyzing ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />} Analyze
            </Button>
            <Button variant="outline" className="flex-1" disabled={!file || isReadingText} onClick={runOcr}>
              {isReadingText ? <Loader2 className="size-4 animate-spin" /> : <ScanLine className="size-4" />} OCR
            </Button>
          </div>
          {error && <p className="text-[13px] font-bold text-red-500">{error}</p>}
        </div>

        <div className="flex flex-col gap-4">
          {analysis && (
            <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Description</p>
              <p className="text-[13px] font-medium text-gray-700">{analysis.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.objects.map((obj) => (
                  <span key={obj.label} className="rounded-md bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-bold text-gray-700">
                    {obj.label} · {Math.round(obj.confidence * 100)}%
                  </span>
                ))}
              </div>
              {analysis.barcodes.length > 0 && (
                <p className="text-[12px] font-medium text-gray-600">Barcodes: {analysis.barcodes.join(', ')}</p>
              )}
            </div>
          )}
          {ocr && (
            <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                OCR Text ({ocr.words} words · {Math.round(ocr.confidence)}% confidence)
              </p>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap text-[12px] leading-relaxed text-gray-700">{ocr.text}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function MultimodalPage() {
  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
            <Camera className="size-6 text-[#D4A017]" /> Multimodal Lab
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Voice transcription, text-to-speech and computer vision in one place.</p>
        </div>

        <VoiceLab />
        <VisionLab />
      </div>
    </DashboardShell>
  )
}
