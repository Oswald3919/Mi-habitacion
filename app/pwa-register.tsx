'use client';
import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // A worker must not cache the hot-reloading development server. Remove one
    // left by an older development build so local navigation stays fresh.
    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))).catch(() => {});
      return;
    }
    void navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }, []);

  return null;
}
