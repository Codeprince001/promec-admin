'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { useSend } from '@/lib/hooks';
import type { Product } from '@/lib/types';
import { Button, Desk, Field, Panel, Pill, QueryState, SelectInput, TextArea, TextInput } from '@/components/desk';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const product = useQuery({ queryKey: ['product', params.id], queryFn: () => get<Product>(`/admin/products/${params.id}`) });
  const send = useSend();
  const row = product.data;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!row) return;
    const form = new FormData(event.currentTarget);
    send.mutate({
      path: `/admin/products/${row.id}`,
      method: 'PATCH',
      message: 'Product saved',
      body: {
        name: String(form.get('name')),
        description: String(form.get('description') || ''),
        status: String(form.get('status')),
        warrantyMonths: Number(form.get('warrantyMonths') || 0),
        sellingPrice: Number(form.get('sellingPrice')),
      },
    });
  }

  return (
    <Desk title={row?.name ?? 'Product'} lede={row ? `${row.manufacturer.name} · ${row.category.name}` : undefined} actions={<Link className="text-sm text-[var(--navy)]" href="/products">All products</Link>}>
      <QueryState loading={product.isLoading} error={product.error}>
        {row ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Listing">
              <form className="grid gap-3" onSubmit={save}>
                <div className="flex gap-2"><Pill status={row.status} /><Pill status={row.condition} /></div>
                <Field label="Name"><TextInput name="name" defaultValue={row.name} required /></Field>
                <Field label="Description"><TextArea name="description" defaultValue={row.description ?? ''} /></Field>
                <Field label="Selling price"><TextInput name="sellingPrice" type="number" min="1" step="0.01" defaultValue={row.skus[0]?.price.amount} required /></Field>
                <Field label="Warranty months"><TextInput name="warrantyMonths" type="number" min="0" defaultValue={row.warrantyMonths} /></Field>
                <Field label="Status">
                  <SelectInput name="status" defaultValue={row.status}>
                    {['draft', 'in_review', 'published', 'archived'].map((item) => <option key={item} value={item}>{item}</option>)}
                  </SelectInput>
                </Field>
                <Button type="submit" disabled={send.isPending}>Save</Button>
              </form>
            </Panel>
            <div className="grid gap-4 content-start">
              <Panel title="Photo">
                <form className="grid gap-3" onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  send.mutate({ path: `/admin/products/${row.id}/media`, body: { url: String(form.get('url')), alt: String(form.get('alt') || row.name) }, message: 'Photo attached' });
                }}>
                  {row.media[0] ? <img src={row.media[0].url} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" /> : null}
                  <Field label="HTTPS photo URL"><TextInput name="url" type="url" required placeholder="https://" /></Field>
                  <Field label="Alt text"><TextInput name="alt" /></Field>
                  <Button type="submit" tone="navy" disabled={send.isPending}>Attach photo</Button>
                </form>
              </Panel>
              <Panel title="Cross references">
                <ul className="mb-3 text-sm">{row.partNumbers.map((part) => <li key={part.number}>{part.type} {part.number}</li>)}</ul>
                <form className="grid gap-3" onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  send.mutate({ path: `/admin/products/${row.id}/cross-references`, body: { fromNumber: String(form.get('fromNumber')), toNumber: String(form.get('toNumber')), relation: String(form.get('relation')) }, message: 'Cross reference saved' });
                }}>
                  <Field label="From number on this part"><TextInput name="fromNumber" required /></Field>
                  <Field label="To number"><TextInput name="toNumber" required /></Field>
                  <Field label="Relation">
                    <SelectInput name="relation" defaultValue="equivalent"><option value="equivalent">Equivalent</option><option value="superseded">Superseded</option><option value="related">Related</option></SelectInput>
                  </Field>
                  <Button type="submit" tone="ghost" disabled={send.isPending}>Add reference</Button>
                </form>
              </Panel>
            </div>
          </div>
        ) : null}
      </QueryState>
    </Desk>
  );
}
