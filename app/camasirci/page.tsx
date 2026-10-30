"use client";

import { AppShell } from "@/components/app-shell";
import { CamasirciPanel } from "@/components/camasirci/panel";

export default function CamasirciPage() {
  return (
    <AppShell role="camasirci">
      <CamasirciPanel />
    </AppShell>
  );
}
