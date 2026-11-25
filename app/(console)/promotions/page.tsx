'use client';

import { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { naira } from '@/lib/format';
import { useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Field, Panel, Pill, QueryState, SelectInput, TextInput } from '@/components/desk';

type Promotion = { id: string; code: string; type: string; amount: string; minSpend: string; active: boolean; usedCount: number; usageLimit: number | null };

export default function PromotionsPage() {
  const query = useQuery({ queryKey: ['promotions'], queryFn: () => get<Promotion[]>('/admin/promotions') });
  const send = useSend();

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    send.mutate({
      path: '/admin/promotions',
      message: 'Promotion created',
      body: {
        code: String(form.get('code')),
        type: String(form.get('type')),
        amount: Number(form.get('amount')),
        minSpend: Number(form.get('minSpend') || 0),
        description: String(form.get('description') || '') || undefined,
        usageLimit: form.get('usageLimit') ? Number(form.get('usageLimit')) : undefined,
      },
    });
  }

  return (
    <Desk title="Promotions" lede="Coupon codes the checkout applies to a basket.">
      <Panel title="New coupon">
        <form className="grid gap-3 md:grid-cols-3" onSubmit={create}>
          <Field label="Code"><TextInput name="code" required minLength={3} /></Field>
          <Field label="Type"><SelectInput name="type" defaultValue="percent"><option value="percent">Percent</option><option value="fixed">Fixed naira</option></SelectInput></Field>
          <Field label="Amount"><TextInput name="amount" type="number" min="1" step="0.01" required /></Field>
          <Field label="Minimum spend"><TextInput name="minSpend" type="number" min="0" defaultValue={0} /></Field>
          <Field label="Usage limit"><TextInput name="usageLimit" type="number" min="1" /></Field>
          <Field label="Description"><TextInput name="description" /></Field>
          <Button type="submit" disabled={send.isPending}>Create</Button>
        </form>
      </Panel>
      <Panel>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length}>
          <DataTable
            columns={['Code', 'Type', 'Amount', 'Minimum', 'Used', 'Status', '']}
            rows={(query.data ?? []).map((row) => [
              row.code,
              row.type,
              row.type === 'percent' ? `${row.amount}%` : naira(row.amount),
              naira(row.minSpend),
              `${row.usedCount}${row.usageLimit ? ` / ${row.usageLimit}` : ''}`,
              <Pill key={row.id} status={row.active ? 'active' : 'archived'} />,
              <Button key={`${row.id}-t`} type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/promotions/${row.id}`, method: 'PATCH', body: { active: !row.active }, message: row.active ? 'Coupon paused' : 'Coupon live' })}>{row.active ? 'Pause' : 'Activate'}</Button>,
            ])}
          />
        </QueryState>
      </Panel>
    </Desk>
  );
}
