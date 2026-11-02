// Varsayılan ayarları (settings/pricing) yazar.
// Muhasebeci hesabıyla çalıştırın (rules gereği sadece muhasebeci yazabilir):
//   SEED_USERNAME=kullanici SEED_PASSWORD=sifre node --env-file=.env.local scripts/seed.mjs
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";

const { SEED_USERNAME, SEED_PASSWORD } = process.env;

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

await setDoc(doc(db, "settings", "pricing"), { washPrice: 50, dryPrice: 25 });

console.log("Ayarlar yazıldı.");
process.exit(0);
