'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { titleCase } from '@/lib/format';
import type { PageMeta } from '@/lib/types';

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function Desk({
  title,
  lede,
  actions,
  children,
}: {
  title: string;
  lede?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {lede ? <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">{lede}</p> : null}
        </div>
        {actions}
      </header>
      {children}
    </div>
  );
}

export function Panel({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Button({
  tone = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'ghost' | 'danger' | 'navy' }) {
  const tones = {
    primary: 'bg-[var(--accent)] text-white hover:brightness-110',
    navy: 'bg-[var(--chip)] text-white hover:brightness-125',
    ghost: 'border border-[var(--line)] bg-transparent hover:bg-[var(--bg)]',
    danger: 'bg-[var(--bad)] text-white hover:brightness-110',
  };
  return (
    <button
      className={cn(
        'inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="field" {...props} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="field min-h-28" {...props} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="field" {...props} />;
}

export function Banner({ tone = 'bad', children }: { tone?: 'ok' | 'bad' | 'warn'; children: ReactNode }) {
  const tones = {
    ok: 'border-emerald-600/30 bg-emerald-600/10',
    bad: 'border-[var(--bad)]/40 bg-[var(--bad)]/10',
    warn: 'border-amber-500/40 bg-amber-500/10',
  };
  return <p className={cn('rounded-xl border px-3 py-2 text-sm', tones[tone])}>{children}</p>;
}

export function Pill({ status }: { status: string }) {
  const ok = ['paid', 'delivered', 'completed', 'approved', 'published', 'matched', 'active', 'cleared'].includes(status);
  const bad = ['cancelled', 'rejected', 'payment_failed', 'suspended', 'returned'].includes(status);
  const warn = ['pending', 'pending_payment', 'draft', 'in_review', 'submitted', 'open', 'processing'].includes(status);
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
        ok && 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300',
        bad && 'bg-[var(--bad)]/15 text-[var(--bad)]',
        warn && 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
        !ok && !bad && !warn && 'bg-[var(--bg)] text-[var(--muted)]',
      )}
    >
      {titleCase(status)}
    </span>
  );
}

export function QueryState({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: unknown;
  empty?: boolean;
  children: ReactNode;
}) {
  if (loading) return <p className="text-sm text-[var(--muted)]">Loading the desk…</p>;
  if (error) return <Banner>{error instanceof Error ? error.message : 'Could not load this desk'}</Banner>;
  if (empty) return <p className="text-sm text-[var(--muted)]">Nothing is waiting here yet.</p>;
  return children;
}

export function DataTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--line)] text-xs uppercase tracking-wide text-[var(--muted)]">
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 font-medium">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[var(--line)] last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3 align-middle">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ meta, page, onPage }: { meta: PageMeta; page: number; onPage: (page: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-[var(--muted)]">
      <span>{meta.total} records</span>
      <div className="flex gap-2">
        <Button type="button" tone="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button type="button" tone="ghost" disabled={page >= meta.totalPages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export function Bars({ points }: { points: { date: string; amount: string }[] }) {
  const max = Math.max(1, ...points.map((point) => Number(point.amount)));
  if (!points.length) return <p className="text-sm text-[var(--muted)]">No events in this window.</p>;
  return (
    <div className="flex h-40 items-end gap-1">
      {points.map((point) => (
        <div key={point.date} className="group flex h-full flex-1 flex-col justify-end" title={`${point.date}: ${point.amount}`}>
          <div className="rounded-t bg-[var(--accent)]" style={{ height: `${Math.max(4, (Number(point.amount) / max) * 100)}%` }} />
        </div>
      ))}
    </div>
  );
}

export function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Modal({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button type="button" tone="ghost" onClick={onClose}>Close</Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Tabs({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: { id: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={cn(
            'rounded-full px-3 py-1.5 text-sm',
            value === option.id ? 'bg-[var(--chip)] text-white' : 'border border-[var(--line)]',
          )}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
