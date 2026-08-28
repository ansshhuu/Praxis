import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import Tesseract from 'tesseract.js'

import { parseJsonObject } from '@/lib/ai/json'

const GEMINI_VISION_MODEL = 'gemini-3.6-flash'

export interface OcrOptions {
  buffer: Buffer
  mimeType: string
}

export interface OcrResult {
  text: string
  confidence: number
  words: number
}

export async function ocrImage(options: OcrOptions): Promise<OcrResult> {
  const { data } = await Tesseract.recognize(options.buffer, 'eng')
  const text = data.text.trim()
  return {
    text,
    confidence: data.confidence ?? 0,
    words: text ? text.split(/\s+/).filter(Boolean).length : 0,
  }
}

export interface AnalyzeImageOptions {
  buffer: Buffer
  mimeType: string
}

export interface DetectedObject {
  label: string
  confidence: number
}

export interface AnalyzeImageResult {
  description: string
  objects: DetectedObject[]
  classification: string[]
  barcodes: string[]
}

const ANALYZE_SCHEMA_PROMPT = [
  'Analyze the provided image and respond with ONLY a JSON object matching this shape:',
  '{"description": string, "objects": [{"label": string, "confidence": number between 0 and 1}], "classification": string[], "barcodes": string[]}',
  '"objects" lists distinct objects you can identify in the image.',
  '"classification" lists general category tags for the image (e.g. "document", "photo", "receipt", "id-card").',
  '"barcodes" lists the decoded text/value of any barcode or QR code visible in the image; use an empty array if none are visible.',
].join('\n')

export async function analyzeImage(options: AnalyzeImageOptions): Promise<AnalyzeImageResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured - required for image analysis')
  }

  const ai = new GoogleGenAI({ apiKey })

  const result = await ai.models.generateContent({
    model: GEMINI_VISION_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: options.mimeType, data: options.buffer.toString('base64') } },
          { text: ANALYZE_SCHEMA_PROMPT },
        ],
      },
    ],
    config: { temperature: 0, maxOutputTokens: 2048, thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } },
  })

  const raw = result.text ?? ''
  const parsed = parseJsonObject(raw)
  if (!parsed) {
    throw new Error('Image analysis returned an unparseable response')
  }

  const objects = Array.isArray(parsed.objects)
    ? (parsed.objects as unknown[])
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
        .map((entry) => ({
          label: typeof entry.label === 'string' ? entry.label : 'unknown',
          confidence: typeof entry.confidence === 'number' ? entry.confidence : 0,
        }))
    : []

  const classification = Array.isArray(parsed.classification)
    ? (parsed.classification as unknown[]).filter((entry): entry is string => typeof entry === 'string')
    : []

  const barcodes = Array.isArray(parsed.barcodes)
    ? (parsed.barcodes as unknown[]).filter((entry): entry is string => typeof entry === 'string')
    : []

  return {
    description: typeof parsed.description === 'string' ? parsed.description : '',
    objects,
    classification,
    barcodes,
  }
}
