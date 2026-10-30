"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Machine, WashRequest } from "@/types";

const time = (r: WashRequest) => r.createdAt?.toDate().getTime() ?? Infinity;

/** Çamaşırcı için makineler ve devam eden (teslim edilmemiş) istekler. */
export function useLaundry() {
  const [machines, setMachines] = useState<Machine[] | null>(null);
  const [requests, setRequests] = useState<WashRequest[] | null>(null);

  useEffect(() => {
    const unsubMachines = onSnapshot(
      collection(db, "machines"),
      (snap) =>
        setMachines(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Machine)
            .sort((a, b) => a.name.localeCompare(b.name, "tr", { numeric: true })),
        ),
      () => setMachines([]),
    );
    const unsubRequests = onSnapshot(
      query(
        collection(db, "requests"),
        where("status", "in", ["bekliyor", "yikaniyor", "kurutuluyor", "bitti"]),
      ),
      (snap) =>
        setRequests(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as WashRequest)
            .sort((a, b) => time(a) - time(b)),
        ),
      () => setRequests([]),
    );

    return () => {
      unsubMachines();
      unsubRequests();
    };
  }, []);

  return { machines, requests };
}
