"use client";

import type { UserProfile } from "@/types";

import { type FormEvent, useEffect, useState } from "react";
import {
  collection,
  doc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";

import { auth, db } from "@/lib/firebase";
import { formatMoney } from "@/lib/format";

type Student = UserProfile & { uid: string };

export function StudentsTab() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const modal = useOverlayState();

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, "users"), where("role", "==", "talebe")),
        (snap) =>
          setStudents(
            snap.docs
              .map((d) => ({ uid: d.id, ...(d.data() as UserProfile) }))
              .sort((a, b) =>
                (a.studentNo ?? "").localeCompare(b.studentNo ?? "", "tr", {
                  numeric: true,
                }),
              ),
          ),
        () => setStudents([]),
      ),
    [],
  );

  const open = (student: Student) => {
    setSelected(student);
    setAmount("");
    setError(null);
    modal.open();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    const value = Math.round(Number(amount.replace(",", ".")) * 100) / 100;

    if (!Number.isFinite(value) || value <= 0) {
      setError("Geçerli bir tutar girin.");

      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);

      batch.update(doc(db, "users", selected.uid), {
        balance: increment(value),
      });
      batch.set(doc(collection(db, "transactions")), {
        uid: selected.uid,
        studentNo: selected.studentNo,
        amount: value,
        type: "yukleme",
        by: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      modal.close();
      toast.success(
        `${selected.studentNo} numaralı talebeye ${formatMoney(value)} eklendi.`,
      );
    } catch {
      setError("Bakiye eklenemedi. Tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  if (students === null) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const filtered = students.filter((s) =>
    (s.studentNo ?? "").includes(search.trim()),
  );

  return (
    <>
      <TextField
        fullWidth
        aria-label="Talebe ara"
        className="mb-3"
        value={search}
        onChange={setSearch}
      >
        <Input inputMode="numeric" placeholder="Talebe numarası ara" />
      </TextField>
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          {students.length === 0 ? "Henüz talebe yok." : "Eşleşen talebe yok."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((s) => (
            <li key={s.uid}>
              <Card>
                <Card.Content className="flex-row items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">No: {s.studentNo}</p>
                    <p className="text-sm tabular-nums text-muted">
                      Bakiye: {formatMoney(s.balance ?? 0)}
                    </p>
                  </div>
                  <Button size="sm" onPress={() => open(s)}>
                    Bakiye ekle
                  </Button>
                </Card.Content>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal.Backdrop isOpen={modal.isOpen} onOpenChange={modal.setOpen}>
        <Modal.Container placement="auto">
          <Modal.Dialog className="sm:max-w-sm">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Bakiye ekle</Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                Talebe No: {selected?.studentNo}
              </p>
            </Modal.Header>
            <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
              <Modal.Body className="p-6">
                <TextField
                  fullWidth
                  isRequired
                  isInvalid={error !== null}
                  value={amount}
                  onChange={setAmount}
                >
                  <Label>Tutar (₺)</Label>
                  <Input inputMode="decimal" placeholder="100" />
                  <FieldError>{error}</FieldError>
                </TextField>
                <div className="mt-3 flex gap-2">
                  {[50, 100, 200].map((v) => (
                    <Button
                      key={v}
                      size="sm"
                      type="button"
                      variant="secondary"
                      onPress={() => setAmount(String(v))}
                    >
                      {formatMoney(v)}
                    </Button>
                  ))}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button slot="close" type="button" variant="secondary">
                  Vazgeç
                </Button>
                <Button isPending={saving} type="submit">
                  Ekle
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
