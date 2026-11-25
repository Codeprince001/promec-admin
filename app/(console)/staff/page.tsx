'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Field, Modal, Panel, Pill, QueryState, SelectInput, TextInput } from '@/components/desk';

type Staff = { id: string; email: string | null; phone: string | null; type: string; status: string; mfaEnabled: boolean; roles: string[] };
type Role = { id: string; name: string };

export default function StaffPage() {
  const [codes, setCodes] = useState<string[] | null>(null);
  const query = useQuery({ queryKey: ['staff'], queryFn: () => get<Staff[]>('/admin/users') });
  const roles = useQuery({ queryKey: ['roles'], queryFn: () => get<Role[]>('/admin/roles') });
  const send = useSend();

  return (
    <Desk title="Staff" lede="Operators, warehouse, finance, and the authenticator recovery codes they can use once.">
      <Panel title="Invite">
        <form className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send.mutate({ path: '/admin/users', body: { email: String(form.get('email')), role: String(form.get('role')) }, message: 'Invite sent' });
          event.currentTarget.reset();
        }}>
          <Field label="Work email"><TextInput name="email" type="email" required /></Field>
          <Field label="Role">
            <SelectInput name="role" required defaultValue={roles.data?.[0]?.name ?? 'support'}>
              {(roles.data ?? []).filter((role) => role.name !== 'customer').map((role) => <option key={role.id} value={role.name}>{role.name}</option>)}
            </SelectInput>
          </Field>
          <Button type="submit" disabled={send.isPending}>Send invite</Button>
        </form>
      </Panel>
      <Panel>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length}>
          <DataTable
            columns={['Person', 'Type', 'Roles', 'MFA', 'Status', '']}
            rows={(query.data ?? []).map((row) => [
              row.email || row.phone || row.id,
              row.type,
              row.roles.join(', ') || '—',
              row.mfaEnabled ? 'On' : 'Off',
              <Pill key={row.id} status={row.status} />,
              <span key={`${row.id}-a`} className="flex flex-wrap gap-2">
                <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/users/${row.id}`, method: 'PATCH', body: { status: row.status === 'active' ? 'disabled' : 'active' }, message: row.status === 'active' ? 'Account disabled' : 'Account enabled' })}>{row.status === 'active' ? 'Disable' : 'Enable'}</Button>
                <Button type="button" tone="ghost" disabled={!row.email || send.isPending} onClick={() => send.mutate({ path: `/auth/admin/users/${row.id}/password-reset`, message: 'Reset email sent' })}>Reset password</Button>
                <Button type="button" tone="ghost" disabled={!row.mfaEnabled || send.isPending} onClick={() => send.mutate({ path: `/auth/admin/users/${row.id}/mfa/disable`, message: 'Authenticator turned off' })}>Turn off MFA</Button>
                <Button type="button" tone="ghost" disabled={!row.mfaEnabled || send.isPending} onClick={() => {
                  send.mutate({ path: `/auth/admin/users/${row.id}/recovery-codes`, message: 'Recovery codes replaced' }, {
                    onSuccess: (data) => setCodes((data as { recoveryCodes: string[] }).recoveryCodes),
                  });
                }}>New recovery codes</Button>
              </span>,
            ])}
          />
        </QueryState>
      </Panel>
      <Modal title="Recovery codes" open={Boolean(codes)} onClose={() => setCodes(null)}>
        <p className="mb-3 text-sm text-[var(--muted)]">Show these once. The previous codes no longer work.</p>
        <ul className="grid gap-1 font-mono text-sm">{(codes ?? []).map((code) => <li key={code}>{code}</li>)}</ul>
      </Modal>
    </Desk>
  );
}
