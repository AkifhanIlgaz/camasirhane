"use client";

import { type FormEvent, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import {
  AlertDialog,
  Button,
  Card,
  Chip,
  Input,
  Label,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";

import { db } from "@/lib/firebase";
import type { Machine } from "@/types";

export function MachinesTab() {
  const [machines, setMachines] = useState<Machine[] | null>(null);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<Machine | null>(null);

  useEffect(
    () =>
      onSnapshot(
        collection(db, "machines"),
        (snap) =>
          setMachines(
            snap.docs
              .map((d) => ({ id: d.id, ...d.data() }) as Machine)
              .sort((a, b) =>
                a.name.localeCompare(b.name, "tr", { numeric: true }),
              ),
          ),
        () => setMachines([]),
      ),
    [],
  );

  const add = async (type: "camasir" | "kurutma") => {
    const trimmed = name.trim();

    if (!trimmed) return;

    setAdding(true);
    try {
      await addDoc(collection(db, "machines"), {
        name: trimmed,
        type,
        requestId: null,
      });
      setName("");
      toast.success("Makine eklendi.");
    } catch {
      toast.danger("Makine eklenemedi.");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (machine: Machine) => {
    try {
      await deleteDoc(doc(db, "machines", machine.id));
      toast.success(`${machine.name} silindi.`);
    } catch {
      toast.danger("Makine silinemedi. İçinde çamaşır olabilir.");
    }
  };

  if (machines === null) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const groups = [
    {
      title: "Çamaşır makineleri",
      list: machines.filter((m) => m.type !== "kurutma"),
    },
    {
      title: "Kurutma makineleri",
      list: machines.filter((m) => m.type === "kurutma"),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <Card.Header>
          <Card.Title>Yeni makine</Card.Title>
        </Card.Header>
        <Card.Content>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e: FormEvent) => e.preventDefault()}
          >
            <TextField
              fullWidth
              aria-label="Makine adı"
              value={name}
              onChange={setName}
            >
              <Input placeholder="Örn. Çamaşır 5" />
            </TextField>
            <div className="flex gap-2">
              <Button
                isPending={adding}
                type="button"
                onPress={() => add("camasir")}
              >
                Çamaşır makinesi ekle
              </Button>
              <Button
                isPending={adding}
                type="button"
                variant="secondary"
                onPress={() => add("kurutma")}
              >
                Kurutma makinesi ekle
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>

      {groups.map(({ title, list }) => (
        <section key={title} className="flex flex-col gap-2">
          <h2 className="font-semibold">{title}</h2>
          {list.length === 0 ? (
            <p className="py-2 text-sm text-muted">Henüz makine yok.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {list.map((m) => (
                <li key={m.id}>
                  <Card>
                    <Card.Content className="flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{m.name}</p>
                        {m.requestId && (
                          <Chip color="accent" size="sm" variant="soft">
                            <Chip.Label>Dolu</Chip.Label>
                          </Chip>
                        )}
                      </div>
                      <Button
                        isDisabled={m.requestId !== null}
                        size="sm"
                        variant="tertiary"
                        onPress={() => setToDelete(m)}
                      >
                        Sil
                      </Button>
                    </Card.Content>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <AlertDialog.Backdrop
        isOpen={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-[400px]">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>Makine silinsin mi?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>{toDelete?.name} kalıcı olarak silinecek.</p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                Vazgeç
              </Button>
              <Button
                slot="close"
                variant="danger"
                onPress={() => toDelete && remove(toDelete)}
              >
                Sil
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </div>
  );
}
