'use client';

import { FormEvent, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { when } from '@/lib/format';
import { useMe, useSend } from '@/lib/hooks';
import { Button, Desk, Field, Panel, Pill, QueryState, SelectInput, TextArea } from '@/components/desk';

type Ticket = {
  id: string;
  ticketNo: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  dueAt: string | null;
  requesterEmail: string | null;
  messages: { id: string; body: string; isStaff: boolean; createdAt: string }[];
};

export default function SupportPage() {
  const [active, setActive] = useState<string | null>(null);
  const me = useMe();
  const query = useQuery({ queryKey: ['tickets'], queryFn: () => get<Ticket[]>('/admin/support/tickets') });
  const send = useSend();
  const ticket = query.data?.find((row) => row.id === active) ?? query.data?.[0];

  function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket) return;
    const form = new FormData(event.currentTarget);
    send.mutate({ path: `/admin/support/tickets/${ticket.id}/messages`, body: { body: String(form.get('body')) }, message: 'Reply sent' });
    event.currentTarget.reset();
  }

  return (
    <Desk title="Support" lede="The inbox buyers write to, with the SLA clock still running.">
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <Panel title="Inbox">
          <QueryState loading={query.isLoading} error={query.error} empty={!query.data?.length}>
            <ul className="grid gap-2">
              {(query.data ?? []).map((row) => (
                <li key={row.id}>
                  <button type="button" className={`w-full rounded-xl px-3 py-2 text-left text-sm ${ticket?.id === row.id ? 'bg-[var(--chip)] text-white' : 'hover:bg-[var(--bg)]'}`} onClick={() => setActive(row.id)}>
                    <span className="block font-medium">{row.subject}</span>
                    <span className="text-xs opacity-80">{row.ticketNo} · {row.priority}</span>
                  </button>
                </li>
              ))}
            </ul>
          </QueryState>
        </Panel>
        {ticket ? (
          <Panel title={ticket.subject}>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <Pill status={ticket.status} />
              <Pill status={ticket.priority} />
              <span className="text-[var(--muted)]">Due {when(ticket.dueAt)} · {ticket.requesterEmail || 'account holder'}</span>
            </div>
            <ol className="mb-4 grid gap-3">
              {ticket.messages.map((message) => (
                <li key={message.id} className={`rounded-2xl px-3 py-2 text-sm ${message.isStaff ? 'bg-[var(--bg)]' : 'border border-[var(--line)]'}`}>
                  <p className="mb-1 text-xs text-[var(--muted)]">{message.isStaff ? 'Staff' : 'Customer'} · {when(message.createdAt)}</p>
                  {message.body}
                </li>
              ))}
            </ol>
            <form className="grid gap-3" onSubmit={reply}>
              <Field label="Reply"><TextArea name="body" required /></Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={send.isPending}>Send reply</Button>
                <Button type="button" tone="ghost" disabled={send.isPending || ticket.status === 'resolved'} onClick={() => send.mutate({ path: `/admin/support/tickets/${ticket.id}/close`, body: { status: 'resolved' }, message: 'Ticket resolved' })}>Resolve</Button>
                <Button type="button" tone="ghost" disabled={send.isPending || ticket.status === 'closed'} onClick={() => send.mutate({ path: `/admin/support/tickets/${ticket.id}/close`, body: { status: 'closed' }, message: 'Ticket closed' })}>Close</Button>
                {me.data ? (
                  <SelectInput className="max-w-40" defaultValue={ticket.priority} onChange={(event) => send.mutate({ path: `/admin/support/tickets/${ticket.id}/assign`, body: { assigneeId: me.data!.id, priority: event.target.value }, message: 'Ticket assigned' })}>
                    {['low', 'normal', 'high', 'urgent'].map((item) => <option key={item} value={item}>{item}</option>)}
                  </SelectInput>
                ) : null}
              </div>
            </form>
          </Panel>
        ) : null}
      </div>
    </Desk>
  );
}
