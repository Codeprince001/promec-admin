'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { page } from '@/lib/api';
import { when } from '@/lib/format';
import { useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Pager, Panel, Pill, QueryState, TextInput } from '@/components/desk';

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  customerType: string;
  email: string | null;
  phone: string | null;
  status: string;
  orders: number;
  createdAt: string;
};

export default function CustomersPage() {
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const send = useSend();
  const query = useQuery({
    queryKey: ['customers', q, pageNo],
    queryFn: () => page<Customer>(`/admin/customers?page=${pageNo}&pageSize=20${q ? `&q=${encodeURIComponent(q)}` : ''}`),
  });

  return (
    <Desk title="Customers" lede="People who buy from the store, with the orders already on their account.">
      <Panel>
        <form className="mb-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); setQ(draft); setPageNo(1); }}>
          <TextInput className="max-w-sm" placeholder="Name or email" value={draft} onChange={(event) => setDraft(event.target.value)} />
          <Button type="submit" tone="navy">Find</Button>
        </form>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.rows.length}>
          <DataTable
            columns={['Customer', 'Contact', 'Type', 'Orders', 'Status', 'Joined', '']}
            rows={(query.data?.rows ?? []).map((row) => [
              `${row.firstName} ${row.lastName}`,
              row.email || row.phone || '—',
              row.customerType,
              row.orders,
              <Pill key={row.id} status={row.status} />,
              when(row.createdAt),
              <Button key={`${row.id}-s`} type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/customers/${row.id}`, method: 'PATCH', body: { status: row.status === 'active' ? 'disabled' : 'active' }, message: row.status === 'active' ? 'Customer disabled' : 'Customer enabled' })}>{row.status === 'active' ? 'Disable' : 'Enable'}</Button>,
            ])}
          />
          {query.data ? <div className="mt-4"><Pager meta={query.data.meta} page={pageNo} onPage={setPageNo} /></div> : null}
        </QueryState>
      </Panel>
    </Desk>
  );
}
