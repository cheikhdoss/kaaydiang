import type { LessonBlock } from '@/features/dashboard/services/dashboard.api'
import { cn } from '@/lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, Type, Video, FileText, Plus, Upload } from 'lucide-react'
import { useState, useCallback } from 'react'

interface BlockWrapperProps {
  block: LessonBlock
  index: number
  onUpdate: (id: string, updates: Partial<LessonBlock>) => void
  onDelete: (id: string) => void
  onAddAfter: (id: string) => void
}

export function BlockWrapper({ block, index, onUpdate, onDelete, onAddAfter }: BlockWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-white border border-gray-200 rounded-lg mb-4',
        'hover:border-indigo-300 hover:shadow-md transition-all duration-200',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-indigo-400',
      )}
    >
      {/* Drag handle + actions bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {block.type === 'text' && (
            <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
              <Type className="w-3.5 h-3.5" /> Texte
            </span>
          )}
          {block.type === 'video' && (
            <span className="flex items-center gap-1 text-xs font-medium text-red-600">
              <Video className="w-3.5 h-3.5" /> Vidéo
            </span>
          )}
          {block.type === 'pdf' && (
            <span className="flex items-center gap-1 text-xs font-medium text-orange-600">
              <FileText className="w-3.5 h-3.5" /> PDF
            </span>
          )}
        </div>
        <span className="ml-auto text-xs text-gray-400">Bloc {index + 1}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddAfter(block.id)}
            className="p-1 text-gray-400 hover:text-indigo-600 rounded hover:bg-gray-100"
            title="Ajouter un bloc après"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(block.id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
            title="Supprimer le bloc"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Block content */}
      <div className="p-4">
        {block.type === 'text' && (
          <TextBlockEditor block={block} onUpdate={onUpdate} />
        )}
        {block.type === 'video' && (
          <VideoBlockEditor block={block} onUpdate={onUpdate} />
        )}
        {block.type === 'pdf' && (
          <PdfBlockEditor block={block} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  )
}

// ==================== TEXT BLOCK ====================

interface TextBlockEditorProps {
  block: LessonBlock
  onUpdate: (id: string, updates: Partial<LessonBlock>) => void
}

function TextBlockEditor({ block, onUpdate }: TextBlockEditorProps) {
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate(block.id, { content: e.target.value })
    },
    [block.id, onUpdate],
  )

  if (!isEditing && block.content) {
    return (
      <div
        className="prose prose-sm max-w-none cursor-pointer text-gray-900"
        onClick={() => setIsEditing(true)}
      >
        {block.content.split('\n').map((line, i) => (
          <p key={i} className={line === '' ? 'mb-2' : 'mb-1 text-gray-900'}>
            {line || '\u00A0'}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div>
      <textarea
        autoFocus
        value={block.content || ''}
        onChange={handleSave}
        onBlur={() => setIsEditing(false)}
        placeholder="Saisissez le contenu de votre leçon ici... Vous pouvez écrire du texte, des titres, des listes, etc."
        className="w-full min-h-[120px] p-3 text-sm text-gray-900 border border-gray-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder:text-gray-400"
      />
      <p className="mt-1 text-xs text-gray-400">
        Astuce : saisissez votre texte puis cliquez ailleurs pour sauvegarder
      </p>
    </div>
  )
}

// ==================== VIDEO BLOCK ====================

interface VideoBlockEditorProps {
  block: LessonBlock
  onUpdate: (id: string, updates: Partial<LessonBlock>) => void
}

function VideoBlockEditor({ block, onUpdate }: VideoBlockEditorProps) {
  const extractVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }

  const videoId = block.video_url ? extractVideoId(block.video_url) : null

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={block.video_title || ''}
        onChange={(e) => onUpdate(block.id, { video_title: e.target.value })}
        placeholder="Titre de la vidéo (ex: Introduction au chapitre)"
        className="w-full px-3 py-2 text-sm font-medium text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-400"
      />
      <input
        type="text"
        value={block.video_url || ''}
        onChange={(e) => onUpdate(block.id, { video_url: e.target.value })}
        placeholder="URL YouTube (ex: https://www.youtube.com/watch?v=...)"
        className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-400"
      />
      {videoId && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={block.video_title || 'Vidéo'}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {!videoId && block.video_url && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          URL non reconnue. Veuillez entrer une URL YouTube valide.
        </p>
      )}
    </div>
  )
}

// ==================== PDF BLOCK ====================

interface PdfBlockEditorProps {
  block: LessonBlock
  onUpdate: (id: string, updates: Partial<LessonBlock>) => void
}

function PdfBlockEditor({ block, onUpdate }: PdfBlockEditorProps) {
  const previewUrl = block._localFile ? URL.createObjectURL(block._localFile) : block.pdf_url

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      onUpdate(block.id, {
        _localFile: file,
        pdf_name: file.name,
        pdf_size: file.size,
      } as Partial<LessonBlock>)
    }
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <FileText className="w-5 h-5 text-orange-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{block.pdf_name || 'document.pdf'}</p>
              {block.pdf_size && (
                <p className="text-xs text-gray-500">{(block.pdf_size / 1024).toFixed(1)} Ko</p>
              )}
              {block._localFile && (
                <p className="text-xs text-orange-500 font-medium">En attente de sauvegarde...</p>
              )}
            </div>
            <button
              onClick={() => onUpdate(block.id, { pdf_url: undefined, pdf_path: undefined, pdf_name: undefined, pdf_size: undefined, _localFile: null })}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Supprimer
            </button>
          </div>
          <div className="w-full h-64 border border-gray-200 rounded-lg overflow-hidden">
            <iframe
              src={previewUrl}
              title={block.pdf_name || 'PDF'}
              className="w-full h-full"
            />
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500">Cliquez ou glissez un PDF ici</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}
