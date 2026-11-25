'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { useSend } from '@/lib/hooks';
import { Button, Desk, Field, Panel, Pill, QueryState, SelectInput, TextInput } from '@/components/desk';

type Supplier = { id: string; legalName: string };
type Rfq = {
  id: string;
  status: string;
  notes: string | null;
  lines: { id: string; description: string; qty: number }[];
  responses: { id: string; currency: string; supplierId: string; lines: { unitPrice: string }[] }[];
};

export default function RfqsPage() {
  const [lines, setLines] = useState([{ description: '', qty: 1 }]);
  const query = useQuery({ queryKey: ['rfqs'], queryFn: () => get<Rfq[]>('/admin/rfqs') });
  const suppliers = useQuery({ queryKey: ['suppliers'], queryFn: () => get<Supplier[]>('/admin/suppliers') });
  const send = useSend();

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    send.mutate({
      path: '/admin/rfqs',
      message: 'Request sent',
      body: { notes: String(form.get('notes') || '') || undefined, lines: lines.filter((line) => line.description) },
    });
  }

  return (
    <Desk title="Supplier quotes" lede="Ask suppliers for a price, record what comes back, and award the winner into a purchase order.">
      <Panel title="New request">
        <form className="grid gap-3" onSubmit={create}>
          <Field label="Notes"><TextInput name="notes" /></Field>
          {lines.map((line, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-2">
              <TextInput placeholder="What to buy" value={line.description} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} />
              <TextInput type="number" min="1" value={line.qty} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, qty: Number(event.target.value) } : item))} />
            </div>
          ))}
          <div className="flex gap-2">
            <Button type="button" tone="ghost" onClick={() => setLines([...lines, { description: '', qty: 1 }])}>Add line</Button>
            <Button type="submit" disabled={send.isPending}>Create request</Button>
          </div>
        </form>
      </Panel>
      <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length}>
        <div className="grid gap-4">
          {(query.data ?? []).map((rfq) => (
            <Panel key={rfq.id} title={rfq.notes || 'Request'} action={<Pill status={rfq.status} />}>
              <ul className="mb-3 text-sm">{rfq.lines.map((line) => <li key={line.id}>{line.qty} × {line.description}</li>)}</ul>
              <form className="mb-3 grid gap-3 md:grid-cols-3" onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                send.mutate({
                  path: `/admin/rfqs/${rfq.id}/quotes`,
                  message: 'Supplier quote recorded',
                  body: {
                    supplierId: String(form.get('supplierId')),
                    currency: String(form.get('currency')),
                    lines: rfq.lines.map((line) => ({ rfqLineId: line.id, unitPrice: Number(form.get(line.id)), leadTimeDays: 0 })),
                  },
                });
              }}>
                <SelectInput name="supplierId">{(suppliers.data ?? []).map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.legalName}</option>)}</SelectInput>
                <TextInput name="currency" defaultValue="USD" maxLength={3} />
                {rfq.lines.map((line) => <TextInput key={line.id} name={line.id} type="number" step="0.01" placeholder={`Price for ${line.description}`} required />)}
                <Button type="submit" tone="ghost" disabled={send.isPending}>Record quote</Button>
              </form>
              <div className="flex flex-wrap gap-2">
                {rfq.responses.map((response) => (
                  <Button key={response.id} type="button" tone="navy" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/rfqs/${rfq.id}/award`, body: { quoteId: response.id }, message: 'Awarded and purchase order opened' })}>
                    Award {response.currency} quote
                  </Button>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      </QueryState>
    </Desk>
  );
}
