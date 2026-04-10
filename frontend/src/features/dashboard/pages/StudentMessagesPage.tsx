import { MessageSquare, Search, Send, Paperclip, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { Button } from '@/components/ui/button'
import { useMarkStudentMessageThreadRead, useSendStudentMessage, useStudentMessages } from '../hooks/useStudentSupplements'
import type { DashboardRole } from '../services/dashboard.api'

const StudentMessagesPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const {
    messages,
    conversation,
    isMessagesLoading,
    isThreadLoading,
    isError,
    error,
    selectedMessage,
    selectMessage,
    clearSelectedMessage,
    participant,
    course,
    refetchThread,
  } = useStudentMessages()
  const sendMessageMutation = useSendStudentMessage()
  const markThreadReadMutation = useMarkStudentMessageThreadRead()
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  if (!user) return <LoadingState fullscreen />

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  const unreadCount = messages.filter(m => m.unread).length

  const threadSignature = useMemo(() => {
    const latest = conversation.at(-1)
    return `${selectedMessage?.id ?? 'none'}:${latest?.id ?? 'empty'}`
  }, [conversation, selectedMessage?.id])

  const [lastMarkedSignature, setLastMarkedSignature] = useState<string>('')

  useEffect(() => {
    if (!selectedMessage?.id) return
    if (!selectedMessage.unread) return
    if (markThreadReadMutation.isPending) return
    if (threadSignature === lastMarkedSignature) return

    setLastMarkedSignature(threadSignature)
    void markThreadReadMutation.mutateAsync(selectedMessage.id)
  }, [
    selectedMessage?.id,
    selectedMessage?.unread,
    markThreadReadMutation.isPending,
    markThreadReadMutation.mutateAsync,
    threadSignature,
    lastMarkedSignature,
  ])
  const filteredMessages = messages.filter((msg) => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return true

    return [msg.sender.name, msg.subject, msg.preview, msg.course]
      .join(' ')
      .toLowerCase()
      .includes(term)
  })

  const handleSend = async () => {
    if (!selectedMessage || !newMessage.trim()) {
      return
    }

    await sendMessageMutation.mutateAsync({
      conversationId: selectedMessage.id,
      message: newMessage.trim(),
    })

    setNewMessage('')
  }

  return (
    <DashboardShell
      title='Messages'
      subtitle={`${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}`}
      role='student'
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#0a0a0a] overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        <div className="flex h-full">
          {/* Messages List */}
          <div className={`${selectedMessage ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r border-slate-200 dark:border-white/5`}>
            {/* Search */}
            <div className="p-4 border-b border-slate-200 dark:border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={16} />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher..."
                  className="w-full h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 pl-9 pr-4 text-sm text-slate-900 dark:text-white outline-none focus:border-[#3054ff] transition-all placeholder:text-slate-400 dark:placeholder:text-white/30"
                />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {isMessagesLoading ? <LoadingState /> : filteredMessages.map((msg, idx) => (
                <motion.button
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => selectMessage(msg)}
                  className={`w-full p-4 text-left border-b border-slate-100 dark:border-white/5 transition-all hover:bg-slate-50 dark:hover:bg-white/5 ${
                    selectedMessage?.id === msg.id ? 'bg-slate-50 dark:bg-white/5 border-l-2 border-l-[#3054ff]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#3054ff]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#3054ff]">{msg.sender.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm font-bold truncate ${msg.unread ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-white/60'}`}>
                          {msg.sender.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-white/30 flex-shrink-0">{msg.date}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{msg.subject}</p>
                      <p className="text-xs text-slate-400 dark:text-white/30 truncate mt-0.5">{msg.preview}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3054ff]/10 text-[#3054ff] font-bold">{msg.course}</span>
                        {msg.unread && <span className="w-2 h-2 rounded-full bg-[#3054ff]" />}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div className={`${selectedMessage ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            {selectedMessage ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center gap-4">
                  <button
                    onClick={() => clearSelectedMessage()}
                    className="md:hidden p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-[#3054ff]/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#3054ff]">{selectedMessage.sender.avatar}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{participant?.name ?? selectedMessage.sender.name}</div>
                    <div className="text-[10px] text-slate-400 dark:text-white/30">{participant?.role ?? selectedMessage.sender.role} — {course ?? selectedMessage.course}</div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {isThreadLoading && <LoadingState />}

                  {isError && (
                    <ErrorState
                      message={error instanceof Error ? error.message : 'Erreur'}
                      onRetry={() => void refetchThread()}
                    />
                  )}

                  {!isThreadLoading && !isError && conversation.length === 0 && (
                    <div className="text-center text-sm text-slate-500 dark:text-white/40">
                      Aucun message dans cette conversation.
                    </div>
                  )}

                  {!isThreadLoading && !isError && conversation.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        msg.sender === 'me'
                          ? 'bg-[#3054ff] text-white rounded-br-md'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-bl-md'
                      }`}>
                        <p className="text-sm whitespace-pre-line">{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${msg.sender === 'me' ? 'text-white/50' : 'text-slate-400 dark:text-white/30'}`}>{msg.date}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <Paperclip size={18} />
                    </button>
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrire un message..."
                        className="flex-1 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-[#3054ff] transition-all placeholder:text-slate-400 dark:placeholder:text-white/30"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newMessage.trim()) {
                            void handleSend()
                          }
                        }}
                      />
                      <Button
                        className="h-10 px-4 bg-[#3054ff] hover:bg-[#1943f2] text-white rounded-xl"
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        onClick={() => void handleSend()}
                      >
                        <Send size={16} />
                      </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
                  <MessageSquare className="text-slate-300 dark:text-white/10" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sélectionnez une conversation</h3>
                <p className="text-sm text-slate-400 dark:text-white/40 max-w-xs">Choisissez une conversation dans la liste pour commencer à discuter avec vos instructeurs.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

export default StudentMessagesPage
