import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'routine-theme'

const isBrowser = () => typeof window !== 'undefined'

export const getStoredTheme = (): Theme => {
  return 'light'
}

export const applyTheme = (_theme: Theme) => {
  if (!isBrowser()) {
    return
  }

  document.documentElement.classList.remove('dark')
  window.localStorage.setItem(THEME_STORAGE_KEY, 'light')
}

export const initializeTheme = () => {
  applyTheme('light')
  return 'light'
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    applyTheme('light')
  }, [theme])

  const toggleTheme = () => {
    setTheme('light')
  }

  return { theme, setTheme, toggleTheme }
}
