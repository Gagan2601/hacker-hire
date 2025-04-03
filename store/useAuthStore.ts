// store/useAuthStore.ts
import { create } from "zustand";

interface AuthState {
  username: string | null;
  setUsername: (username: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  username: null,
  setUsername: (username) => set({ username }),
}));
