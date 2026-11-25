'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { useSend } from '@/lib/hooks';
import { when } from '@/lib/format';
import type { SettingsView } from '@/lib/types';
import { Banner, Button, Desk, Field, Panel, QueryState, TextInput } from '@/components/desk';

type SessionRow = { id: string; ip: string | null; userAgent: string | null; createdAt: string; expiresAt: string };
type Balance = { ok: boolean; balances: { currency: string; amount: string }[] };

export default function SettingsPage() {
  const settings = useQuery({ queryKey: ['settings'], queryFn: () => get<SettingsView>('/admin/settings') });
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: () => get<SessionRow[]>('/auth/sessions') });
  const send = useSend();
  const [form, setForm] = useState<SettingsView | null>(null);
  const [secret, setSecret] = useState('');
  const [test, setTest] = useState<Balance | null>(null);

  useEffect(() => {
    if (settings.data) setForm(settings.data);
  }, [settings.data]);

  function save(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    send.mutate({
      path: '/admin/settings',
      message: 'Settings saved',
      body: {
        storeName: form.storeName,
        supportEmail: form.supportEmail,
        supportPhone: form.supportPhone,
        currency: form.currency,
        paystackPublicKey: form.paystackPublicKey,
        paystackSecretKey: secret || undefined,
        bankName: form.bankName,
        bankAccountName: form.bankAccountName,
        bankAccountNumber: form.bankAccountNumber,
        guestCheckout: form.guestCheckout,
        nlSearch: form.nlSearch,
      },
    }, { onSuccess: () => setSecret('') });
  }

  function set<K extends keyof SettingsView>(key: K, value: SettingsView[K]) {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  return (
    <Desk title="Settings" lede="Store profile, the Paystack account that collects checkout, and the bank buyers transfer to.">
      <QueryState loading={settings.isLoading} error={settings.error}>
        {form ? (
          <form className="grid gap-4" onSubmit={save}>
            <Panel title="Store">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Store name"><TextInput value={form.storeName} onChange={(event) => set('storeName', event.target.value)} required /></Field>
                <Field label="Currency"><TextInput value={form.currency} maxLength={3} onChange={(event) => set('currency', event.target.value.toUpperCase())} /></Field>
                <Field label="Support email"><TextInput type="email" value={form.supportEmail} onChange={(event) => set('supportEmail', event.target.value)} /></Field>
                <Field label="Support phone"><TextInput value={form.supportPhone} onChange={(event) => set('supportPhone', event.target.value)} /></Field>
              </div>
            </Panel>
            <Panel title="Paystack">
              <div className="mb-3">
                {form.paystackSecretSource === 'missing' ? <Banner tone="warn">No secret key is saved. Checkout cannot open Paystack until one is added.</Banner> : <Banner tone="ok">Secret is coming from {form.paystackSecretSource === 'account' ? 'this desk' : 'the server environment'}{form.paystackSecretLast4 ? ` · ending ${form.paystackSecretLast4}` : ''}.</Banner>}
              </div>
              <div className="grid gap-3">
                <Field label="Public key"><TextInput value={form.paystackPublicKey} onChange={(event) => set('paystackPublicKey', event.target.value)} placeholder="pk_live_…" /></Field>
                <Field label="Secret key"><TextInput type="password" value={secret} autoComplete="off" onChange={(event) => setSecret(event.target.value)} placeholder="Leave blank to keep the saved key" /></Field>
                <Field label="Webhook URL"><TextInput readOnly value={form.webhookUrl} onFocus={(event) => event.currentTarget.select()} /></Field>
                <p className="text-xs text-[var(--muted)]">Paste that URL into the Paystack dashboard and subscribe to charge.success. The secret saved here is encrypted before it is stored.</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" tone="navy" disabled={send.isPending} onClick={() => send.mutate({ path: '/admin/settings/paystack/test', message: 'Paystack accepted the key' }, { onSuccess: (data) => setTest(data as Balance) })}>Test connection</Button>
                  <Button type="button" tone="ghost" onClick={() => send.mutate({ path: '/admin/settings', body: { clearPaystackSecret: true }, message: 'Saved key cleared. The environment key is used if one exists.' })}>Clear saved secret</Button>
                </div>
                {test ? <p className="text-sm">{test.balances.map((row) => `${row.currency} ${row.amount}`).join(' · ') || 'Connected'}</p> : null}
              </div>
            </Panel>
            <Panel title="Bank transfer">
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Bank"><TextInput value={form.bankName} onChange={(event) => set('bankName', event.target.value)} /></Field>
                <Field label="Account name"><TextInput value={form.bankAccountName} onChange={(event) => set('bankAccountName', event.target.value)} /></Field>
                <Field label="Account number"><TextInput value={form.bankAccountNumber} onChange={(event) => set('bankAccountNumber', event.target.value)} /></Field>
              </div>
            </Panel>
            <Panel title="Checkout behaviour">
              <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.guestCheckout} onChange={(event) => set('guestCheckout', event.target.checked)} /> Allow guest checkout</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.nlSearch} onChange={(event) => set('nlSearch', event.target.checked)} /> Allow the parts assistant to search the catalogue</label>
            </Panel>
            <Button type="submit" disabled={send.isPending}>Save settings</Button>
          </form>
        ) : null}
      </QueryState>
      <Panel title="This account's sessions">
        <QueryState loading={sessions.isLoading} error={sessions.error} empty={!sessions.data?.length}>
          <ul className="grid gap-2 text-sm">
            {(sessions.data ?? []).map((session) => (
              <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-2">
                <span>{session.ip || 'Unknown IP'} · {session.userAgent || 'Unknown device'} · {when(session.createdAt)}</span>
                <Button type="button" tone="ghost" onClick={() => send.mutate({ path: `/auth/sessions/${session.id}`, method: 'DELETE', message: 'Session revoked' })}>Revoke</Button>
              </li>
            ))}
          </ul>
        </QueryState>
      </Panel>
    </Desk>
  );
}
