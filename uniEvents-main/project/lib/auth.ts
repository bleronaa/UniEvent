import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  updateUser: (updatedUser: Partial<User>) => void;
  logout: () => void;
  getAuthHeader: () => { Authorization: string } | {};
  syncWithSession: (session: any) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        set({ token, user, isAuthenticated: true });
        localStorage.setItem("token", token);
      },

      updateUser: (updatedUser) => {
        set((state) => {
          const currentUser = state.user;
          if (currentUser) {
            const updated = { ...currentUser, ...updatedUser };
            return { user: updated };
          }
          return state;
        });
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
        localStorage.removeItem("token");
        window.location.href = "/login";
      },

      getAuthHeader: () => {
        const token = get().token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      },

      syncWithSession: (session) => {
        if (session?.user) {
          const user: User = {
            id: session.user.userId,
            name: session.user.name || "",
            email: session.user.email || "",
            role: session.user.role,
          };
          const token = session.user.token || localStorage.getItem("token");

          if (token) {
            set({ token, user, isAuthenticated: true });
            localStorage.setItem("token", token);
          }
        } else {
          set({ token: null, user: null, isAuthenticated: false });
          localStorage.removeItem("token");
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
