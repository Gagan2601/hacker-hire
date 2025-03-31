// store/useCameraStore.ts
import { create } from "zustand";

interface CameraState {
  stream: MediaStream | null;
  setStream: (stream: MediaStream) => void;
  stopStream: () => void;
  isActivePage: boolean;
  setIsActivePage: (isActive: boolean) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  stream: null,
  isActivePage: false,
  setStream: (stream) => set({ stream }),
  stopStream: () => {
    set((state) => {
      if (state.stream) {
        console.log("Camera stopped completely");
        state.stream.getTracks().forEach((track) => track.stop());
      }
      return { stream: null };
    });
  },
  setIsActivePage: (isActive) => set({ isActivePage: isActive }),
}));
