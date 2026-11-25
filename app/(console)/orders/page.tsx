'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { page } from '@/lib/api';
import { naira, when } from '@/lib/format';
import type { Order } from '@/lib/types';
import { Button, DataTable, Desk, Pager, Panel, Pill, QueryState, SelectInput, TextInput } from '@/components/desk';

const STATUSES = ['', 'pending_payment', 'payment_failed', 'paid', 'awaiting_stock', 'processing', 'packed', 'dispatched', 'delivered', 'completed', 'cancelled', 'return_requested', 'returned'];

export default function OrdersPage() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const query = useQuery({
    queryKey: ['orders', status, pageNo],
    queryFn: () => page<Order>(`/admin/orders?page=${pageNo}&pageSize=20${status ? `&status=${status}` : ''}`),
  });
  const rows = (query.data?.rows ?? []).filter((order) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return order.orderNo.toLowerCase().includes(needle) || order.items.some((item) => item.name.toLowerCase().includes(needle) || item.sku.toLowerCase().includes(needle));
  });

  return (
    <Desk title="Orders" lede="Every storefront order, from payment through delivery and returns.">
      <Panel>
        <form className="mb-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); setQ(draft); }}>
          <TextInput className="max-w-xs" placeholder="Order number, SKU, or part" value={draft} onChange={(event) => setDraft(event.target.value)} />
          <SelectInput className="max-w-xs" value={status} onChange={(event) => { setStatus(event.target.value); setPageNo(1); }}>
            {STATUSES.map((item) => <option key={item || 'all'} value={item}>{item ? item.replaceAll('_', ' ') : 'All statuses'}</option>)}
          </SelectInput>
          <Button type="submit" tone="navy">Find</Button>
        </form>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.isLoading && rows.length === 0}>
          <DataTable
            columns={['Order', 'Status', 'Payment', 'Total', 'Placed', '']}
            rows={rows.map((order) => [
              <span key={order.id} className="font-medium">{order.orderNo}</span>,
              <Pill key={`${order.id}-s`} status={order.status} />,
              <Pill key={`${order.id}-p`} status={order.paymentStatus} />,
              naira(order.grandTotal),
              when(order.placedAt),
              <Link key={`${order.id}-o`} className="font-medium text-[var(--navy)]" href={`/orders/${order.id}`}>Open</Link>,
            ])}
          />
          {query.data ? <div className="mt-4"><Pager meta={query.data.meta} page={pageNo} onPage={setPageNo} /></div> : null}
        </QueryState>
      </Panel>
    </Desk>
  );
}
