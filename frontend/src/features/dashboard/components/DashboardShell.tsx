import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut,
  LayoutDashboard,
  BookOpen,
  Library,
  Settings,
  User,
  Users,
  Bell,
  Menu,
  X,
  Trophy,
  Zap,
  Activity,
  HelpCircle,
  ClipboardList,
  Award,
  Sun,
  Moon,
  Calendar,
  MessageSquare,
  GraduationCap,
  LifeBuoy,
  UserCircle,
  BarChart3,
  FileEdit
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { DashboardRole } from '../services/dashboard.api'
import { dashboardPaths } from '../utils/navigation'
import { useTheme } from '@/components/theme-provider'

interface NavItem {
  label: string
  icon: any
  path: string
  roles: DashboardRole[]
}

const navItems: NavItem[] = [
  { label: 'Vue d\'ensemble', icon: LayoutDashboard, path: dashboardPaths.home, roles: ['student', 'instructor', 'admin'] },
  // Student
  { label: 'Mes Cours', icon: BookOpen, path: dashboardPaths.studentCourses, roles: ['student'] },
  { label: 'Catalogue', icon: Library, path: dashboardPaths.studentCatalog, roles: ['student'] },
  { label: 'Progression', icon: Activity, path: dashboardPaths.studentProgress, roles: ['student'] },
  { label: 'Notes', icon: GraduationCap, path: dashboardPaths.studentGrades, roles: ['student'] },
  { label: 'Quiz', icon: HelpCircle, path: dashboardPaths.studentQuiz, roles: ['student'] },
  { label: 'Devoirs', icon: ClipboardList, path: dashboardPaths.studentAssignments, roles: ['student'] },
  { label: 'Certificats', icon: Award, path: dashboardPaths.studentCertificates, roles: ['student'] },
  { label: 'Calendrier', icon: Calendar, path: dashboardPaths.studentCalendar, roles: ['student'] },
  { label: 'Messages', icon: MessageSquare, path: dashboardPaths.studentMessages, roles: ['student'] },
  { label: 'Notifications', icon: Bell, path: dashboardPaths.studentNotifications, roles: ['student'] },
  { label: 'Profil', icon: UserCircle, path: dashboardPaths.studentProfile, roles: ['student'] },
  { label: 'Aide', icon: LifeBuoy, path: dashboardPaths.studentHelp, roles: ['student'] },
  // Instructor
  { label: 'Mes Cours', icon: BookOpen, path: dashboardPaths.instructorCourses, roles: ['instructor'] },
  { label: 'Étudiants', icon: Users, path: dashboardPaths.instructorStudents, roles: ['instructor'] },
  { label: 'Calendrier', icon: Calendar, path: dashboardPaths.instructorCalendar, roles: ['instructor'] },
  { label: 'Quiz', icon: FileEdit, path: dashboardPaths.instructorQuiz, roles: ['instructor'] },
  { label: 'Devoirs', icon: ClipboardList, path: dashboardPaths.instructorAssignments, roles: ['instructor'] },
  { label: 'Statistiques', icon: BarChart3, path: dashboardPaths.instructorStats, roles: ['instructor'] },
  { label: 'Messages', icon: MessageSquare, path: dashboardPaths.instructorMessages, roles: ['instructor'] },
  { label: 'Notifications', icon: Bell, path: dashboardPaths.instructorNotifications, roles: ['instructor'] },
  { label: 'Profil', icon: UserCircle, path: dashboardPaths.instructorProfile, roles: ['instructor'] },
  { label: 'Aide', icon: LifeBuoy, path: dashboardPaths.instructorHelp, roles: ['instructor'] },
  // Admin
  { label: 'Utilisateurs', icon: User, path: dashboardPaths.adminUsers, roles: ['admin'] },
  { label: 'Modération', icon: FileEdit, path: dashboardPaths.adminModeration, roles: ['admin'] },
  { label: 'Santé', icon: Activity, path: dashboardPaths.adminHealth, roles: ['admin'] },
  { label: 'Paramètres', icon: Settings, path: '#', roles: ['student', 'instructor', 'admin'] },
]

interface DashboardShellProps {
  title: string
  subtitle: string
  role: DashboardRole
  viewerRole: DashboardRole
  userName: string
  userEmail: string
  onLogout: () => Promise<void>
  onNavigateRole: (role: DashboardRole) => void
  children: React.ReactNode
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  title,
  subtitle,
  role,
  viewerRole,
  userName,
  userEmail,
  onLogout,
  onNavigateRole,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  const filteredNavItems = navItems.filter(item => item.roles.includes(role))

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-slate-900 dark:text-white font-sans selection:bg-[#3054ff] selection:text-white transition-colors duration-300">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#3054ff]/10 dark:bg-[#3054ff]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#9791fe]/10 dark:bg-[#9791fe]/5 blur-[150px]" />
      </div>

      {/* Sidebar - Desktop */}
      <aside 
        className={`fixed left-0 top-0 h-full z-40 bg-white/80 dark:bg-black/40 backdrop-blur-2xl border-r border-slate-200 dark:border-white/5 transition-all duration-500 ease-in-out hidden lg:flex flex-col ${
          isSidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-serif italic text-2xl font-black text-slate-900 dark:text-white tracking-tight"
              >
                Kayy<span className="text-[#3054ff]">Diang</span>
              </motion.div>
            ) : (
              <motion.div
                key="logo-short"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-serif italic text-2xl font-black text-[#3054ff] mx-auto"
              >
                K
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group relative ${
                  isActive 
                    ? 'bg-[#3054ff] text-white shadow-[0_10px_20px_rgba(48,84,255,0.2)]' 
                    : 'text-slate-500 dark:text-white/50 hover:text-[#3054ff] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:text-[#3054ff] transition-colors'} />
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-[#3054ff] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {isSidebarOpen && (
          <div className="p-6">
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#3054ff]/10 dark:bg-[#3054ff]/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#3054ff]" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#3054ff] uppercase tracking-widest">Pro Status</div>
                  <div className="text-xs text-slate-600 dark:text-white/80">Premium Member</div>
                </div>
              </div>
              <Button className="w-full bg-[#3054ff] hover:bg-[#1943f2] text-[10px] h-8 font-bold uppercase tracking-widest text-white">
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 dark:border-white/5 space-y-2">
          {viewerRole !== role && (
            <button
              onClick={() => onNavigateRole(viewerRole)}
              className="w-full flex items-center gap-4 p-3 text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all"
            >
              <Zap size={20} />
              {isSidebarOpen && <span className="text-sm">Retour {viewerRole}</span>}
            </button>
          )}
          <button
            onClick={() => void onLogout()}
            className="w-full flex items-center gap-4 p-3 text-slate-500 dark:text-white/50 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/5 rounded-xl transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`transition-all duration-500 ease-in-out ${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/40 backdrop-blur-2xl border-b border-slate-100 dark:border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
              <p className="text-[10px] text-slate-400 dark:text-white/40 uppercase tracking-widest font-black">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-500 dark:text-white/40 hover:text-[#3054ff] dark:hover:text-white transition-colors rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <button className="relative p-2 text-slate-500 dark:text-white/40 hover:text-[#3054ff] dark:hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#3054ff] rounded-full border border-white dark:border-black"></span>
            </button>
            
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white">{userName}</div>
                <div className="text-[10px] text-slate-400 dark:text-white/40">{userEmail}</div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3054ff] to-[#9791fe] p-[1px]">
                <div className="w-full h-full rounded-xl bg-white dark:bg-black flex items-center justify-center overflow-hidden">
                  <User size={18} className="text-slate-400 dark:text-white/60" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="relative z-10 p-6 lg:p-10 max-w-[1600px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0a0a0a] border-r border-slate-200 dark:border-white/5 p-6 flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="font-serif italic text-2xl font-black text-slate-900 dark:text-white">
                  Kayy<span className="text-[#3054ff]">Diang</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-500 dark:text-white/60">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-4 p-4 rounded-xl text-slate-600 dark:text-white/60 hover:text-[#3054ff] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-4">
                <button
                  onClick={() => void onLogout()}
                  className="w-full flex items-center gap-4 p-4 text-slate-600 dark:text-white/60 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Déconnexion</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
