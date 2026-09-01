export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-10 text-center text-sm text-zinc-400">
      {children}
    </div>
  );
}
