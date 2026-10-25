import { Card } from "./card";
// Label on top, number below. Used in cards and the job view.
export function StatTile({
  label,
  value,
  size = "md",
}: {
  label: string;
  value: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const number =
    size === "lg" ? "text-3xl" : size === "md" ? "text-lg" : "text-base";
  return (
    <Card className="rounded-lg border-0 bg-background px-2 py-2 text-center">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`font-semibold tabular-nums ${number}`}>{value}</p>
    </Card>
  );
}
