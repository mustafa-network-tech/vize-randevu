import { Badge, BadgeVariant } from '@/components/ui/Badge'
import { cn } from '@/lib/helpers/cn'

export type LogLevel = 'info' | 'warning' | 'error' | 'success'

export interface LogEntry {
  id: number
  timestamp: string
  level: LogLevel
  bot: string
  country: string
  message: string
}

const levelConfig: Record<LogLevel, { variant: BadgeVariant; label: string }> = {
  info: { variant: 'info', label: 'BİLGİ' },
  warning: { variant: 'warning', label: 'UYARI' },
  error: { variant: 'error', label: 'HATA' },
  success: { variant: 'success', label: 'BAŞARI' },
}

interface LogTableProps {
  logs: LogEntry[]
  compact?: boolean
}

export function LogTable({ logs, compact = false }: LogTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4 whitespace-nowrap">
              Zaman
            </th>
            <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4">
              Seviye
            </th>
            {!compact && (
              <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4 whitespace-nowrap">
                Bot
              </th>
            )}
            <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4 whitespace-nowrap">
              Ülke
            </th>
            <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4">
              Mesaj
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {logs.map((log) => {
            const levelInfo = levelConfig[log.level]
            return (
              <tr
                key={log.id}
                className={cn(
                  'transition-colors',
                  log.level === 'error'
                    ? 'bg-red-50/60 hover:bg-red-50'
                    : log.level === 'success'
                    ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                    : 'hover:bg-slate-50'
                )}
              >
                <td className="py-3 px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                  {log.timestamp}
                </td>
                <td className="py-3 px-4">
                  <Badge variant={levelInfo.variant} dot>
                    {levelInfo.label}
                  </Badge>
                </td>
                {!compact && (
                  <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap font-medium">
                    {log.bot}
                  </td>
                )}
                <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                  {log.country}
                </td>
                <td className="py-3 px-4 text-xs text-slate-700 max-w-md truncate">
                  {log.message}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
