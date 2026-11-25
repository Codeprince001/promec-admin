'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { when } from '@/lib/format';
import { useCan, useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Panel, Pill, QueryState } from '@/components/desk';

type ReturnRow = {
  id: string;
  orderId: string;
  orderNo: string;
  orderStatus: string;
  status: string;
  reasonCode: string;
  restockQty: number | null;
  createdAt: string;
};

export default function ReturnsPage() {
  const refunds = useCan('orders.refund.approve');
  const query = useQuery({ queryKey: ['returns'], queryFn: () => get<ReturnRow[]>('/admin/returns') });
  const send = useSend();

  return (
    <Desk title="Returns" lede="Approve, receive, inspect, and refund the way a marketplace returns desk does.">
      <Panel>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length}>
          <DataTable
            columns={['Order', 'Reason', 'Status', 'Opened', 'Actions']}
            rows={(query.data ?? []).map((row) => [
              <Link key={row.id} href={`/orders/${row.orderId}`}>{row.orderNo}</Link>,
              row.reasonCode,
              <Pill key={`${row.id}-s`} status={row.status} />,
              when(row.createdAt),
              <div key={`${row.id}-a`} className="flex flex-wrap gap-2">
                <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/returns/${row.id}/decision`, body: { decision: 'approved' }, message: 'Return approved' })}>Approve</Button>
                <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/returns/${row.id}/decision`, body: { decision: 'rejected', note: 'Rejected from the desk' }, message: 'Return rejected' })}>Reject</Button>
                <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/returns/${row.id}/receive`, message: 'Marked received' })}>Receive</Button>
                <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => {
                  const qty = window.prompt('Quantity to restock', '1');
                  if (qty == null) return;
                  send.mutate({ path: `/admin/returns/${row.id}/inspect`, body: { restockQty: Number(qty) }, message: 'Inspection saved' });
                }}>Inspect</Button>
                {refunds ? <Button type="button" tone="danger" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/returns/${row.id}/refund`, message: 'Refund issued' })}>Refund</Button> : null}
              </div>,
            ])}
          />
        </QueryState>
      </Panel>
    </Desk>
  );
}
