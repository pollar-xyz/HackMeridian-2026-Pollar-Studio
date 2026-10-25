"use client";

import { useState } from "react";
import { Check, Gift, Rocket, Wallet } from "lucide-react";
import { useStudioStore } from "@/lib/mock/store";
import { useUiStore } from "@/lib/mock/ui-store";
import { useT } from "@/lib/i18n";
import { Modal, Spinner } from "@/components/Modal";
import { toast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Field } from "@/components/ui/Field";

// One-time packs. Per credit they cost a bit more than a monthly plan, so the plan stays the better deal:
// Starter 0.020, Builder 0.017, Event 0.015 USDC per credit, against 0.010 on the Builder plan and 0.0075 on Pro.
export const PACKS = [
  { credits: 200, priceUsdc: 4, label: "Starter", note: "About 3 new apps" },
  { credits: 600, priceUsdc: 10, label: "Builder", note: "A week of iterating", popular: true },
  { credits: 2000, priceUsdc: 30, label: "Event", note: "For teams shipping several apps" },
];
// Older purchases were recorded with the first price list. Billing reads their own saved amount.

type Method = "wallet" | "voucher";

export function AddCreditsModal() {
  const t = useT();
  const open = useUiStore((s) => s.creditsOpen);
  const setOpen = useUiStore((s) => s.setCreditsOpen);
  const openSettings = useUiStore((s) => s.openSettings);
  const addCredits = useStudioStore((s) => s.addCredits);
  const [pack, setPack] = useState(PACKS[1]);
  const [method, setMethod] = useState<Method>("wallet");
  const [voucher, setVoucher] = useState("");
  const [state, setState] = useState<"pick" | "processing" | "done">("pick");
  const [added, setAdded] = useState(0);

  const close = () => {
    setOpen(false);
    setState("pick");
    setVoucher("");
  };

  const confirm = (chosen = pack) => {
    setPack(chosen);
    const amount = method === "voucher" ? 100 : chosen.credits;
    setState("processing");
    setTimeout(() => {
      addCredits(amount, method === "voucher" ? "Event voucher" : `${chosen.label} pack`, method === "voucher" ? 0 : chosen.priceUsdc);
      setAdded(amount);
      setState("done");
      toast(t("{n} credits added", { n: amount }));
    }, 1500);
  };

  const voucherValid = /^POLLAR-[A-Z0-9]{4,}$/i.test(voucher.trim());
  const canConfirm = method === "wallet" || voucherValid;

  return (
    <Modal
      open={open}
      size={state === "pick" ? "lg" : "sm"}
      title={state === "done" ? undefined : t("Add credits")}
      onClose={state === "processing" ? undefined : close}
    >
      {state === "processing" && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <Spinner />
          <p className="text-sm font-medium">{method === "wallet" ? t("Paying from your Pollar wallet") : t("Checking your voucher")}</p>
        </div>
      )}

      {state === "done" && (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Check size={24} />
          </span>
          <p className="text-lg font-semibold">{t("{n} credits added", { n: added })}</p>
          <p className="text-sm text-muted">{t("They are ready to use on your next generation.")}</p>
          <Button className="mt-2 w-full" onClick={close}>
            {t("Done")}
          </Button>
        </div>
      )}

      {state === "pick" && (
        <div className="flex flex-col gap-4">
          <Segmented<Method>
            value={method}
            onChange={setMethod}
            className="self-start"
            options={[
              { value: "wallet", label: (<><Wallet size={14} /> {t("Pollar wallet")}</>) },
              { value: "voucher", label: (<><Gift size={14} /> {t("Event voucher")}</>) },
            ]}
          />

          {method === "wallet" ? (
            <>
              {/* Same card layout as the plans, so packs and plans compare at a glance. */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {PACKS.map((p) => (
                  <div
                    key={p.credits}
                    className={`flex flex-col gap-4 rounded-2xl border p-5 ${p.popular ? "border-accent bg-accent-soft/40" : "border-line bg-surface"}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted">{t("{pack} pack", { pack: t(p.label) })}</p>
                        {p.popular && <span className="shrink-0 whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-white">{t("Popular")}</span>}
                      </div>
                      <p className="mt-2 whitespace-nowrap text-3xl font-semibold tracking-tight">
                        {p.priceUsdc} USDC
                      </p>
                      <p className="mt-1 text-sm text-muted">{t("One-time payment")}</p>
                    </div>
                    <ul className="flex flex-col gap-2.5 text-sm">
                      <li className="flex items-start gap-2">
                        <Check size={16} className="mt-0.5 shrink-0 text-accent" /> {t("{n} credits", { n: p.credits.toLocaleString("en-US") })}
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={16} className="mt-0.5 shrink-0 text-accent" /> {t("Never expire")}
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={16} className="mt-0.5 shrink-0 text-accent" /> {t(p.note)}
                      </li>
                    </ul>
                    <Button variant={p.popular ? "primary" : "secondary"} className="mt-auto" onClick={() => confirm(p)}>
                      {t("Buy")}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Field
              label={t("Voucher code from the event team")}
              hint={t("Each voucher adds 100 credits. Ask a mentor at the Pollar desk for one.")}
              value={voucher}
              onChange={(e) => setVoucher(e.target.value.toUpperCase())}
              placeholder="POLLAR-XXXX"
              className="font-mono text-sm uppercase"
            />
          )}

          {method === "voucher" && (
            <Button className="w-full sm:w-auto sm:self-end" onClick={() => confirm()} disabled={!canConfirm}>
              {t("Redeem voucher")}
            </Button>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-background px-3 py-2.5 text-xs text-muted">
            <Rocket size={14} className="mt-0.5 shrink-0 text-accent" />
            <span>
              {t("Paid once from your Pollar wallet. Need credits every month? A plan gives you more for the same price.")}{" "}
              <Button variant="unstyled"
                type="button"
                onClick={() => {
                  close();
                  openSettings("plan");
                }}
                className="font-medium text-accent hover:underline"
              >
                {t("See plans")}
              </Button>
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}
