'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { get, send } from './api';
import { useSession } from './session';
import type { Me } from './types';
import { allowed } from './nav';
import { useUi } from './ui-store';

export function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const finish = () => setReady(true);
    const unsub = useSession.persist.onFinishHydration(finish);
    if (useSession.persist.hasHydrated()) finish();
    return unsub;
  }, []);
  return ready;
}

export function useMe() {
  const token = useSession((state) => state.token);
  const ready = useHydrated();
  return useQuery({
    queryKey: ['me', token],
    enabled: ready && Boolean(token),
    queryFn: () => get<Me>('/auth/me'),
    retry: false,
  });
}

export function useCan(code?: string) {
  const me = useMe();
  return allowed(me.data?.permissions, code);
}

export function useSend() {
  const client = useQueryClient();
  const notify = useUi((state) => state.notify);
  return useMutation({
    mutationFn: (input: { path: string; method?: string; body?: unknown; message?: string }) =>
      send(input.path, input.method ?? 'POST', input.body),
    onSuccess: async (_data, variables) => {
      notify(variables.message ?? 'Updated');
      await client.invalidateQueries();
    },
    onError: (error) => notify(error instanceof Error ? error.message : 'The request failed', 'bad'),
  });
}
