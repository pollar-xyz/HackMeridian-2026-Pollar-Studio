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
  const tones = {
    warn: "border-warn-line bg-warn-soft text-warn",
    danger: "border-danger/20 bg-danger-soft text-danger",
    info: "border-accent/20 bg-accent-soft text-accent-strong",
  };
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>
      <span>{children}</span>
      {action}
    </div>
  );
}
