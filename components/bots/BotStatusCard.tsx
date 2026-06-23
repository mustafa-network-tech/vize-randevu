'use client'

import { Badge, BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Activity, Globe, Play, Square, AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/helpers/cn'

export type BotStatus = 'running' | 'stopped' | 'error' | 'idle'

export interface BotData {
  id: number
  name: string
  country: string
  countryEmoji: string
  status: BotStatus
  lastActivity: string
  todayAttempts: number
  todayFound: number
  successRate: number
  currentTask?: string
}

const statusConfig: Record<BotStatus, { label: string; variant: BadgeVariant }> = {
  running: { label: 'Çalışıyor', variant: 'success' },
  stopped: { label: 'Durduruldu', variant: 'default' },
  error: { label: 'Hata', variant: 'error' },
  idle: { label: 'Bekliyor', variant: 'warning' },
}

export function BotStatusCard({ bot }: { bot: BotData }) {
  const status = statusConfig[bot.status]

  return (
    <div
      className={cn(
        'bg-white rounded-xl border shadow-sm p-5 transition-all duration-200 hover:shadow-md',
        bot.status === 'error'
          ? 'border-red-200 bg-red-50/30'
          : 'border-slate-200'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-slate-800 text-sm">{bot.name}</h3>
            <Badge variant={status.variant} dot>
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>{bot.countryEmoji}</span>
            <Globe className="w-3 h-3" />
            <span>{bot.country}</span>
          </div>
          {bot.currentTask && bot.status === 'running' && (
            <p className="text-xs text-blue-600 mt-1 font-medium truncate">
              ↪ {bot.currentTask}
            </p>
          )}
        </div>
        {bot.status === 'error' && (
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
          <p className="text-base font-bold text-slate-800">{bot.todayAttempts}</p>
          <p className="text-xs text-slate-500 mt-0.5">Deneme</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
          <p className="text-base font-bold text-emerald-600">{bot.todayFound}</p>
          <p className="text-xs text-slate-500 mt-0.5">Bulunan</p>
        </div>
        <div
          className={cn(
            'rounded-lg p-2.5 text-center',
            bot.successRate >= 70
              ? 'bg-blue-50'
              : bot.successRate >= 40
              ? 'bg-amber-50'
              : 'bg-slate-50'
          )}
        >
          <p
            className={cn(
              'text-base font-bold',
              bot.successRate >= 70
                ? 'text-blue-600'
                : bot.successRate >= 40
                ? 'text-amber-600'
                : 'text-slate-400'
            )}
          >
            %{bot.successRate}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Başarı</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Activity className="w-3 h-3" />
          <span>{bot.lastActivity}</span>
        </div>
        <div className="flex gap-1.5">
          {bot.status === 'error' && (
            <Button variant="outline" size="sm">
              <RefreshCw className="w-3 h-3" />
              Yeniden Başlat
            </Button>
          )}
          {bot.status === 'running' ? (
            <Button variant="secondary" size="sm">
              <Square className="w-3 h-3" />
              Durdur
            </Button>
          ) : bot.status !== 'error' ? (
            <Button size="sm">
              <Play className="w-3 h-3" />
              Başlat
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
