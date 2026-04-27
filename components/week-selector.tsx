"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentWeek } from "@/hooks/use-current-week";

function parseWeek(identifier: string): { year: number; week: number } {
  const [year, w] = identifier.split("-W");
  return { year: parseInt(year), week: parseInt(w) };
}

function formatWeek(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function weekLabel(identifier: string): string {
  const { year, week } = parseWeek(identifier);
  return `Semana ${week} — ${year}`;
}

function offsetWeek(identifier: string, delta: number): string {
  const { year, week } = parseWeek(identifier);
  let newWeek = week + delta;
  let newYear = year;

  if (newWeek < 1) {
    newYear--;
    newWeek = 52;
  } else if (newWeek > 52) {
    newYear++;
    newWeek = 1;
  }

  return formatWeek(newYear, newWeek);
}

export function WeekSelector() {
  const { weekIdentifier, setWeekIdentifier } = useCurrentWeek();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setWeekIdentifier(offsetWeek(weekIdentifier, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[160px] text-center text-sm font-medium">
        {weekLabel(weekIdentifier)}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setWeekIdentifier(offsetWeek(weekIdentifier, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
