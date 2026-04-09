import { useDraggable } from '@dnd-kit/core'
import { Type, Video, FileText, Plus } from 'lucide-react'
import { CSS } from '@dnd-kit/utilities'

interface DraggableToolProps {
  type: 'text' | 'video' | 'pdf'
  label: string
  color: string
  icon: React.ReactNode
}

function DraggableTool({ type, label, color, icon, onAdd }: DraggableToolProps & { onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tool-${type}`,
    data: { type },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 9999 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onAdd}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer ${color} ${
        isDragging ? 'opacity-50 scale-105 shadow-lg' : 'hover:scale-[1.02]'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
      <Plus className="w-4 h-4 ml-auto opacity-50" />
    </div>
  )
}

interface LessonBlockToolbarProps {
  onAddBlock: (type: 'text' | 'video' | 'pdf') => void
}

export function LessonBlockToolbar({ onAddBlock }: LessonBlockToolbarProps) {
  const tools = [
    {
      type: 'text' as const,
      label: 'Bloc Texte',
      color: 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400',
      icon: <Type className="w-5 h-5 text-blue-500" />,
    },
    {
      type: 'video' as const,
      label: 'Bloc Vidéo',
      color: 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400',
      icon: <Video className="w-5 h-5 text-red-500" />,
    },
    {
      type: 'pdf' as const,
      label: 'Bloc PDF',
      color: 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-400',
      icon: <FileText className="w-5 h-5 text-orange-500" />,
    },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Ajouter un bloc
      </h3>
      <p className="text-xs text-gray-500">
        Glissez un bloc dans la feuille ou cliquez pour l'ajouter
      </p>
      <div className="space-y-2">
        {tools.map((tool) => (
          <DraggableTool
            key={tool.type}
            type={tool.type}
            label={tool.label}
            color={tool.color}
            icon={tool.icon}
            onAdd={() => onAddBlock(tool.type)}
          />
        ))}
      </div>
    </div>
  )
}
