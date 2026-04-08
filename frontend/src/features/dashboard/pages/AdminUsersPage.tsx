import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { resolveRoleDashboardPath } from '../utils/navigation'
import { DashboardShell } from '../components/DashboardShell'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { ActionFeedback } from '../components/ActionFeedback'
import { useAdminUsers, useUpdateAdminUserRole, useUpdateAdminUserStatus } from '../hooks/useAdminUsers'
import type { DashboardRole } from '../services/dashboard.api'

const AdminUsersPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [roleFilter, setRoleFilter] = useState<DashboardRole | ''>('')
  const [activeFilter, setActiveFilter] = useState<'0' | '1' | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const filters = useMemo(
    () => ({
      role: roleFilter || undefined,
      active: activeFilter || undefined,
      search: search.trim() || undefined,
      page,
    }),
    [activeFilter, page, roleFilter, search]
  )

  const { data, isLoading, isError, error, refetch } = useAdminUsers(filters)
  const updateRole = useUpdateAdminUserRole()
  const updateStatus = useUpdateAdminUserStatus()

  if (!user) {
    return <LoadingState fullscreen />
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const handleNavigateRole = (role: DashboardRole) => {
    navigate(resolveRoleDashboardPath(role))
  }

  const users = data?.data ?? []
  const errorMessage = error instanceof Error ? error.message : 'Impossible de charger les utilisateurs.'

  return (
    <DashboardShell
      title='Gestion des utilisateurs'
      subtitle='Espace Admin'
      role='admin'
      viewerRole={user.role}
      userName={`${user.first_name} ${user.last_name}`}
      userEmail={user.email}
      onLogout={handleLogout}
      onNavigateRole={handleNavigateRole}
    >
      <div className='mb-4 grid grid-cols-1 gap-3 md:grid-cols-4'>
        <div className='relative md:col-span-2'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40' />
          <input
            className='h-10 w-full rounded-lg border border-white/20 bg-black/40 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#3054ff]'
            placeholder='Rechercher nom ou email'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as DashboardRole | '')
            setPage(1)
          }}
          className='h-10 rounded-lg border border-white/20 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#3054ff]'
        >
          <option value=''>Tous les roles</option>
          <option value='student'>Etudiant</option>
          <option value='instructor'>Instructeur</option>
          <option value='admin'>Admin</option>
        </select>

        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value as '0' | '1' | '')
            setPage(1)
          }}
          className='h-10 rounded-lg border border-white/20 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#3054ff]'
        >
          <option value=''>Tous statuts</option>
          <option value='1'>Actifs</option>
          <option value='0'>Inactifs</option>
        </select>
      </div>

      {feedback ? <div className='mb-4'><ActionFeedback type={feedback.type} message={feedback.message} /></div> : null}

      {isLoading ? <LoadingState /> : null}
      {!isLoading && isError ? <ErrorState message={errorMessage} onRetry={() => void refetch()} /> : null}

      {!isLoading && !isError ? (
        <div className='space-y-3'>
          {users.map((item) => (
            <div key={item.id} className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/35 p-4'>
              <div>
                <p className='text-sm font-semibold text-white'>
                  {item.first_name} {item.last_name}
                </p>
                <p className='text-xs text-white/60'>
                  {item.email} | {item.role} | {item.is_active ? 'actif' : 'inactif'}
                </p>
              </div>

              <div className='flex flex-wrap gap-2'>
                <Button
                  variant='outline'
                  className='border-white/20 bg-transparent text-white hover:bg-white/10'
                  disabled={updateRole.isPending}
                  onClick={() => {
                    setFeedback(null)
                    const nextRole = item.role === 'student' ? 'instructor' : item.role === 'instructor' ? 'admin' : 'student'
                    updateRole
                      .mutateAsync({ userId: item.id, role: nextRole })
                      .then(() => setFeedback({ type: 'success', message: 'Role mis a jour.' }))
                      .catch((err: unknown) => {
                        const message = err instanceof Error ? err.message : 'Echec mise a jour role.'
                        setFeedback({ type: 'error', message })
                      })
                  }}
                >
                  Changer role
                </Button>

                <Button
                  className='bg-[#3054ff] text-white hover:bg-[#2445e8]'
                  disabled={updateStatus.isPending}
                  onClick={() => {
                    setFeedback(null)
                    updateStatus
                      .mutateAsync({ userId: item.id, isActive: !item.is_active })
                      .then(() => setFeedback({ type: 'success', message: 'Statut mis a jour.' }))
                      .catch((err: unknown) => {
                        const message = err instanceof Error ? err.message : 'Echec mise a jour statut.'
                        setFeedback({ type: 'error', message })
                      })
                  }}
                >
                  {item.is_active ? 'Desactiver' : 'Activer'}
                </Button>
              </div>
            </div>
          ))}

          <div className='pt-2 text-xs text-white/60'>
            Page {data?.current_page ?? 1} / {data?.last_page ?? 1} - Total {data?.total ?? 0} utilisateurs
          </div>

          <div className='flex flex-wrap gap-2 pt-2'>
            <Button
              variant='outline'
              className='border-white/20 bg-transparent text-white hover:bg-white/10'
              disabled={(data?.current_page ?? 1) <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Page precedente
            </Button>
            <Button
              className='bg-[#3054ff] text-white hover:bg-[#2445e8]'
              disabled={(data?.current_page ?? 1) >= (data?.last_page ?? 1)}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Page suivante
            </Button>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  )
}

export default AdminUsersPage
