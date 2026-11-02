import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type Role = "muhasebeci" | "camasirci" | "talebe";

/** `users/{uid}` dokümanı. */
export interface UserProfile {
  role: Role;
  username: string;
  /** Sadece talebeler için; çamaşırcı çamaşırı bu numarayla tanır. */
  studentNo?: string;
  /** Sadece talebeler için, TL. */
  balance?: number;
}

/** `settings/pricing` — sadece muhasebeci değiştirir. */
export interface PricingSettings {
  washPrice: number;
  dryPrice: number;
}

/** `transactions/{id}` */
export interface Transaction {
  id: string;
  uid: string;
  studentNo: string;
  amount: number;
  type: "yukleme" | "yikama";
  by: string;
  createdAt: { toDate: () => Date } | null;
}

/** `teslim` artık kullanılmıyor; sadece eski kayıtlar için ("bitti" ile aynı sayılır). */
export type RequestStatus = "bekliyor" | "yikaniyor" | "kurutuluyor" | "bitti" | "teslim";

/** `requests/{id}` */
export interface WashRequest {
  id: string;
  uid: string;
  studentNo: string;
  /** Program id'si (`lib/programs.ts`); eski kayıtlarda Türkçe program adı. */
  program: string;
  temperature: number;
  spin: number;
  softener: boolean;
  dry: boolean;
  /** Kurutma isteniyorsa seçilen kurutma programı. */
  dryProgram: string | null;
  price: number;
  status: RequestStatus;
  machineId: string | null;
  startedAt: { toDate: () => Date } | null;
  createdAt: { toDate: () => Date } | null;
  /** Fotoğraf `requestImages/{id}` içinde; 10 gün sonra silinir. */
  hasImage?: boolean;
  /** Talebenin çamaşırcıya notu (en fazla 200 karakter); eski kayıtlarda yoktur. */
  note?: string;
  /** Talebeye "hazır" bildirimi gönderildiyse zamanı (sunucu yazar). */
  notifiedAt?: { toDate: () => Date } | null;
}

/** `requestImages/{requestId}` — sadece talebe ve çamaşırcı okur. */
export interface RequestImage {
  uid: string;
  /** Storage yolu: `requestImages/{uid}/{requestId}.jpg` */
  path?: string;
  /** Eski kayıtlar: `data:image/jpeg;base64,...` */
  image?: string;
  expireAt: { toDate: () => Date };
}

/** `machines/{id}` — makineyi muhasebeci ekler. */
export interface Machine {
  id: string;
  name: string;
  /** Eski kayıtlarda yoksa çamaşır makinesi sayılır. */
  type?: "camasir" | "kurutma";
  /** Makinedeki isteğin id'si; boşsa makine boştur. */
  requestId: string | null;
}
