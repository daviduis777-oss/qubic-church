import { createNavigation } from 'next-intl/navigation'
import { defineRouting } from 'next-intl/routing'

import { defaultLocale, locales } from '@/config/i18n'

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  // English is always the default. /pt opens only when asked for directly:
  // no redirect from browser language or a cookie left by an earlier visit.
  localeDetection: false,
})

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
