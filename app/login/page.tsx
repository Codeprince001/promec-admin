'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useHydrated } from '@/lib/hooks';
import { useSession } from '@/lib/session';
import type { LoginResult } from '@/lib/types';
import { Banner, Button, Field, TextInput } from '@/components/desk';

export default function LoginPage() {
  const router = useRouter();
  const ready = useHydrated();
  const token = useSession((state) => state.token);
  const setToken = useSession((state) => state.setToken);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState('');
  const [challenge, setChallenge] = useState<LoginResult | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && token) router.replace('/');
  }, [ready, token, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      if (challenge?.challengeId && recovery) {
        const body = await api<{ data: LoginResult }>('/auth/mfa/recovery', {
          method: 'POST',
          token: null,
          body: JSON.stringify({ challengeId: challenge.challengeId, code: recovery }),
        });
        if (!body.data.accessToken) throw new Error('The recovery code was not accepted');
        setToken(body.data.accessToken);
        router.replace('/');
        return;
      }
      if (challenge?.challengeId) {
        const body = await api<{ data: LoginResult }>('/auth/mfa/verify', {
          method: 'POST',
          token: null,
          body: JSON.stringify({ challengeId: challenge.challengeId, code }),
        });
        if (!body.data.accessToken) throw new Error('That authenticator code was not accepted');
        setToken(body.data.accessToken);
        router.replace('/');
        return;
      }
      const body = await api<{ data: LoginResult }>('/auth/login', {
        method: 'POST',
        token: null,
        body: JSON.stringify({ identifier, password }),
      });
      if (body.data.mfaRequired) {
        setChallenge(body.data);
        return;
      }
      if (!body.data.accessToken) throw new Error('The desk did not return a session');
      setToken(body.data.accessToken);
      router.replace('/');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign in failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg)] px-4 py-10 text-[var(--ink)]">
      <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-14 place-items-center">
            <img src="/assets/promec_logo.png" alt="PROMEC" className="h-8 w-auto" />
          </div>
          <div>
            <p className="text-lg font-semibold">PROMEC Desk</p>
            <p className="text-sm text-[var(--muted)]">Staff sign in. Authenticator required.</p>
          </div>
        </div>
        <form className="grid gap-4" onSubmit={submit}>
          {error ? <Banner>{error}</Banner> : null}
          {challenge ? (
            <>
              {challenge.enrollmentRequired && challenge.secret ? (
                <Banner tone="warn">
                  Add this key to an authenticator app, then enter the 6-digit code. Secret: {challenge.secret}
                </Banner>
              ) : (
                <p className="text-sm text-[var(--muted)]">Enter the 6-digit code from your authenticator.</p>
              )}
              <Field label="Authenticator code">
                <TextInput inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} required={!recovery} />
              </Field>
              <Field label="Recovery code, if you cannot use the app">
                <TextInput value={recovery} onChange={(event) => setRecovery(event.target.value)} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Email or phone">
                <TextInput autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required />
              </Field>
              <Field label="Password">
                <TextInput type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </Field>
            </>
          )}
          <Button type="submit" disabled={pending}>{pending ? 'Checking…' : challenge ? 'Verify' : 'Sign in'}</Button>
        </form>
      </div>
    </div>
  );
}
