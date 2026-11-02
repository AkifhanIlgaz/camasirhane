import { FieldValue } from "firebase-admin/firestore";

import { adminAuth, adminDb, adminMessaging } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const TEXT = {
  tr: {
    title: "Çamaşırınız hazır",
    body: "Çamaşırınızı teslim alabilirsiniz.",
  },
  en: { title: "Your laundry is ready", body: "You can pick up your laundry." },
  ar: { title: "غسيلك جاهز", body: "يمكنك استلام غسيلك الآن." },
} as const;

/** Bu hatalarda token artık geçersizdir ve silinir. */
const STALE_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

const json = (body: object, status = 200) => Response.json(body, { status });

/**
 * Çamaşırcı isteği "bitti" yaptıktan sonra çağırır; talebenin cihazlarına bildirim gönderir.
 * Her istek için en fazla bir kez gönderilir (`notifiedAt`).
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
    if (snap.get("status") !== "bitti")
      return { error: "not-finished" as const };
    if (snap.get("notifiedAt")) return { skipped: true as const };
    tx.update(requestRef, { notifiedAt: FieldValue.serverTimestamp() });

    return { uid: snap.get("uid") as string };
  });

  if ("error" in claim) return json({ error: claim.error }, 409);
  if ("skipped" in claim) return json({ sent: 0, skipped: true });

  try {
    const tokens = await db.collection(`users/${claim.uid}/fcmTokens`).get();

    if (tokens.empty) return json({ sent: 0 });

    const result = await adminMessaging().sendEach(
      tokens.docs.map((d) => ({
        token: d.id,
        notification: TEXT[d.get("locale") as keyof typeof TEXT] ?? TEXT.tr,
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
      .update({ notifiedAt: FieldValue.delete() })
      .catch(() => {});
    console.error(e);

    return json({ error: "send-failed" }, 500);
  }
}
