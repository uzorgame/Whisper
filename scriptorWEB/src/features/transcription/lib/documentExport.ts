import { downloadBlob } from '../../../shared/lib/download'
import { formatTimecode } from '../../../shared/lib/format'
import type { TranscriptSegment } from '../model/types'

export interface DocumentMeta {
  title: string
  /** source audio length in seconds */
  duration: number
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * pdfmake and docx are both heavy and only needed on demand, so they are
 * dynamically imported — neither lands in the initial bundle.
 */

let pdfMakeReady: Promise<any> | null = null

async function loadPdfMake(): Promise<any> {
  if (pdfMakeReady) return pdfMakeReady

  pdfMakeReady = (async () => {
    const core = await import('pdfmake/build/pdfmake')
    const pdfMake: any = (core as any).default ?? core

    const fonts = await import('pdfmake/build/vfs_fonts')
    const vfs: any = (fonts as any).default ?? fonts

    // pdfmake 0.3 registers the virtual file system through a method;
    // 0.2 exposed a plain `vfs` property. Support whichever is present.
    if (typeof pdfMake.addVirtualFileSystem === 'function') {
      pdfMake.addVirtualFileSystem(vfs)
    } else {
      pdfMake.vfs = vfs.pdfMake?.vfs ?? vfs
    }

    return pdfMake
  })()

  return pdfMakeReady
}

export async function exportPDF(
  segments: TranscriptSegment[],
  meta: DocumentMeta,
): Promise<void> {
  const pdfMake = await loadPdfMake()

  const rows = segments.map((segment) => [
    {
      text: formatTimecode(segment.start),
      color: '#6B665C',
      fontSize: 9,
      margin: [0, 2, 0, 0] as [number, number, number, number],
    },
    { text: segment.text, fontSize: 11, lineHeight: 1.35 },
  ])

  const definition = {
    pageMargins: [48, 56, 48, 56] as [number, number, number, number],
    content: [
      { text: meta.title, fontSize: 20, bold: true, color: '#201515' },
      {
        text: `${formatTimecode(meta.duration)} · ${segments.length} segments · transcribed locally`,
        fontSize: 9,
        color: '#6B665C',
        margin: [0, 4, 0, 18] as [number, number, number, number],
      },
      {
        table: { widths: [46, '*'], body: rows },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#ECEAE3',
          paddingTop: () => 6,
          paddingBottom: () => 6,
          paddingLeft: () => 0,
          paddingRight: () => 8,
        },
      },
    ],
    defaultStyle: { color: '#36342E' },
  }

  pdfMake.createPdf(definition).download(`${meta.title}.pdf`)
}

export async function exportDOCX(
  segments: TranscriptSegment[],
  meta: DocumentMeta,
): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import(
    'docx'
  )

  const body = segments.flatMap((segment) => [
    new Paragraph({
      children: [
        new TextRun({
          text: formatTimecode(segment.start),
          color: '6B665C',
          size: 18,
        }),
        new TextRun({ text: '  ' }),
        new TextRun({ text: segment.text, size: 22 }),
      ],
      spacing: { after: 140 },
    }),
  ])

  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: meta.title,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${formatTimecode(meta.duration)} · ${segments.length} segments · transcribed locally`,
                color: '6B665C',
                size: 18,
              }),
            ],
            spacing: { after: 320 },
          }),
          ...body,
        ],
      },
    ],
  })

  downloadBlob(`${meta.title}.docx`, await Packer.toBlob(document))
}
