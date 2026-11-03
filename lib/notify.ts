"use client";

import { auth } from "@/lib/firebase";

const RETRY_DELAYS_MS = [0, 2_000, 5_000];

/**
 * Talebeye isteğin o anki durumuna göre bildirim gönderilmesini ister
 * ("kurutmaya alındı" veya "hazır"; bkz. app/api/notify).
 * Ağ hatasında birkaç kez dener; çamaşırcının işini bekletmemek için sonucu beklenmez.
 */
export async function notifyStudent(requestId: string) {
  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    try {
      const idToken = await auth.currentUser?.getIdToken();

      if (!idToken) return false;

      const res = await fetch("/api/notify", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ requestId }),
      });

      // 4xx tekrar denemekle düzelmez.
      if (res.ok || (res.status >= 400 && res.status < 500)) return res.ok;
    } catch {
      // Ağ hatası: tekrar dene.
    }
  }

  return false;
}
