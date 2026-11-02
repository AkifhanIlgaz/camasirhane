"use client";

import type { Locale } from "@/lib/i18n/messages";

import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
} from "firebase/messaging";

import { app, db } from "@/lib/firebase";
import { isIOS, isStandalone } from "@/lib/pwa";

/** Bu cihazın token'ı; çıkışta silinsin diye saklanır. */
const TOKEN_KEY = "fcm-token";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type PushState =
  /** Tarayıcı desteklemiyor. */
  | "unsupported"
  /** iPhone/iPad: önce ana ekrana eklenmeli. */
  | "needs-install"
  | NotificationPermission;

export async function getPushState(): Promise<PushState> {
  if (isIOS() && !isStandalone()) return "needs-install";

  const supported =
    !!VAPID_KEY &&
    "serviceWorker" in navigator &&
    "Notification" in window &&
    (await isSupported().catch(() => false));

  return supported ? Notification.permission : "unsupported";
}

const readStored = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const writeStored = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Depolama kapalıysa çıkışta token silinemez; gönderimde geçersiz token'lar temizlenir.
  }
};

/**
 * İzin verilmişse bu cihazın token'ını `users/{uid}/fcmTokens/{token}` altına yazar.
 * Dil de saklanır; bildirim talebenin seçtiği dilde gider.
 */
export async function registerPush(uid: string, locale: Locale) {
  const registration = await navigator.serviceWorker.register("/sw.js");
  const token = await getToken(getMessaging(app), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  const previous = readStored();

  if (previous && previous !== token) {
    await deleteDoc(doc(db, "users", uid, "fcmTokens", previous)).catch(
      () => {},
    );
  }

  await setDoc(doc(db, "users", uid, "fcmTokens", token), {
    locale,
    updatedAt: serverTimestamp(),
  });
  writeStored(token);
}

/** Çıkışta çağrılır: cihaz, sonraki kullanıcıya önceki kişinin bildirimlerini göstermesin. */
export async function unregisterPush(uid: string) {
  const token = readStored();

  if (!token) return;
  writeStored(null);
  await deleteDoc(doc(db, "users", uid, "fcmTokens", token)).catch(() => {});
  await deleteToken(getMessaging(app)).catch(() => {});
}
