import Link from "next/link";
import { ArrowLeft, Boxes } from "lucide-react";
import { buttonClass } from "@/components/ui/button-variants";

export default function AppNotFound() {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-5 grid size-12 place-items-center rounded-2xl border border-line bg-surface text-muted">
        <Boxes size={22} aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">App not found</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
        This app may have been removed, or the link may be incorrect.
      </p>
      <Link href="/studio/apps" className={`${buttonClass("secondary", "md")} mt-6`}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to My apps
      </Link>
    </section>
  );
}
