'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { naira } from '@/lib/format';
import { useCan, useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Field, Panel, Pill, QueryState, SelectInput, TextInput } from '@/components/desk';

type Proof = {
  id: string;
  amount: string;
  bankReference: string;
  evidenceUrl: string;
  status: string;
  payment: { id: string; providerRef: string | null; order: { id: string; orderNo: string } };
};

export default function PaymentsPage() {
  const [status, setStatus] = useState('pending');
  const refunds = useCan('orders.refund.approve');
  const proofs = useQuery({ queryKey: ['proofs', status], queryFn: () => get<Proof[]>(`/admin/payments/proofs?status=${status}`) });
  const send = useSend();

  function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    send.mutate({ path: `/admin/payments/${String(form.get('reference'))}/confirm`, message: 'Payment confirmed' });
  }

  return (
    <Desk title="Payments" lede="Match bank-transfer proofs, confirm a Paystack or transfer reference, and issue refunds.">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Panel title="Transfer proofs" action={
          <SelectInput className="max-w-40" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="pending">Pending</option>
            <option value="matched">Matched</option>
            <option value="rejected">Rejected</option>
          </SelectInput>
        }>
          <QueryState loading={proofs.isLoading} error={proofs.error} empty={!proofs.data?.length}>
            <DataTable
              columns={['Order', 'Reference', 'Amount', 'Status', '']}
              rows={(proofs.data ?? []).map((row) => [
                row.payment?.order?.orderNo ?? '—',
                row.bankReference,
                naira(row.amount),
                <Pill key={row.id} status={row.status} />,
                <div key={`${row.id}-a`} className="flex flex-wrap gap-2">
                  <a className="self-center text-sm text-[var(--navy)]" href={row.evidenceUrl}>Evidence</a>
                  {row.status === 'pending' ? (
                    <>
                      <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/payments/proofs/${row.id}/match`, message: 'Proof matched' })}>Match</Button>
                      <Button type="button" tone="danger" disabled={send.isPending} onClick={() => {
                        const note = window.prompt('Why is this proof rejected?');
                        if (!note) return;
                        send.mutate({ path: `/admin/payments/proofs/${row.id}/reject`, body: { note }, message: 'Proof rejected' });
                      }}>Reject</Button>
                    </>
                  ) : null}
                </div>,
              ])}
            />
          </QueryState>
        </Panel>
        <div className="grid content-start gap-4">
          <Panel title="Confirm a reference">
            <form className="grid gap-3" onSubmit={confirm}>
              <Field label="Payment reference"><TextInput name="reference" required /></Field>
              <Button type="submit" disabled={send.isPending}>Mark paid</Button>
            </form>
          </Panel>
          {refunds ? (
            <Panel title="Refund a payment">
              <form className="grid gap-3" onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                send.mutate({ path: `/admin/payments/${String(form.get('id'))}/refunds`, body: { amount: Number(form.get('amount')), reason: String(form.get('reason')) }, message: 'Refund recorded' });
              }}>
                <Field label="Payment id"><TextInput name="id" required /></Field>
                <Field label="Amount"><TextInput name="amount" type="number" min="1" step="0.01" required /></Field>
                <Field label="Reason"><TextInput name="reason" required minLength={3} /></Field>
                <Button type="submit" tone="danger" disabled={send.isPending}>Refund</Button>
              </form>
            </Panel>
          ) : null}
        </div>
      </div>
    </Desk>
  );
}
