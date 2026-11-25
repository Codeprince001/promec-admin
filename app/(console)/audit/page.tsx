'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { page } from '@/lib/api';
import { when } from '@/lib/format';
import { DataTable, Desk, Pager, Panel, QueryState } from '@/components/desk';

type Entry = { id: string; action: string; entityType: string; entityId: string | null; actorId: string | null; createdAt: string };

export default function AuditPage() {
  const [pageNo, setPageNo] = useState(1);
  const query = useQuery({
    queryKey: ['audit', pageNo],
    queryFn: () => page<Entry>(`/admin/audit?page=${pageNo}&pageSize=30`),
  });
  return (
    <Desk title="Audit log" lede="Who changed a price, approved a vendor, or moved an order. Entries are chained.">
      <Panel>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.rows.length}>
          <DataTable
            columns={['When', 'Action', 'Entity', 'Actor']}
            rows={(query.data?.rows ?? []).map((row) => [when(row.createdAt), row.action, `${row.entityType} ${row.entityId ?? ''}`, row.actorId ?? 'system'])}
          />
          {query.data ? <div className="mt-4"><Pager meta={query.data.meta} page={pageNo} onPage={setPageNo} /></div> : null}
        </QueryState>
      </Panel>
    </Desk>
  );
}
