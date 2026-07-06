'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react'
import { applyTheme, persistTheme, type ThemeValue } from '@/lib/theme'
import { updateTheme } from '@/features/settings/actions'

type ThemeContextValue = {
  theme: ThemeValue
  toggleTheme: () => void
  isPending: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode
  initialTheme: ThemeValue
}) {
  const [theme, setThemeState] = useState<ThemeValue>(initialTheme)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    applyTheme(theme)
    persistTheme(theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    const next: ThemeValue = theme === 'light' ? 'dark' : 'light'
    setThemeState(next)
    startTransition(async () => {
      await updateTheme(next)
    })
  }, [theme])

  const value = useMemo(
    () => ({ theme, toggleTheme, isPending }),
    [isPending, theme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
