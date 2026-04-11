import type { FC } from 'react'
import { BarChart3 } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AdminDashboardPayload, AdminModulesPayload, SystemActivityLogItem } from '../services/dashboard.api'

const CHART_COLORS = {
  primary: '#3054ff',
  accent: '#7c89ff',
  mint: '#5cf0c4',
  amber: '#f5b942',
  rose: '#f472b6',
  grid: 'rgba(255,255,255,0.08)',
  tick: 'rgba(255,255,255,0.55)',
}

const PIE_COLORS = [CHART_COLORS.primary, CHART_COLORS.mint, CHART_COLORS.amber]

const chartTooltipStyle = {
  backgroundColor: 'rgba(13,16,32,0.95)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  fontSize: 12,
}

function aggregateHttpFamilies(rows: SystemActivityLogItem[]) {
  const buckets: Record<string, number> = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, Autre: 0 }
  for (const r of rows) {
    const c = r.status_code
    if (c >= 200 && c < 300) buckets['2xx'] += 1
    else if (c >= 300 && c < 400) buckets['3xx'] += 1
    else if (c >= 400 && c < 500) buckets['4xx'] += 1
    else if (c >= 500) buckets['5xx'] += 1
    else buckets.Autre += 1
  }
  return Object.entries(buckets)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
}

interface AdminDashboardChartsProps {
  data: AdminDashboardPayload
  modulesData: AdminModulesPayload | undefined
  activitySample: SystemActivityLogItem[] | undefined
}

export const AdminDashboardCharts: FC<AdminDashboardChartsProps> = ({
  data,
  modulesData,
  activitySample,
}) => {
  const volumeData = [
    { name: 'Utilisateurs', value: data.stats.users },
    { name: 'Etudiants', value: data.stats.students },
    { name: 'Instructeurs', value: data.stats.instructors },
    { name: 'Cours publies', value: data.stats.published_courses },
  ]

  const dist = modulesData?.modules.role_distribution
  const rolePieData =
    dist != null
      ? [
          { name: 'Etudiants', value: dist.students },
          { name: 'Instructeurs', value: dist.instructors },
          { name: 'Admins', value: dist.admins },
        ].filter((d) => d.value > 0)
      : []

  const pub = modulesData?.modules.publication_status
  const publicationData =
    pub != null
      ? [
          { name: 'Publies', value: pub.published },
          { name: 'Brouillons', value: pub.drafts },
        ]
      : []

  const httpFamilyData =
    activitySample != null && activitySample.length > 0 ? aggregateHttpFamilies(activitySample) : []

  const hasRoleData = rolePieData.length > 0
  const hasPublication = publicationData.some((d) => d.value > 0)

  return (
    <section
      className="mb-8 rounded-2xl border border-[#3054ff]/20 bg-gradient-to-br from-black/55 to-[#1a1f3a]/35 p-5 shadow-[0_0_36px_-14px_rgba(48,84,255,0.3)]"
      aria-label="Vue d'ensemble graphique"
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <BarChart3 className="h-5 w-5 text-[#8ea0ff]" />
        <h3 className="text-sm font-semibold tracking-tight text-white/95">Vue d&apos;ensemble</h3>
        <p className="w-full text-xs text-white/55 sm:w-auto sm:pl-2">
          Indicateurs cles et repartition des comptes et des cours.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">Volumes plateforme</h4>
          <div className="h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: CHART_COLORS.tick, fontSize: 11 }}
                  axisLine={{ stroke: CHART_COLORS.grid }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: CHART_COLORS.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={{ color: 'rgba(255,255,255,0.85)' }}
                  formatter={(value: number) => [value, 'Valeur']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {volumeData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === 0 ? CHART_COLORS.primary : i === 1 ? CHART_COLORS.mint : i === 2 ? CHART_COLORS.amber : CHART_COLORS.accent}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">Repartition des roles</h4>
          <div className="h-[260px] w-full min-w-0">
            {hasRoleData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rolePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {rolePieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgba(0,0,0,0.25)" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value: number, name: string) => [`${value} comptes`, name]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}
                    formatter={(value) => <span className="text-white/75">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-white/50">
                Chargement des donnees ou aucun utilisateur.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">Cours : publication</h4>
          <div className="h-[240px] w-full min-w-0">
            {hasPublication ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={publicationData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: CHART_COLORS.tick, fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    tick={{ fill: CHART_COLORS.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [value, 'Cours']} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                    <Cell fill={CHART_COLORS.mint} />
                    <Cell fill={CHART_COLORS.amber} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-white/50">
                Chargement des donnees cours.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">
            Journal (page courante) - familles HTTP
          </h4>
          <div className="h-[240px] w-full min-w-0">
            {httpFamilyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={httpFamilyData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: CHART_COLORS.tick, fontSize: 11 }}
                    axisLine={{ stroke: CHART_COLORS.grid }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: CHART_COLORS.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [value, 'Requetes']} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {httpFamilyData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          entry.name === '2xx'
                            ? CHART_COLORS.mint
                            : entry.name === '4xx' || entry.name === '5xx'
                              ? '#f87171'
                              : entry.name === '3xx'
                                ? CHART_COLORS.amber
                                : CHART_COLORS.accent
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center px-4 text-center text-sm text-white/50">
                Aucune activite sur cette page du journal, ou journal non charge.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
