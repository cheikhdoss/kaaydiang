import { MessageSquare, Search, Send, Paperclip, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import {
  useInstructorMessageThread,
  useMarkInstructorThreadRead,
  useInstructorMessages,
  useSendInstructorMessage,
} from '../hooks/useInstructorSupplements'
import type { DashboardRole } from '../services/dashboard.api'

const InstructorMessagesPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: conversations = [], isLoading, isError, error, refetch } = useInstructorMessages()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const sendMessageMutation = useSendInstructorMessage()
  const markThreadReadMutation = useMarkInstructorThreadRead()

  if (!user) return <LoadingState fullscreen />

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return conversations

    return conversations.filter((conversation) => {
      return [conversation.sender_name, conversation.course_title, conversation.last_message]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [conversations, searchTerm])

  const selectedConversation = useMemo(() => {
    if (selectedConversationId === null) return null
    return conversations.find((item) => item.id === selectedConversationId) ?? null
  }, [conversations, selectedConversationId])

  const activeConversation = selectedConversation ?? filteredConversations[0] ?? null
  const {
    data: activeThread,
    isLoading: isThreadLoading,
    isError: isThreadError,
    error: threadError,
    refetch: refetchThread,
  } = useInstructorMessageThread(activeConversation?.id ?? null)

  const threadSignature = useMemo(() => {
    const latest = activeThread?.messages?.at(-1)
    return `${activeConversation?.id ?? 'none'}:${latest?.id ?? 'empty'}`
  }, [activeConversation?.id, activeThread?.messages])

  const [lastMarkedSignature, setLastMarkedSignature] = useState<string>('')

  useEffect(() => {
    if (!activeConversation?.id) return
    if (activeConversation.unread_count <= 0) return
    if (markThreadReadMutation.isPending) return
    if (threadSignature === lastMarkedSignature) return

    setLastMarkedSignature(threadSignature)
    void markThreadReadMutation.mutateAsync(activeConversation.id)
  }, [
    activeConversation?.id,
    activeConversation?.unread_count,
    markThreadReadMutation.isPending,
    markThreadReadMutation.mutateAsync,
    threadSignature,
    lastMarkedSignature,
  ])

  const initials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  const threadMessages = useMemo(() => {
    const sourceMessages = activeThread?.messages ?? []

    return sourceMessages.map((message) => ({
      id: message.id,
      sender: message.sender,
      text: message.text,
      date: message.created_at
        ? new Date(message.created_at).toLocaleDateString('fr-FR')
        : 'Aujourd\'hui',
    }))
  }, [activeThread])

  const canSendMessage = Boolean(activeConversation?.id) && newMessage.trim().length > 0 && !sendMessageMutation.isPending

  const handleSendMessage = async () => {
    const text = newMessage.trim()
    const studentId = activeConversation?.id

    if (!text || !studentId) {
      return
    }

    try {
      await sendMessageMutation.mutateAsync({
        studentId,
        message: text,
      })
      setNewMessage('')
    } catch {
      // handled by error state below
    }
  }

  if (isLoading) return <LoadingState fullscreen />
  if (isError) return <ErrorState message={error instanceof Error ? error.message : 'Erreur'} onRetry={() => void refetch()} />

  const unreadTotal = conversations.reduce((acc, c) => acc + c.unread_count, 0)

  return (
    <DashboardShell
      title="Messages"
      subtitle={`${unreadTotal} message${unreadTotal > 1 ? 's' : ''} non lu${unreadTotal > 1 ? 's' : ''}`}
      role="instructor"
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0a0a0a] overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        <div className="flex h-full">
          <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r border-slate-200 dark:border-white/5`}>
            <div className="p-4 border-b border-slate-200 dark:border-white/5">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher un étudiant, un cours..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-white/40">
                  Aucune conversation ne correspond a votre recherche.
                </div>
              ) : (
                filteredConversations.map((conv, i) => (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full p-4 text-left flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 ${activeConversation?.id === conv.id ? 'bg-blue-50/50 dark:bg-blue-400/5 border-l-2 border-l-blue-600' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {initials(conv.sender_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{conv.sender_name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-white/30 flex-shrink-0 ml-2">{conv.created_at ? new Date(conv.created_at).toLocaleDateString('fr-FR') : '-'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-white/40 truncate">{conv.course_title}</div>
                    <div className="text-xs text-slate-500 dark:text-white/40 truncate">{conv.last_message}</div>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{conv.unread_count}</span>
                  )}
                </motion.button>
              )))
              }
            </div>
          </div>

          <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            {activeConversation ? (
              <>
                <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center gap-4">
                  <button onClick={() => setSelectedConversationId(null)} className="md:hidden p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">{initials(activeConversation.sender_name)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{activeConversation.sender_name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-white/30">Étudiant - {activeConversation.course_title}</div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {isThreadLoading && (
                    <div className="text-center text-sm text-slate-500 dark:text-white/40">Chargement de la conversation...</div>
                  )}

                  {isThreadError && (
                    <ErrorState
                      message={threadError instanceof Error ? threadError.message : 'Erreur de chargement de la conversation.'}
                      onRetry={() => void refetchThread()}
                    />
                  )}

                  {!isThreadLoading && !isThreadError && threadMessages.length === 0 && (
                    <div className="text-center text-sm text-slate-500 dark:text-white/40">Aucun message dans cette conversation.</div>
                  )}

                  {sendMessageMutation.isError && (
                    <div className="text-center text-sm text-red-600 dark:text-red-300">
                      {sendMessageMutation.error instanceof Error
                        ? sendMessageMutation.error.message
                        : 'Impossible d\'envoyer le message.'}
                    </div>
                  )}

                  {!isThreadLoading && !isThreadError && threadMessages.map((msg) => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.sender === 'instructor' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${msg.sender === 'instructor' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-bl-md'}`}>
                        <p className="text-sm whitespace-pre-line">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${msg.sender === 'instructor' ? 'text-white/50' : 'text-slate-400 dark:text-white/30'}`}>{msg.date}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" type="button">
                      <Paperclip size={18} />
                    </button>
                    <input
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      placeholder="Écrire une réponse..."
                      className="flex-1 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-600 transition-all placeholder:text-slate-400 dark:placeholder:text-white/30"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && canSendMessage) {
                          void handleSendMessage()
                        }
                      }}
                    />
                    <button
                      className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!canSendMessage}
                      type="button"
                      onClick={() => void handleSendMessage()}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
                  <MessageSquare className="text-slate-300 dark:text-white/10" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sélectionnez une conversation</h3>
                <p className="text-sm text-slate-400 dark:text-white/40 max-w-xs">Choisissez une conversation dans la liste pour commencer à discuter avec vos étudiants.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default InstructorMessagesPage
