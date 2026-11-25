'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { naira } from '@/lib/format';
import type { Overview, Series } from '@/lib/types';
import { Bars, Desk, Panel, QueryState, SelectInput, Stat } from '@/components/desk';

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const overview = useQuery({ queryKey: ['overview'], queryFn: () => get<Overview>('/admin/analytics/overview') });
  const sales = useQuery({ queryKey: ['sales', days], queryFn: () => get<Series>(`/admin/analytics/sales?days=${days}`) });
  const fitment = useQuery({ queryKey: ['fitment', days], queryFn: () => get<Series>(`/admin/analytics/fitment?days=${days}`) });
  const purchasing = useQuery({ queryKey: ['purchasing', days], queryFn: () => get<Series>(`/admin/analytics/purchasing?days=${days}`) });

  return (
    <Desk title="Analytics" lede="What sold, what was fitted, and what procurement spent." actions={
      <SelectInput className="max-w-36" value={days} onChange={(event) => setDays(Number(event.target.value))}>
        <option value={7}>7 days</option>
        <option value={30}>30 days</option>
        <option value={90}>90 days</option>
      </SelectInput>
    }>
      <QueryState loading={overview.isLoading} error={overview.error}>
        {overview.data ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="GMV" value={naira(overview.data.gmv)} />
            <Stat label="Orders" value={String(overview.data.orders)} />
            <Stat label="Paid" value={String(overview.data.paidOrders)} />
            <Stat label="Tracked SKUs" value={String(overview.data.trackedSkus)} />
          </div>
        ) : null}
      </QueryState>
      <div className="grid gap-4 xl:grid-cols-3">
        {[{ title: 'Sales', query: sales }, { title: 'Fitment checks', query: fitment }, { title: 'Purchasing', query: purchasing }].map((block) => (
          <Panel key={block.title} title={block.title}>
            <QueryState loading={block.query.isLoading} error={block.query.error}>
              <Bars points={block.query.data?.series ?? []} />
              <p className="mt-3 text-sm text-[var(--muted)]">{naira(block.query.data?.amount)} · {block.query.data?.total ?? 0} events</p>
            </QueryState>
          </Panel>
        ))}
      </div>
    </Desk>
  );
}
