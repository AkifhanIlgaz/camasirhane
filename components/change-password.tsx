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

import { type MessageKey, useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";

const MIN_LENGTH = 6;

const errorKey = (code: string): MessageKey =>
  code === "auth/wrong-password" || code === "auth/invalid-credential"
    ? "pw.err.wrong"
    : code === "auth/too-many-requests"
      ? "pw.err.tooMany"
      : code === "auth/network-request-failed"
        ? "pw.err.network"
        : "pw.err.generic";

/** Her rol kendi şifresini değiştirebilir: mevcut şifre doğrulanır, sonra yenisi kaydedilir. */
export function ChangePassword() {
  const { user } = useAuth();
  const { t } = useI18n();
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
      toast.success(t("pw.success"));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(t(errorKey((err as { code?: string }).code ?? "")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="tertiary" onPress={modal.open}>
        {t("pw.button")}
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
              <Modal.Heading>{t("pw.title")}</Modal.Heading>
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
                  <Label>{t("pw.current")}</Label>
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
                  <Label>{t("pw.new")}</Label>
                  <Input />
                  <FieldError>
                    {sameAsOld
                      ? t("pw.same")
                      : t("pw.minLength", { n: MIN_LENGTH })}
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
                  <Label>{t("pw.again")}</Label>
                  <Input />
                  <FieldError>{t("pw.mismatch")}</FieldError>
                </TextField>
                {error && <p className="text-sm text-danger">{error}</p>}
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close" type="button" variant="secondary">
                  {t("pw.cancel")}
                </Button>
                <Button
                  isDisabled={!canSubmit}
                  isPending={submitting}
                  type="submit"
                >
                  {t("pw.submit")}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
