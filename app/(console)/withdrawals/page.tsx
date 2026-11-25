'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { naira, when } from '@/lib/format';
import { useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Panel, Pill, QueryState, SelectInput } from '@/components/desk';

type Withdrawal = {
  id: string;
  amount: string;
  status: string;
  note: string | null;
  reference: string | null;
  requestedAt: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  vendor?: { businessName: string };
};

export default function WithdrawalsPage() {
  const [status, setStatus] = useState('');
  const query = useQuery({
    queryKey: ['withdrawals', status],
    queryFn: () => get<Withdrawal[]>(`/admin/vendor-withdrawals${status ? `?status=${status}` : ''}`),
  });
  const send = useSend();

  function act(id: string, action: 'approve' | 'reject' | 'pay') {
    const reference = action === 'pay' ? window.prompt('Payment reference') : undefined;
    if (action === 'pay' && !reference) return;
    send.mutate({ path: `/admin/vendor-withdrawals/${id}`, body: { action, reference }, message: `Withdrawal ${action}d` });
  }

  return (
    <Desk title="Vendor payouts" lede="Requests sellers raise from their store balance." actions={
      <SelectInput className="max-w-40" value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="">All</option>
        {['requested', 'approved', 'paid', 'rejected'].map((item) => <option key={item} value={item}>{item}</option>)}
      </SelectInput>
    }>
      <Panel>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length}>
          <DataTable
            columns={['Seller', 'Amount', 'Account', 'Status', 'Requested', '']}
            rows={(query.data ?? []).map((row) => [
              row.vendor?.businessName ?? 'Vendor',
              naira(row.amount),
              `${row.bankName} · ${row.accountNumber}`,
              <Pill key={row.id} status={row.status} />,
              when(row.requestedAt),
              <div key={`${row.id}-a`} className="flex gap-2">
                <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => act(row.id, 'approve')}>Approve</Button>
                <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => act(row.id, 'pay')}>Mark paid</Button>
                <Button type="button" tone="danger" disabled={send.isPending} onClick={() => act(row.id, 'reject')}>Reject</Button>
              </div>,
            ])}
          />
        </QueryState>
      </Panel>
    </Desk>
  );
}
