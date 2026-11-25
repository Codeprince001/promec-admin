import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

type Flash = { tone: 'ok' | 'bad'; text: string } | null;

type UiState = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  flash: Flash;
  notify: (text: string, tone?: 'ok' | 'bad') => void;
  clearFlash: () => void;
};

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      collapsed: false,
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      mobileOpen: false,
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
      flash: null,
      notify: (text, tone = 'ok') => set({ flash: { text, tone } }),
      clearFlash: () => set({ flash: null }),
    }),
    {
      name: 'promec.admin.ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme, collapsed: state.collapsed }),
    },
  ),
);
