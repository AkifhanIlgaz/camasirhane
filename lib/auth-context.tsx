"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { unregisterPush } from "@/lib/push";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/types";

interface AuthState {
  user: User | null;
  /** `users/{uid}` dokümanı; doküman yoksa null (hesap kullanılamaz). */
  profile: UserProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Kullanıcı adı, Firebase Auth için dahili bir e-postaya çevrilir. */
const toEmail = (username: string) =>
  `${username.trim().toLowerCase()}@camasirhane.local`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (nextUser) => {
      unsubProfile?.();
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setProfile(null);
        setProfileReady(true);

        return;
      }

      setProfileReady(false);
      unsubProfile = onSnapshot(
        doc(db, "users", nextUser.uid),
        (snap) => {
          setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
          setProfileReady(true);
        },
        () => {
          setProfile(null);
          setProfileReady(true);
        },
      );
    });

    return () => {
      unsubProfile?.();
      unsubAuth();
    };
  }, []);

  const value: AuthState = {
    user,
    profile,
    loading: !authReady || !profileReady,
    login: async (username, password) => {
      await signInWithEmailAndPassword(auth, toEmail(username), password);
    },
    logout: async () => {
      // Bu cihaza önceki kullanıcının bildirimleri gitmesin.
      if (user) await unregisterPush(user.uid).catch(() => {});
      await signOut(auth);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı");

  return ctx;
}
