"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";
import { AssetIcon } from "@/components/AssetIcons";
import { MultiDropdown } from "@/components/ui/Dropdown";
import { useT } from "@/lib/i18n";
import { ASSETS, RAIL_COUNTRIES, SOON_COUNTRIES, type Asset, type RailCountry } from "@/lib/mock/types";

const ASSET_NOTES: Record<Asset, string> = {
  USDC: "Stablecoin, default for payments",
  USDT: "Stablecoin, new on Stellar",
  XLM: "Native asset, lowest fees",
};

export function ComposerPaymentOptions() {
  const [assets, setAssets] = useState<Asset[]>(["USDC"]);
  const [countries, setCountries] = useState<RailCountry[]>(["BO", "BR", "AR"]);
  const t = useT();
  return <>
            <MultiDropdown<Asset>
              label={assets.length ? assets.join(" · ") : t("XLM only")}
              icon={
                <span className="flex -space-x-1">
                  {(assets.length ? assets : (["XLM"] as Asset[])).map((a) => (
                    <span
                      key={a}
                      className="rounded-full ring-2 ring-background"
                    >
                      <AssetIcon asset={a} size={16} />
                    </span>
                  ))}
                </span>
              }
              values={assets}
              onChange={setAssets}
              allowEmpty
              hint={
                assets.length ? (
                  <>
                    {t(
                      "Users can pay with any of these. The first one is what you receive.",
                    )}{" "}
                    <span className="text-foreground">
                      {t("Pick none and your app works only with XLM.")}
                    </span>
                  </>
                ) : (
                  <span className="text-foreground">
                    {t(
                      "No stablecoin picked. Your app will take and pay out everything in XLM, Stellar's native asset. Its price moves, so balances are not pegged to a currency.",
                    )}
                  </span>
                )
              }
              items={ASSETS.map((a) => ({
                value: a,
                label: a,
                note: t(ASSET_NOTES[a]),
                icon: <AssetIcon asset={a} size={20} />,
              }))}
            />
            <MultiDropdown<RailCountry>
              label={
                countries.length === 0
                  ? t("No bank rails")
                  : countries.length === RAIL_COUNTRIES.length
                    ? t("3 countries")
                    : countries
                        .map(
                          (c) =>
                            RAIL_COUNTRIES.find((r) => r.code === c)?.currency,
                        )
                        .join(" · ")
              }
              icon={
                countries.length ? (
                  <span className="text-sm leading-none">
                    {countries
                      .map(
                        (c) => RAIL_COUNTRIES.find((r) => r.code === c)?.flag,
                      )
                      .join("")}
                  </span>
                ) : (
                  <Landmark size={14} className="text-muted" />
                )
              }
              values={countries}
              onChange={setCountries}
              allowEmpty
              hint={
                countries.length ? (
                  <>
                    {t("Where users can add money and cash out to a bank.")}{" "}
                    <span className="text-foreground">
                      {t("Optional, pick none to skip banks.")}
                    </span>
                  </>
                ) : (
                  <span className="text-foreground">
                    {t(
                      "No country picked. Users add and withdraw money only from Stellar wallets and exchanges, with no bank or identity check.",
                    )}
                  </span>
                )
              }
              soonLabel={t("Soon")}
              items={[
                ...RAIL_COUNTRIES.map((c) => ({
                  value: c.code,
                  label: `${t(c.name)} · ${c.currency}`,
                  note: t("{rail} in, bank cashout out", { rail: c.rail }),
                  icon: <span className="text-lg leading-none">{c.flag}</span>,
                })),
                // Coming soon: listed so makers see where Pollar is going, but not selectable yet.
                ...SOON_COUNTRIES.map((c) => ({
                  value: c.code as RailCountry,
                  label: `${t(c.name)} · ${c.currency}`,
                  note: t("Coming soon"),
                  soon: true,
                  icon: <span className="text-lg leading-none">{c.flag}</span>,
                })),
              ]}
            />
  </>;
}
