import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";
export type ActivePanel = "chat" | "contacts" | "groups" | "profile" | "settings";

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  activePanel: ActivePanel;
  isMobile: boolean;
  mobileSidebarOpen: boolean;
  searchQuery: string;

  setTheme: (theme: Theme) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActivePanel: (panel: ActivePanel) => void;
  setIsMobile: (isMobile: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      sidebarCollapsed: false,
      activePanel: "chat",
      isMobile: false,
      mobileSidebarOpen: false,
      searchQuery: "",

      setTheme: (theme) => set({ theme }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setActivePanel: (activePanel) => set({ activePanel }),
      setIsMobile: (isMobile) => set({ isMobile }),
      setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
    }),
    {
      name: "echo-ui",
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
