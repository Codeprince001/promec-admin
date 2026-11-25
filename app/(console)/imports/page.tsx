'use client';

import { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { nextImportStep, when } from '@/lib/format';
import { useSend } from '@/lib/hooks';
import { Button, Desk, Field, Panel, Pill, QueryState, SelectInput, TextInput } from '@/components/desk';

type ImportRow = {
  id: string;
  status: string;
  mode: string;
  blAwbNo: string | null;
  eta: string | null;
  dutyTotal: string | null;
  milestones: { id: string; step: string; note: string | null; createdAt: string }[];
};

export default function ImportsPage() {
  const query = useQuery({ queryKey: ['imports'], queryFn: () => get<ImportRow[]>('/admin/imports') });
  const orders = useQuery({ queryKey: ['pos'], queryFn: () => get<{ id: string; poNo: string }[]>('/admin/purchase-orders') });
  const send = useSend();

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const eta = String(form.get('eta') || '');
    send.mutate({
      path: '/admin/imports',
      message: 'Import opened',
      body: {
        poId: String(form.get('poId') || '') || undefined,
        mode: String(form.get('mode')),
        blAwbNo: String(form.get('blAwbNo') || '') || undefined,
        eta: eta ? new Date(eta).toISOString() : undefined,
      },
    });
  }

  return (
    <Desk title="Imports" lede="Air, sea, and courier shipments through customs, with the documents a clearing desk keeps.">
      <Panel title="Open a shipment">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={create}>
          <Field label="Purchase order">
            <SelectInput name="poId"><option value="">None</option>{(orders.data ?? []).map((order) => <option key={order.id} value={order.id}>{order.poNo}</option>)}</SelectInput>
          </Field>
          <Field label="Mode"><SelectInput name="mode" defaultValue="sea"><option value="sea">Sea</option><option value="air">Air</option><option value="courier">Courier</option></SelectInput></Field>
          <Field label="B/L or AWB"><TextInput name="blAwbNo" /></Field>
          <Field label="ETA"><TextInput name="eta" type="datetime-local" /></Field>
          <Button type="submit" disabled={send.isPending}>Open</Button>
        </form>
      </Panel>
      <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length}>
        <div className="grid gap-4">
          {(query.data ?? []).map((row) => {
            const next = nextImportStep(row.status);
            return (
              <Panel key={row.id} title={`${row.mode} · ${row.blAwbNo || 'No bill yet'}`} action={<Pill status={row.status} />}>
                <p className="mb-2 text-sm text-[var(--muted)]">ETA {when(row.eta)} · duty {row.dutyTotal ?? 'not posted'}</p>
                <ol className="mb-3 text-sm">{row.milestones.map((step) => <li key={step.id}>{step.step}{step.note ? ` · ${step.note}` : ''}</li>)}</ol>
                <div className="flex flex-wrap gap-2">
                  {next ? <Button type="button" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/imports/${row.id}/advance`, body: { step: next }, message: `Moved to ${next}` })}>Advance to {next}</Button> : null}
                  <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => {
                    const dutyTotal = window.prompt('Duty total');
                    if (!dutyTotal) return;
                    send.mutate({ path: `/admin/imports/${row.id}/duty`, body: { dutyTotal: Number(dutyTotal) }, message: 'Duty saved' });
                  }}>Post duty</Button>
                  <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => {
                    const url = window.prompt('Document URL');
                    if (!url) return;
                    send.mutate({ path: `/admin/imports/${row.id}/documents`, body: { kind: 'invoice', url }, message: 'Document attached' });
                  }}>Attach invoice</Button>
                </div>
              </Panel>
            );
          })}
        </div>
      </QueryState>
    </Desk>
  );
}
