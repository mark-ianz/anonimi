import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types/user";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/lib/constants";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          // Write cookie so Next.js middleware can detect authentication server-side.
          // Max-age matches refresh token lifetime (7 days) so the cookie persists
          // for the full session; actual JWT validation still happens server-side.
          document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
      },

      setUser: (user) => set({ user }),

      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          // Clear the authentication cookie used by Next.js middleware.
          document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "echo-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // After Zustand rehydrates persisted state from localStorage, clear the
      // loading flag so ProtectedRoute doesn't spin indefinitely.
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    }
  )
);
