import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SessionState = {
  token: string | null;
  setToken: (token: string | null) => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
    }),
    { name: 'promec.admin.session', storage: createJSONStorage(() => sessionStorage) },
  ),
);
