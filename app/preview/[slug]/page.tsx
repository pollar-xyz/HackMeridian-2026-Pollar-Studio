import { Suspense } from "react";
import { GeneratedApp } from "@/components/generated/GeneratedApp";
import { Spinner } from "@/components/Modal";

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <GeneratedApp />
    </Suspense>
  );
}
