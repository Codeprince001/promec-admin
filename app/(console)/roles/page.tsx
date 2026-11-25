'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { Desk, Panel, QueryState } from '@/components/desk';

type Role = { id: string; name: string; description: string | null; permissions: string[] };

export default function RolesPage() {
  const query = useQuery({ queryKey: ['roles'], queryFn: () => get<Role[]>('/admin/roles') });
  return (
    <Desk title="Roles" lede="What each operations role is allowed to do. Super admins hold every permission.">
      <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length}>
        <div className="grid gap-3 md:grid-cols-2">
          {(query.data ?? []).map((role) => (
            <Panel key={role.id} title={role.name}>
              <p className="mb-2 text-sm text-[var(--muted)]">{role.description || 'No description'}</p>
              <ul className="flex flex-wrap gap-2 text-xs">{role.permissions.map((code) => <li key={code} className="rounded-full bg-[var(--bg)] px-2 py-1">{code}</li>)}</ul>
            </Panel>
          ))}
        </div>
      </QueryState>
    </Desk>
  );
}
