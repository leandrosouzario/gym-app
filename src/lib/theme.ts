const STORAGE_KEY = 'gym-theme'
const COOKIE_NAME = 'gym-theme'

export type ThemeValue = 'light' | 'dark'

export function applyTheme(theme: ThemeValue) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function persistTheme(theme: ThemeValue) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme)
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax`
  }
}

export function readStoredTheme(): ThemeValue | null {
  if (typeof localStorage === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : null
}
