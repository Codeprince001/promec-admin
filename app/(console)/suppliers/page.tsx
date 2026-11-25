'use client';

import { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Field, Panel, QueryState, TextInput } from '@/components/desk';

type Supplier = { id: string; legalName: string; country: string; tier: number; currency: string; email: string | null; status: string };

export default function SuppliersPage() {
  const query = useQuery({ queryKey: ['suppliers'], queryFn: () => get<Supplier[]>('/admin/suppliers') });
  const send = useSend();

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    send.mutate({
      path: '/admin/suppliers',
      message: 'Supplier added',
      body: {
        legalName: String(form.get('legalName')),
        country: String(form.get('country')),
        tier: Number(form.get('tier') || 2),
        currency: String(form.get('currency') || 'USD'),
        email: String(form.get('email') || '') || undefined,
      },
    });
    event.currentTarget.reset();
  }

  return (
    <Desk title="Suppliers" lede="The factories and distributors purchase orders are raised against.">
      <Panel title="Add a supplier">
        <form className="grid gap-3 md:grid-cols-5" onSubmit={create}>
          <Field label="Legal name"><TextInput name="legalName" required /></Field>
          <Field label="Country"><TextInput name="country" required defaultValue="China" /></Field>
          <Field label="Tier"><TextInput name="tier" type="number" min="1" max="3" defaultValue={2} /></Field>
          <Field label="Currency"><TextInput name="currency" maxLength={3} defaultValue="USD" /></Field>
          <Field label="Email"><TextInput name="email" type="email" /></Field>
          <Button type="submit" disabled={send.isPending}>Save supplier</Button>
        </form>
      </Panel>
      <Panel>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length}>
          <DataTable columns={['Name', 'Country', 'Tier', 'Currency', 'Email', 'Status']} rows={(query.data ?? []).map((row) => [row.legalName, row.country, row.tier, row.currency, row.email ?? '—', row.status])} />
        </QueryState>
      </Panel>
    </Desk>
  );
}
