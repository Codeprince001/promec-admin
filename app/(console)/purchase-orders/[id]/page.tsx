'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Field, Panel, Pill, QueryState, SelectInput, TextInput } from '@/components/desk';

type Line = { id: string; description: string; qty: number; unitPrice: string };
type Invoice = { id: string; invoiceNo: string; status: string; total: string };
type Order = {
  id: string;
  poNo: string;
  status: string;
  currency: string;
  total: string;
  supplier: { legalName: string };
  items: Line[];
  invoices: Invoice[];
};
type Warehouse = { id: string; code: string };

export default function PurchaseOrderPage() {
  const params = useParams<{ id: string }>();
  const order = useQuery({ queryKey: ['po', params.id], queryFn: () => get<Order>(`/admin/purchase-orders/${params.id}`) });
  const warehouses = useQuery({ queryKey: ['warehouses'], queryFn: () => get<Warehouse[]>('/admin/inventory/warehouses') });
  const send = useSend();
  const row = order.data;

  function receive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!row) return;
    const form = new FormData(event.currentTarget);
    const lines = row.items.map((item) => ({ itemId: item.id, qty: Number(form.get(item.id) || 0) })).filter((item) => item.qty > 0);
    send.mutate({ path: `/admin/purchase-orders/${row.id}/receipts`, body: { warehouseId: String(form.get('warehouseId')), lines }, message: 'Goods received' });
  }

  return (
    <Desk title={row?.poNo ?? 'Purchase order'} lede={row ? `${row.supplier.legalName} · ${row.currency} ${row.total}` : undefined} actions={<Link className="text-sm text-[var(--navy)]" href="/purchase-orders">All purchase orders</Link>}>
      <QueryState loading={order.isLoading} error={order.error}>
        {row ? (
          <div className="grid gap-4">
            <Panel title="Lines" action={<Pill status={row.status} />}>
              {row.status === 'draft' ? <Button className="mb-3" type="button" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/purchase-orders/${row.id}/issue`, message: 'Purchase order issued' })}>Issue to supplier</Button> : null}
              <form className="grid gap-3" onSubmit={receive}>
                <DataTable
                  columns={['Description', 'Ordered', 'Price', 'Receive qty']}
                  rows={row.items.map((item) => [item.description, item.qty, String(item.unitPrice), <TextInput key={item.id} name={item.id} type="number" min="0" defaultValue={0} />])}
                />
                <Field label="Warehouse">
                  <SelectInput name="warehouseId">{(warehouses.data ?? []).map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code}</option>)}</SelectInput>
                </Field>
                <Button type="submit" tone="navy" disabled={send.isPending || row.status === 'draft'}>Receive goods</Button>
              </form>
            </Panel>
            <Panel title="Supplier invoice">
              <form className="mb-4 grid gap-3" onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const itemId = String(form.get('itemId'));
                send.mutate({
                  path: `/admin/purchase-orders/${row.id}/invoices`,
                  message: 'Invoice captured',
                  body: { invoiceNo: String(form.get('invoiceNo')), lines: [{ itemId, qty: Number(form.get('qty')), unitPrice: Number(form.get('unitPrice')) }] },
                });
              }}>
                <div className="grid gap-3 md:grid-cols-4">
                  <Field label="Invoice number"><TextInput name="invoiceNo" required /></Field>
                  <Field label="Line"><SelectInput name="itemId">{row.items.map((item) => <option key={item.id} value={item.id}>{item.description}</option>)}</SelectInput></Field>
                  <Field label="Qty"><TextInput name="qty" type="number" min="1" required /></Field>
                  <Field label="Unit price"><TextInput name="unitPrice" type="number" step="0.01" required /></Field>
                </div>
                <Button type="submit" tone="ghost" disabled={send.isPending}>Capture invoice</Button>
              </form>
              <DataTable
                columns={['Invoice', 'Total', 'Status', '']}
                rows={(row.invoices ?? []).map((invoice) => [
                  invoice.invoiceNo,
                  String(invoice.total),
                  <Pill key={invoice.id} status={invoice.status} />,
                  <div key={`${invoice.id}-a`} className="flex flex-wrap gap-2">
                    <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/supplier-invoices/${invoice.id}/match`, message: 'Invoice matched' })}>Match</Button>
                    <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/supplier-invoices/${invoice.id}/approve`, message: 'Invoice approved' })}>Approve</Button>
                    <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => {
                      const reference = window.prompt('Payment reference');
                      if (!reference) return;
                      send.mutate({ path: `/admin/supplier-invoices/${invoice.id}/pay`, body: { method: 'bank_transfer', reference }, message: 'Invoice paid' });
                    }}>Pay</Button>
                  </div>,
                ])}
              />
            </Panel>
          </div>
        ) : null}
      </QueryState>
    </Desk>
  );
}
