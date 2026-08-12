import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Menu, MenuItem } from '../../../shared/ui/Menu'
import {
  ChevronDownIcon,
  CopyIcon,
  FileIcon,
} from '../../../shared/ui/icons'
import { downloadTextFile, stripExtension } from '../../../shared/lib/download'
import { exportDOCX, exportPDF } from '../lib/documentExport'
import { serialiseTranscript, toPlainText } from '../lib/exporters'
import type { TranscriptionResult } from '../model/types'

interface Props {
  result: TranscriptionResult
  sourceName: string
}

export function ExportMenu({ result, sourceName }: Props) {
  const [copied, setCopied] = useState(false)
  const [busyFormat, setBusyFormat] = useState<string | null>(null)

  const title = stripExtension(sourceName)
  const meta = { title, duration: result.duration }

  async function handleCopy() {
    await navigator.clipboard.writeText(toPlainText(result.segments))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function runDocumentExport(
    format: 'pdf' | 'docx',
    task: () => Promise<void>,
  ) {
    setBusyFormat(format)
    try {
      await task()
    } finally {
      setBusyFormat(null)
    }
  }

  return (
    <Menu
      heading="Export"
      trigger={({ open, toggle }) => (
        <Button onClick={toggle} aria-expanded={open}>
          Export
          <ChevronDownIcon />
        </Button>
      )}
    >
      {({ close }) => (
        <>
          <MenuItem
            icon={<CopyIcon />}
            onSelect={() => {
              void handleCopy()
              close()
            }}
          >
            {copied ? 'Copied' : 'Copy text'}
          </MenuItem>

          <MenuItem
            icon={<FileIcon label="PDF" />}
            disabled={busyFormat !== null}
            onSelect={() => {
              void runDocumentExport('pdf', () =>
                exportPDF(result.segments, meta),
              )
              close()
            }}
          >
            Download PDF
          </MenuItem>

          <MenuItem
            icon={<FileIcon label="DOC" />}
            disabled={busyFormat !== null}
            onSelect={() => {
              void runDocumentExport('docx', () =>
                exportDOCX(result.segments, meta),
              )
              close()
            }}
          >
            Download DOCX
          </MenuItem>

          <MenuItem
            icon={<FileIcon label="TXT" />}
            onSelect={() => {
              downloadTextFile(
                `${title}.txt`,
                serialiseTranscript(result.segments, 'txt'),
              )
              close()
            }}
          >
            Download TXT
          </MenuItem>

          <MenuItem
            icon={<FileIcon label="SRT" />}
            onSelect={() => {
              downloadTextFile(
                `${title}.srt`,
                serialiseTranscript(result.segments, 'srt'),
              )
              close()
            }}
          >
            Download SRT
          </MenuItem>

          <MenuItem
            icon={<FileIcon label="VTT" />}
            onSelect={() => {
              downloadTextFile(
                `${title}.vtt`,
                serialiseTranscript(result.segments, 'vtt'),
              )
              close()
            }}
          >
            Download VTT
          </MenuItem>
        </>
      )}
    </Menu>
  )
}
