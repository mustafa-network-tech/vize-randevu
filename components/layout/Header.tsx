'use client'

import { Bell, Menu, Search, RefreshCw } from 'lucide-react'
import { DarkModeToggle } from './DarkModeToggle'

interface HeaderProps {
  onMenuClick: () => void
  title: string
  subtitle?: string
}

export function Header({ onMenuClick, title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Menüyü aç"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="hidden md:flex items-center gap-2 px-3 py-1.5 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span className="text-xs">Ara...</span>
          <kbd className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-mono">⌘K</kbd>
        </button>

        <DarkModeToggle />

        <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
        </button>

        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>

        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-xs font-bold text-white ml-1 shadow-sm cursor-pointer">
          A
        </div>
      </div>
    </header>
  )
}
