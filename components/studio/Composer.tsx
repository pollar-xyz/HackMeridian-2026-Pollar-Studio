import { ComposerState, ComposerTabs, ComposerPanel } from "./composer/ComposerState";
import { ComposerInfo } from "./composer/ComposerInfo";
import { ComposerTargets } from "./composer/ComposerTargets";
import { ComposerInput } from "./composer/ComposerInput";
import { ComposerSubmit } from "./composer/ComposerSubmit";
import { ComposerPaymentOptions } from "./composer/ComposerPaymentOptions";

export function Composer({ autoFocus }: { autoFocus?: boolean }) {
  return (
    <ComposerState canSubmit>
      <div className="flex flex-col gap-2">
        <ComposerTabs>
          <ComposerTargets />
          <ComposerPanel>
            <ComposerInput autoFocus={autoFocus} />
            <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 px-1">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <ComposerInfo />
                <ComposerPaymentOptions />
              </div>
              <ComposerSubmit />
            </div>
          </ComposerPanel>
        </ComposerTabs>
      </div>
    </ComposerState>
  );
}
