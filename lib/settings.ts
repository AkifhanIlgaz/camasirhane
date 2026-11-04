"use client";

import type { PricingSettings } from "@/types";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebase";

export const defaultPricing: PricingSettings = { washPrice: 50, dryPrice: 25 };

/** Fiyat dokümanı henüz yoksa varsayılanlar döner. Programlar `lib/programs.ts` içindedir. */
export function useSettings() {
  const [pricing, setPricing] = useState<PricingSettings>(defaultPricing);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onSnapshot(
        doc(db, "settings", "pricing"),
        (snap) => {
          setPricing(
            snap.exists() ? (snap.data() as PricingSettings) : defaultPricing,
          );
          setLoading(false);
        },
        () => setLoading(false),
      ),
    [],
  );

  return { pricing, loading };
}
