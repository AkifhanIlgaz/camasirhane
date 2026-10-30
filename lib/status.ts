import type { RequestStatus } from "@/types";

export const statusLabel: Record<RequestStatus, string> = {
  bekliyor: "Sırada",
  yikaniyor: "Yıkanıyor",
  kurutuluyor: "Kurutuluyor",
  bitti: "Bitti",
  teslim: "Teslim edildi",
};

export const statusColor: Record<
  RequestStatus,
  "default" | "warning" | "accent" | "success"
> = {
  bekliyor: "warning",
  yikaniyor: "accent",
  kurutuluyor: "accent",
  bitti: "success",
  teslim: "default",
};
