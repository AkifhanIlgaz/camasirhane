"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Card, Chip, Spinner, Tabs } from "@heroui/react";
import clsx from "clsx";

import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime, formatMoney } from "@/lib/format";
import { statusColor, statusLabel } from "@/lib/status";
import type { Transaction, WashRequest } from "@/types";

/** Kendi dokümanlarını dinler; index gerekmesin diye sıralama istemcide yapılır. */
function useOwnDocs<T extends { createdAt: { toDate: () => Date } | null }>(
  name: "requests" | "transactions",
) {
  const { user } = useAuth();
  const [items, setItems] = useState<T[] | null>(null);

  useEffect(() => {
    if (!user) return;

    return onSnapshot(
      query(collection(db, name), where("uid", "==", user.uid)),
      (snap) =>
        setItems(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as unknown as T)
            .sort(
              (a, b) =>
                // Sunucu zamanı henüz gelmemiş (null) kayıt en yenidir.
                (b.createdAt?.toDate().getTime() ?? Infinity) -
                (a.createdAt?.toDate().getTime() ?? Infinity),
            ),
        ),
      () => setItems([]),
    );
  }, [user, name]);

  return items;
}

const Loading = () => (
  <div className="flex justify-center py-8">
    <Spinner />
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <p className="py-8 text-center text-sm text-muted">{text}</p>
);

function Requests() {
  const items = useOwnDocs<WashRequest>("requests");

  if (items === null) return <Loading />;
  if (items.length === 0) return <Empty text="Henüz isteğiniz yok." />;

  return (
    <ul className="flex flex-col gap-2">
      {items.map((r) => (
        <li key={r.id}>
          <Card>
            <Card.Content className="gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-semibold">{r.program}</p>
                <Chip color={statusColor[r.status]} size="sm" variant="soft">
                  <Chip.Label>{statusLabel[r.status]}</Chip.Label>
                </Chip>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Chip size="sm" variant="soft">
                  <Chip.Label className="tabular-nums">{r.temperature}°C</Chip.Label>
                </Chip>
                <Chip size="sm" variant="soft">
                  <Chip.Label className="tabular-nums">{r.spin} devir</Chip.Label>
                </Chip>
                {r.softener && (
                  <Chip color="accent" size="sm" variant="soft">
                    <Chip.Label>Yumuşatıcı</Chip.Label>
                  </Chip>
                )}
                {r.dry && (
                  <Chip color="warning" size="sm" variant="soft">
                    <Chip.Label>Kurutma</Chip.Label>
                  </Chip>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs text-muted">
                  {r.createdAt ? formatDateTime(r.createdAt.toDate()) : ""}
                </p>
                <p className="text-lg font-semibold leading-none tabular-nums">
                  {formatMoney(r.price)}
                </p>
              </div>
            </Card.Content>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function Transactions() {
  const items = useOwnDocs<Transaction>("transactions");

  if (items === null) return <Loading />;
  if (items.length === 0) return <Empty text="Henüz işlem yok." />;

  return (
    <ul className="flex flex-col gap-2">
      {items.map((t) => (
        <li key={t.id}>
          <Card>
            <Card.Content className="flex-row items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {t.type === "yukleme" ? "Bakiye yükleme" : "Yıkama"}
                </p>
                <p className="text-sm text-muted">
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
  );
}

export function History() {
  return (
    <Tabs className="w-full">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Geçmiş">
          <Tabs.Tab id="istekler">
            İsteklerim
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="bakiye">
            Bakiye geçmişi
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="istekler">
        <Requests />
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="bakiye">
        <Transactions />
      </Tabs.Panel>
    </Tabs>
  );
}
