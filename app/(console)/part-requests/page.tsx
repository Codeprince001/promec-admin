'use client';

import { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { naira, when } from '@/lib/format';
import { useMe, useSend } from '@/lib/hooks';
import { Button, Desk, Field, Panel, Pill, QueryState, TextArea, TextInput } from '@/components/desk';

type RequestRow = {
  id: string;
  description: string;
  partNumber: string | null;
  status: string;
  contactEmail: string | null;
  quotedPrice: string | null;
  dueAt: string | null;
  customer: { firstName: string; lastName: string } | null;
};

export default function PartRequestsPage() {
  const me = useMe();
  const query = useQuery({ queryKey: ['part-requests'], queryFn: () => get<RequestRow[]>('/admin/part-requests') });
  const send = useSend();

  function quote(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    send.mutate({ path: `/part-requests/${id}/quote`, body: { quotedPrice: Number(form.get('quotedPrice')), quoteNote: String(form.get('quoteNote')) }, message: 'Quote sent' });
  }

  return (
    <Desk title="Part requests" lede="Buyers who could not find the part. Quote them, or assign the request to yourself.">
      <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length}>
        <div className="grid gap-4">
          {(query.data ?? []).map((row) => (
            <Panel key={row.id} title={row.partNumber || 'No part number'} action={<Pill status={row.status} />}>
              <p className="mb-1 text-sm">{row.description}</p>
              <p className="mb-3 text-xs text-[var(--muted)]">{row.customer ? `${row.customer.firstName} ${row.customer.lastName}` : row.contactEmail} · due {when(row.dueAt)} {row.quotedPrice ? `· quoted ${naira(row.quotedPrice)}` : ''}</p>
              <form className="grid gap-3 md:grid-cols-[10rem_1fr_auto]" onSubmit={(event) => quote(event, row.id)}>
                <Field label="Price"><TextInput name="quotedPrice" type="number" min="1" step="0.01" required /></Field>
                <Field label="Note"><TextArea name="quoteNote" required /></Field>
                <div className="flex items-end gap-2">
                  <Button type="submit" disabled={send.isPending}>Quote</Button>
                  {me.data ? <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/part-requests/${row.id}/assign`, body: { assigneeId: me.data!.id }, message: 'Assigned to you' })}>Assign me</Button> : null}
                </div>
              </form>
            </Panel>
          ))}
        </div>
      </QueryState>
    </Desk>
  );
}
