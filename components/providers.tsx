'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useUi } from '@/lib/ui-store';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false } },
  }));
  const theme = useUi((state) => state.theme);
  const flash = useUi((state) => state.flash);
  const clearFlash = useUi((state) => state.clearFlash);

  useEffect(() => {
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.classList.toggle('dark', media.matches);
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(clearFlash, 4200);
    return () => window.clearTimeout(timer);
  }, [flash, clearFlash]);

  return (
    <QueryClientProvider client={client}>
      {children}
      {flash ? (
        <div className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border px-4 py-3 text-sm shadow-lg ${flash.tone === 'bad' ? 'border-[var(--bad)] bg-[var(--surface)]' : 'border-emerald-600/40 bg-[var(--surface)]'}`}>
          {flash.text}
        </div>
      ) : null}
    </QueryClientProvider>
  );
}
