'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get, send as post } from '@/lib/api';
import { useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Field, Panel, Pill, QueryState, SelectInput, TextInput } from '@/components/desk';

type Supplier = { id: string; legalName: string; currency: string };
type PurchaseOrder = { id: string; poNo: string; status: string; currency: string; total: string; supplier: { legalName: string } };
type Cost = { landedUnitCost: string; sellingPrice: string; currency: string };

export default function PurchaseOrdersPage() {
  const [lines, setLines] = useState([{ description: '', qty: 1, unitPrice: 0 }]);
  const [cost, setCost] = useState<Cost | null>(null);
  const orders = useQuery({ queryKey: ['pos'], queryFn: () => get<PurchaseOrder[]>('/admin/purchase-orders') });
  const suppliers = useQuery({ queryKey: ['suppliers'], queryFn: () => get<Supplier[]>('/admin/suppliers') });
  const action = useSend();

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    action.mutate({
      path: '/admin/purchase-orders',
      message: 'Purchase order drafted',
      body: {
        supplierId: String(form.get('supplierId')),
        currency: String(form.get('currency')),
        incoterm: String(form.get('incoterm') || '') || undefined,
        items: lines.filter((line) => line.description).map((line) => ({ description: line.description, qty: Number(line.qty), unitPrice: Number(line.unitPrice), weightKg: 0 })),
      },
    });
  }

  return (
    <Desk title="Purchase orders" lede="Draft a buy, issue it, then receive and match the supplier invoice.">
      <Panel title="New purchase order">
        <form className="grid gap-3" onSubmit={create}>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Supplier">
              <SelectInput name="supplierId" required>{(suppliers.data ?? []).map((row) => <option key={row.id} value={row.id}>{row.legalName}</option>)}</SelectInput>
            </Field>
            <Field label="Currency"><TextInput name="currency" defaultValue="USD" maxLength={3} required /></Field>
            <Field label="Incoterm"><TextInput name="incoterm" placeholder="FOB" /></Field>
          </div>
          {lines.map((line, index) => (
            <div key={index} className="grid gap-2 md:grid-cols-3">
              <TextInput placeholder="Description" value={line.description} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} />
              <TextInput type="number" min="1" value={line.qty} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, qty: Number(event.target.value) } : item))} />
              <TextInput type="number" min="0" step="0.01" value={line.unitPrice} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, unitPrice: Number(event.target.value) } : item))} />
            </div>
          ))}
          <div className="flex gap-2">
            <Button type="button" tone="ghost" onClick={() => setLines([...lines, { description: '', qty: 1, unitPrice: 0 }])}>Add line</Button>
            <Button type="submit" disabled={action.isPending}>Create draft</Button>
          </div>
        </form>
      </Panel>
      <Panel title="Landed cost">
        <form className="grid gap-3 md:grid-cols-4" onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const result = await post<Cost>('/admin/purchase-orders/landed-cost', 'POST', {
            unitPriceFx: Number(form.get('unitPriceFx')),
            fxRate: Number(form.get('fxRate')),
            freightAlloc: Number(form.get('freightAlloc') || 0),
            dutyAlloc: Number(form.get('dutyAlloc') || 0),
          });
          setCost(result);
        }}>
          <Field label="Unit FX"><TextInput name="unitPriceFx" type="number" step="0.01" required /></Field>
          <Field label="FX to NGN"><TextInput name="fxRate" type="number" step="0.01" required /></Field>
          <Field label="Freight"><TextInput name="freightAlloc" type="number" step="0.01" defaultValue={0} /></Field>
          <Field label="Duty"><TextInput name="dutyAlloc" type="number" step="0.01" defaultValue={0} /></Field>
          <Button type="submit" tone="navy">Price it</Button>
        </form>
        {cost ? <p className="mt-3 text-sm">Landed {cost.landedUnitCost} · sell {cost.sellingPrice} {cost.currency}</p> : null}
      </Panel>
      <Panel>
        <QueryState loading={orders.isLoading} error={orders.error} empty={!orders.data?.length}>
          <DataTable
            columns={['PO', 'Supplier', 'Currency', 'Total', 'Status', '']}
            rows={(orders.data ?? []).map((row) => [
              row.poNo,
              row.supplier?.legalName ?? '—',
              row.currency,
              String(row.total),
              <Pill key={row.id} status={row.status} />,
              <Link key={`${row.id}-l`} className="font-medium text-[var(--navy)]" href={`/purchase-orders/${row.id}`}>Open</Link>,
            ])}
          />
        </QueryState>
      </Panel>
    </Desk>
  );
}
