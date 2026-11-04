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
  Alert,
  Button,
  Card,
  Checkbox,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  Switch,
  TextArea,
  TextField,
  toast,
  useOverlayState,
  type Key,
} from "@heroui/react";
import { ref, uploadBytes } from "firebase/storage";

import { useI18n } from "@/lib/i18n";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/format";
import { compressImage } from "@/lib/image";
import {
  DRY_PROGRAMS,
  SPINS,
  TEMPERATURES,
  WASH_PROGRAMS,
} from "@/lib/programs";

/** Bakiye bu kadar yıkamadan azsa "azalıyor" uyarısı gösterilir. */
const LOW_BALANCE_WASHES = 2;

const PHOTO_WARNING_KEY = "photo-warning-dismissed";

const readDismissed = () => {
  try {
    return localStorage.getItem(PHOTO_WARNING_KEY) === "1";
  } catch {
    return false;
  }
};

/** Not en fazla bu kadar karakter olabilir (kurallarla aynı). */
const NOTE_MAX = 200;

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
  const { pricing, loading } = useSettings();
  const { t, locale } = useI18n();

  const [program, setProgram] = useState<Key | null>(null);
  const [temperature, setTemperature] = useState<Key | null>(null);
  const [spin, setSpin] = useState<Key | null>(null);
  const [dryProgram, setDryProgram] = useState<Key | null>(null);
  const [softener, setSoftener] = useState(false);
  const [dry, setDry] = useState(false);
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [note, setNote] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const warning = useOverlayState();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  /** Uyarı daha önce "bir daha gösterme" ile kapatılmadıysa önce uyarıyı açar. */
  const pickPhoto = () => {
    if (readDismissed()) fileInput.current?.click();
    else warning.open();
  };

  const acknowledgeWarning = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(PHOTO_WARNING_KEY, "1");
      } catch {
        // Tarayıcı depolaması kapalıysa uyarı her seferinde gösterilir.
      }
    }
    warning.close();
    // Kullanıcı dokunuşu içinde çağrıldığı için kamera/dosya seçici açılabilir.
    fileInput.current?.click();
  };
  const removePhoto = () => {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(null);
  };
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
      const path = `requestImages/${user.uid}/${requestRef.id}.jpg`;

      await uploadBytes(ref(storage, path), photo.blob, {
        contentType: "image/jpeg",
      });
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
        note: note.trim(),
      });
      batch.set(doc(db, "requestImages", requestRef.id), {
        uid: user.uid,
        path,
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
      removePhoto();
      setNote("");
      modal.close();
      toast.success(t("form.success"));
    } catch (err) {
      console.error(err);
      setError(t("form.error"));
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
              {t("form.balance", { no: profile.studentNo ?? "" })}
            </p>
            <p className="mt-1 text-4xl font-bold leading-none tabular-nums">
              {formatMoney(balance, locale)}
            </p>
          </div>
          <Button fullWidth onPress={modal.open}>
            {t("form.new")}
          </Button>
          {balance < pricing.washPrice * LOW_BALANCE_WASHES && (
            <Alert status={balance < pricing.washPrice ? "danger" : "warning"}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>
                  {balance < pricing.washPrice
                    ? t("form.emptyTitle")
                    : t("form.lowTitle")}
                </Alert.Title>
                <Alert.Description>
                  {balance < pricing.washPrice
                    ? t("form.emptyDesc")
                    : t("form.lowDesc", {
                        n: Math.floor(balance / pricing.washPrice),
                      })}
                </Alert.Description>
              </Alert.Content>
            </Alert>
          )}
        </Card.Content>
      </Card>

      <Modal.Backdrop isOpen={modal.isOpen} onOpenChange={modal.setOpen}>
        <Modal.Container placement="auto">
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t("form.new")}</Modal.Heading>
            </Modal.Header>
            <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
              <Modal.Body className="flex flex-col gap-4 p-6">
                <OptionSelect
                  items={WASH_PROGRAMS.map((p) => ({
                    id: p.id,
                    text: p.name[locale],
                  }))}
                  label={t("form.program")}
                  value={program}
                  onChange={setProgram}
                />
                <OptionSelect
                  items={TEMPERATURES.map((temp) => ({
                    id: String(temp),
                    text: `${temp}°C`,
                  }))}
                  label={t("form.temperature")}
                  value={temperature}
                  onChange={setTemperature}
                />
                <OptionSelect
                  items={SPINS.map((s) => ({
                    id: String(s),
                    text: t("form.spinValue", { n: s }),
                  }))}
                  label={t("form.spin")}
                  value={spin}
                  onChange={setSpin}
                />
                <Switch isSelected={softener} onChange={setSoftener}>
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    {t("form.softener")}
                  </Switch.Content>
                </Switch>
                <Switch isSelected={dry} onChange={setDry}>
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    {t("form.dry", {
                      price: formatMoney(pricing.dryPrice, locale),
                    })}
                  </Switch.Content>
                </Switch>
                {dry && (
                  <OptionSelect
                    items={DRY_PROGRAMS.map((p) => ({
                      id: p.id,
                      text: p.name[locale],
                    }))}
                    label={t("form.dryProgram")}
                    value={dryProgram}
                    onChange={setDryProgram}
                  />
                )}

                <div className="flex flex-col gap-2">
                  <Label>{t("form.photoLabel")}</Label>
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
                        const blob = await compressImage(file);

                        if (photo) URL.revokeObjectURL(photo.url);
                        setPhoto({ blob, url: URL.createObjectURL(blob) });
                        setError(null);
                      } catch (err) {
                        const code = err instanceof Error ? err.message : "";

                        setError(
                          code === "img.type" ||
                            code === "img.size" ||
                            code === "img.big"
                            ? t(code)
                            : t("form.photoReadError"),
                        );
                      }
                    }}
                  />
                  {photo ? (
                    <div className="relative overflow-hidden rounded-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={t("form.photoSelectedAlt")}
                        className="h-44 w-full object-cover"
                        src={photo.url}
                      />
                      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <Button
                          size="sm"
                          type="button"
                          variant="secondary"
                          onPress={pickPhoto}
                        >
                          {t("form.photoChange")}
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="danger-soft"
                          onPress={removePhoto}
                        >
                          {t("form.photoRemove")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-secondary/50 px-4 text-center transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      type="button"
                      onClick={pickPhoto}
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
                      <span className="text-sm font-medium">
                        {t("form.photoTake")}
                      </span>
                      <span className="text-xs font-medium text-danger">
                        {t("form.photoHint")}
                      </span>
                    </button>
                  )}
                </div>

                <TextField
                  fullWidth
                  maxLength={NOTE_MAX}
                  value={note}
                  onChange={setNote}
                >
                  <Label>{t("form.note")}</Label>
                  <TextArea placeholder={t("form.notePlaceholder")} rows={3} />
                  <span className="text-xs text-muted tabular-nums">
                    {note.length}/{NOTE_MAX}
                  </span>
                </TextField>

                <div className="flex items-center justify-between rounded-xl bg-surface-secondary px-4 py-3">
                  <span className="text-sm text-muted">{t("form.total")}</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatMoney(price, locale)}
                  </span>
                </div>

                {insufficient && (
                  <p className="text-sm text-danger">
                    {t("form.insufficient")}
                  </p>
                )}
                {error && <p className="text-sm text-danger">{error}</p>}
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close" type="button" variant="secondary">
                  {t("form.cancel")}
                </Button>
                <Button
                  isDisabled={!complete || insufficient}
                  isPending={submitting}
                  type="submit"
                >
                  {t("form.submit")}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={warning.isOpen} onOpenChange={warning.setOpen}>
        <Modal.Container placement="auto">
          <Modal.Dialog className="sm:max-w-sm">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t("form.warnTitle")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4 p-6">
              <p className="text-sm font-medium text-danger">
                {t("form.warnText")}
              </p>
              <Checkbox isSelected={dontShowAgain} onChange={setDontShowAgain}>
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  {t("form.warnDontShow")}
                </Checkbox.Content>
              </Checkbox>
            </Modal.Body>
            <Modal.Footer>
              <Button fullWidth onPress={acknowledgeWarning}>
                {t("form.warnOk")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
