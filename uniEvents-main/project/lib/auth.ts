import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  updateUser: (updatedUser: Partial<User>) => void; 
  logout: () => void;
  getAuthHeader: () => { Authorization: string } | undefined;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (updatedUser) => {
        set((state) => {
          const currentUser = state.user;
          if (currentUser) {
            const updated = { ...currentUser, ...updatedUser };
            return { user: updated };  // Përditësojmë me informacionin e ri
          }
          return state;
        });
      },      
      logout: () => set({ token: null, user: null }),
      getAuthHeader: () => {
        const token = get().token;
        return token ? { Authorization: `Bearer ${token}` } : undefined;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);