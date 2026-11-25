'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { naira } from '@/lib/format';
import { useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Field, Modal, Panel, QueryState, SelectInput, TextInput } from '@/components/desk';

type Vendor = {
  id: string;
  businessName: string;
  slug: string;
  status: string;
  fulfilmentMode: string;
  commissionRate: string;
  city: string | null;
  state: string | null;
  ratingAvg: string;
  ratingCount: number;
};

type Ledger = { balance: string; entries: { id: string; amount: string; kind: string; reference: string | null; createdAt: string }[] };

export default function VendorsPage() {
  const [selected, setSelected] = useState<Vendor | null>(null);
  const vendors = useQuery({ queryKey: ['vendors'], queryFn: () => get<Vendor[]>('/admin/vendors') });
  const ledger = useQuery({ queryKey: ['ledger', selected?.id], enabled: Boolean(selected), queryFn: () => get<Ledger>(`/admin/vendors/${selected?.id}/ledger`) });
  const send = useSend();

  function review(event: FormEvent<HTMLFormElement>, vendor: Vendor) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    send.mutate({
      path: `/admin/vendors/${vendor.id}`,
      method: 'PATCH',
      message: 'Vendor updated',
      body: {
        status: String(form.get('status')),
        commissionRate: Number(form.get('commissionRate')),
        fulfilmentMode: String(form.get('fulfilmentMode')),
      },
    });
  }

  return (
    <Desk title="Vendors" lede="Approve marketplace stores, set commission, and pay out a ledger balance.">
      <Panel>
        <QueryState loading={vendors.isLoading} error={vendors.error} empty={!vendors.data?.length}>
          <div className="grid gap-4">
            {(vendors.data ?? []).map((vendor) => (
              <form key={vendor.id} className="grid gap-3 rounded-2xl border border-[var(--line)] p-3 md:grid-cols-[1.2fr_repeat(3,0.7fr)_auto]" onSubmit={(event) => review(event, vendor)}>
                <div>
                  <p className="font-medium">{vendor.businessName}</p>
                  <p className="text-xs text-[var(--muted)]">{vendor.city} {vendor.state} · {vendor.ratingAvg} ({vendor.ratingCount})</p>
                </div>
                <SelectInput name="status" defaultValue={vendor.status}>
                  {['pending', 'approved', 'suspended', 'rejected'].map((item) => <option key={item} value={item}>{item}</option>)}
                </SelectInput>
                <SelectInput name="fulfilmentMode" defaultValue={vendor.fulfilmentMode}>
                  <option value="promec">PROMEC fulfils</option>
                  <option value="vendor">Vendor fulfils</option>
                </SelectInput>
                <TextInput name="commissionRate" type="number" min="0" max="0.5" step="0.01" defaultValue={Number(vendor.commissionRate)} />
                <div className="flex gap-2">
                  <Button type="submit" disabled={send.isPending}>Save</Button>
                  <Button type="button" tone="ghost" onClick={() => setSelected(vendor)}>Ledger</Button>
                </div>
              </form>
            ))}
          </div>
        </QueryState>
      </Panel>
      <Modal title={selected ? `${selected.businessName} ledger` : 'Ledger'} open={Boolean(selected)} onClose={() => setSelected(null)}>
        <QueryState loading={ledger.isLoading} error={ledger.error}>
          <p className="mb-3 text-lg font-semibold">Balance {naira(ledger.data?.balance)}</p>
          <form className="mb-4 grid gap-3" onSubmit={(event) => {
            event.preventDefault();
            if (!selected) return;
            const form = new FormData(event.currentTarget);
            send.mutate({ path: `/admin/vendors/${selected.id}/payouts`, body: { amount: Number(form.get('amount')), reference: String(form.get('reference')) }, message: 'Payout recorded' });
          }}>
            <Field label="Amount"><TextInput name="amount" type="number" min="1" step="0.01" required /></Field>
            <Field label="Bank reference"><TextInput name="reference" required /></Field>
            <Button type="submit" disabled={send.isPending}>Pay vendor</Button>
          </form>
          <DataTable columns={['Kind', 'Amount', 'Reference']} rows={(ledger.data?.entries ?? []).map((entry) => [entry.kind, naira(entry.amount), entry.reference ?? '—'])} />
        </QueryState>
      </Modal>
    </Desk>
  );
}
