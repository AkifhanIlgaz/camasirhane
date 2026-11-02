"use client";

import { type FormEvent, useRef, useState } from "react";
import {
  collection,
  Timestamp,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  Button,
  Card,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  Switch,
  toast,
  useOverlayState,
  type Key,
} from "@heroui/react";

import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/format";
import { compressImage } from "@/lib/image";

const IMAGE_TTL_MS = 10 * 24 * 60 * 60 * 1000;

function OptionSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: Key | null;
  onChange: (value: Key | null) => void;
  items: { id: string; text: string }[];
}) {
  return (
    <Select fullWidth value={value} onChange={onChange}>
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {items.map((item) => (
            <ListBox.Item key={item.id} id={item.id} textValue={item.text}>
              {item.text}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function RequestForm() {
  const { user, profile } = useAuth();
  const { pricing, options, loading } = useSettings();

  const [program, setProgram] = useState<Key | null>(null);
  const [temperature, setTemperature] = useState<Key | null>(null);
  const [spin, setSpin] = useState<Key | null>(null);
  const [dryProgram, setDryProgram] = useState<Key | null>(null);
  const [softener, setSoftener] = useState(false);
  const [dry, setDry] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const modal = useOverlayState();
  const [submitting, setSubmitting] = useState(false);

  if (loading || !user || !profile) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const balance = profile.balance ?? 0;
  const price = pricing.washPrice + (dry ? pricing.dryPrice : 0);
  const insufficient = balance < price;
  const complete =
    program !== null &&
    temperature !== null &&
    spin !== null &&
    photo !== null &&
    (!dry || dryProgram !== null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!complete || insufficient || !photo) return;

    setError(null);
    setSubmitting(true);
    try {
      const requestRef = doc(collection(db, "requests"));
      const batch = writeBatch(db);

      batch.set(requestRef, {
        uid: user.uid,
        studentNo: profile.studentNo,
        program: String(program),
        temperature: Number(temperature),
        spin: Number(spin),
        softener,
        dry,
        dryProgram: dry ? String(dryProgram) : null,
        price,
        status: "bekliyor",
        machineId: null,
        startedAt: null,
        createdAt: serverTimestamp(),
        hasImage: true,
      });
      batch.set(doc(db, "requestImages", requestRef.id), {
        uid: user.uid,
        image: photo,
        createdAt: serverTimestamp(),
        // Çamaşırcı paneli süresi dolan fotoğrafı siler.
        expireAt: Timestamp.fromMillis(Date.now() + IMAGE_TTL_MS),
      });
      batch.update(doc(db, "users", user.uid), { balance: balance - price });
      batch.set(doc(db, "transactions", requestRef.id), {
        uid: user.uid,
        studentNo: profile.studentNo,
        amount: -price,
        type: "yikama",
        by: user.uid,
        requestId: requestRef.id,
        createdAt: serverTimestamp(),
      });
      await batch.commit();

      setProgram(null);
      setTemperature(null);
      setSpin(null);
      setSoftener(false);
      setDry(false);
      setDryProgram(null);
      setPhoto(null);
      modal.close();
      toast.success("İsteğiniz alındı.");
    } catch (err) {
      console.error(err);
      setError("İstek oluşturulamadı. Fiyatlar değişmiş olabilir, tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <Card.Content className="gap-4">
          <div>
            <p className="text-sm text-muted">
              Bakiyeniz · Talebe No {profile.studentNo}
            </p>
            <p className="mt-1 text-4xl font-bold leading-none tabular-nums">
              {formatMoney(balance)}
            </p>
          </div>
          <Button fullWidth onPress={modal.open}>
            Yeni yıkama isteği
          </Button>
          {balance < pricing.washPrice && (
            <p className="text-sm text-muted">
              Bakiyeniz yetersiz. Bakiye eklemek için muhasebeciye başvurun.
            </p>
          )}
        </Card.Content>
      </Card>

      <Modal.Backdrop isOpen={modal.isOpen} onOpenChange={modal.setOpen}>
        <Modal.Container placement="auto">
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Yeni yıkama isteği</Modal.Heading>
            </Modal.Header>
            <form onSubmit={onSubmit}>
              <Modal.Body className="flex flex-col gap-4 p-6">
                <OptionSelect
                  items={options.programs.map((p) => ({ id: p.name, text: p.name }))}
                  label="Program"
                  value={program}
                  onChange={setProgram}
                />
                <OptionSelect
                  items={options.temperatures.map((t) => ({
                    id: String(t),
                    text: `${t}°C`,
                  }))}
                  label="Sıcaklık"
                  value={temperature}
                  onChange={setTemperature}
                />
                <OptionSelect
                  items={options.spins.map((s) => ({
                    id: String(s),
                    text: `${s} devir`,
                  }))}
                  label="Devir"
                  value={spin}
                  onChange={setSpin}
                />
                <Switch isSelected={softener} onChange={setSoftener}>
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    Yumuşatıcım var
                  </Switch.Content>
                </Switch>
                <Switch isSelected={dry} onChange={setDry}>
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    Kurutma olsun (+{formatMoney(pricing.dryPrice)})
                  </Switch.Content>
                </Switch>
                {dry && (
                  <OptionSelect
                    items={options.dryPrograms.map((p) => ({
                      id: p.name,
                      text: p.name,
                    }))}
                    label="Kurutma programı"
                    value={dryProgram}
                    onChange={setDryProgram}
                  />
                )}

                <div className="flex flex-col gap-2">
                  <Label>Çamaşır fotoğrafı</Label>
                  <input
                    ref={fileInput}
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    type="file"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      try {
                        setPhoto(await compressImage(file));
                        setError(null);
                      } catch (err) {
                        setError(
                          err instanceof Error && err.message
                            ? err.message
                            : "Fotoğraf okunamadı, başka bir fotoğraf deneyin.",
                        );
                      }
                    }}
                  />
                  {photo ? (
                    <div className="relative overflow-hidden rounded-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Seçilen fotoğraf"
                        className="h-44 w-full object-cover"
                        src={photo}
                      />
                      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <Button
                          size="sm"
                          type="button"
                          variant="secondary"
                          onPress={() => fileInput.current?.click()}
                        >
                          Değiştir
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="danger-soft"
                          onPress={() => setPhoto(null)}
                        >
                          Kaldır
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-secondary/50 px-4 text-center transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      type="button"
                      onClick={() => fileInput.current?.click()}
                    >
                      <svg
                        aria-hidden
                        className="size-8 text-muted"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.6}
                        viewBox="0 0 24 24"
                      >
                        <path d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                        <circle cx="12" cy="12.5" r="3.5" />
                      </svg>
                      <span className="text-sm font-medium">Fotoğraf çek</span>
                      <span className="text-xs text-muted">
                        Sadece çamaşırcı görür, 10 gün sonra silinir.
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-xl bg-surface-secondary px-4 py-3">
                  <span className="text-sm text-muted">Toplam</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatMoney(price)}
                  </span>
                </div>

                {insufficient && (
                  <p className="text-sm text-danger">
                    Bakiyeniz yetersiz. Bakiye eklemek için muhasebeciye başvurun.
                  </p>
                )}
                {error && <p className="text-sm text-danger">{error}</p>}
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close" type="button" variant="secondary">
                  Vazgeç
                </Button>
                <Button
                  isDisabled={!complete || insufficient}
                  isPending={submitting}
                  type="submit"
                >
                  İstek oluştur
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
