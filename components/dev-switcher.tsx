"use client";

import { useState } from "react";
import { Button } from "@heroui/react";

import { useAuth } from "@/lib/auth-context";
import { roleLabel } from "@/lib/roles";
import type { Role } from "@/types";

/** `process.env.NEXT_PUBLIC_*` değerleri derleme sırasında satır içine alındığı için tek tek yazılmalı. */
type Account = { role: Role; username?: string; password?: string };

/** Sadece geliştirmede ya da demo modunda çağrılır; normal üretim derlemesinde bu dal silinir ve şifreler pakete girmez. */
const getAccounts = (): Account[] => [
  {
    role: "muhasebeci",
    username: process.env.NEXT_PUBLIC_DEV_MUHASEBECI_USERNAME,
    password: process.env.NEXT_PUBLIC_DEV_MUHASEBECI_PASSWORD,
  },
  {
    role: "camasirci",
    username: process.env.NEXT_PUBLIC_DEV_CAMASIRCI_USERNAME,
    password: process.env.NEXT_PUBLIC_DEV_CAMASIRCI_PASSWORD,
  },
  {
    role: "talebe",
    username: process.env.NEXT_PUBLIC_DEV_TALEBE_USERNAME,
    password: process.env.NEXT_PUBLIC_DEV_TALEBE_PASSWORD,
  },
];

/**
 * Geliştirmede ve `NEXT_PUBLIC_DEMO_MODE=true` ile derlenen demo yayınında görünür; tek tıkla rol değiştirir.
 * Demo yayınında şifreler pakete girer, bu yüzden yalnızca sahte veri içeren ayrı bir Firebase projesiyle kullanın.
 */
export function DevSwitcher() {
  const { profile, login } = useAuth();
  const [pending, setPending] = useState<Role | null>(null);

  if (
    process.env.NODE_ENV !== "development" &&
    process.env.NEXT_PUBLIC_DEMO_MODE !== "true"
  ) {
    return null;
  }

  const available = getAccounts().filter((a) => a.username && a.password);

  if (available.length === 0) return null;

  const switchTo = async (a: Account) => {
    setPending(a.role);
    try {
      await login(a.username!, a.password!);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-full bg-overlay p-1 shadow-overlay">
      {available.map((a) => (
        <Button
          key={a.role}
          isPending={pending === a.role}
          size="sm"
          variant={profile?.role === a.role ? "primary" : "ghost"}
          onPress={() => switchTo(a)}
        >
          {roleLabel[a.role]}
        </Button>
      ))}
    </div>
  );
}
