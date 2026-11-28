"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client-side canonical IA redirect compatible with Next.js static export (`output: "export"`).
 */
export default function SchedulingRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/scheduler/shifts/board");
  }, [router]);

  return (
    <div className="p-8 text-center text-sm text-slate-500">
      Redirecting to Unified Shift Board...
    </div>
  );
}
