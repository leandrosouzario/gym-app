import type { MetadataRoute } from 'next'
import { PWA_MANIFEST_ICONS } from '@/lib/pwa-icons'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: 'gym-app',
    name: 'Gym App',
    short_name: 'Gym',
    description:
      'Aplicação para gerenciamento de fichas de treino, registro de sessões e evolução de carga.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    lang: 'pt-BR',
    categories: ['health', 'fitness'],
    icons: PWA_MANIFEST_ICONS.map((icon) => ({ ...icon })),
  }
}
