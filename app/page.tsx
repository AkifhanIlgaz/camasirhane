"use client";

import { AppShell } from "@/components/app-shell";
import { History } from "@/components/talebe/history";
import { RequestForm } from "@/components/talebe/request-form";

export default function Home() {
  return (
    <AppShell role="talebe">
      <div className="flex flex-col gap-6">
        <RequestForm />
        <History />
      </div>
    </AppShell>
  );
}
