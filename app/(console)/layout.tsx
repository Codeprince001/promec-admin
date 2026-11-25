import { Suspense } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { Shell } from '@/components/shell';

// Desks load after sign-in. They are client screens, so navigations into
// this group are not an instant static shell.
export const instant = false;

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--muted)]">Opening the desk…</div>}>
      <AuthGate>
        <Shell>{children}</Shell>
      </AuthGate>
    </Suspense>
  );
}
