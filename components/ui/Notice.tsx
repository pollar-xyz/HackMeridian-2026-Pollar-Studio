import { Alert, AlertDescription } from "./alert";
// Inline message with an optional action on the right.
export function Notice({
  tone = "warn",
  children,
  action,
}: {
  tone?: "warn" | "danger" | "info";
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Alert
      variant={
        tone === "danger"
          ? "destructive"
          : tone === "warn"
            ? "warning"
            : "default"
      }
      role={tone === "info" ? "status" : "alert"}
      className="flex flex-wrap items-center justify-between gap-2"
    >
      <AlertDescription>{children}</AlertDescription>
      {action}
    </Alert>
  );
}
