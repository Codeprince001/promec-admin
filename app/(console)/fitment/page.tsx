'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get, page } from '@/lib/api';
import { useSend } from '@/lib/hooks';
import type { Product } from '@/lib/types';
import { Button, Desk, Field, Panel, SelectInput, TextInput } from '@/components/desk';

type Make = { id: string; name: string };
type Model = { id: string; name: string };
type Variant = { id: string; trim: string | null; yearFrom: number; yearTo: number };

export default function FitmentPage() {
  const [makeId, setMakeId] = useState('');
  const [modelId, setModelId] = useState('');
  const products = useQuery({ queryKey: ['products', 'fitment'], queryFn: () => page<Product>('/admin/products?page=1&pageSize=100') });
  const makes = useQuery({ queryKey: ['makes'], queryFn: () => get<Make[]>('/vehicles/makes') });
  const models = useQuery({ queryKey: ['models', makeId], enabled: Boolean(makeId), queryFn: () => get<Model[]>(`/vehicles/models?makeId=${makeId}`) });
  const variants = useQuery({ queryKey: ['variants', modelId], enabled: Boolean(modelId), queryFn: () => get<Variant[]>(`/vehicles/variants?modelId=${modelId}`) });
  const send = useSend();

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    send.mutate({
      path: '/compatibility/admin',
      message: 'Fitment saved',
      body: {
        productId: String(form.get('productId')),
        vehicleVariantId: String(form.get('vehicleVariantId')),
        status: String(form.get('status')),
        notes: String(form.get('notes') || '') || undefined,
        sourceName: 'PROMEC desk',
      },
    });
  }

  return (
    <Desk title="Fitment" lede="Record whether a part fits a vehicle. The storefront only shows confirmed compatibility from these records.">
      <Panel>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={save}>
          <Field label="Product">
            <SelectInput name="productId" required>{(products.data?.rows ?? []).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</SelectInput>
          </Field>
          <Field label="Make">
            <SelectInput value={makeId} onChange={(event) => { setMakeId(event.target.value); setModelId(''); }}>
              <option value="">Choose</option>
              {(makes.data ?? []).map((make) => <option key={make.id} value={make.id}>{make.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Model">
            <SelectInput value={modelId} onChange={(event) => setModelId(event.target.value)}>
              <option value="">Choose</option>
              {(models.data ?? []).map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
            </SelectInput>
          </Field>
          <Field label="Variant">
            <SelectInput name="vehicleVariantId" required>
              {(variants.data ?? []).map((variant) => <option key={variant.id} value={variant.id}>{variant.trim || 'Base'} · {variant.yearFrom}–{variant.yearTo}</option>)}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput name="status" defaultValue="confirmed">
              <option value="confirmed">Confirmed</option>
              <option value="probable">Probable</option>
              <option value="unverified">Unverified</option>
              <option value="incompatible">Incompatible</option>
            </SelectInput>
          </Field>
          <Field label="Notes"><TextInput name="notes" /></Field>
          <Button type="submit" disabled={send.isPending}>Save fitment</Button>
        </form>
      </Panel>
    </Desk>
  );
}
