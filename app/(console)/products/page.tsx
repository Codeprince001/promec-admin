'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get, page } from '@/lib/api';
import { naira } from '@/lib/format';
import { useSend } from '@/lib/hooks';
import type { Category, Manufacturer, Product } from '@/lib/types';
import { Button, DataTable, Desk, Field, Modal, Pager, Panel, Pill, QueryState, SelectInput, TextArea, TextInput } from '@/components/desk';

export default function ProductsPage() {
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [csv, setCsv] = useState('name,manufacturerName,categorySlug,sellingPrice,stockQty,partNumber,partType\n');
  const query = useQuery({
    queryKey: ['products', q, status, pageNo],
    queryFn: () => page<Product>(`/admin/products?page=${pageNo}&pageSize=20${q ? `&q=${encodeURIComponent(q)}` : ''}${status ? `&status=${status}` : ''}`),
  });
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => get<Category[]>('/categories'), enabled: open });
  const manufacturers = useQuery({ queryKey: ['manufacturers'], queryFn: () => get<Manufacturer[]>('/admin/manufacturers'), enabled: open });
  const send = useSend();

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const part = String(form.get('partNumber') || '');
    send.mutate({
      path: '/admin/products',
      message: 'Product created',
      body: {
        name: String(form.get('name')),
        manufacturerId: String(form.get('manufacturerId')),
        categoryId: String(form.get('categoryId')),
        description: String(form.get('description') || ''),
        condition: String(form.get('condition')),
        sellingPrice: Number(form.get('sellingPrice')),
        stockQty: Number(form.get('stockQty') || 0),
        warrantyMonths: Number(form.get('warrantyMonths') || 0),
        status: String(form.get('status')),
        partNumbers: part ? [{ number: part, type: String(form.get('partType')) }] : [],
      },
    }, { onSuccess: () => setOpen(false) });
  }

  return (
    <Desk title="Products" lede="Draft, review, and publish the parts customers can buy." actions={<Button type="button" onClick={() => setOpen(true)}>New product</Button>}>
      <Panel>
        <form className="mb-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); setQ(draft); setPageNo(1); }}>
          <TextInput className="max-w-xs" placeholder="Name or part number" value={draft} onChange={(event) => setDraft(event.target.value)} />
          <SelectInput className="max-w-48" value={status} onChange={(event) => { setStatus(event.target.value); setPageNo(1); }}>
            <option value="">All statuses</option>
            {['draft', 'in_review', 'published', 'archived'].map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectInput>
          <Button type="submit" tone="navy">Find</Button>
        </form>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.rows.length}>
          <DataTable
            columns={['Part', 'SKU', 'Price', 'Stock', 'Status', '']}
            rows={(query.data?.rows ?? []).map((product) => {
              const sku = product.skus[0];
              return [
                <div key={product.id}><p className="font-medium">{product.name}</p><p className="text-xs text-[var(--muted)]">{product.manufacturer.name}</p></div>,
                sku?.sku ?? '—',
                sku ? naira(sku.price.amount) : '—',
                sku?.availability.qty ?? 0,
                <Pill key={`${product.id}-s`} status={product.status} />,
                <Link key={`${product.id}-l`} className="font-medium text-[var(--navy)]" href={`/products/${product.id}`}>Edit</Link>,
              ];
            })}
          />
          {query.data ? <div className="mt-4"><Pager meta={query.data.meta} page={pageNo} onPage={setPageNo} /></div> : null}
        </QueryState>
      </Panel>
      <Panel title="CSV import">
        <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); setImporting(true); send.mutate({ path: '/admin/products/import', body: { csv }, message: 'Import finished' }, { onSettled: () => setImporting(false) }); }}>
          <TextArea value={csv} onChange={(event) => setCsv(event.target.value)} />
          <Button type="submit" disabled={send.isPending || importing}>Import</Button>
        </form>
      </Panel>
      <Modal title="New product" open={open} onClose={() => setOpen(false)}>
        <form className="grid gap-3" onSubmit={create}>
          <Field label="Name"><TextInput name="name" required /></Field>
          <Field label="Manufacturer">
            <SelectInput name="manufacturerId" required>
              {(manufacturers.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </SelectInput>
          </Field>
          <div className="flex gap-2">
            <TextInput name="newManufacturer" placeholder="Or type a new manufacturer" />
            <Button type="button" tone="ghost" disabled={send.isPending} onClick={(event) => {
              const form = event.currentTarget.form;
              const name = String(new FormData(form!).get('newManufacturer') || '').trim();
              if (name.length < 2) return;
              send.mutate({ path: '/admin/manufacturers', body: { name, type: 'aftermarket' }, message: 'Manufacturer added' });
            }}>Add brand</Button>
          </div>
          <Field label="Category">
            <SelectInput name="categoryId" required>
              {(categories.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.path || item.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Description"><TextArea name="description" /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Price (NGN)"><TextInput name="sellingPrice" type="number" min="1" step="0.01" required /></Field>
            <Field label="Opening stock"><TextInput name="stockQty" type="number" min="0" defaultValue={0} /></Field>
            <Field label="Warranty months"><TextInput name="warrantyMonths" type="number" min="0" defaultValue={0} /></Field>
            <Field label="Condition">
              <SelectInput name="condition" defaultValue="new"><option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option></SelectInput>
            </Field>
          </div>
          <Field label="Part number"><TextInput name="partNumber" /></Field>
          <Field label="Part type">
            <SelectInput name="partType" defaultValue="OEM"><option>OEM</option><option>MPN</option><option>AFTERMARKET</option></SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput name="status" defaultValue="draft"><option value="draft">Draft</option><option value="in_review">In review</option><option value="published">Published</option></SelectInput>
          </Field>
          <Button type="submit" disabled={send.isPending}>Create product</Button>
        </form>
      </Modal>
    </Desk>
  );
}
