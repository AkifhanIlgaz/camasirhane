// 4 çamaşır + 4 kurutma makinesi yazar (sabit id'li, tekrar çalıştırmak güvenlidir).
// Muhasebeci hesabıyla (kurallar gereği makineyi sadece muhasebeci ekler) çalıştırın:
//   SEED_USERNAME=kullanici SEED_PASSWORD=sifre node --env-file=.env.local scripts/seed-machines.mjs
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

// Verilmezse .env.local'deki geliştirme muhasebeci hesabı kullanılır.
const SEED_USERNAME =
  process.env.SEED_USERNAME ?? process.env.NEXT_PUBLIC_DEV_MUHASEBECI_USERNAME;
const SEED_PASSWORD =
  process.env.SEED_PASSWORD ?? process.env.NEXT_PUBLIC_DEV_MUHASEBECI_PASSWORD;

if (!SEED_USERNAME || !SEED_PASSWORD) {
  console.error("SEED_USERNAME ve SEED_PASSWORD gerekli.");
  process.exit(1);
}

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

await signInWithEmailAndPassword(
  getAuth(app),
  `${SEED_USERNAME.trim().toLowerCase()}@camasirhane.local`,
  SEED_PASSWORD,
);

const db = getFirestore(app);

for (const [type, prefix, label] of [
  ["camasir", "camasir", "Çamaşır"],
  ["kurutma", "kurutma", "Kurutma"],
]) {
  for (let i = 1; i <= 4; i++) {
    const ref = doc(db, "machines", `${prefix}-${i}`);

    // Varsa dokunma (dolu bir makinenin requestId'si silinmesin).
    if (!(await getDoc(ref)).exists()) {
      await setDoc(ref, { name: `${label} ${i}`, type, requestId: null });
    }
  }
}

console.log("8 makine yazıldı.");
process.exit(0);
