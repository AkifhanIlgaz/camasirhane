"use client";

import { doc, updateDoc } from "firebase/firestore";
import { Button, Card, toast } from "@heroui/react";

import { db } from "@/lib/firebase";
import { RequestInfo } from "@/components/camasirci/request-info";
import type { Machine, WashRequest } from "@/types";

export function DeliveryTab({
  machines,
  requests,
}: {
  machines: Machine[];
  requests: WashRequest[];
}) {
  const done = requests.filter((r) => r.status === "bitti");

  if (done.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Teslim bekleyen çamaşır yok.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {done.map((r) => (
        <li key={r.id}>
          <Card>
            <Card.Content className="gap-3">
              <RequestInfo request={r} />
              {r.machineId && (
                <p className="text-sm text-muted">
                  {machines.find((m) => m.id === r.machineId)?.name ?? "Makine"}
                </p>
              )}
              <Button
                size="sm"
                onPress={async () => {
                  await updateDoc(doc(db, "requests", r.id), { status: "teslim" });
                  toast.success("Teslim edildi olarak işaretlendi.");
                }}
              >
                Teslim edildi
              </Button>
            </Card.Content>
          </Card>
        </li>
      ))}
    </ul>
  );
}
