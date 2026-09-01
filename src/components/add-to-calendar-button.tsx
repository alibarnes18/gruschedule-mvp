"use client";

import { downloadIcs, type IcsEvent } from "@/lib/ics";

type Props = {
  filename: string;
  event: IcsEvent;
  label?: string;
};

export function AddToCalendarButton({ filename, event, label = "Takvime Ekle" }: Props) {
  return (
    <button
      type="button"
      onClick={() => downloadIcs(filename, [event])}
      className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
    >
      {label}
    </button>
  );
}
