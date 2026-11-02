"use client";

import { useEffect, useState } from "react";
import { Alert, Button } from "@heroui/react";

import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { getPushState, type PushState, registerPush } from "@/lib/push";

/** Çamaşır hazır olunca bildirim gelmesi için izin ister; izin varsa token'ı günceller. */
export function NotificationPrompt() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [state, setState] = useState<PushState | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getPushState().then(setState);
  }, []);

  // İzin verilmişse token'ı (ve dili) her açılışta tazele.
  useEffect(() => {
    if (state === "granted" && user) {
      registerPush(user.uid, locale).catch((e) => console.error(e));
    }
  }, [state, user, locale]);

  const enable = async () => {
    if (!user) return;
    setPending(true);
    setFailed(false);
    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") await registerPush(user.uid, locale);
      setState(permission);
    } catch (e) {
      console.error(e);
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  // iPhone'da önce ana ekrana eklenmeli; yönergeyi InstallPrompt gösterir.
  if (state === "needs-install") return null;

  if (state === "denied") {
    return (
      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{t("notif.deniedTitle")}</Alert.Title>
          <Alert.Description>{t("notif.denied")}</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  if (state !== "default") return null;

  return (
    <Alert status="accent">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t("notif.title")}</Alert.Title>
        <Alert.Description>
          {failed ? t("notif.error") : t("notif.desc")}
        </Alert.Description>
        <Button className="mt-2" isPending={pending} size="sm" onPress={enable}>
          {t("notif.enable")}
        </Button>
      </Alert.Content>
    </Alert>
  );
}
