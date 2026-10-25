"use client";

import { Stars } from "@/components/ui/Stars";
import { toast } from "@/components/Toast";
import { useStudioStore } from "@/lib/mock/store";

export function RatingControl({ value, count, mine, appId, appName, labels }: {
  value: number; count: number; mine: number | null; appId: string; appName: string;
  labels: { rate: string; new: string; thanks: string };
}) {
  const rateApp = useStudioStore((state) => state.rateApp);
  return <Stars value={value} count={count} mine={mine} size={14} label={labels.rate} newLabel={labels.new} onRate={(stars) => {
    rateApp(appId, stars);
    toast(labels.thanks.replace("{n}", String(stars)).replace("{name}", appName));
  }} />;
}
