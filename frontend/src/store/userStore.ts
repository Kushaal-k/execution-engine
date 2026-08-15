import { create } from "zustand";

interface UserState {
  username: string;
  activeUsers: Map<string, string>;
  setUsername: (username: string) => void;
  setUserPresence: (userId: string, username: string) => void;
  removeUserPresence: (userId: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  username: "",
  activeUsers: new Map(),

  setUsername: (username) => set({ username }),

  setUserPresence: (userId, username) =>
    set((state) => {
      const next = new Map(state.activeUsers);
      next.set(userId, username || "Anonymous");
      return { activeUsers: next };
    }),

  removeUserPresence: (userId) =>
    set((state) => {
      const next = new Map(state.activeUsers);
      next.delete(userId);
      return { activeUsers: next };
    }),
}));
