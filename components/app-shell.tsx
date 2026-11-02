"use client";

import type { ReactNode } from "react";
import type { Role } from "@/types";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@heroui/react";

import { LocaleScope, useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { roleHome } from "@/lib/roles";
import { ChangePassword } from "@/components/change-password";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      {children}
    </div>
  );
}

function Header({ role, onLogout }: { role: Role; onLogout: () => void }) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between border-b border-separator bg-background/70 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      <div className="flex items-center gap-2">
        <Logo />
        <div className="leading-tight">
          <p className="text-sm font-bold">{t("brand")}</p>
          <p className="text-xs text-muted">{t(`role.${role}`)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitch />
        <ChangePassword />
        <Button size="sm" variant="tertiary" onPress={onLogout}>
          {t("shell.logout")}
        </Button>
      </div>
    </header>
  );
}

function NoProfile({ onLogout }: { onLogout: () => void }) {
  const { t } = useI18n();

  return (
    <FullScreen>
      <p className="font-medium">{t("shell.noProfile")}</p>
      <p className="text-sm text-muted">{t("shell.noProfileHint")}</p>
      <Button variant="tertiary" onPress={onLogout}>
        {t("shell.logoutLong")}
      </Button>
    </FullScreen>
  );
}

/** Giriş ve rol kontrolü yapar; sadece `role` rolündeki kullanıcıya içeriği gösterir. */
export function AppShell({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, profile, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (profile && profile.role !== role)
      router.replace(roleHome[profile.role]);
  }, [loading, user, profile, role, router]);

  if (loading || !user || (profile && profile.role !== role)) {
    return (
      <FullScreen>
        <Spinner />
      </FullScreen>
    );
  }

  if (!profile) {
    return (
      <LocaleScope mode={role === "talebe" ? "user" : "tr"}>
        <NoProfile onLogout={() => logout()} />
      </LocaleScope>
    );
  }

  return (
    <LocaleScope mode={role === "talebe" ? "user" : "tr"}>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <Header role={profile.role} onLogout={() => logout()} />
        <main className="flex-1 px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
      </div>
    </LocaleScope>
  );
}
