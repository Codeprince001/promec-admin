'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, Monitor, Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-react';
import { send } from '@/lib/api';
import { useMe } from '@/lib/hooks';
import { allowed, NAV } from '@/lib/nav';
import { useSession } from '@/lib/session';
import { useUi, type ThemeMode } from '@/lib/ui-store';
import { Button } from './desk';

const THEMES: ThemeMode[] = ['light', 'dark', 'system'];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const me = useMe();
  const collapsed = useUi((state) => state.collapsed);
  const toggleCollapsed = useUi((state) => state.toggleCollapsed);
  const mobileOpen = useUi((state) => state.mobileOpen);
  const setMobileOpen = useUi((state) => state.setMobileOpen);
  const theme = useUi((state) => state.theme);
  const setTheme = useUi((state) => state.setTheme);
  const setToken = useSession((state) => state.setToken);
  const permissions = me.data?.permissions ?? [];
  const groups = NAV.filter((item) => allowed(permissions, item.permission)).reduce<Record<string, typeof NAV>>((acc, item) => {
    acc[item.group] = [...(acc[item.group] ?? []), item];
    return acc;
  }, {});

  async function logout() {
    await send('/auth/logout', 'POST').catch(() => null);
    setToken(null);
    router.replace('/login');
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className={`fixed inset-0 z-30 bg-black/40 lg:hidden ${mobileOpen ? 'block' : 'hidden'}`} onClick={() => setMobileOpen(false)} />
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--line)] bg-[var(--surface)] transition-all ${collapsed ? 'w-[4.5rem]' : 'w-64'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-2 border-b border-[var(--line)] px-3 py-3">
          <Link href="/" className="grid h-11 shrink-0 place-items-center">
            <img src="/assets/promec_logo.png" alt="PROMEC" className="h-7 w-auto" />
          </Link>
          {collapsed ? null : (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">PROMEC Desk</p>
              <p className="truncate text-xs text-[var(--muted)]">Operations</p>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-4">
              {collapsed ? null : <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{group}</p>}
              {items.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    onClick={() => setMobileOpen(false)}
                    className={`mb-1 flex min-h-10 items-center rounded-xl px-3 text-sm ${active ? 'bg-[var(--chip)] text-white' : 'hover:bg-[var(--bg)]'}`}
                  >
                    {collapsed ? item.label.slice(0, 1) : item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <div className={collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64'}>
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-[var(--line)] bg-[var(--bg)]/90 px-4 py-3 backdrop-blur">
          <Button type="button" tone="ghost" className="size-10 px-0 lg:hidden" aria-label="Open menu" title="Open menu" onClick={() => setMobileOpen(true)}><Menu /></Button>
          <Button type="button" tone="ghost" className="hidden size-10 px-0 lg:inline-flex" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={toggleCollapsed}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button>
          <p className="hidden text-sm text-[var(--muted)] sm:block">Lagos operations desk</p>
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" tone="ghost" className="size-10 px-0" aria-label={`Theme is ${theme}. Switch theme.`} title={theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'} onClick={() => setTheme(THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length])}>
              {theme === 'dark' ? <Moon /> : theme === 'light' ? <Sun /> : <Monitor />}
            </Button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{me.data?.customer ? `${me.data.customer.firstName} ${me.data.customer.lastName}` : me.data?.email ?? 'Staff'}</p>
              <p className="text-xs text-[var(--muted)]">{me.data?.roles.join(', ') || me.data?.type}</p>
            </div>
            <Button type="button" tone="ghost" className="size-10 px-0" aria-label="Sign out" title="Sign out" onClick={logout}><LogOut /></Button>
          </div>
        </header>
        <main className="px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
