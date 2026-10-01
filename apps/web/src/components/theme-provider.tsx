'use client'

import {
  type ThemeProviderProps,
  ThemeProvider as NextThemesProvider,
} from 'next-themes'

import { TooltipProvider } from '@/components/ui/tooltip'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </NextThemesProvider>
  )
}
