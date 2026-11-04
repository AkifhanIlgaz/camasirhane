"use client";

import { type FormEvent, useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { Button, Card, Input, Label, Spinner, TextField } from "@heroui/react";

import { db } from "@/lib/firebase";
import { useSettings } from "@/lib/settings";

const toNumber = (value: string) => Number(value.replace(",", "."));

export function SettingsTab() {
  const { pricing, loading } = useSettings();

  const [washPrice, setWashPrice] = useState("");
  const [dryPrice, setDryPrice] = useState("");
  const [priceMsg, setPriceMsg] = useState<string | null>(null);
  const [savingPrice, setSavingPrice] = useState(false);

  // Ayarlar değiştikçe (ilk yükleme dahil) formu güncel değerlerle doldur.
  useEffect(() => {
    if (loading) return;
    setWashPrice(String(pricing.washPrice));
    setDryPrice(String(pricing.dryPrice));
  }, [loading, pricing]);

  const savePricing = async (e: FormEvent) => {
    e.preventDefault();
    const wash = toNumber(washPrice);
    const dry = toNumber(dryPrice);

    if (
      !Number.isFinite(wash) ||
      wash < 0 ||
      !Number.isFinite(dry) ||
      dry < 0
    ) {
      setPriceMsg("Geçerli fiyatlar girin.");

      return;
    }

    setSavingPrice(true);
    try {
      await setDoc(doc(db, "settings", "pricing"), {
        washPrice: wash,
        dryPrice: dry,
      });
      setPriceMsg("Fiyatlar kaydedildi.");
    } catch {
      setPriceMsg("Kaydedilemedi. Tekrar deneyin.");
    } finally {
      setSavingPrice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Card.Header>
          <Card.Title>Fiyatlar</Card.Title>
          <Card.Description>
            Kurutma, yıkama ücretine eklenen ek ücrettir.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <form className="flex flex-col gap-4" onSubmit={savePricing}>
            <TextField
              fullWidth
              isRequired
              value={washPrice}
              onChange={setWashPrice}
            >
              <Label>Yıkama fiyatı (₺)</Label>
              <Input inputMode="decimal" />
            </TextField>
            <TextField
              fullWidth
              isRequired
              value={dryPrice}
              onChange={setDryPrice}
            >
              <Label>Kurutma ek ücreti (₺)</Label>
              <Input inputMode="decimal" />
            </TextField>
            {priceMsg && <p className="text-sm text-muted">{priceMsg}</p>}
            <Button isPending={savingPrice} type="submit">
              Fiyatları kaydet
            </Button>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
