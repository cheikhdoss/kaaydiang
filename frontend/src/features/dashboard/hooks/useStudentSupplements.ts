import { useState, useEffect } from 'react'

// ==================== CALENDAR MOCK DATA ====================

interface CalendarEvent {
  id: number
  title: string
  date: string
  time: string
  type: 'deadline' | 'live' | 'exam' | 'reminder'
  course: string
  description: string
}

const calendarEvents: CalendarEvent[] = [
  { id: 1, title: 'Devoir React — Projet final', date: '2026-04-10', time: '23:59', type: 'deadline', course: 'React Masterclass', description: 'Soumission du projet final avec les composants avancés' },
  { id: 2, title: 'Live Q&A — Laravel', date: '2026-04-12', time: '14:00', type: 'live', course: 'Laravel Avancé', description: 'Session de questions-réponses en direct avec l\'instructeur' },
  { id: 3, title: 'Examen — JavaScript', date: '2026-04-15', time: '09:00', type: 'exam', course: 'JavaScript Pro', description: 'Examen final couvrant ES6+, async/await, et les design patterns' },
  { id: 4, title: 'Rappel — Devoir Node.js', date: '2026-04-08', time: '18:00', type: 'reminder', course: 'Node.js API', description: 'N\'oubliez pas de soumettre votre API REST avant la date limite' },
  { id: 5, title: 'Webinaire — Design System', date: '2026-04-18', time: '10:00', type: 'live', course: 'UI/UX Design', description: 'Création d\'un design system complet de A à Z' },
  { id: 6, title: 'Quiz — Python Data', date: '2026-04-20', time: '00:00', type: 'deadline', course: 'Python Data Science', description: 'Quiz sur Pandas, NumPy et la visualisation de données' },
]

export const useStudentCalendar = () => {
  const [data, setData] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(calendarEvents)
      setIsLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  return { data, isLoading }
}

// ==================== MESSAGES MOCK DATA ====================

interface Message {
  id: number
  sender: { name: string; avatar: string; role: string }
  subject: string
  preview: string
  date: string
  unread: boolean
  course: string
}

const mockMessages: Message[] = [
  { id: 1, sender: { name: 'Dr. Amadou Diallo', avatar: 'AD', role: 'Instructeur' }, subject: 'Feedback sur votre dernier devoir', preview: 'Excellent travail sur le composant CourseCard. J\'ai quelques suggestions pour améliorer...', date: 'Il y a 2h', unread: true, course: 'React Masterclass' },
  { id: 2, sender: { name: 'Prof. Fatou Sow', avatar: 'FS', role: 'Instructeur' }, subject: 'Planning du live de la semaine prochaine', preview: 'Bonjour à tous, le live de la semaine prochaine portera sur les middleware Laravel...', date: 'Il y a 5h', unread: true, course: 'Laravel Avancé' },
  { id: 3, sender: { name: 'Marie Ndiaye', avatar: 'MN', role: 'Instructeur' }, subject: 'Correction — Quiz Design System', preview: 'Votre score de 95% est excellent. Voici le détail de vos réponses...', date: 'Hier', unread: false, course: 'UI/UX Design' },
  { id: 4, sender: { name: 'Support KayyDiang', avatar: 'KD', role: 'Support' }, subject: 'Bienvenue sur la plateforme !', preview: 'Nous sommes ravis de vous accueillir. Voici quelques conseils pour commencer...', date: 'Il y a 3 jours', unread: false, course: 'Général' },
  { id: 5, sender: { name: 'Dr. Amadou Diallo', avatar: 'AD', role: 'Instructeur' }, subject: 'Nouveau chapitre disponible', preview: 'Le chapitre 12 sur les hooks personnalisés est maintenant disponible...', date: 'Il y a 5 jours', unread: false, course: 'React Masterclass' },
]

interface ConversationMessage {
  id: number
  sender: 'me' | 'instructor'
  text: string
  date: string
}

const mockConversation: ConversationMessage[] = [
  { id: 1, sender: 'instructor', text: 'Bonjour ! J\'ai lu votre dernier devoir. Le code est propre et bien structuré.', date: 'Il y a 2h' },
  { id: 2, sender: 'instructor', text: 'Voici mes suggestions :\n1. Utilisez useMemo pour optimiser le rendu de la liste\n2. Ajoutez des PropTypes pour la validation\n3. Séparez le hook de logique métier dans un custom hook', date: 'Il y a 2h' },
  { id: 3, sender: 'me', text: 'Merci beaucoup Dr. Diallo ! Je vais appliquer ces changements dès ce soir.', date: 'Il y a 1h' },
  { id: 4, sender: 'instructor', text: 'Parfait ! N\'hésitez pas si vous avez des questions. Bon courage 💪', date: 'Il y a 30 min' },
]

export const useStudentMessages = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages(mockMessages)
      setIsLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const selectMessage = (msg: Message) => {
    setSelectedMessage(msg)
    setConversation(mockConversation)
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, unread: false } : m))
  }

  return { messages, conversation, isLoading, selectedMessage, selectMessage }
}

// ==================== COURSE DETAIL MOCK DATA ====================

export interface Lesson {
  id: number
  title: string
  type: 'video' | 'pdf'
  duration: number
  completed: boolean
  locked: boolean
  resourceUrl?: string
  description: string
}

interface Chapter {
  id: number
  title: string
  description: string
  lessons: Lesson[]
}

interface CourseDetail {
  id: number
  title: string
  description: string
  thumbnail: string
  instructor: string
  level: string
  enrolledStudents: number
  chapters: Chapter[]
}

const mockCourseDetail: CourseDetail = {
  id: 1,
  title: 'React Masterclass — De zéro à expert',
  description: 'Maîtrisez React 18 avec les hooks avancés, le pattern compound components, les performances et le testing. Un parcours complet pour devenir un développeur React senior.',
  thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=80',
  instructor: 'Dr. Amadou Diallo',
  level: 'Intermédiaire',
  enrolledStudents: 2450,
  chapters: [
    {
      id: 1,
      title: 'Fondamentaux React',
      description: 'Les bases solides de React',
      lessons: [
        { id: 1, title: 'Introduction à React 18', type: 'video', duration: 15, completed: true, locked: false, resourceUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Vue d\'ensemble de React et son écosystème' },
        { id: 2, title: 'JSX et Composants', type: 'video', duration: 22, completed: true, locked: false, resourceUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Comprendre JSX et créer vos premiers composants' },
        { id: 3, title: 'Props et State', type: 'pdf', duration: 10, completed: true, locked: false, resourceUrl: '#', description: 'Guide complet sur les props et le state management local' },
        { id: 4, title: 'Cycle de vie des composants', type: 'video', duration: 18, completed: true, locked: false, resourceUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'useEffect et les effets de bord' },
      ]
    },
    {
      id: 2,
      title: 'Hooks Avancés',
      description: 'Maîtriser les hooks React',
      lessons: [
        { id: 5, title: 'useMemo et useCallback', type: 'video', duration: 25, completed: true, locked: false, resourceUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Optimisation des performances avec la mémoïsation' },
        { id: 6, title: 'useRef et DOM', type: 'pdf', duration: 12, completed: false, locked: false, resourceUrl: '#', description: 'Accéder au DOM et persister des valeurs' },
        { id: 7, title: 'Custom Hooks', type: 'video', duration: 30, completed: false, locked: false, resourceUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Créer vos propres hooks réutilisables' },
        { id: 8, title: 'useReducer — State complexe', type: 'video', duration: 28, completed: false, locked: true, resourceUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Gérer un state complexe avec useReducer' },
      ]
    },
    {
      id: 3,
      title: 'Pattern & Architecture',
      description: 'Structurer une application React pro',
      lessons: [
        { id: 9, title: 'Compound Components', type: 'pdf', duration: 20, completed: false, locked: true, resourceUrl: '#', description: 'Le pattern Compound Components expliqué' },
        { id: 10, title: 'Render Props & HOC', type: 'video', duration: 35, completed: false, locked: true, resourceUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Patterns de composition avancés' },
        { id: 11, title: 'Context API vs Redux', type: 'video', duration: 40, completed: false, locked: true, resourceUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Quand utiliser Context API ou Redux' },
      ]
    },
    {
      id: 4,
      title: 'Performances & Testing',
      description: 'Optimiser et tester votre app',
      lessons: [
        { id: 12, title: 'React.memo et Profiler', type: 'video', duration: 22, completed: false, locked: true, resourceUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Identifier et résoudre les problèmes de performance' },
        { id: 13, title: 'Code Splitting', type: 'pdf', duration: 15, completed: false, locked: true, resourceUrl: '#', description: 'React.lazy et Suspense pour le code splitting' },
        { id: 14, title: 'Testing avec Jest & RTL', type: 'video', duration: 45, completed: false, locked: true, resourceUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Tests unitaires et d\'intégration avec React Testing Library' },
      ]
    },
  ]
}

export const useCourseDetail = (courseId: number) => {
  const [data, setData] = useState<CourseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockCourseDetail)
      setIsLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [courseId])

  return { data, isLoading }
}

export const useLesson = (courseId: number, lessonId: number) => {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      const course = mockCourseDetail
      const lesson = course.chapters.flatMap(c => c.lessons).find(l => l.id === lessonId)
      setLesson(lesson || null)
      setCourse(course)
      setIsLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [courseId, lessonId])

  return { lesson, course, isLoading }
}

// ==================== LEGACY EXPORTS (for StudentDashboard, etc.) ====================

interface Certificate {
  id: number
  course: { title: string }
  certificate_code: string
  issued_at: string
}

interface DeadlineAssignment {
  id: number
  title: string
  course_title: string
  due_date: string
  status: string
  submitted_at?: string
}

interface NextLessonPayload {
  next_lesson?: {
    course: { title: string }
    lesson_title: string
    duration: number
  }
}

const mockCertificates: Certificate[] = [
  { id: 1, course: { title: 'Laravel + React Masterclass' }, certificate_code: 'KAYY-2026-001', issued_at: '2026-04-07' },
]

const mockDeadlines: DeadlineAssignment[] = [
  { id: 1, title: 'Projet React — Dashboard', course_title: 'React Masterclass', due_date: '2026-04-15', status: 'pending' },
  { id: 2, title: 'API REST — CRUD', course_title: 'Laravel Avancé', due_date: '2026-04-20', status: 'submitted', submitted_at: '2026-04-05' },
]

const mockNextLesson: NextLessonPayload = {
  next_lesson: {
    course: { title: 'React Masterclass' },
    lesson_title: 'Custom Hooks',
    duration: 1800,
  }
}

export const useStudentSupplementCertificates = () => {
  const [data, setData] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockCertificates)
      setIsLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  return { data, isLoading }
}

export const useStudentSupplementDeadlines = () => {
  const [data, setData] = useState<DeadlineAssignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [error] = useState<Error | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockDeadlines)
      setIsLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const refetch = () => {
    setIsLoading(true)
    setTimeout(() => {
      setData(mockDeadlines)
      setIsLoading(false)
    }, 400)
  }

  return { data, isLoading, isError, error, refetch }
}

export const useStudentSupplementNextLesson = () => {
  const [data, setData] = useState<NextLessonPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockNextLesson)
      setIsLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  return { data, isLoading }
}
