import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";

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
  isLoading: boolean;
  setAuth: (token: string, user: User) => void;
  updateUser: (updatedUser: Partial<User>) => void;
  logout: () => void;
  getAuthHeader: () => { Authorization: string } | {};
  syncWithSession: (session: any) => void;
  initializeClientAuth: () => void;
}

// Objekt i rremë StateStorage për SSR
const dummyStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: true, // Fillimisht true derisa gjendja të ngarkohet në klient
      setAuth: (token, user) => {
        set({ token, user, isAuthenticated: true, isLoading: false });
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
        }
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
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
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
          const token = session.user.token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
          if (token) {
            set({ token, user, isAuthenticated: true, isLoading: false });
            if (typeof window !== "undefined") {
              localStorage.setItem("token", token);
            }
          }
        } else {
          set({ token: null, user: null, isAuthenticated: false, isLoading: false });
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
          }
        }
      },
      initializeClientAuth: () => {
        if (typeof window !== "undefined") {
          const storedToken = localStorage.getItem("token");
          const storedState = localStorage.getItem("auth-storage");
          let initialUser = null;
          if (storedState) {
            try {
              const parsedState = JSON.parse(storedState);
              initialUser = parsedState.state?.user || null;
              console.log("Initialized auth state:", { storedToken, initialUser });
            } catch (e) {
              console.error("Failed to parse auth-storage:", e);
            }
          }
          set({
            token: storedToken || null,
            user: initialUser,
            isAuthenticated: !!storedToken && !!initialUser,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : dummyStorage)),
      onRehydrateStorage: () => (state: AuthState | undefined) => {
        // Vendos isLoading në false pas rehidratimit
        return { ...state, isLoading: true }; // Mbaj isLoading true derisa initializeClientAuth të thirret
      },
    }
  )
);