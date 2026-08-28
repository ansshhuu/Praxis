const MAX_TEXT_CHARS = 200_000

const SCANNED_PDF_THRESHOLD = 24

export class ExtractionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ExtractionError'
  }
}

export const PPT_UNSUPPORTED_NOTE =
  'PPT text extraction not supported in this demo'

export const SCANNED_PDF_NOTE =
  'This PDF contains no selectable text - it appears to be a scan. OCR is available for image uploads (PNG/JPG) in this demo, but not for scanned PDFs.'

function clean(text: string): string {
  const normalized = text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return normalized.length > MAX_TEXT_CHARS
    ? `${normalized.slice(0, MAX_TEXT_CHARS)}\n\n[truncated - document exceeds ${MAX_TEXT_CHARS.toLocaleString()} characters]`
    : normalized
}

function normalizeKind(fileType: string): string {
  const value = fileType.trim().toLowerCase()

  const mimeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/csv': 'csv',
    'text/plain': 'txt',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
  }
  if (mimeMap[value]) return mimeMap[value]

  const tail = value.split('.').pop() ?? value
  return tail.replace(/[^a-z0-9]/g, '')
}

async function download(fileUrl: string): Promise<Buffer> {
  let response: Response
  try {
    response = await fetch(fileUrl)
  } catch (error) {
    throw new ExtractionError(
      `Could not download the file for extraction: ${(error as Error).message}`,
      { cause: error },
    )
  }

  if (!response.ok) {
    throw new ExtractionError(
      `Could not download the file for extraction (HTTP ${response.status})`,
    )
  }

  return Buffer.from(await response.arrayBuffer())
}

async function extractPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse')

  const parser = new PDFParse({ data: buffer })
  let text: string
  try {
    ;({ text } = await parser.getText())
  } finally {
    await parser.destroy()
  }
  const cleaned = clean(text)
  return cleaned.length >= SCANNED_PDF_THRESHOLD ? cleaned : SCANNED_PDF_NOTE
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const { value } = await mammoth.extractRawText({ buffer })
  return clean(value)
}

async function extractSpreadsheet(buffer: Buffer): Promise<string> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  const sheets = workbook.SheetNames.map((name) => {
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name], { blankrows: false })
    if (!csv.trim()) return ''
    return workbook.SheetNames.length > 1 ? `# ${name}\n${csv}` : csv
  }).filter(Boolean)

  return clean(sheets.join('\n\n'))
}

async function extractImage(buffer: Buffer): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  try {
    const { data } = await worker.recognize(buffer)
    return clean(data.text)
  } finally {
    await worker.terminate()
  }
}

const IMAGE_KINDS = new Set(['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'tif', 'gif'])
const SPREADSHEET_KINDS = new Set(['xlsx', 'xls', 'xlsm', 'ods'])

export async function extractText(fileUrl: string, fileType: string): Promise<string> {
  const kind = normalizeKind(fileType)

  if (kind === 'ppt' || kind === 'pptx') {
    return PPT_UNSUPPORTED_NOTE
  }

  const buffer = await download(fileUrl)

  try {
    if (kind === 'pdf') return await extractPdf(buffer)
    if (kind === 'docx') return await extractDocx(buffer)
    if (SPREADSHEET_KINDS.has(kind)) return await extractSpreadsheet(buffer)
    if (IMAGE_KINDS.has(kind)) return await extractImage(buffer)
    if (kind === 'csv' || kind === 'txt' || kind === 'md' || kind === 'json') {
      return clean(buffer.toString('utf8'))
    }
    if (kind === 'doc') {
      return 'Legacy .doc text extraction not supported in this demo - re-save the file as .docx.'
    }

    throw new ExtractionError(`Unsupported file type for extraction: ${fileType}`)
  } catch (error) {
    if (error instanceof ExtractionError) throw error
    throw new ExtractionError(
      `Failed to extract text from ${kind || 'file'}: ${(error as Error).message}`,
      { cause: error },
    )
  }
}
