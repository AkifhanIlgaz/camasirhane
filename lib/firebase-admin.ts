import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

/**
 * Sadece sunucuda (API route) kullanılır. `FIREBASE_SERVICE_ACCOUNT_KEY`:
 * Firebase Console → Proje ayarları → Hizmet hesapları → yeni özel anahtar (JSON'un tamamı).
 */
function adminApp() {
  if (getApps().length) return getApp();

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY tanımlı değil");

  return initializeApp({ credential: cert(JSON.parse(raw)) });
}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());
export const adminMessaging = () => getMessaging(adminApp());
