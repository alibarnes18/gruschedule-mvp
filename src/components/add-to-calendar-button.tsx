"use client";

import { Button } from "@/components/ui/button";
import { downloadIcs, type IcsEvent } from "@/lib/ics";

type Props = {
  filename: string;
  event: IcsEvent;
  label?: string;
};

export function AddToCalendarButton({ filename, event, label = "Takvime Ekle" }: Props) {
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
