'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { refreshAccess } from '@/lib/api';
import { useHydrated, useMe } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import { Banner } from './desk';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ready = useHydrated();
  const token = useSession((state) => state.token);
  const me = useMe();

  useEffect(() => {
    if (!ready || token) return;
    refreshAccess().then((ok) => {
      if (!ok) router.replace('/login');
    });
  }, [ready, token, router]);

  useEffect(() => {
    if (me.error && !token) router.replace('/login');
  }, [me.error, token, router]);

  const opening = !ready || !token || me.isLoading;
  const staff = me.data?.type === 'staff' || (me.data?.permissions.length ?? 0) > 0;
  const blocked = !opening && (me.isError || !staff);

  return (
    <>
      {opening ? <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--bg)] text-sm text-[var(--muted)]">Opening the desk…</div> : null}
      {blocked ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--bg)] p-8">
          <div className="max-w-lg">
            <Banner tone={me.isError ? 'bad' : 'warn'}>
              {me.isError ? (me.error instanceof Error ? me.error.message : 'Sign in again to open the desk.') : 'This desk is for PROMEC staff. Sign in with an operations account.'}
            </Banner>
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}
