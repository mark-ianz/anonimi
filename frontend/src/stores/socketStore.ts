import { create } from "zustand";

export type SocketStatus = "disconnected" | "connecting" | "connected" | "error";

interface SocketState {
  chatStatus: SocketStatus;
  adminStatus: SocketStatus;
  lastError: string | null;

  setChatStatus: (status: SocketStatus) => void;
  setAdminStatus: (status: SocketStatus) => void;
  setError: (error: string | null) => void;
}

export const useSocketStore = create<SocketState>()((set) => ({
  chatStatus: "disconnected",
  adminStatus: "disconnected",
  lastError: null,

  setChatStatus: (chatStatus) => set({ chatStatus }),
  setAdminStatus: (adminStatus) => set({ adminStatus }),
  setError: (lastError) => set({ lastError }),
}));
