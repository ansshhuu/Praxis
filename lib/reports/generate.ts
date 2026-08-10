import {
  AlignmentType,
  Document as WordDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  Table as WordTable,
  TableCell as WordTableCell,
  TableRow as WordTableRow,
  TextRun,
  WidthType,
} from 'docx'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import * as XLSX from 'xlsx'

import type { ReportData } from './data'

export type ReportFormat = 'PDF' | 'WORD' | 'EXCEL'

export const REPORT_FORMATS: ReportFormat[] = ['PDF', 'WORD', 'EXCEL']

const FORMAT_META: Record<ReportFormat, { extension: string; mimeType: string }> = {
  PDF: { extension: 'pdf', mimeType: 'application/pdf' },
  WORD: {
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  EXCEL: {
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
}

export function formatMeta(format: ReportFormat) {
  return FORMAT_META[format]
}

export function isReportFormat(value: unknown): value is ReportFormat {
  return typeof value === 'string' && (REPORT_FORMATS as string[]).includes(value)
}

export interface GeneratedFile {
  bytes: Uint8Array
  extension: string
  mimeType: string
}

function toWinAnsi(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 48

async function generatePdf(
  data: ReportData,
  aiSummary: string,
  generatedAt: Date,
): Promise<GeneratedFile> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const contentWidth = PAGE_WIDTH - MARGIN * 2
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  function ensureSpace(needed: number) {
    if (y - needed >= MARGIN) return
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    y = PAGE_HEIGHT - MARGIN
  }

  function drawText(
    text: string,
    options: { size?: number; bold?: boolean; color?: [number, number, number]; x?: number } = {},
  ) {
    const size = options.size ?? 10
    const usedFont = options.bold ? bold : font
    const [r, g, b] = options.color ?? [0.1, 0.1, 0.12]
    ensureSpace(size + 4)
    y -= size + 2
    page.drawText(toWinAnsi(text), {
      x: options.x ?? MARGIN,
      y,
      size,
      font: usedFont,
      color: rgb(r, g, b),
    })
  }

  function wrap(text: string, size: number, width: number, useBold = false): string[] {
    const usedFont = useBold ? bold : font
    const lines: string[] = []
    for (const paragraph of text.split('\n').map(toWinAnsi)) {
      let current = ''
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = current ? `${current} ${word}` : word
        if (usedFont.widthOfTextAtSize(candidate, size) <= width) {
          current = candidate
        } else {
          if (current) lines.push(current)
          current = word
        }
      }
      lines.push(current)
    }
    return lines
  }

  drawText(data.title, { size: 20, bold: true })
  drawText(
    `Generated ${generatedAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`,
    { size: 9, color: [0.45, 0.45, 0.5] },
  )
  y -= 10

  if (data.highlights.length) {
    drawText('Key Figures', { size: 13, bold: true })
    y -= 2
    for (const highlight of data.highlights) {
      drawText(`${highlight.label}:  ${highlight.value}`, { size: 10 })
    }
    y -= 10
  }

  drawText('Summary & Insights', { size: 13, bold: true })
  y -= 2
  for (const line of wrap(aiSummary, 10, contentWidth)) {
    drawText(line, { size: 10 })
  }
  y -= 10

  if (data.rows.length) {
    drawText('Data', { size: 13, bold: true })
    y -= 4

    const columnWidth = contentWidth / data.columns.length
    const cellSize = 8

    function fitCell(value: string): string {
      const text = toWinAnsi(value)
      const max = columnWidth - 6
      if (font.widthOfTextAtSize(text, cellSize) <= max) return text
      let clipped = text
      while (clipped.length > 1 && font.widthOfTextAtSize(`${clipped}...`, cellSize) > max) {
        clipped = clipped.slice(0, -1)
      }
      return `${clipped}...`
    }

    function drawRow(cells: string[], useBold: boolean) {
      ensureSpace(cellSize + 6)
      y -= cellSize + 4
      cells.forEach((cell, index) => {
        page.drawText(fitCell(cell), {
          x: MARGIN + index * columnWidth,
          y,
          size: cellSize,
          font: useBold ? bold : font,
          color: rgb(0.1, 0.1, 0.12),
        })
      })
    }

    drawRow(data.columns, true)
    page.drawLine({
      start: { x: MARGIN, y: y - 3 },
      end: { x: PAGE_WIDTH - MARGIN, y: y - 3 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.85),
    })
    y -= 4

    for (const row of data.rows) {
      drawRow(row.map(String), false)
    }
  } else {
    drawText('No data recorded for this report type yet.', { size: 10, color: [0.45, 0.45, 0.5] })
  }

  if (data.note) {
    y -= 12
    drawText('Note', { size: 11, bold: true })
    for (const line of wrap(data.note, 9, contentWidth)) {
      drawText(line, { size: 9, color: [0.45, 0.45, 0.5] })
    }
  }

  return { bytes: await pdf.save(), ...FORMAT_META.PDF }
}

async function generateWord(
  data: ReportData,
  aiSummary: string,
  generatedAt: Date,
): Promise<GeneratedFile> {
  const children: (Paragraph | WordTable)[] = [
    new Paragraph({ text: data.title, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: `Generated ${generatedAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`,
          italics: true,
          color: '6B7280',
          size: 18,
        }),
      ],
    }),
  ]

  if (data.highlights.length) {
    children.push(new Paragraph({ text: 'Key Figures', heading: HeadingLevel.HEADING_2 }))
    for (const highlight of data.highlights) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({ text: `${highlight.label}: `, bold: true }),
            new TextRun(highlight.value),
          ],
        }),
      )
    }
  }

  children.push(new Paragraph({ text: 'Summary & Insights', heading: HeadingLevel.HEADING_2 }))
  for (const paragraph of aiSummary.split('\n').filter((line) => line.trim())) {
    children.push(new Paragraph({ text: paragraph.trim() }))
  }

  children.push(new Paragraph({ text: 'Data', heading: HeadingLevel.HEADING_2 }))
  if (data.rows.length) {
    children.push(
      new WordTable({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new WordTableRow({
            tableHeader: true,
            children: data.columns.map(
              (column) =>
                new WordTableCell({
                  shading: { fill: 'EEF2FF' },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: column, bold: true, size: 18 })] }),
                  ],
                }),
            ),
          }),
          ...data.rows.map(
            (row) =>
              new WordTableRow({
                children: row.map(
                  (cell) =>
                    new WordTableCell({
                      children: [
                        new Paragraph({ children: [new TextRun({ text: String(cell), size: 18 })] }),
                      ],
                    }),
                ),
              }),
          ),
        ],
      }),
    )
  } else {
    children.push(new Paragraph({ text: 'No data recorded for this report type yet.' }))
  }

  if (data.note) {
    children.push(new Paragraph({ text: 'Note', heading: HeadingLevel.HEADING_2 }))
    children.push(
      new Paragraph({ children: [new TextRun({ text: data.note, italics: true, color: '6B7280' })] }),
    )
  }

  const document = new WordDocument({ sections: [{ children }] })
  const buffer = await Packer.toBuffer(document)
  return { bytes: new Uint8Array(buffer), ...FORMAT_META.WORD }
}

function generateExcel(
  data: ReportData,
  aiSummary: string,
  generatedAt: Date,
): GeneratedFile {
  const workbook = XLSX.utils.book_new()

  const dataSheet = XLSX.utils.aoa_to_sheet(
    data.rows.length
      ? [data.columns, ...data.rows]
      : [data.columns, ['No data recorded for this report type yet.']],
  )
  dataSheet['!cols'] = data.columns.map(() => ({ wch: 22 }))
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data')

  const summaryRows: (string | number)[][] = [
    [data.title],
    [`Generated ${generatedAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`],
    [],
    ['Key Figures'],
    ...data.highlights.map((highlight) => [highlight.label, highlight.value]),
    [],
    ['Summary & Insights'],
    ...aiSummary.split('\n').filter((line) => line.trim()).map((line) => [line.trim()]),
  ]
  if (data.note) summaryRows.push([], ['Note'], [data.note])

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
  summarySheet['!cols'] = [{ wch: 40 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return { bytes: new Uint8Array(output), ...FORMAT_META.EXCEL }
}

export async function generateReportFile(
  format: ReportFormat,
  data: ReportData,
  aiSummary: string,
  generatedAt: Date,
): Promise<GeneratedFile> {
  switch (format) {
    case 'PDF':
      return generatePdf(data, aiSummary, generatedAt)
    case 'WORD':
      return generateWord(data, aiSummary, generatedAt)
    case 'EXCEL':
      return generateExcel(data, aiSummary, generatedAt)
  }
}
