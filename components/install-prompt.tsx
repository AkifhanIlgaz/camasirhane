"use client";

import type { MessageKey } from "@/lib/i18n";

import { useEffect, useState } from "react";
import { Alert, Button, CloseButton, toast } from "@heroui/react";

import { useI18n } from "@/lib/i18n";
import {
  getInstallContext,
  type InstallContext,
  isStandalone,
} from "@/lib/pwa";

/** Chrome/Android'in kurulum olayı (standart tiplerde yok). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "install-dismissed-at";
/** Kapatılınca bu kadar süre tekrar gösterilmez. */
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

const recentlyDismissed = () => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));

    return Number.isFinite(at) && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
};

const DESCRIPTION: Record<InstallContext, MessageKey> = {
  inapp: "install.inappDesc",
  "ios-safari": "install.iosDesc",
  "ios-other": "install.iosOtherDesc",
  "android-firefox": "install.firefoxDesc",
  prompt: "install.desc",
};

/**
 * Uygulama ana ekrana eklenmemişse, kullanılan tarayıcıya uygun yönergeyi gösterir.
 * Chrome/Edge/Samsung'da tek dokunuşla ekler; uygulama içi tarayıcıda gerçek tarayıcıya yönlendirir.
 */
export function InstallPrompt() {
  const { t } = useI18n();
  const [mode, setMode] = useState<InstallContext | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    // Kurulabilirlik için service worker kayıtlı olmalı (bildirimler de aynısını kullanır).
    navigator.serviceWorker?.register("/sw.js").catch(() => {});

    const context = getInstallContext();

    // Chrome/Edge: yalnızca tarayıcı kurulabilir dediğinde (olay gelince) gösterilir.
    if (context !== "prompt") {
      setMode(context);

      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("prompt");
    };
    const onInstalled = () => setMode(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mode) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Depolama kapalıysa sadece bu oturumda gizlenir.
    }
    setMode(null);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;

    setDeferred(null);
    if (outcome === "accepted") setMode(null);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success(t("install.copied"));
    } catch {
      // Pano kapalıysa kullanıcı adresi elle kopyalar.
      window.prompt(t("install.copy"), window.location.origin);
    }
  };

  return (
    <Alert className="mb-4" status={mode === "inapp" ? "warning" : "accent"}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          {mode === "inapp" ? t("install.inappTitle") : t("install.title")}
        </Alert.Title>
        <Alert.Description>{t(DESCRIPTION[mode])}</Alert.Description>
        {mode === "prompt" && deferred && (
          <Button className="mt-2" size="sm" onPress={install}>
            {t("install.button")}
          </Button>
        )}
        {mode === "inapp" && (
          <Button className="mt-2" size="sm" onPress={copyLink}>
            {t("install.copy")}
          </Button>
        )}
      </Alert.Content>
      <CloseButton aria-label={t("install.close")} onPress={dismiss} />
    </Alert>
  );
}
