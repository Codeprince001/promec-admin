'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { naira } from '@/lib/format';
import { DataTable, Desk, Panel, Pill, QueryState } from '@/components/desk';

type Account = {
  id: string;
  legalName: string;
  status: string;
  paymentTermsDays: number;
  creditLimit: string;
  exposure: string;
  available: string;
};

export default function TradePage() {
  const query = useQuery({ queryKey: ['b2b'], queryFn: () => get<Account[]>('/admin/b2b/accounts') });
  return (
    <Desk title="Business accounts" lede="Trade credit, terms, and the exposure still open on each account.">
      <Panel>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length}>
          <DataTable
            columns={['Account', 'Status', 'Terms', 'Limit', 'Exposure', 'Available', '']}
            rows={(query.data ?? []).map((row) => [
              row.legalName,
              <Pill key={row.id} status={row.status} />,
              `${row.paymentTermsDays} days`,
              naira(row.creditLimit),
              naira(row.exposure),
              naira(row.available),
              <Link key={`${row.id}-l`} className="font-medium text-[var(--navy)]" href={`/trade/${row.id}`}>Manage</Link>,
            ])}
          />
        </QueryState>
      </Panel>
    </Desk>
  );
}
