import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase no está configurado.');
  browserClient = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return browserClient;
}

export const DATA_MODE_KEY = 'mi-habitacion:data-mode';
export const DATA_ERROR_EVENT = 'mi-habitacion:data-error';
export type DataMode = 'local' | 'remote';
export function getDataMode(): DataMode {
  if (typeof window === 'undefined' || !isSupabaseConfigured()) return 'local';
  return window.localStorage.getItem(DATA_MODE_KEY) === 'remote' ? 'remote' : 'local';
}
export function setDataMode(mode: DataMode): void {
  window.localStorage.setItem(DATA_MODE_KEY, mode);
  window.dispatchEvent(new CustomEvent('mi-habitacion:data-mode-changed', { detail: mode }));
}
export function reportDataError(message: string): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(DATA_ERROR_EVENT, { detail: message }));
}
