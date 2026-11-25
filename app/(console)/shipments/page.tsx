'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { titleCase, when } from '@/lib/format';
import { useSend } from '@/lib/hooks';
import { Button, DataTable, Desk, Field, Panel, Pill, QueryState, SelectInput, TextInput } from '@/components/desk';

type Shipment = { id: string; orderId: string; orderNo: string; status: string; courier: string | null; trackingNo: string | null; labelUrl: string | null };
type Track = { trackingNo: string; courier: string | null; status: string; events: { status: string; note: string | null; occurredAt: string }[] };

export default function ShipmentsPage() {
  const [tracking, setTracking] = useState('');
  const [lookup, setLookup] = useState('');
  const query = useQuery({ queryKey: ['shipments'], queryFn: () => get<Shipment[]>('/admin/shipments') });
  const track = useQuery({ queryKey: ['track', lookup], enabled: lookup.length > 3, queryFn: () => get<Track>(`/shipping/track/${encodeURIComponent(lookup)}`) });
  const send = useSend();

  function record(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    send.mutate({
      path: '/admin/shipments/events',
      message: 'Tracking event recorded',
      body: { courier: String(form.get('courier')), trackingNo: String(form.get('trackingNo')), status: String(form.get('status')), note: String(form.get('note') || '') || undefined },
    });
  }

  return (
    <Desk title="Shipments" lede="Book GIG or DHL waybills, record scans, and look up a parcel the way a buyer would.">
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Panel title="Open shipments">
          <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length}>
            <DataTable
              columns={['Order', 'Courier', 'Tracking', 'Status', '']}
              rows={(query.data ?? []).map((row) => [
                row.orderNo,
                row.courier ?? '—',
                row.trackingNo ?? '—',
                <Pill key={row.id} status={row.status} />,
                <div key={`${row.id}-a`} className="flex gap-2">
                  <Button type="button" tone="ghost" disabled={send.isPending} onClick={() => send.mutate({ path: `/admin/shipments/${row.id}/book`, message: 'Booking requested' })}>Book</Button>
                  {row.labelUrl ? <a className="self-center text-sm text-[var(--navy)]" href={row.labelUrl}>Label</a> : null}
                </div>,
              ])}
            />
          </QueryState>
        </Panel>
        <div className="grid gap-4 content-start">
          <Panel title="Record a scan">
            <form className="grid gap-3" onSubmit={record}>
              <Field label="Courier"><SelectInput name="courier" defaultValue="gig"><option value="gig">GIG</option><option value="dhl">DHL</option></SelectInput></Field>
              <Field label="Tracking number"><TextInput name="trackingNo" required minLength={4} /></Field>
              <Field label="Status">
                <SelectInput name="status" defaultValue="in_transit">
                  <option value="in_transit">In transit</option>
                  <option value="out_for_delivery">Out for delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="exception">Exception</option>
                </SelectInput>
              </Field>
              <Field label="Note"><TextInput name="note" /></Field>
              <Button type="submit" disabled={send.isPending}>Save event</Button>
            </form>
          </Panel>
          <Panel title="Track a parcel">
            <form className="mb-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); setLookup(tracking.trim()); }}>
              <TextInput value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder="Waybill" />
              <Button type="submit" tone="navy">Track</Button>
            </form>
            <QueryState loading={track.isFetching && Boolean(lookup)} error={lookup ? track.error : null}>
              {track.data ? (
                <ol className="grid gap-2 text-sm">
                  <li className="font-medium">{track.data.courier} · {titleCase(track.data.status)}</li>
                  {track.data.events.map((event, index) => <li key={`${event.status}-${index}`}>{titleCase(event.status)} · {when(event.occurredAt)}{event.note ? ` · ${event.note}` : ''}</li>)}
                </ol>
              ) : null}
            </QueryState>
          </Panel>
        </div>
      </div>
    </Desk>
  );
}
