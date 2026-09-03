'use client';

import { useEffect } from 'react';

export const THEME_BASE_COLORS = {
  warm: '#f3f1ea',
  sage: '#edf2ed',
  gray: '#e9e9e7',
  dark: '#181918',
} as const;

function syncThemeColor() {
  const appearance = document.documentElement.dataset.appearance as keyof typeof THEME_BASE_COLORS | undefined;
  const color = THEME_BASE_COLORS[appearance ?? 'warm'];
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
}

export default function ThemeColorSync() {
  useEffect(() => {
    syncThemeColor();
    const observer = new MutationObserver((records) => {
      if (records.some((record) => record.attributeName === 'data-appearance')) syncThemeColor();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-appearance'] });
    return () => observer.disconnect();
  }, []);

  return null;
}
