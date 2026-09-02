import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mi habitación',
    short_name: 'Mi habitación',
    description: 'Tu sistema personal para organizar tareas, dinero, proyectos, metas, prepa y hogar.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f1ea',
    theme_color: '#f3f1ea',
    lang: 'es-MX',
    orientation: 'portrait',
    icons: [
      { src: '/app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
