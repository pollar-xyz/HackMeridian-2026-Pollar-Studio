"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";
import { ImagePlus, Sparkles, Store, X } from "lucide-react";
import type { App, ListingArt } from "@/lib/mock/types";
import { KIND_LABELS } from "@/lib/mock/types";
import { useStudioStore } from "@/lib/mock/store";
import { useT } from "@/lib/i18n";
import { Modal, Spinner } from "@/components/Modal";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { toast } from "@/components/Toast";
import {
  AppLogo,
  ART_COLORS,
  ART_PATTERNS,
  Banner,
  readImage,
} from "./ListingArt";

const TAGLINES: Record<App["kind"], string[]> = {
  "pasanaku-circles": [
    "Save together, one friend collects each week",
    "Your savings circle, without the spreadsheet",
  ],
  "bill-split": [
    "Split the bill, everyone pays their share",
    "No more chasing friends after dinner",
  ],
  "money-pool": [
    "Pool money for a goal, together",
    "Collect for a shared goal, see every contribution",
  ],
  "vendor-pay-link": [
    "Get paid with one link",
    "Send a link, get paid in seconds",
  ],
  "qr-menu-orders": [
    "Scan, order and pay from your table",
    "Your menu, orders and payments in one QR",
  ],
  "raffle-hub": [
    "Fair raffles with the prize in escrow",
    "Sell tickets, draw a winner nobody can rig",
  ],
  "event-tickets": [
    "Tickets with a QR, refunds if it is cancelled",
    "Sell tickets, scan them at the door",
  ],
  "match-predictions": [
    "Predict the match, the oracle settles it",
    "Friendly predictions, paid out automatically",
  ],
  "market-orders": [
    "Order from every stall, pay each one directly",
    "Your local market, online",
  ],
};

function randomArt(seed: number): ListingArt {
  return {
    color: ART_COLORS[seed % ART_COLORS.length],
    pattern: ART_PATTERNS[seed % ART_PATTERNS.length],
  };
}

export function PublishListingModal({
  app,
  open,
  onClose,
}: {
  app: App;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const publishListing = useStudioStore((s) => s.publishListing);
  const current = app.listing;
  const [tagline, setTagline] = useState(current?.tagline ?? "");
  const [logo, setLogo] = useState<ListingArt>(
    current?.logo ?? { color: ART_COLORS[0], pattern: "none" },
  );
  const [banner, setBanner] = useState<ListingArt>(
    current?.banner ?? { color: ART_COLORS[0], pattern: "dots" },
  );
  const [generating, setGenerating] = useState(false);
  const [round, setRound] = useState(1);
  const logoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const valid = tagline.trim().length >= 6;

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      const next = round + 1;
      const art = randomArt(next * 7 + app.name.length);
      setLogo({ color: art.color, pattern: "none" });
      setBanner({
        ...art,
        pattern: art.pattern === "none" ? "dots" : art.pattern,
      });
      const options = TAGLINES[app.kind];
      if (!tagline.trim() || options.includes(tagline))
        setTagline(options[next % options.length]);
      setRound(next);
      setGenerating(false);
    }, 900);
  };

  const upload = async (file: File | undefined, kind: "logo" | "banner") => {
    if (!file) return;
    try {
      const image = await readImage(
        file,
        kind === "logo" ? 160 : 960,
        kind === "logo" ? 160 : 360,
      );
      if (kind === "logo") setLogo((a) => ({ ...a, image }));
      else setBanner((a) => ({ ...a, image }));
    } catch (e) {
      toast(
        e instanceof Error ? t(e.message) : t("That file is not an image"),
        "error",
      );
    }
  };

  const publish = () => {
    publishListing(app.id, {
      tagline: tagline.trim().slice(0, 80),
      logo,
      banner,
    });
    toast(
      current
        ? t("Marketplace listing updated")
        : t("{name} is now in the marketplace", { name: app.name }),
    );
    onClose();
  };

  // Guard: testnet apps use play money and get wiped on resets, so they cannot be listed.
  if (app.network !== "mainnet" || app.status !== "published") {
    return (
      <Modal open={open} onClose={onClose} title={t("Marketplace")}>
        <div className="flex flex-col gap-4 text-sm">
          <p className="text-muted">
            {t(
              "The marketplace lists mainnet apps only. Open Publish again and pick Mainnet when you are ready for real money.",
            )}
          </p>
          <Button className="self-end" onClick={onClose}>
            {t("Got it")}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={t("Publish to marketplace")}
      open={open}
      onClose={onClose}
      size="xl"
      bare
    >
      <div className="flex max-h-[85vh] flex-col overflow-y-auto md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {current
                  ? t("Edit marketplace listing")
                  : t("Publish to the marketplace")}
              </h2>
              <p className="text-sm text-muted">
                {t(
                  "A logo, a banner and one line. That is what people see before they open your app.",
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-muted hover:bg-background"
              aria-label={t("Close")}
            >
              <X size={18} />
            </Button>
          </div>

          <Button
            variant="unstyled"
            type="button"
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-3 rounded-xl border border-dashed border-accent/50 bg-accent-soft px-4 py-3 text-left transition-colors hover:border-accent disabled:opacity-70"
          >
            {generating ? (
              <Spinner className="h-5 w-5" />
            ) : (
              <Sparkles size={20} className="text-accent" />
            )}
            <span>
              <span className="block text-sm font-semibold text-accent-strong">
                {generating
                  ? t("Generating")
                  : t("Generate logo, banner and one-liner")}
              </span>
              <span className="block text-xs text-muted">
                {t("Made from your prompt. Generate again for another option.")}
              </span>
            </span>
          </Button>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="flex justify-between">
              <span className="font-medium">{t("One-liner")}</span>
              <span className="text-xs text-muted">{tagline.length}/80</span>
            </span>
            <Input
              value={tagline}
              maxLength={80}
              onChange={(e) => setTagline(e.target.value)}
              placeholder={TAGLINES[app.kind][0]}
              className={`${inputClass} text-sm ${tagline.trim() && !valid ? "border-warn-line" : ""}`}
            />
            {/* Say why Publish is off instead of leaving a silent grey button. */}
            <span
              className={`text-xs ${tagline.trim() && !valid ? "text-warn" : "text-muted"}`}
            >
              {valid
                ? t("Say what the app does, in plain words.")
                : t("Write at least {n} more characters, or generate one.", {
                    n: 6 - tagline.trim().length,
                  })}
            </span>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t("Logo")}</span>
              <AppLogo app={app} art={logo} size={72} />
              <Button
                variant="unstyled"
                type="button"
                onClick={() => logoInput.current?.click()}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                <ImagePlus size={12} /> {t("Upload")}
              </Button>
              <Input
                ref={logoInput}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => upload(e.target.files?.[0], "logo")}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-sm font-medium">{t("Banner")}</span>
              <div className="overflow-hidden rounded-xl border border-line">
                <Banner app={app} art={banner} height={72} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="unstyled"
                  type="button"
                  onClick={() => bannerInput.current?.click()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  <ImagePlus size={12} /> {t("Upload")}
                </Button>
                <Input
                  ref={bannerInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => upload(e.target.files?.[0], "banner")}
                />
                <RadioGroup
                  aria-label={t("Banner")}
                  orientation="horizontal"
                  value={banner.image ? "" : banner.color}
                  onValueChange={(color) => {
                    setBanner({
                      color,
                      pattern:
                        banner.pattern === "none" ? "dots" : banner.pattern,
                    });
                    setLogo({ color, pattern: "none" });
                  }}
                  className="ml-auto flex gap-1"
                >
                  {ART_COLORS.map((c) => (
                    <RadioGroupItem
                      key={c}
                      value={c}
                      aria-label={c}
                      className={`h-5 w-5 rounded-full ring-offset-2 ring-offset-surface ${banner.color === c && !banner.image ? "ring-2 ring-accent" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
            {current && (
              <Button
                variant="ghost"
                onClick={() => {
                  publishListing(app.id, null);
                  toast(t("Removed from the marketplace"));
                  onClose();
                }}
              >
                {t("Remove from marketplace")}
              </Button>
            )}
            <Button
              className="ml-auto"
              onClick={publish}
              disabled={!valid}
              title={valid ? undefined : t("Add a one-liner first")}
            >
              <Store size={16} /> {current ? t("Save listing") : t("Publish")}
            </Button>
          </div>
        </div>

        <aside className="border-t border-line bg-background p-5 sm:p-6 md:w-80 md:border-l md:border-t-0">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
            {t("How it will look")}
          </p>
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <Banner app={app} art={banner} height={110} />
            <div className="px-4 pb-4">
              <AppLogo
                app={app}
                art={logo}
                size={52}
                className="relative z-10 -mt-7 border-4 border-surface"
              />
              <p className="mt-2 truncate text-base font-semibold">
                {app.name}
              </p>
              <p className="line-clamp-2 text-sm text-muted">
                {tagline || t("Your one-liner goes here")}
              </p>
              <p className="mt-2 text-xs text-muted">
                {t(KIND_LABELS[app.kind])} · {t("by")}{" "}
                {app.maker?.name ?? "you"}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
