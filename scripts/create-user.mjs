// Talebe veya çamaşırcı hesabı açar (Auth hesabı + users/{uid} dokümanı).
// Muhasebeci hesabıyla çalıştırın:
//   ADMIN_USERNAME=muhasebeci ADMIN_PASSWORD='...' \
//   node --env-file=.env.local scripts/create-user.mjs talebe <talebeNo> <şifre>
//   ADMIN_USERNAME=muhasebeci ADMIN_PASSWORD='...' \
//   node --env-file=.env.local scripts/create-user.mjs camasirci <kullanıcıAdı> <şifre>
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";

const { ADMIN_USERNAME, ADMIN_PASSWORD, NEXT_PUBLIC_FIREBASE_API_KEY: apiKey } =
  process.env;
const [role, username, password] = process.argv.slice(2);

if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !["talebe", "camasirci"].includes(role) || !username || !password) {
  console.error(
    "Kullanım: ADMIN_USERNAME=.. ADMIN_PASSWORD=.. node --env-file=.env.local scripts/create-user.mjs <talebe|camasirci> <kullanıcıAdı> <şifre>",
  );
  process.exit(1);
}

const toEmail = (name) => `${name.trim().toLowerCase()}@camasirhane.local`;

// Oturumu bozmadan yeni Auth hesabı açmak için REST API kullanılır.
const res = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: toEmail(username),
      password,
      returnSecureToken: false,
    }),
  },
);
const created = await res.json();

if (!res.ok) {
  console.error("Auth hesabı açılamadı:", created.error?.message);
  process.exit(1);
}

const app = initializeApp({
  apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

await signInWithEmailAndPassword(getAuth(app), toEmail(ADMIN_USERNAME), ADMIN_PASSWORD);

await setDoc(
  doc(getFirestore(app), "users", created.localId),
  role === "talebe"
    ? { role, username, studentNo: username, balance: 0 }
    : { role, username },
);

console.log(`${role} oluşturuldu: ${username} (uid: ${created.localId})`);
process.exit(0);
