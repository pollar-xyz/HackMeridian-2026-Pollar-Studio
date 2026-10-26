"use client";

import { useState } from "react";
import { Check, Tag } from "lucide-react";
import { useStudioStore } from "@/lib/mock/store";
import { PLANS, planById, type Plan } from "@/lib/mock/plans";
import { useT } from "@/lib/i18n";
import { PanelHeader } from "./PanelHeader";
import { useStudioAccount } from "@/components/StudioGate";
import { Modal, Spinner } from "@/components/Modal";
import { toast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { Input } from "@/components/ui/input";

export function PlanPanel() {
  const account = useStudioAccount();
  const t = useT();
  const upgradePlan = useStudioStore((s) => s.upgradePlan);
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [state, setState] = useState<"confirm" | "paying" | "done">("confirm");

  if (!account) return null;
  const current = planById(account.plan);

  const applyPromo = () => {
    if (/^POLLAR-/i.test(promo.trim())) {
      setDiscount(50);
      toast(t("Promo applied: 50% off the first month"));
    } else {
      toast(t("That code is not valid"), "error");
    }
  };

  const confirm = () => {
    if (!selected) return;
    setState("paying");
    setTimeout(() => {
      upgradePlan(selected.id, price(selected));
      setState("done");
    }, 1500);
  };

  const close = () => {
    setSelected(null);
    setState("confirm");
  };

  const price = (p: Plan) =>
    discount
      ? Math.round(p.priceUsdc * (1 - discount / 100) * 100) / 100
      : p.priceUsdc;

  return (
    <PanelHeader
      title={t("Manage plan")}
      description={t(
        "You are on the {plan} plan. Plans are paid in USDC from your Pollar wallet, monthly, cancel any time.",
        { plan: t(current.name) },
      )}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center">
          <p className="flex flex-1 items-center gap-2 text-sm text-muted">
            <Tag size={16} className="shrink-0 text-accent" />
            <span>
              <span className="font-medium text-foreground">
                {t("Unlock your discount.")}
              </span>{" "}
              {t(
                "Have a promo code from the event? It takes 50% off the first month.",
              )}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Input
              aria-label={t("Promo code")}
              value={promo}
              onChange={(e) => setPromo(e.target.value.toUpperCase())}
              placeholder="POLLAR-XXXX"
              className={`${inputClass} w-36 py-2 font-mono text-sm uppercase`}
            />
            <Button
              variant="secondary"
              onClick={applyPromo}
              disabled={!promo.trim() || discount > 0}
            >
              {discount ? t("Applied") : t("Verify and apply")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = p.id === current.id;
            const highlight = p.id === "builder";
            return (
              <div
                key={p.id}
                className={`flex min-h-[24rem] flex-col gap-5 rounded-2xl border p-5 ${
                  highlight
                    ? "border-accent bg-accent-soft/40"
                    : "border-line bg-surface"
                } ${isCurrent ? "ring-1 ring-accent/40" : ""}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted">
                      {t("{plan} plan", { plan: t(p.name) })}
                    </p>
                    {highlight && (
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">
                        {t("Popular")}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-nowrap text-3xl font-semibold tracking-tight">
                    {p.priceUsdc === 0 ? (
                      t("Free")
                    ) : (
                      <>
                        {price(p)} USDC
                        <span className="text-base font-normal text-muted">
                          /{t("mo")}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted">{t(p.tagline)}</p>
                </div>
                <ul className="flex flex-col gap-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-accent"
                      />{" "}
                      {t(f)}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={highlight ? "primary" : "secondary"}
                  className="mt-auto"
                  // Paid plans are not sold yet: every account is on Free.
                  disabled
                >
                  {isCurrent
                    ? t("Current plan")
                    : p.priceUsdc === 0
                      ? t("Included")
                      : t("Coming soon")}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted">
          {t(
            "Credits from your plan land every month. Unused credits roll over while the plan is active. Studio never charges your users, they only pay the apps you publish.",
          )}
        </p>

        <Modal
          open={selected !== null}
          title={
            state === "done"
              ? undefined
              : t("Switch to {plan}", { plan: t(selected?.name ?? "") })
          }
          onClose={state === "paying" ? undefined : close}
        >
          {selected && state === "confirm" && (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl bg-background p-3 text-sm">
                <Row label={t("Plan")} value={t(selected.name)} />
                <Row label={t("Today")} value={`${price(selected)} USDC`} />
                <Row
                  label={t("Credits added now")}
                  value={selected.monthlyCredits.toLocaleString("en-US")}
                />
                <Row label={t("Paid from")} value={t("Pollar wallet")} />
              </div>
              <Button className="w-full" onClick={confirm}>
                {t("Pay {amount} USDC and switch", { amount: price(selected) })}
              </Button>
            </div>
          )}
          {state === "paying" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Spinner />
              <p className="text-sm font-medium">
                {t("Paying from your Pollar wallet")}
              </p>
            </div>
          )}
          {selected && state === "done" && (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Check size={24} />
              </span>
              <p className="text-lg font-semibold">
                {t("You are on {plan}", { plan: t(selected.name) })}
              </p>
              <p className="text-sm text-muted">
                {t("{n} credits were added to your balance.", {
                  n: selected.monthlyCredits.toLocaleString("en-US"),
                })}
              </p>
              <Button className="mt-2 w-full" onClick={close}>
                {t("Done")}
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </PanelHeader>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
