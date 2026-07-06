import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { PWA_APPLE_TOUCH_ICON } from '@/lib/pwa-icons'
import './globals.css'

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  'https://gym.leandrosouza.info'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Gym App — Gerenciamento de Treinos',
    template: '%s · Gym App',
  },
  description:
    'Aplicação para gerenciamento de fichas de treino, registro de sessões e evolução de carga.',
  applicationName: 'Gym App',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gym',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'Gym App',
    title: 'Gym App — Gerenciamento de Treinos',
    description:
      'Aplicação para gerenciamento de fichas de treino, registro de sessões e evolução de carga.',
  },
  icons: {
    icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: PWA_APPLE_TOUCH_ICON, sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies()
  const theme = cookieStore.get('gym-theme')?.value === 'dark' ? 'dark' : ''

  return (
    <html lang="pt-BR" className={theme}>
      <head>
        <link rel="apple-touch-icon" href={PWA_APPLE_TOUCH_ICON} sizes="180x180" />
      </head>
      <body className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
