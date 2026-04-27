import { create } from "zustand";
import { currentWeekIdentifier } from "@/lib/utils";

interface WeekState {
  weekIdentifier: string;
  setWeekIdentifier: (week: string) => void;
}

export const useWeekStore = create<WeekState>((set) => ({
  weekIdentifier: currentWeekIdentifier(),
  setWeekIdentifier: (weekIdentifier) => set({ weekIdentifier }),
}));
