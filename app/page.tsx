"use client";

import { AppShell } from "@/components/app-shell";
import { LanguageSwitch } from "@/components/talebe/language-switch";
import { History } from "@/components/talebe/history";
import { NotificationPrompt } from "@/components/talebe/notifications";
import { RequestForm } from "@/components/talebe/request-form";
import { Tour } from "@/components/talebe/tour";

export default function Home() {
  return (
    <AppShell role="talebe">
      {/* `data-tour`: tanıtma turunda vurgulanan alanlar (bkz. Tour). */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <div className="flex-1" data-tour="language">
            <LanguageSwitch />
          </div>
          <Tour />
        </div>
        <div className="empty:hidden" data-tour="notifications">
          <NotificationPrompt />
        </div>
        <div data-tour="request">
          <RequestForm />
        </div>
        <div data-tour="history">
          <History />
        </div>
      </div>
    </AppShell>
  );
}
