import { Suspense } from "react";
import { AppDetail } from "@/components/studio/AppDetail";
import { Spinner } from "@/components/Modal";

export default function AppDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-20">
          <Spinner />
        </div>
      }
    >
      <AppDetail />
    </Suspense>
  );
}
