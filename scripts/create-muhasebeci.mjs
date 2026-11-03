// Muhasebeci hesabı açar (Auth hesabı + users/{uid} dokümanı).
// Şifre rastgele üretilir ve hesaplar.csv dosyasının sonuna eklenir (.gitignore'da).
// Firestore kuralları muhasebeci dokümanı açılmasına izin vermediği için
// Admin SDK (FIREBASE_SERVICE_ACCOUNT_KEY) ile çalışır; giriş gerekmez:
//   node --env-file=.env.local scripts/create-muhasebeci.mjs <kullanıcıAdı>
import { randomInt } from "node:crypto";
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const CSV = "hesaplar.csv";
const [username] = process.argv.slice(2);

if (!username) {
  console.error("Kullanım: node --env-file=.env.local scripts/create-muhasebeci.mjs <kullanıcıAdı>");
  process.exit(1);
}

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!raw) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY tanımlı değil.");
  process.exit(1);
}

// Karışabilecek karakterler (0/O, 1/l/I) çıkarıldı.
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const password = Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

initializeApp({ credential: cert(JSON.parse(raw)) });

const name = username.trim().toLowerCase();
const email = `${name}@camasirhane.local`;

let user;
try {
  user = await getAuth().createUser({ email, password });
} catch (err) {
  if (err.code === "auth/email-already-exists") {
    console.error(`Bu kullanıcı adı zaten var: ${name}`);
  } else {
    console.error("Auth hesabı açılamadı:", err.message);
  }
  process.exit(1);
}

// Şifreyi önce kaydet; doküman yazımı patlasa bile kaybolmasın.
if (!existsSync(CSV)) writeFileSync(CSV, "rol,kullanici_adi,sifre\n");
appendFileSync(CSV, `muhasebeci,${name},${password}\n`);

await getFirestore()
  .doc(`users/${user.uid}`)
  .set({ role: "muhasebeci", username: name });

console.log(`muhasebeci oluşturuldu: ${name} (uid: ${user.uid}). Şifre: ${CSV}`);
process.exit(0);
