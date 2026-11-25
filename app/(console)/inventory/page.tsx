'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { naira, when } from '@/lib/format';
import { useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Field, Panel, Pill, QueryState, SelectInput, Tabs, TextInput } from '@/components/desk';

type Stock = { id: string; skuId: string; sku: string; product: string; warehouse: string; onHandQty: number; reservedQty: number; availableQty: number; reorderPoint: number; avgCost: string };
type Warehouse = { id: string; code: string; name: string; state: string | null };
type Transfer = { id: string; transferNo: string; status: string; from: string; to: string; lines: number };
type Count = { id: string; status: string; warehouse: string; lines: number; createdAt: string };
type Bin = { id: string; code: string; zone: string | null; stock: { qty: number }[] };

export default function InventoryPage() {
  const [tab, setTab] = useState('stock');
  const stock = useQuery({ queryKey: ['inventory'], queryFn: () => get<Stock[]>('/admin/inventory') });
  const warehouses = useQuery({ queryKey: ['warehouses'], queryFn: () => get<Warehouse[]>('/admin/inventory/warehouses') });
  const transfers = useQuery({ queryKey: ['transfers'], queryFn: () => get<Transfer[]>('/admin/inventory/transfers'), enabled: tab === 'transfers' });
  const counts = useQuery({ queryKey: ['counts'], queryFn: () => get<Count[]>('/admin/inventory/cycle-counts'), enabled: tab === 'counts' });
  const bins = useQuery({ queryKey: ['bins'], queryFn: () => get<Bin[]>('/admin/inventory/bins'), enabled: tab === 'bins' });
  const send = useSend();

  function adjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    send.mutate({ path: `/admin/inventory/${String(form.get('skuId'))}/adjustments`, body: { qtyDelta: Number(form.get('qtyDelta')), reason: String(form.get('reason')) }, message: 'Stock adjusted' });
  }

  return (
    <Desk title="Inventory" lede="On-hand stock, bin locations, warehouse transfers, and cycle counts.">
      <Tabs value={tab} onChange={setTab} options={[{ id: 'stock', label: 'Stock' }, { id: 'bins', label: 'Bins' }, { id: 'transfers', label: 'Transfers' }, { id: 'counts', label: 'Cycle counts' }]} />
      {tab === 'stock' ? (
        <Panel>
          <form className="mb-4 grid gap-3 md:grid-cols-4" onSubmit={adjust}>
            <Field label="SKU"><SelectInput name="skuId" required>{(stock.data ?? []).map((row) => <option key={row.skuId} value={row.skuId}>{row.sku} · {row.product}</option>)}</SelectInput></Field>
            <Field label="Quantity change"><TextInput name="qtyDelta" type="number" required /></Field>
            <Field label="Reason"><TextInput name="reason" required minLength={3} /></Field>
            <div className="self-end"><Button type="submit" disabled={send.isPending}>Adjust</Button></div>
          </form>
          <QueryState loading={stock.isLoading} error={stock.error} empty={!stock.data?.length}>
            <DataTable
              columns={['SKU', 'Part', 'Warehouse', 'On hand', 'Reserved', 'Available', 'Reorder', 'Cost']}
              rows={(stock.data ?? []).map((row) => [row.sku, row.product, row.warehouse, row.onHandQty, row.reservedQty, row.availableQty, row.reorderPoint, naira(row.avgCost)])}
            />
          </QueryState>
        </Panel>
      ) : null}
      {tab === 'bins' ? (
        <Panel>
          <form className="mb-4 grid gap-3 md:grid-cols-4" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            send.mutate({ path: '/admin/inventory/bins', body: { warehouseId: String(form.get('warehouseId')), code: String(form.get('code')), zone: String(form.get('zone') || '') || undefined }, message: 'Bin created' });
          }}>
            <Field label="Warehouse"><SelectInput name="warehouseId">{(warehouses.data ?? []).map((row) => <option key={row.id} value={row.id}>{row.code}</option>)}</SelectInput></Field>
            <Field label="Code"><TextInput name="code" required /></Field>
            <Field label="Zone"><TextInput name="zone" /></Field>
            <div className="self-end"><Button type="submit" disabled={send.isPending}>Add bin</Button></div>
          </form>
          <QueryState loading={bins.isLoading} error={bins.error} empty={!bins.data?.length}>
            <DataTable columns={['Code', 'Zone', 'Lines']} rows={(bins.data ?? []).map((row) => [row.code, row.zone ?? '—', row.stock.length])} />
          </QueryState>
        </Panel>
      ) : null}
      {tab === 'transfers' ? (
        <Panel>
          <form className="mb-4 grid gap-3 md:grid-cols-4" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            send.mutate({ path: '/admin/inventory/transfers', body: { fromWarehouseId: String(form.get('from')), toWarehouseId: String(form.get('to')), lines: [{ skuId: String(form.get('skuId')), qty: Number(form.get('qty')) }] }, message: 'Transfer opened' });
          }}>
            <Field label="From"><SelectInput name="from">{(warehouses.data ?? []).map((row) => <option key={row.id} value={row.id}>{row.code}</option>)}</SelectInput></Field>
            <Field label="To"><SelectInput name="to">{(warehouses.data ?? []).map((row) => <option key={row.id} value={row.id}>{row.code}</option>)}</SelectInput></Field>
            <Field label="SKU"><SelectInput name="skuId">{(stock.data ?? []).map((row) => <option key={row.skuId} value={row.skuId}>{row.sku}</option>)}</SelectInput></Field>
            <Field label="Qty"><TextInput name="qty" type="number" min="1" required /></Field>
            <Button type="submit" disabled={send.isPending}>Open transfer</Button>
          </form>
          <QueryState loading={transfers.isLoading} error={transfers.error} empty={!transfers.data?.length}>
            <DataTable
              columns={['Transfer', 'From', 'To', 'Lines', 'Status', '']}
              rows={(transfers.data ?? []).map((row) => [
                row.transferNo,
                row.from,
                row.to,
                row.lines,
                <Pill key={row.id} status={row.status} />,
                <div key={`${row.id}-a`} className="flex gap-2">
                  <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/inventory/transfers/${row.id}/ship`, message: 'Transfer shipped' })}>Ship</Button>
                  <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/inventory/transfers/${row.id}/receive`, message: 'Transfer received' })}>Receive</Button>
                </div>,
              ])}
            />
          </QueryState>
        </Panel>
      ) : null}
      {tab === 'counts' ? (
        <Panel>
          <form className="mb-4 grid gap-3 md:grid-cols-4" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            send.mutate({ path: '/admin/inventory/cycle-counts', body: { warehouseId: String(form.get('warehouseId')), lines: [{ skuId: String(form.get('skuId')), countedQty: Number(form.get('countedQty')) }] }, message: 'Count opened' });
          }}>
            <Field label="Warehouse"><SelectInput name="warehouseId">{(warehouses.data ?? []).map((row) => <option key={row.id} value={row.id}>{row.code}</option>)}</SelectInput></Field>
            <Field label="SKU"><SelectInput name="skuId">{(stock.data ?? []).map((row) => <option key={row.skuId} value={row.skuId}>{row.sku}</option>)}</SelectInput></Field>
            <Field label="Counted"><TextInput name="countedQty" type="number" min="0" required /></Field>
            <div className="self-end"><Button type="submit" disabled={send.isPending}>Open count</Button></div>
          </form>
          <QueryState loading={counts.isLoading} error={counts.error} empty={!counts.data?.length}>
            <DataTable
              columns={['Warehouse', 'Lines', 'Opened', 'Status', '']}
              rows={(counts.data ?? []).map((row) => [
                row.warehouse,
                row.lines,
                when(row.createdAt),
                <Pill key={row.id} status={row.status} />,
                <Button key={`${row.id}-p`} type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/inventory/cycle-counts/${row.id}/post`, message: 'Count posted' })}>Post</Button>,
              ])}
            />
          </QueryState>
        </Panel>
      ) : null}
    </Desk>
  );
}
