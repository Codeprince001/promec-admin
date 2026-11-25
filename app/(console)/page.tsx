'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PaymentChart, RevenueChart, StatusChart } from '@/components/overview-charts';
import { DataTable, Desk, Panel, Pill, QueryState, SelectInput, Stat } from '@/components/desk';
import { get } from '@/lib/api';
import { naira, when } from '@/lib/format';
import { useCan, useMe } from '@/lib/hooks';
import type { Overview } from '@/lib/types';

export default function OverviewPage() {
  const me = useMe();
  const analytics = useCan('analytics.view');
  const [days, setDays] = useState(30);
  const overview = useQuery({
    queryKey: ['overview', days],
    enabled: analytics,
    queryFn: () => get<Overview>(`/admin/analytics/overview?days=${days}`),
  });
  const data = overview.data;
  const paidRate = data && data.orders > 0 ? `${Math.round((data.paidOrders / data.orders) * 100)}%` : '0%';

  return (
    <Desk
      title="Overview"
      lede="Paid revenue, order mix, and the work still sitting with warehouse, finance, and support."
      actions={
        <SelectInput className="max-w-36" value={days} onChange={(event) => setDays(Number(event.target.value))}>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </SelectInput>
      }
    >
      {me.isPending ? <p className="text-sm text-[var(--muted)]">Loading the desk…</p> : null}
      {me.isSuccess && !analytics ? <p className="text-sm text-[var(--muted)]">Your role opens the desks in the sidebar. The trading numbers stay with finance and leadership.</p> : null}
      {analytics ? (
        <QueryState loading={overview.isLoading} error={overview.error}>
          {data ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Paid GMV" value={naira(data.gmv)} href="/analytics" />
                <Stat label="Average paid order" value={naira(data.averageOrder)} href="/orders" />
                <Stat label="Orders" value={String(data.orders)} href="/orders" />
                <Stat label="Paid rate" value={paidRate} href="/payments" />
                <Stat label="Open shipments" value={String(data.openShipments)} href="/shipments" />
                <Stat label="Open returns" value={String(data.openReturns)} href="/returns" />
                <Stat label="Open tickets" value={String(data.openTickets)} href="/support" />
                <Stat label="Low stock SKUs" value={String(data.lowStockSkus)} href="/inventory" />
              </div>
              <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
                <Panel title={`Revenue and orders, last ${days} days`}>
                  <RevenueChart points={data.revenue} />
                </Panel>
                <Panel title="Orders by status">
                  <StatusChart rows={data.byStatus} />
                </Panel>
              </div>
              <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                <Panel title="Payment status">
                  <PaymentChart rows={data.byPayment} />
                </Panel>
                <Panel title="Latest orders" action={<Link className="text-sm text-[var(--navy)]" href="/orders">All orders</Link>}>
                  {data.recent.length ? (
                    <DataTable
                      columns={['Order', 'Status', 'Payment', 'Total', 'Placed']}
                      rows={data.recent.map((order) => [
                        <Link key={order.id} className="font-medium" href={`/orders/${order.id}`}>{order.orderNo}</Link>,
                        <Pill key={`${order.id}-s`} status={order.status} />,
                        <Pill key={`${order.id}-p`} status={order.paymentStatus} />,
                        naira(order.grandTotal),
                        when(order.placedAt),
                      ])}
                    />
                  ) : (
                    <p className="text-sm text-[var(--muted)]">No orders have been placed yet.</p>
                  )}
                </Panel>
              </div>
            </>
          ) : null}
        </QueryState>
      ) : null}
    </Desk>
  );
}
