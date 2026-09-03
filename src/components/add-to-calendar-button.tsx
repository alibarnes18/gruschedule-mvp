"use client";

import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadIcs, type IcsEvent } from "@/lib/ics";

type Props = {
  filename: string;
  event: IcsEvent;
  label?: string;
  iconOnly?: boolean;
};

export function AddToCalendarButton({ filename, event, label = "Takvime Ekle", iconOnly = false }: Props) {
  if (iconOnly) {
    return (
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={() => downloadIcs(filename, [event])}
        className="flex size-9 flex-none items-center justify-center rounded-xl border border-border bg-foreground/[0.03] text-muted-foreground transition-all hover:bg-gradient-to-br hover:from-[#7C3AED] hover:to-[#3B82F6] hover:text-white hover:shadow-[0_0_20px_-4px_rgba(124,58,237,0.65)] hover:border-transparent"
      >
        <CalendarPlus className="size-4" />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => downloadIcs(filename, [event])}
    >
      {label}
    </Button>
  );
}
