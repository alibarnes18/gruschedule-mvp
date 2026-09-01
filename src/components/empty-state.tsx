import { Alert, AlertDescription } from "@/components/ui/alert";

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="border-dashed bg-transparent py-8">
      <AlertDescription className="w-full text-center text-sm">{children}</AlertDescription>
    </Alert>
  );
}
