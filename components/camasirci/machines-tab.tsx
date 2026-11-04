"use client";

import type { Machine, WashRequest } from "@/types";

import { useEffect, useState } from "react";
import {
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  Button,
  Card,
  Chip,
  Modal,
  Tabs,
  toast,
  useOverlayState,
} from "@heroui/react";

import { db } from "@/lib/firebase";
import { formatTime } from "@/lib/format";
import { notifyStudent } from "@/lib/notify";
import { programMinutes, programName } from "@/lib/programs";
import { RequestInfo } from "@/components/camasirci/request-info";

/** Kalan süreyi görmek için yarım dakikada bir yenilenen şimdiki zaman. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);

    return () => clearInterval(id);
  }, []);

  return now;
}

export function MachinesTab({
  machines,
  requests,
}: {
  machines: Machine[];
  requests: WashRequest[];
}) {
  const now = useNow();
  const [washed, setWashed] = useState<{
    machine: Machine;
    request: WashRequest;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const dryModal = useOverlayState();

  const washers = machines.filter((m) => m.type !== "kurutma");
  const dryers = machines.filter((m) => m.type === "kurutma");
  const freeDryers = dryers.filter((m) => m.requestId === null);

  const finish = async (machine: Machine, request: WashRequest) => {
    // Kurutma istenmişse çamaşır kurutma makinesine geçer.
    if (machine.type !== "kurutma" && request.dry) {
      setWashed({ machine, request });
      dryModal.open();

      return;
    }

    const batch = writeBatch(db);

    batch.update(doc(db, "requests", request.id), { status: "bitti" });
    batch.update(doc(db, "machines", machine.id), { requestId: null });
    await batch.commit();
    toast.success(`${request.studentNo} numaralı talebenin çamaşırı hazır.`);
    // Talebeye bildirim; başarısız olsa da çamaşırcının akışı etkilenmez.
    void notifyStudent(request.id);
  };

  const startDrying = async (dryer: Machine) => {
    if (!washed) return;

    setSaving(true);
    try {
      const batch = writeBatch(db);

      batch.update(doc(db, "requests", washed.request.id), {
        status: "kurutuluyor",
        machineId: dryer.id,
        startedAt: serverTimestamp(),
      });
      batch.update(doc(db, "machines", washed.machine.id), { requestId: null });
      batch.update(doc(db, "machines", dryer.id), {
        requestId: washed.request.id,
      });
      await batch.commit();
      dryModal.close();
      toast.success(`${dryer.name} başlatıldı.`);
      // Talebeye "yıkama bitti, kurutmaya alındı" bildirimi.
      void notifyStudent(washed.request.id);
    } catch {
      toast.danger("Kurutma başlatılamadı. Tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  };

  const estimate = (request: WashRequest, isDryer: boolean) => {
    const minutes = isDryer
      ? programMinutes("dry", request.dryProgram)
      : programMinutes("wash", request.program);

    if (!request.startedAt || !minutes) return null;

    const end = new Date(
      request.startedAt.toDate().getTime() + minutes * 60_000,
    );

    return { end, remaining: Math.ceil((end.getTime() - now) / 60_000) };
  };

  const renderList = (list: Machine[], empty: string) => {
    if (list.length === 0) {
      return <p className="py-4 text-center text-sm text-muted">{empty}</p>;
    }

    return (
      <ul className="flex flex-col gap-2">
        {list.map((m) => {
          const isDryer = m.type === "kurutma";
          const request = requests.find((r) => r.id === m.requestId);
          const est = request ? estimate(request, isDryer) : null;

          return (
            <li key={m.id}>
              <Card>
                <Card.Content className="gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{m.name}</p>
                    <Chip
                      color={m.requestId ? "accent" : "success"}
                      size="sm"
                      variant="soft"
                    >
                      <Chip.Label>{m.requestId ? "Dolu" : "Boş"}</Chip.Label>
                    </Chip>
                  </div>

                  {request ? (
                    <>
                      <RequestInfo request={request} />
                      {request.startedAt && (
                        <p className="text-sm text-muted">
                          Başlangıç: {formatTime(request.startedAt.toDate())}
                          {est && (
                            <>
                              {" · "}Tahmini bitiş: {formatTime(est.end)} (
                              {est.remaining > 0
                                ? `${est.remaining} dk kaldı`
                                : "süre doldu"}
                              )
                            </>
                          )}
                        </p>
                      )}
                      <Button size="sm" onPress={() => finish(m, request)}>
                        {isDryer ? "Kurutma bitti" : "Yıkama bitti"}
                      </Button>
                    </>
                  ) : (
                    m.requestId && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() =>
                          updateDoc(doc(db, "machines", m.id), {
                            requestId: null,
                          })
                        }
                      >
                        Makineyi boşalt
                      </Button>
                    )
                  )}
                </Card.Content>
              </Card>
            </li>
          );
        })}
      </ul>
    );
  };

  const count = (list: Machine[]) => list.filter((m) => m.requestId).length;

  return (
    <>
      <Tabs className="w-full" variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Makine türleri">
            <Tabs.Tab id="camasir">
              Çamaşır ({count(washers)}/{washers.length})
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="kurutma">
              Kurutma ({count(dryers)}/{dryers.length})
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="pt-4" id="camasir">
          {renderList(washers, "Çamaşır makinesi yok. Muhasebeci ekleyebilir.")}
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="kurutma">
          {renderList(dryers, "Kurutma makinesi yok. Muhasebeci ekleyebilir.")}
        </Tabs.Panel>
      </Tabs>

      <Modal.Backdrop isOpen={dryModal.isOpen} onOpenChange={dryModal.setOpen}>
        <Modal.Container placement="auto">
          <Modal.Dialog className="sm:max-w-sm">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Kurutma makinesi seçin</Modal.Heading>
              <p className="mt-1 text-sm text-muted">
                Talebe No: {washed?.request.studentNo}
                {washed?.request.dryProgram
                  ? ` · ${programName("dry", washed.request.dryProgram)}`
                  : ""}
              </p>
            </Modal.Header>
            <Modal.Body className="p-6">
              {freeDryers.length === 0 ? (
                <p className="text-sm text-muted">
                  Boş kurutma makinesi yok. Bir kurutmanın bitmesini bekleyin.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {freeDryers.map((d) => (
                    <Button
                      key={d.id}
                      fullWidth
                      isDisabled={saving}
                      variant="secondary"
                      onPress={() => startDrying(d)}
                    >
                      {d.name}
                    </Button>
                  ))}
                </div>
              )}
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
