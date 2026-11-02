import type { MessageKey } from "@/lib/i18n";
import type { RequestStatus } from "@/types";

/** Çeviri anahtarı: `t(statusKey[status])`. */
export const statusKey = {
  bekliyor: "status.bekliyor",
  yikaniyor: "status.yikaniyor",
  kurutuluyor: "status.kurutuluyor",
  bitti: "status.bitti",
  teslim: "status.teslim",
} as const satisfies Record<RequestStatus, MessageKey>;

export const statusColor: Record<
  RequestStatus,
  "default" | "warning" | "accent" | "success"
> = {
  bekliyor: "warning",
  yikaniyor: "accent",
  kurutuluyor: "accent",
  bitti: "success",
  teslim: "success",
};
