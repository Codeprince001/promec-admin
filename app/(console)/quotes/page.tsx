'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { naira, when } from '@/lib/format';
import { useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Panel, Pill, QueryState } from '@/components/desk';

type Quote = {
  id: string;
  quoteNo: string;
  status: string;
  total: string;
  validUntil: string | null;
  notes: string | null;
  items: { description: string; qty: number; unitPrice: string }[];
};

export default function QuotesPage() {
  const query = useQuery({ queryKey: ['quotes'], queryFn: () => get<Quote[]>('/admin/b2b/quotes') });
  const send = useSend();
  return (
    <Desk title="Trade quotes" lede="Submitted quotes waiting for a price decision before they can become orders.">
      <Panel>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length}>
          <div className="grid gap-4">
            {(query.data ?? []).map((quote) => (
              <article key={quote.id} className="rounded-2xl border border-[var(--line)] p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="font-medium">{quote.quoteNo}</p>
                  <Pill status={quote.status} />
                  <span className="text-sm">{naira(quote.total)}</span>
                  {quote.validUntil ? <span className="text-xs text-[var(--muted)]">Valid until {when(quote.validUntil)}</span> : null}
                </div>
                <DataTable columns={['Line', 'Qty', 'Price']} rows={quote.items.map((item) => [item.description, item.qty, naira(item.unitPrice)])} />
                {quote.status === 'submitted' ? (
                  <div className="mt-3 flex gap-2">
                    <Button type="button" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/b2b/quotes/${quote.id}/decision`, body: { status: 'approved', validDays: 14 }, message: 'Quote approved' })}>Approve 14 days</Button>
                    <Button type="button" tone="danger" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/b2b/quotes/${quote.id}/decision`, body: { status: 'rejected', validDays: 1 }, message: 'Quote rejected' })}>Reject</Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </QueryState>
      </Panel>
    </Desk>
  );
}
