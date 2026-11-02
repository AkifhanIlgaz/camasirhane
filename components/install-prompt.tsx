"use client";

import { useEffect, useState } from "react";
import { Alert, Button, CloseButton } from "@heroui/react";

import { useI18n } from "@/lib/i18n";
import { isIOS, isStandalone } from "@/lib/pwa";

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

/**
 * Uygulama ana ekrana eklenmemişse gösterilir. Android/Chrome'da tek dokunuşla ekler,
 * iPhone'da (otomatik ekleme yok) Safari'deki adımları anlatır.
 */
export function InstallPrompt() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"ios" | "prompt" | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    // Kurulabilirlik için service worker kayıtlı olmalı (bildirimler de aynısını kullanır).
    navigator.serviceWorker?.register("/sw.js").catch(() => {});

    if (isIOS()) {
      setMode("ios");

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

  return (
    <Alert className="mb-4" status="accent">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t("install.title")}</Alert.Title>
        <Alert.Description>
          {mode === "ios" ? t("install.iosDesc") : t("install.desc")}
        </Alert.Description>
        {mode === "prompt" && deferred && (
          <Button className="mt-2" size="sm" onPress={install}>
            {t("install.button")}
          </Button>
        )}
      </Alert.Content>
      <CloseButton aria-label={t("install.close")} onPress={dismiss} />
    </Alert>
  );
}
