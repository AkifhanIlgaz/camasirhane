"use client";

import { type FormEvent, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  Button,
  FieldError,
  Input,
  Label,
  Modal,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";

import { useAuth } from "@/lib/auth-context";

const MIN_LENGTH = 6;

const errorMessage = (code: string) =>
  code === "auth/wrong-password" || code === "auth/invalid-credential"
    ? "Mevcut şifre hatalı."
    : code === "auth/too-many-requests"
      ? "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin."
      : code === "auth/network-request-failed"
        ? "Bağlantı hatası. İnternetinizi kontrol edin."
        : "Şifre değiştirilemedi, tekrar deneyin.";

/** Her rol kendi şifresini değiştirebilir: mevcut şifre doğrulanır, sonra yenisi kaydedilir. */
export function ChangePassword() {
  const { user } = useAuth();
  const modal = useOverlayState();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setAgain("");
    setError(null);
  };

  const mismatch = again !== "" && next !== again;
  const tooShort = next !== "" && next.length < MIN_LENGTH;
  const sameAsOld = next !== "" && next === current;
  const canSubmit =
    current !== "" && next.length >= MIN_LENGTH && next === again && !sameAsOld;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.email || !canSubmit) return;

    setError(null);
    setSubmitting(true);
    try {
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, current),
      );
      await updatePassword(user, next);
      modal.close();
      reset();
      toast.success("Şifreniz değiştirildi.");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(errorMessage((err as { code?: string }).code ?? ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="tertiary" onPress={modal.open}>
        Şifre
      </Button>
      <Modal.Backdrop
        isOpen={modal.isOpen}
        onOpenChange={(open) => {
          modal.setOpen(open);
          if (!open) reset();
        }}
      >
        <Modal.Container placement="auto">
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Şifre değiştir</Modal.Heading>
            </Modal.Header>
            <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
              <Modal.Body className="flex flex-col gap-4 p-6">
                <TextField
                  fullWidth
                  isRequired
                  autoComplete="current-password"
                  name="current-password"
                  type="password"
                  value={current}
                  onChange={setCurrent}
                >
                  <Label>Mevcut şifre</Label>
                  <Input />
                </TextField>
                <TextField
                  fullWidth
                  isRequired
                  autoComplete="new-password"
                  isInvalid={tooShort || sameAsOld}
                  name="new-password"
                  type="password"
                  value={next}
                  onChange={setNext}
                >
                  <Label>Yeni şifre</Label>
                  <Input />
                  <FieldError>
                    {sameAsOld
                      ? "Yeni şifre mevcut şifreyle aynı olamaz."
                      : `En az ${MIN_LENGTH} karakter olmalı.`}
                  </FieldError>
                </TextField>
                <TextField
                  fullWidth
                  isRequired
                  autoComplete="new-password"
                  isInvalid={mismatch}
                  name="confirm-password"
                  type="password"
                  value={again}
                  onChange={setAgain}
                >
                  <Label>Yeni şifre (tekrar)</Label>
                  <Input />
                  <FieldError>Şifreler eşleşmiyor.</FieldError>
                </TextField>
                {error && <p className="text-sm text-danger">{error}</p>}
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close" type="button" variant="secondary">
                  Vazgeç
                </Button>
                <Button
                  isDisabled={!canSubmit}
                  isPending={submitting}
                  type="submit"
                >
                  Değiştir
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
