import type { Account } from "@/lib/mock/types";
import { GENERATION_LIMIT } from "@/lib/mock/store-constants";
import { CREDIT_COSTS } from "@/lib/mock/jobs";
import { ComposerState, ComposerTabs, ComposerPanel } from "./composer/ComposerState";
import { ComposerInfo } from "./composer/ComposerInfo";
import { ComposerTargets } from "./composer/ComposerTargets";
import { ComposerInput } from "./composer/ComposerInput";
import { ComposerSubmit } from "./composer/ComposerSubmit";
import { ComposerPaymentOptions } from "./composer/ComposerPaymentOptions";
import { ComposerLimitNotice } from "./composer/ComposerLimitNotice";

const MIN_CREDITS =
  CREDIT_COSTS.generating + CREDIT_COSTS.building + CREDIT_COSTS.publishing;

export function Composer({
  account,
  autoFocus,
}: {
  account: Account;
  autoFocus?: boolean;
}) {
  const limitReached =
    (account.plan ?? "free") === "free" &&
    account.generationsUsed >= GENERATION_LIMIT;
  const lowCredits = account.credits < MIN_CREDITS;
  return (
    <ComposerState canSubmit={!limitReached && !lowCredits}>
      <div className="flex flex-col gap-2">
        <ComposerTabs>
          <ComposerTargets />
          <ComposerPanel>
            <ComposerInput autoFocus={autoFocus} />
            <div className="mt-1 flex flex-wrap items-center gap-2 px-1">
              <ComposerInfo />
              <ComposerPaymentOptions />
              <div className="ml-auto flex shrink-0 items-center gap-2">
                <ComposerSubmit credits={MIN_CREDITS} />
              </div>
            </div>
          </ComposerPanel>
          {(limitReached || lowCredits) && (
            <ComposerLimitNotice
              limitReached={limitReached}
              lowCredits={lowCredits}
              credits={account.credits}
              minCredits={MIN_CREDITS}
            />
          )}
        </ComposerTabs>
      </div>
    </ComposerState>
  );
}
