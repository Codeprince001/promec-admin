'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { NEXT_STATUS, naira, titleCase, when } from '@/lib/format';
import { useCan, useSend } from '@/lib/hooks';
import type { Order } from '@/lib/types';
import { Button, DataTable, Desk, Panel, Pill, QueryState } from '@/components/desk';

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const refunds = useCan('orders.refund.approve');
  const order = useQuery({
    queryKey: ['order', params.id],
    queryFn: () => get<Order>(`/admin/orders/${params.id}`),
  });
  const send = useSend();
  const row = order.data;
  const next = row ? NEXT_STATUS[row.status] ?? [] : [];

  return (
    <Desk title={row?.orderNo ?? 'Order'} lede="Move the order only along the states the warehouse and finance desks allow." actions={<Link className="text-sm text-[var(--navy)]" href="/orders">Back to orders</Link>}>
      <QueryState loading={order.isLoading} error={order.error}>
        {row ? (
          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
            <div className="grid gap-4">
              <Panel title="Lines">
                <DataTable
                  columns={['Part', 'SKU', 'Qty', 'Price', 'Fitment']}
                  rows={row.items.map((item) => [item.name, item.sku, item.qty, naira(item.unitPrice), item.fitmentStatus ?? '—'])}
                />
                <dl className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
                  <div>Subtotal {naira(row.subtotal)}</div>
                  <div>Discount {naira(row.discountTotal)}</div>
                  <div>Shipping {naira(row.shippingTotal)}</div>
                  <div className="font-semibold">Total {naira(row.grandTotal)}</div>
                </dl>
              </Panel>
              <Panel title="Payments">
                <DataTable
                  columns={['Provider', 'Reference', 'Amount', 'Status', '']}
                  rows={row.payments.map((payment) => [
                    payment.provider,
                    payment.reference ?? '—',
                    naira(payment.amount),
                    <Pill key={payment.id} status={payment.status} />,
                    refunds && payment.status === 'paid' ? (
                      <Button key={`${payment.id}-r`} type="button" tone="danger" disabled={send.isPending} onClick={() => {
                        const amount = window.prompt('Refund amount in naira', payment.amount);
                        const reason = amount ? window.prompt('Reason') : null;
                        if (!amount || !reason) return;
                        send.mutate({ path: `/admin/payments/${payment.id}/refunds`, body: { amount: Number(amount), reason }, message: 'Refund recorded' });
                      }}>Refund</Button>
                    ) : '—',
                  ])}
                />
              </Panel>
              <Panel title="Shipments">
                {row.shipments.length === 0 ? <p className="text-sm text-[var(--muted)]">No waybill yet. Book it from Shipments after the order is packed.</p> : null}
                {row.shipments.map((shipment) => (
                  <div key={shipment.id} className="mb-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Pill status={shipment.status} />
                      <span className="font-mono text-sm">{shipment.trackingNo ?? 'No tracking number'}</span>
                      {shipment.labelUrl ? <a className="text-sm text-[var(--navy)]" href={shipment.labelUrl}>Label</a> : null}
                    </div>
                    <ol className="grid gap-2 border-l border-[var(--line)] pl-4 text-sm">
                      {shipment.events.map((event) => (
                        <li key={event.id}>
                          <span className="font-medium">{titleCase(event.status)}</span>
                          <span className="text-[var(--muted)]"> · {when(event.occurredAt)}</span>
                          {event.note ? <p className="text-[var(--muted)]">{event.note}</p> : null}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </Panel>
            </div>
            <div className="grid gap-4 content-start">
              <Panel title="State">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Pill status={row.status} />
                  <Pill status={row.paymentStatus} />
                  <Pill status={row.fulfilmentStatus} />
                </div>
                <p className="mb-3 text-sm text-[var(--muted)]">Placed {when(row.placedAt)} · {row.deliveryMethod} {row.courierCode ? `via ${row.courierCode}` : ''}</p>
                <div className="flex flex-wrap gap-2">
                  {next.map((status) => (
                    <Button key={status} type="button" tone={status === 'cancelled' ? 'danger' : 'primary'} disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/orders/${row.id}/transitions`, body: { status }, message: `Moved to ${titleCase(status)}` })}>
                      {titleCase(status)}
                    </Button>
                  ))}
                </div>
              </Panel>
              <Panel title="Delivery address">
                <address className="text-sm not-italic leading-6">
                  {row.shippingAddress ? Object.entries(row.shippingAddress).filter(([, value]) => value).map(([key, value]) => <div key={key}>{value}</div>) : 'No address stored'}
                </address>
                {row.couponCode ? <p className="mt-3 text-sm">Coupon {row.couponCode}</p> : null}
              </Panel>
            </div>
          </div>
        ) : null}
      </QueryState>
    </Desk>
  );
}
