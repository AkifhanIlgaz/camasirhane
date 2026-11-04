"use client";

import type { Machine, WashRequest } from "@/types";

import { useState } from "react";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { Button, Card, Modal, toast, useOverlayState } from "@heroui/react";

import { db } from "@/lib/firebase";
import { formatDateTime } from "@/lib/format";
import { RequestInfo } from "@/components/camasirci/request-info";

export function QueueTab({
  machines,
  requests,
}: {
  machines: Machine[];
  requests: WashRequest[];
}) {
  const [selected, setSelected] = useState<WashRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modal = useOverlayState();

  const waiting = requests.filter((r) => r.status === "bekliyor");
  const freeMachines = machines.filter(
    (m) => m.requestId === null && m.type !== "kurutma",
  );

  const open = (request: WashRequest) => {
    setSelected(request);
    setError(null);
    modal.open();
  };

  const assign = async (machine: Machine) => {
    if (!selected) return;

    setSaving(true);
    setError(null);
    try {
      const batch = writeBatch(db);

      batch.update(doc(db, "requests", selected.id), {
        status: "yikaniyor",
        machineId: machine.id,
        startedAt: serverTimestamp(),
      });
      batch.update(doc(db, "machines", machine.id), { requestId: selected.id });
      await batch.commit();
      modal.close();
      toast.success(`${machine.name} başlatıldı.`);
    } catch {
      setError("Atama yapılamadı. Tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {waiting.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">Sırada istek yok.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {waiting.map((r, i) => (
            <li key={r.id}>
              <Card>
                <Card.Content className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <RequestInfo request={r} />
                    <span className="shrink-0 text-xs text-muted">
                      #{i + 1}
                      {r.createdAt
                        ? ` · ${formatDateTime(r.createdAt.toDate())}`
                        : ""}
                    </span>
                  </div>
                  <Button size="sm" onPress={() => open(r)}>
                    Makineye ata ve başlat
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
              <Modal.Heading>Makine seçin</Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                Talebe No: {selected?.studentNo}
              </p>
            </Modal.Header>
            <Modal.Body className="p-6">
              {freeMachines.length === 0 ? (
                <p className="text-sm text-muted">
                  Boş makine yok. Makineler sekmesinden makine ekleyin ya da bir
                  yıkamanın bitmesini bekleyin.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {freeMachines.map((m) => (
                    <Button
                      key={m.id}
                      fullWidth
                      isDisabled={saving}
                      variant="secondary"
                      onPress={() => assign(m)}
                    >
                      {m.name}
                    </Button>
                  ))}
                </div>
              )}
              {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">
                Vazgeç
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
