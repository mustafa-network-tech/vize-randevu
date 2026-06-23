import { cn } from '@/lib/helpers/cn'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet'
  className?: string
}

const colorStyles = {
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    trend: 'text-blue-600',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-600',
    trend: 'text-emerald-600',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-600',
    trend: 'text-amber-600',
  },
  rose: {
    icon: 'bg-rose-100 text-rose-600',
    trend: 'text-rose-600',
  },
  violet: {
    icon: 'bg-violet-100 text-violet-600',
    trend: 'text-violet-600',
  },
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  className,
}: StatCardProps) {
  const styles = colorStyles[color]

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1.5 leading-none">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'text-xs mt-2 font-semibold flex items-center gap-1',
                trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'
              )}
            >
              <span>{trend.value >= 0 ? '↑' : '↓'}</span>
              <span>
                %{Math.abs(trend.value)} {trend.label}
              </span>
            </p>
          )}
        </div>
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3',
            styles.icon
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
