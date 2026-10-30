"use client";

import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { Card, Chip, Input, Spinner, Tabs, TextField } from "@heroui/react";
import clsx from "clsx";

import { db } from "@/lib/firebase";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { Transaction } from "@/types";

export function TransactionsTab() {
  const [items, setItems] = useState<Transaction[] | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"hepsi" | Transaction["type"]>("hepsi");

  useEffect(
    () =>
      onSnapshot(
        query(
          collection(db, "transactions"),
          orderBy("createdAt", "desc"),
          limit(500),
        ),
        (snap) =>
          setItems(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction),
          ),
        () => setItems([]),
      ),
    [],
  );

  if (items === null) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const filtered = items.filter(
    (t) =>
      (type === "hepsi" || t.type === type) &&
      t.studentNo.includes(search.trim()),
  );

  return (
    <div className="flex flex-col gap-3">
      <TextField
        fullWidth
        aria-label="Talebe ara"
        value={search}
        onChange={setSearch}
      >
        <Input inputMode="numeric" placeholder="Talebe numarası ara" />
      </TextField>
      <Tabs
        selectedKey={type}
        variant="secondary"
        onSelectionChange={(key) => setType(key as typeof type)}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="İşlem tipi">
            <Tabs.Tab id="hepsi">
              Tümü
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="yukleme">
              Yükleme
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="yikama">
              Yıkama
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          {items.length === 0 ? "Henüz işlem yok." : "Eşleşen işlem yok."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((t) => (
            <li key={t.id}>
              <Card>
                <Card.Content className="flex-row items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">No: {t.studentNo}</p>
                      <Chip
                        color={t.type === "yukleme" ? "success" : "default"}
                        size="sm"
                        variant="soft"
                      >
                        <Chip.Label>
                          {t.type === "yukleme" ? "Yükleme" : "Yıkama"}
                        </Chip.Label>
                      </Chip>
                    </div>
                    <p className="text-xs text-muted">
                      {t.createdAt ? formatDateTime(t.createdAt.toDate()) : ""}
                    </p>
                  </div>
                  <p
                    className={clsx(
                      "font-semibold tabular-nums",
                      t.amount > 0 ? "text-success" : "text-danger",
                    )}
                  >
                    {t.amount > 0 ? "+" : ""}
                    {formatMoney(t.amount)}
                  </p>
                </Card.Content>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
