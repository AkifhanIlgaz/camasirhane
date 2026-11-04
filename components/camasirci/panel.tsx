"use client";

import { useEffect } from "react";
import {
  collection,
  deleteDoc,
  getDocs,
  limit,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { Spinner, Tabs } from "@heroui/react";
import { deleteObject, ref } from "firebase/storage";

import { MachinesTab } from "@/components/camasirci/machines-tab";
import { QueueTab } from "@/components/camasirci/queue-tab";
import { db, storage } from "@/lib/firebase";
import { useLaundry } from "@/lib/use-laundry";

export function CamasirciPanel() {
  const { machines, requests } = useLaundry();

  // Süresi (10 gün) dolan istek fotoğraflarını siler.
  useEffect(() => {
    getDocs(
      query(
        collection(db, "requestImages"),
        where("expireAt", "<=", Timestamp.now()),
        limit(50),
      ),
    )
      .then((snap) =>
        Promise.all(
          snap.docs.map(async (d) => {
            const path = d.data().path as string | undefined;

            if (path) {
              // Dosya zaten yoksa (object-not-found) kaydı yine de sil.
              await deleteObject(ref(storage, path)).catch((e) => {
                if (e?.code !== "storage/object-not-found") throw e;
              });
            }
            await deleteDoc(d.ref);
          }),
        ),
      )
      .catch(() => {});
  }, []);

  if (machines === null || requests === null) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const waiting = requests.filter((r) => r.status === "bekliyor").length;

  return (
    <Tabs className="w-full">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Çamaşırcı bölümleri">
          <Tabs.Tab id="sira">
            Sıra{waiting > 0 ? ` (${waiting})` : ""}
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="makineler">
            Makineler
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="sira">
        <QueueTab machines={machines} requests={requests} />
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="makineler">
        <MachinesTab machines={machines} requests={requests} />
      </Tabs.Panel>
    </Tabs>
  );
}
