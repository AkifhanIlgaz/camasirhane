"use client";

import { type FormEvent, useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import {
  Button,
  Card,
  Description,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";

import { db } from "@/lib/firebase";
import { useSettings } from "@/lib/settings";
import type { WashProgram } from "@/types";

const toNumber = (value: string) => Number(value.replace(",", "."));

const parseNumbers = (value: string) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .map(Number);

const isPositive = (n: number) => Number.isFinite(n) && n > 0;

type ProgramRow = { name: string; minutes: string };

function ProgramsEditor({
  title,
  hint,
  rows,
  onChange,
}: {
  title: string;
  hint: string;
  rows: ProgramRow[];
  onChange: (rows: ProgramRow[]) => void;
}) {
  const update = (i: number, patch: Partial<ProgramRow>) =>
    onChange(rows.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{title}</p>
      {rows.map((p, i) => (
        <div key={i} className="flex items-end gap-2">
          <TextField
            fullWidth
            aria-label="Program adı"
            value={p.name}
            onChange={(v) => update(i, { name: v })}
          >
            <Input placeholder="Program adı" />
          </TextField>
          <TextField
            aria-label="Süre (dakika)"
            className="w-24 shrink-0"
            value={p.minutes}
            onChange={(v) => update(i, { minutes: v })}
          >
            <Input inputMode="numeric" placeholder="dk" />
          </TextField>
          <Button
            isIconOnly
            aria-label="Programı sil"
            variant="tertiary"
            onPress={() => onChange(rows.filter((_, j) => j !== i))}
          >
            ×
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        type="button"
        variant="secondary"
        onPress={() => onChange([...rows, { name: "", minutes: "60" }])}
      >
        Program ekle
      </Button>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}

const toPrograms = (rows: ProgramRow[]): WashProgram[] =>
  rows
    .filter((p) => p.name.trim())
    .map((p) => ({ name: p.name.trim(), minutes: toNumber(p.minutes) }));

const fromPrograms = (list: WashProgram[]): ProgramRow[] =>
  list.map((p) => ({ name: p.name, minutes: String(p.minutes) }));

export function SettingsTab() {
  const { pricing, options, loading } = useSettings();

  const [washPrice, setWashPrice] = useState("");
  const [dryPrice, setDryPrice] = useState("");
  const [priceMsg, setPriceMsg] = useState<string | null>(null);
  const [savingPrice, setSavingPrice] = useState(false);

  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [dryPrograms, setDryPrograms] = useState<ProgramRow[]>([]);
  const [temperatures, setTemperatures] = useState("");
  const [spins, setSpins] = useState("");
  const [optionsMsg, setOptionsMsg] = useState<string | null>(null);
  const [savingOptions, setSavingOptions] = useState(false);

  // Ayarlar değiştikçe (ilk yükleme dahil) formu güncel değerlerle doldur.
  useEffect(() => {
    if (loading) return;
    setWashPrice(String(pricing.washPrice));
    setDryPrice(String(pricing.dryPrice));
    setPrograms(fromPrograms(options.programs));
    setDryPrograms(fromPrograms(options.dryPrograms));
    setTemperatures(options.temperatures.join(", "));
    setSpins(options.spins.join(", "));
  }, [loading, pricing, options]);

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

  const saveOptions = async (e: FormEvent) => {
    e.preventDefault();
    const temps = parseNumbers(temperatures);
    const spinList = parseNumbers(spins);
    const programList = toPrograms(programs);
    const dryProgramList = toPrograms(dryPrograms);

    if (
      programList.length === 0 ||
      !programList.every((p) => isPositive(p.minutes)) ||
      dryProgramList.length === 0 ||
      !dryProgramList.every((p) => isPositive(p.minutes)) ||
      temps.length === 0 ||
      !temps.every(isPositive) ||
      spinList.length === 0 ||
      !spinList.every(isPositive)
    ) {
      setOptionsMsg(
        "Her listede en az bir değer olmalı; süre, sıcaklık ve devir sayı olmalı.",
      );

      return;
    }

    setSavingOptions(true);
    try {
      await setDoc(doc(db, "settings", "options"), {
        programs: programList,
        dryPrograms: dryProgramList,
        temperatures: temps,
        spins: spinList,
      });
      setOptionsMsg("Seçenekler kaydedildi.");
    } catch {
      setOptionsMsg("Kaydedilemedi. Tekrar deneyin.");
    } finally {
      setSavingOptions(false);
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

      <Card>
        <Card.Header>
          <Card.Title>İstek seçenekleri</Card.Title>
          <Card.Description>
            Talebelerin yıkama isteğinde göreceği seçenekler.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <form className="flex flex-col gap-4" onSubmit={saveOptions}>
            <ProgramsEditor
              hint="Süre, çamaşırcıya gösterilen tahmini bitiş için kullanılır."
              rows={programs}
              title="Yıkama programları"
              onChange={setPrograms}
            />
            <ProgramsEditor
              hint="Talebe kurutma seçince bunlardan birini seçer; süre kurutma makinesindeki tahmini bitiş içindir."
              rows={dryPrograms}
              title="Kurutma programları"
              onChange={setDryPrograms}
            />

            <TextField
              fullWidth
              value={temperatures}
              onChange={setTemperatures}
            >
              <Label>Sıcaklıklar (°C)</Label>
              <Input inputMode="numeric" />
              <Description>Virgülle ayırın: 30, 40, 60, 90</Description>
            </TextField>
            <TextField fullWidth value={spins} onChange={setSpins}>
              <Label>Devirler</Label>
              <Input inputMode="numeric" />
              <Description>Virgülle ayırın: 400, 800, 1000, 1200</Description>
            </TextField>

            {optionsMsg && <p className="text-sm text-muted">{optionsMsg}</p>}
            <Button isPending={savingOptions} type="submit">
              Seçenekleri kaydet
            </Button>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
