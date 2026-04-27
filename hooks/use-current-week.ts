import { useWeekStore } from "@/store/week.store";
import { currentWeekIdentifier } from "@/lib/utils";

export function useCurrentWeek() {
  const { weekIdentifier, setWeekIdentifier } = useWeekStore();
  return {
    weekIdentifier,
    setWeekIdentifier,
    currentWeek: currentWeekIdentifier(),
  };
}
