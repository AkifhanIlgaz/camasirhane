import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb, adminMessaging } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type Locale = "tr" | "en" | "ar";
type Text = { title: string; body: string };

/** Kurutma istendiyse: yıkama bitti, çamaşır kurutma makinesine alındı. */
const DRYING: Record<Locale, Text> = {
  tr: {
    title: "Yıkama bitti",
    body: "Çamaşırınız kurutmaya alındı. Kuruyunca tekrar haber vereceğiz.",
  },
  en: {
    title: "Washing is done",
    body: "Your laundry is now drying. We'll let you know when it's dry.",
  },
  ar: {
    title: "انتهى الغسيل",
    body: "غسيلك الآن في المجفف. سنخبرك عندما يجف.",
  },
};

/** Kurutma istenmediyse: çamaşır yıkama makinesinden ıslak çıkar. */
const WASHED: Record<Locale, Text> = {
  tr: {
    title: "Çamaşırınız yıkandı",
    body: "Yıkama bitti. Çamaşırınızı teslim alıp kurutabilirsiniz.",
  },
  en: {
    title: "Your laundry is washed",
    body: "Washing is done. You can pick up your laundry and dry it.",
  },
  ar: {
    title: "تم غسل غسيلك",
    body: "انتهى الغسيل. يمكنك استلام غسيلك وتجفيفه.",
  },
};

/** Kurutma istendiyse: çamaşır kurutma makinesinden kuru çıkar. */
const DRIED: Record<Locale, Text> = {
  tr: {
    title: "Çamaşırınız kurudu",
    body: "Yıkama ve kurutma bitti. Çamaşırınızı teslim alabilirsiniz.",
  },
  en: {
    title: "Your laundry is dry",
    body: "Washing and drying are done. You can pick up your laundry.",
  },
  ar: {
    title: "غسيلك جاف",
    body: "انتهى الغسيل والتجفيف. يمكنك استلام غسيلك الآن.",
  },
};

/** Bu hatalarda token artık geçersizdir ve silinir. */
const STALE_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

const json = (body: object, status = 200) => Response.json(body, { status });

/**
 * Çamaşırcı isteği "kurutuluyor" veya "bitti" yaptıktan sonra çağırır; talebenin cihazlarına
 * isteğin o anki durumuna uygun bildirimi gönderir. Her aşama için en fazla bir kez gönderilir
 * (`dryingNotifiedAt`, `notifiedAt`).
 */
export async function POST(req: Request) {
  const idToken = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const { requestId } = (await req.json().catch(() => ({}))) as {
    requestId?: unknown;
  };

  if (!idToken || typeof requestId !== "string" || !requestId) {
    return json({ error: "bad-request" }, 400);
  }

  let callerUid: string;

  try {
    callerUid = (await adminAuth().verifyIdToken(idToken)).uid;
  } catch {
    return json({ error: "unauthenticated" }, 401);
  }

  const db = adminDb();
  const caller = await db.doc(`users/${callerUid}`).get();

  if (caller.get("role") !== "camasirci") {
    return json({ error: "forbidden" }, 403);
  }

  const requestRef = db.doc(`requests/${requestId}`);

  // Aynı istek için iki kez gönderilmesin: işaret transaction içinde konur.
  const claim = await db.runTransaction(async (tx) => {
    const snap = await tx.get(requestRef);

    if (!snap.exists) return { error: "not-found" as const };

    const status = snap.get("status");
    const flag =
      status === "kurutuluyor"
        ? "dryingNotifiedAt"
        : status === "bitti"
          ? "notifiedAt"
          : null;

    if (!flag) return { error: "not-notifiable" as const };
    if (snap.get(flag)) return { skipped: true as const };
    tx.update(requestRef, { [flag]: FieldValue.serverTimestamp() });

    const texts =
      status === "kurutuluyor"
        ? DRYING
        : snap.get("dry") === true
          ? DRIED
          : WASHED;

    return { uid: snap.get("uid") as string, flag, texts };
  });

  if ("error" in claim) return json({ error: claim.error }, 409);
  if ("skipped" in claim) return json({ sent: 0, skipped: true });

  try {
    const tokens = await db.collection(`users/${claim.uid}/fcmTokens`).get();

    if (tokens.empty) return json({ sent: 0 });

    const { texts } = claim;
    const result = await adminMessaging().sendEach(
      tokens.docs.map((d) => ({
        token: d.id,
        notification: texts[d.get("locale") as Locale] ?? texts.tr,
        // Bildirime dokununca açılacak sayfa (bkz. public/sw.js).
        data: { requestId, link: "/" },
      })),
    );

    await Promise.all(
      result.responses.map((r, i) =>
        !r.success && STALE_CODES.has(r.error?.code ?? "")
          ? tokens.docs[i].ref.delete()
          : null,
      ),
    );

    return json({ sent: result.successCount });
  } catch (e) {
    // Gönderilemediyse işareti geri al ki çamaşırcının tekrar denemesi işe yarasın.
    await requestRef
      .update({ [claim.flag]: FieldValue.delete() })
      .catch(() => {});
    console.error(e);

    return json({ error: "send-failed" }, 500);
  }
}
