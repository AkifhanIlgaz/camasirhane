"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Card, Chip, Spinner, Tabs } from "@heroui/react";
import clsx from "clsx";

import { RequestPhoto } from "@/components/request-photo";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { formatDateTime, formatMoney } from "@/lib/format";
import { programName } from "@/lib/programs";
import { statusColor, statusKey } from "@/lib/status";
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
  const { t, locale } = useI18n();
  const items = useOwnDocs<WashRequest>("requests");

  if (items === null) return <Loading />;
  if (items.length === 0) return <Empty text={t("hist.noRequests")} />;

  return (
    <ul className="flex flex-col gap-2">
      {items.map((r) => (
        <li key={r.id}>
          <Card>
            <Card.Content className="gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-semibold">{programName("wash", r.program, locale)}</p>
                <Chip color={statusColor[r.status]} size="sm" variant="soft">
                  <Chip.Label>{t(statusKey[r.status])}</Chip.Label>
                </Chip>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Chip size="sm" variant="soft">
                  <Chip.Label className="tabular-nums">{r.temperature}°C</Chip.Label>
                </Chip>
                <Chip size="sm" variant="soft">
                  <Chip.Label className="tabular-nums">{t("form.spinValue", { n: r.spin })}</Chip.Label>
                </Chip>
                {r.softener && (
                  <Chip color="accent" size="sm" variant="soft">
                    <Chip.Label>{t("hist.softener")}</Chip.Label>
                  </Chip>
                )}
                {r.dry && (
                  <Chip color="warning" size="sm" variant="soft">
                    <Chip.Label>
                      {r.dryProgram
                        ? `${t("hist.dry")} · ${programName("dry", r.dryProgram, locale)}`
                        : t("hist.dry")}
                    </Chip.Label>
                  </Chip>
                )}
              </div>
              {r.note && (
                <p className="whitespace-pre-wrap text-sm text-muted">
                  {t("hist.note", { note: r.note })}
                </p>
              )}
              {r.hasImage && <RequestPhoto requestId={r.id} />}
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs text-muted">
                  {r.createdAt ? formatDateTime(r.createdAt.toDate(), locale) : ""}
                </p>
                <p className="text-lg font-semibold leading-none tabular-nums">
                  {formatMoney(r.price, locale)}
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
  const { t, locale } = useI18n();
  const items = useOwnDocs<Transaction>("transactions");

  if (items === null) return <Loading />;
  if (items.length === 0) return <Empty text={t("hist.noTransactions")} />;

  return (
    <ul className="flex flex-col gap-2">
      {items.map((tx) => (
        <li key={tx.id}>
          <Card>
            <Card.Content className="flex-row items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {tx.type === "yukleme" ? t("hist.topup") : t("hist.wash")}
                </p>
                <p className="text-sm text-muted">
                  {tx.createdAt ? formatDateTime(tx.createdAt.toDate(), locale) : ""}
                </p>
              </div>
              <p
                className={clsx(
                  "font-semibold tabular-nums",
                  tx.amount > 0 ? "text-success" : "text-danger",
                )}
              >
                {tx.amount > 0 ? "+" : ""}
                {formatMoney(tx.amount, locale)}
              </p>
            </Card.Content>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function History() {
  const { t } = useI18n();

  return (
    <Tabs className="w-full">
      <Tabs.ListContainer>
        <Tabs.List aria-label={t("hist.aria")}>
          <Tabs.Tab id="istekler">
            {t("hist.requests")}
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="bakiye">
            {t("hist.balance")}
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
