// Toplu hesap açar: talebe 1..110 ve 2 çamaşırcı (Auth hesabı + users/{uid} dokümanı).
// Şifreler rastgele üretilir ve hesaplar.csv dosyasına yazılır (.gitignore'da).
// Muhasebeci hesabıyla çalıştırın:
//   ADMIN_USERNAME=muhasebeci ADMIN_PASSWORD='...' \
//   node --env-file=.env.local scripts/create-bulk-users.mjs
// Var olan hesaplar atlanır (şifreleri değiştirilmez, CSV'ye yazılmaz).
import { randomInt } from "node:crypto";
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";

const STUDENT_COUNT = 110;
const CAMASIRCI = ["camasirci1", "camasirci2"];
const CSV = "hesaplar.csv";

const { ADMIN_USERNAME, ADMIN_PASSWORD, NEXT_PUBLIC_FIREBASE_API_KEY: apiKey } =
  process.env;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error("ADMIN_USERNAME ve ADMIN_PASSWORD gerekli.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const toEmail = (name) => `${name.trim().toLowerCase()}@camasirhane.local`;

// Karışabilecek karakterler (0/O, 1/l/I) çıkarıldı.
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const randomPassword = () =>
  Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

const app = initializeApp({
  apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
await signInWithEmailAndPassword(getAuth(app), toEmail(ADMIN_USERNAME), ADMIN_PASSWORD);
const db = getFirestore(app);

if (!existsSync(CSV)) writeFileSync(CSV, "rol,kullanici_adi,sifre\n");

const accounts = [
  ...Array.from({ length: STUDENT_COUNT }, (_, i) => ["talebe", String(i + 1)]),
  ...CAMASIRCI.map((name) => ["camasirci", name]),
];

let created = 0;
let skipped = 0;

for (const [role, username] of accounts) {
  const password = randomPassword();
  // Oturumu bozmadan yeni Auth hesabı açmak için REST API kullanılır.
  // Firebase kısa sürede çok hesapta TOO_MANY_ATTEMPTS_TRY_LATER döner; bekleyip tekrar denenir.
  let res;
  let body;
  for (let attempt = 1; ; attempt++) {
    res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: toEmail(username), password, returnSecureToken: false }),
      },
    );
    body = await res.json();
    if (body.error?.message !== "TOO_MANY_ATTEMPTS_TRY_LATER" || attempt >= 10) break;
    console.log(`Sınıra takıldı, 60 sn bekleniyor (deneme ${attempt}/10)...`);
    await sleep(60_000);
  }
  await sleep(1000);

  if (!res.ok) {
    if (body.error?.message === "EMAIL_EXISTS") {
      skipped++;
      console.log(`Atlandı (zaten var): ${role} ${username}`);
      continue;
    }
    console.error(`Hata (${role} ${username}):`, body.error?.message);
    process.exit(1);
  }

  // Şifreyi önce kaydet; doküman yazımı patlasa bile kaybolmasın.
  appendFileSync(CSV, `${role},${username},${password}\n`);

  await setDoc(
    doc(db, "users", body.localId),
    role === "talebe"
      ? { role, username, studentNo: username, balance: 0 }
      : { role, username },
  );
  created++;
  console.log(`Oluşturuldu: ${role} ${username}`);
}

console.log(`\nBitti. Oluşturulan: ${created}, atlanan: ${skipped}. Şifreler: ${CSV}`);
process.exit(0);
