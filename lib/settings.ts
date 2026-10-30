"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { OptionsSettings, PricingSettings } from "@/types";

export const defaultPricing: PricingSettings = { washPrice: 50, dryPrice: 25 };

export const defaultOptions: OptionsSettings = {
  programs: [
    { name: "Pamuklu", minutes: 60 },
    { name: "Sentetik", minutes: 50 },
    { name: "Hassas", minutes: 40 },
    { name: "Hızlı yıkama", minutes: 30 },
  ],
  dryPrograms: [
    { name: "Normal kurutma", minutes: 60 },
    { name: "Hızlı kurutma", minutes: 30 },
  ],
  temperatures: [30, 40, 60, 90],
  spins: [400, 800, 1000, 1200],
};

/** Ayar dokümanları henüz yoksa varsayılanlar döner. */
export function useSettings() {
  const [pricing, setPricing] = useState<PricingSettings>(defaultPricing);
  const [options, setOptions] = useState<OptionsSettings>(defaultOptions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let pricingReady = false;
    let optionsReady = false;
    const done = () => pricingReady && optionsReady && setLoading(false);

    const unsubPricing = onSnapshot(
      doc(db, "settings", "pricing"),
      (snap) => {
        setPricing(snap.exists() ? (snap.data() as PricingSettings) : defaultPricing);
        pricingReady = true;
        done();
      },
      () => {
        pricingReady = true;
        done();
      },
    );
    const unsubOptions = onSnapshot(
      doc(db, "settings", "options"),
      (snap) => {
        setOptions({ ...defaultOptions, ...(snap.data() as Partial<OptionsSettings>) });
        optionsReady = true;
        done();
      },
      () => {
        optionsReady = true;
        done();
      },
    );

    return () => {
      unsubPricing();
      unsubOptions();
    };
  }, []);

  return { pricing, options, loading };
}
