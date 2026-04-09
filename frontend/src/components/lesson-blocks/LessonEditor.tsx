import { useState, useCallback, useRef, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import type { LessonBlock, LessonBlockType, UpsertLessonPayload } from '@/features/dashboard/services/dashboard.api'
import { BlockWrapper } from './BlockWrapper'
import { LessonBlockToolbar } from './LessonBlockToolbar'
import { v4 as uuidv4 } from 'uuid'
import { cn } from '@/lib/utils'
import { Save, Plus, ChevronLeft, ChevronRight, FileText, Check, Trash2 } from 'lucide-react'

interface LessonEditorProps {
  lesson: UpsertLessonPayload & { id?: number }
  chapters: Array<{
    id: number
    title: string
    lessons: Array<{ id: number; title: string }>
  }>
  currentChapterId: number
  currentLessonId: number | null
  onSave: (lessonData: UpsertLessonPayload) => void
  onDeleteLesson: (lessonId: number) => void
  onNavigateLesson: (chapterId: number, lessonId: number) => void
  onAddLesson: (chapterId: number) => void
  onFinishChapter: (chapterId: number) => void
  onAddChapter: (courseId: number) => void
  onUploadPdfBlock?: (blockId: string, file: File) => Promise<LessonBlock | void>
  courseId: number
  isSaving?: boolean
}

export function LessonEditor({
  lesson,
  chapters,
  currentChapterId,
  currentLessonId,
  onSave,
  onDeleteLesson,
  onNavigateLesson,
  onAddLesson,
  onFinishChapter,
  onAddChapter,
  onUploadPdfBlock,
  courseId,
  isSaving = false,
}: LessonEditorProps) {
  const [blocks, setBlocks] = useState<LessonBlock[]>(lesson.blocks || [])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const currentChapter = chapters.find((c) => c.id === currentChapterId)
  const currentLessonIndex = currentChapter?.lessons.findIndex((l) => l.id === currentLessonId) ?? -1
  const prevLesson = currentChapter?.lessons[currentLessonIndex - 1] ?? null
  const nextLesson = currentChapter?.lessons[currentLessonIndex + 1] ?? null

  useEffect(() => {
    setBlocks(lesson.blocks || [])
  }, [lesson.id, lesson.blocks])

  const handleAddBlock = useCallback((type: LessonBlockType, index?: number) => {
    const newBlock: LessonBlock = {
      id: uuidv4(),
      type,
      order: blocks.length,
      content: type === 'text' ? '' : undefined,
      video_url: type === 'video' ? '' : undefined,
      video_title: type === 'video' ? '' : undefined,
    }

    if (index !== undefined && index >= 0) {
      const newBlocks = [...blocks]
      newBlocks.splice(index, 0, newBlock)
      newBlocks.forEach((b, i) => (b.order = i))
      setBlocks(newBlocks)
    } else {
      setBlocks([...blocks, newBlock])
    }
  }, [blocks])

  const handleUpdateBlock = useCallback((id: string, updates: Partial<LessonBlock>) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, ...updates } : block))
    )
  }, [])

  const handleDeleteBlock = useCallback((id: string) => {
    setBlocks((prev) =>
      prev
        .filter((b) => b.id !== id)
        .map((block, index) => ({ ...block, order: index })),
    )
  }, [])

  const handleAddAfter = useCallback((id: string) => {
    const index = blocks.findIndex((b) => b.id === id)
    handleAddBlock('text', index + 1)
  }, [blocks, handleAddBlock])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event

    // Handle dragging from toolbar (new block)
    if (event.active.id.toString().startsWith('tool-')) {
      if (over && over.id === 'canvas-drop-zone') {
        setDropIndicatorIndex(blocks.length)
      }
      return
    }

    // Handle reordering existing blocks
    if (over && over.id !== 'canvas-drop-zone') {
      const overIndex = blocks.findIndex((b) => b.id === over.id)
      setDropIndicatorIndex(overIndex)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setDropIndicatorIndex(null)

    if (!over) return

    // New block from toolbar
    if (active.id.toString().startsWith('tool-')) {
      const type = active.data.current?.type as LessonBlockType
      const insertIndex = over.id === 'canvas-drop-zone'
        ? blocks.length
        : blocks.findIndex((b) => b.id === over.id)
      handleAddBlock(type, insertIndex >= 0 ? insertIndex : blocks.length)
      return
    }

    // Reorder existing blocks
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id)
      const newIndex = blocks.findIndex((b) => b.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newBlocks = arrayMove(blocks, oldIndex, newIndex)
        newBlocks.forEach((b, i) => (b.order = i))
        setBlocks(newBlocks)
      }
    }
  }

  const handleSave = async () => {
    // Strip _localFile from blocks before sending to API (File objects can't be serialized)
    const normalizedBlocks = blocks.map((block, index) => {
      const { _localFile: _, ...rest } = block as LessonBlock & { _localFile?: File | null }
      return {
        ...rest,
        order: index,
      }
    })

    onSave({
      title: lesson.title,
      content: lesson.content,
      blocks: normalizedBlocks,
      video_url: normalizedBlocks.length > 0 ? null : lesson.video_url,
      order: lesson.order,
      duration: lesson.duration,
      is_free: lesson.is_free,
    })

    // Upload PDFs after save (only for existing lessons)
    if (!lesson.id) return

    const blocksWithFiles = blocks.filter(
      (b) => (b as LessonBlock & { _localFile?: File | null })._localFile,
    )
    for (const block of blocksWithFiles) {
      const _localFile = (block as LessonBlock & { _localFile?: File | null })._localFile
      if (_localFile && onUploadPdfBlock) {
        const uploadedBlock = await onUploadPdfBlock(block.id, _localFile)
        if (uploadedBlock) {
          // Update the block in state with the uploaded URL
          setBlocks((prev) =>
            prev.map((b) =>
              b.id === block.id
                ? { ...b, ...uploadedBlock, _localFile: null }
                : b,
            ),
          )
        }
      }
    }
  }

  const activeBlockType = activeId?.startsWith('tool-')
    ? activeId.replace('tool-', '') as LessonBlockType
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-12rem)] gap-6">
        {/* ==================== LEFT: A4 CANVAS ==================== */}
        <div className="flex-1 overflow-y-auto pr-2">
          {/* Lesson title header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">{lesson.title || 'Nouvelle leçon'}</h2>
            </div>
            <div className="flex items-center gap-2">
              {lesson.id && (
                <button
                  onClick={() => onDeleteLesson(lesson.id!)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                  isSaving
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md',
                )}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>

          {/* A4 Page Canvas */}
          <div
            ref={canvasRef}
            id="canvas-drop-zone"
            className={cn(
              'min-h-[800px] bg-white rounded-xl shadow-lg border-2 border-dashed transition-colors mx-auto',
              'max-w-[210mm] p-[15mm]',
              dropIndicatorIndex !== null && !activeId?.startsWith('tool-')
                ? 'border-indigo-400 bg-indigo-50/30'
                : 'border-gray-200',
            )}
          >
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Plus className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Commencez votre leçon
                </h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Glissez des blocs depuis la barre d'outils à droite, ou cliquez sur un bloc pour l'ajouter
                </p>
              </div>
            ) : (
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.map((block, index) => (
                  <div key={block.id} className="relative">
                    {/* Drop indicator */}
                    {dropIndicatorIndex === index && activeId?.startsWith('tool-') && (
                      <div className="absolute -top-2 left-0 right-0 h-1 bg-indigo-400 rounded-full z-10" />
                    )}
                    <BlockWrapper
                      block={block}
                      index={index}
                      onUpdate={handleUpdateBlock}
                      onDelete={handleDeleteBlock}
                      onAddAfter={handleAddAfter}
                    />
                  </div>
                ))}
                {dropIndicatorIndex === blocks.length && activeId?.startsWith('tool-') && (
                  <div className="h-1 bg-indigo-400 rounded-full mb-4" />
                )}
              </SortableContext>
            )}
          </div>

          {/* Navigation buttons below canvas */}
          <div className="flex items-center justify-between mt-6 pb-4">
            <button
              onClick={() => prevLesson && onNavigateLesson(currentChapterId, prevLesson.id)}
              disabled={!prevLesson}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                prevLesson
                  ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed',
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              {prevLesson?.title || 'Leçon précédente'}
            </button>

            <button
              onClick={() => onAddLesson(currentChapterId)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle leçon
            </button>

            <button
              onClick={() => nextLesson && onNavigateLesson(currentChapterId, nextLesson.id)}
              disabled={!nextLesson}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                nextLesson
                  ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed',
              )}
            >
              {nextLesson?.title || 'Leçon suivante'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ==================== RIGHT: TOOLBAR ==================== */}
        <div className="w-72 flex-shrink-0 space-y-6">
          {/* Block tools */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <LessonBlockToolbar onAddBlock={handleAddBlock} />
          </div>

          {/* Chapter navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Chapitres & Leçons
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      chapter.id === currentChapterId ? 'bg-indigo-600' : 'bg-gray-300',
                    )} />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {chapter.title}
                    </span>
                  </div>
                  <div className="ml-4 space-y-0.5">
                    {chapter.lessons.map((lessonItem) => (
                      <button
                        key={lessonItem.id}
                        onClick={() => onNavigateLesson(chapter.id, lessonItem.id)}
                        className={cn(
                          'w-full text-left px-2 py-1 rounded text-xs truncate transition-colors',
                          lessonItem.id === currentLessonId
                            ? 'bg-indigo-100 text-indigo-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100',
                        )}
                      >
                        {lessonItem.title || 'Sans titre'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chapter actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Actions du chapitre
            </h3>
            <button
              onClick={() => onAddChapter(courseId)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau chapitre
            </button>
            <button
              onClick={() => onFinishChapter(currentChapterId)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Check className="w-4 h-4" />
              Terminer le chapitre
            </button>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeBlockType && (
          <div className="px-4 py-3 rounded-lg bg-white shadow-xl border-2 border-indigo-400 opacity-90">
            <span className="text-sm font-medium capitalize text-gray-700">
              Bloc {activeBlockType}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
