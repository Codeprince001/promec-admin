'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { naira, when } from '@/lib/format';
import { useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Field, Panel, QueryState, SelectInput, TextInput } from '@/components/desk';

type Statement = {
  account: { id: string; legalName: string; status: string; paymentTermsDays: number; discountRate: number; creditLimit: string; exposure: string; available: string };
  entries: { id: string; kind: string; amount: string; reference: string | null; note: string | null; createdAt: string }[];
};

type PriceList = { id: string; name: string; items: { skuId: string; unitPrice: string }[] };

export default function TradeAccountPage() {
  const params = useParams<{ id: string }>();
  const statement = useQuery({ queryKey: ['statement', params.id], queryFn: () => get<Statement>(`/admin/b2b/accounts/${params.id}`) });
  const lists = useQuery({ queryKey: ['prices', params.id], queryFn: () => get<PriceList[]>(`/admin/b2b/accounts/${params.id}/price-lists`) });
  const send = useSend();
  const account = statement.data?.account;

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    send.mutate({
      path: `/admin/b2b/accounts/${params.id}`,
      method: 'PATCH',
      message: 'Account updated',
      body: {
        status: String(form.get('status')),
        creditLimit: Number(form.get('creditLimit')),
        paymentTermsDays: Number(form.get('paymentTermsDays')),
        discountRate: Number(form.get('discountRate')),
      },
    });
  }

  return (
    <Desk title={account?.legalName ?? 'Business account'} actions={<Link className="text-sm text-[var(--navy)]" href="/trade">All accounts</Link>}>
      <QueryState loading={statement.isLoading} error={statement.error}>
        {account ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Credit">
              <p className="mb-3 text-sm text-[var(--muted)]">Exposure {naira(account.exposure)} · available {naira(account.available)}</p>
              <form className="grid gap-3" onSubmit={review}>
                <Field label="Status">
                  <SelectInput name="status" defaultValue={account.status}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></SelectInput>
                </Field>
                <Field label="Credit limit"><TextInput name="creditLimit" type="number" min="0" defaultValue={account.creditLimit} /></Field>
                <Field label="Payment terms (days)"><TextInput name="paymentTermsDays" type="number" min="0" defaultValue={account.paymentTermsDays} /></Field>
                <Field label="Discount rate (0–0.5)"><TextInput name="discountRate" type="number" min="0" max="0.5" step="0.01" defaultValue={account.discountRate} /></Field>
                <Button type="submit" disabled={send.isPending}>Save terms</Button>
              </form>
              <form className="mt-4 grid gap-3" onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                send.mutate({ path: `/admin/b2b/accounts/${params.id}/payments`, body: { amount: Number(form.get('amount')), reference: String(form.get('reference')) }, message: 'Payment posted' });
              }}>
                <Field label="Receive payment"><TextInput name="amount" type="number" min="1" step="0.01" required /></Field>
                <Field label="Reference"><TextInput name="reference" required /></Field>
                <Button type="submit" tone="navy" disabled={send.isPending}>Post receipt</Button>
              </form>
            </Panel>
            <div className="grid content-start gap-4">
              <Panel title="Statement">
                <DataTable columns={['When', 'Kind', 'Amount', 'Reference']} rows={(statement.data?.entries ?? []).map((entry) => [when(entry.createdAt), entry.kind, naira(entry.amount), entry.reference ?? entry.note ?? '—'])} />
              </Panel>
              <Panel title="Contract prices">
                <form className="mb-3 grid gap-3" onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  send.mutate({ path: `/admin/b2b/accounts/${params.id}/price-lists`, body: { name: String(form.get('name')), items: [{ skuId: String(form.get('skuId')), unitPrice: Number(form.get('unitPrice')) }] }, message: 'Price list created' });
                }}>
                  <Field label="List name"><TextInput name="name" required /></Field>
                  <Field label="SKU id"><TextInput name="skuId" required /></Field>
                  <Field label="Unit price"><TextInput name="unitPrice" type="number" min="1" step="0.01" required /></Field>
                  <Button type="submit" tone="ghost" disabled={send.isPending}>Add price list</Button>
                </form>
                <QueryState loading={lists.isLoading} error={lists.error} empty={!lists.data?.length}>
                  <ul className="text-sm">{(lists.data ?? []).map((list) => <li key={list.id}>{list.name} · {list.items.length} prices</li>)}</ul>
                </QueryState>
              </Panel>
            </div>
          </div>
        ) : null}
      </QueryState>
    </Desk>
  );
}
