import { useEffect, useState } from 'react'
import type { LessonBlock } from '@/features/dashboard/services/dashboard.api'
import { FileText, Video, ExternalLink, Minimize2 } from 'lucide-react'
import { createPortal } from 'react-dom'

interface StudentBlockRendererProps {
  block: LessonBlock
}

export function StudentBlockRenderer({ block }: StudentBlockRendererProps) {
  if (block.type === 'text') {
    return <TextBlockRenderer block={block} />
  }

  if (block.type === 'video') {
    return <VideoBlockRenderer block={block} />
  }

  if (block.type === 'pdf') {
    return <PdfBlockRenderer block={block} />
  }

  return null
}

// ==================== TEXT BLOCK ====================

function TextBlockRenderer({ block }: { block: LessonBlock }) {
  if (!block.content) return null
  return (
    <div className="mb-6 text-gray-800 dark:text-gray-100 leading-relaxed">
      {block.content.split('\n').map((line, i) => (
        <p key={i} className={line === '' ? 'mb-3' : 'mb-2'}>
          {line || '\u00A0'}
        </p>
      ))}
    </div>
  )
}

// ==================== VIDEO BLOCK ====================

function VideoBlockRenderer({ block }: { block: LessonBlock }) {
  const extractVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }

  const videoId = block.video_url ? extractVideoId(block.video_url) : null
  return (
    <div className="mb-6">
      {block.video_title && (
        <div className="flex items-center gap-2 mb-3">
          <Video className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{block.video_title}</h3>
        </div>
      )}
      {videoId ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={block.video_title || 'Vidéo'}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <Video className="w-4 h-4" />
          URL vidéo non valide
        </div>
      )}
    </div>
  )
}

// ==================== PDF BLOCK ====================

function PdfBlockRenderer({ block }: { block: LessonBlock }) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return

    const originalOverflow = document.body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded])

  if (!block.pdf_url) {
    return (
      <div className="mb-6 flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-600 text-sm">
        <FileText className="w-4 h-4" />
        Aucun fichier PDF sélectionné
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        {block.pdf_name && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{block.pdf_name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={block.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Nouvel onglet
              </a>
              <button
                onClick={() => setExpanded(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Agrandir
              </button>
            </div>
          </div>
        )}
        <div className="w-full h-96 border-2 border-gray-200 rounded-xl overflow-hidden">
          <iframe
            src={block.pdf_url}
            title={block.pdf_name || 'PDF'}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Fullscreen PDF Modal */}
      {expanded && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col">
          {/* Top bar - toujours visible au-dessus du PDF */}
          <div className="relative z-50 flex items-center justify-between bg-gray-800 border-b border-gray-700 px-4 py-2 shadow-xl flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <span className="text-white font-semibold truncate max-w-md">
                {block.pdf_name || 'Document PDF'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={block.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Nouvel onglet
              </a>
              <button
                onClick={() => setExpanded(false)}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-lg"
              >
                <Minimize2 className="w-4 h-4" />
                Réduire
              </button>
            </div>
          </div>

          {/* PDF viewer */}
          <div className="flex-1 p-4 overflow-hidden min-h-0">
            <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-2xl">
              <iframe
                src={block.pdf_url}
                title={block.pdf_name || 'PDF'}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
