'use client';

import { Area, Bar, CartesianGrid, Cell, ComposedChart, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { naira, titleCase } from '@/lib/format';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

function tipStyle() {
  return {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 12,
    color: 'var(--ink)',
    fontSize: 12,
  };
}

export function RevenueChart({ points }: { points: { date: string; orders: number; gmv: string }[] }) {
  const data = points.map((point) => ({ ...point, gmv: Number(point.gmv), label: point.date.slice(5) }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis yAxisId="gmv" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={64} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
          <YAxis yAxisId="orders" orientation="right" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
          <Tooltip
            contentStyle={tipStyle()}
            formatter={(value, name) => (name === 'Paid GMV' ? naira(Number(value)) : value)}
            labelFormatter={(_label, payload) => payload?.[0]?.payload?.date ?? ''}
          />
          <Legend />
          <Bar yAxisId="orders" dataKey="orders" name="Orders" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Area yAxisId="gmv" type="monotone" dataKey="gmv" name="Paid GMV" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.18} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusChart({ rows }: { rows: { status: string; count: number; amount: string }[] }) {
  const data = rows.map((row) => ({ ...row, name: titleCase(row.status) }));
  if (!data.length) return <p className="text-sm text-[var(--muted)]">No orders yet.</p>;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2}>
            {data.map((row, index) => (
              <Cell key={row.status} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tipStyle()} formatter={(value, _name, item) => [`${value} · ${naira(item?.payload?.amount)}`, item?.payload?.name ?? '']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PaymentChart({ rows }: { rows: { status: string; count: number }[] }) {
  const data = rows.map((row) => ({ ...row, name: titleCase(row.status) }));
  if (!data.length) return <p className="text-sm text-[var(--muted)]">No payments recorded.</p>;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} layout="vertical" margin={{ top: 8, right: 8, left: 16, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tipStyle()} />
          <Bar dataKey="count" name="Orders" fill="var(--chart-3)" radius={[0, 6, 6, 0]} maxBarSize={22} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
