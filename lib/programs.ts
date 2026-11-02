import type { Locale } from "@/lib/i18n/messages";

/**
 * Makine programları ve seçenekleri (Beko çamaşır ve kurutma makinesi).
 * İsteklerde programın `id` değeri saklanır; adı dile göre buradan gelir.
 * `minutes`, makinedeki tahmini bitiş süresi için kullanılır (yaklaşık değer).
 */
export interface MachineProgram {
  id: string;
  minutes: number;
  name: Record<Locale, string>;
}

export const WASH_PROGRAMS: MachineProgram[] = [
  {
    id: "pamuklu",
    minutes: 180,
    name: { tr: "Pamuklu", en: "Cottons", ar: "قطنيات" },
  },
  {
    id: "eko-40-60",
    minutes: 210,
    name: { tr: "Eko 40-60", en: "Eco 40-60", ar: "إيكو 40-60" },
  },
  {
    id: "sentetik",
    minutes: 110,
    name: { tr: "Sentetik", en: "Synthetics", ar: "صناعيات" },
  },
  {
    id: "ekspres",
    minutes: 30,
    name: { tr: "Ekspres", en: "Express", ar: "سريع" },
  },
  {
    id: "ekspres-14",
    minutes: 14,
    name: { tr: "Ekspres 14", en: "Express 14", ar: "سريع 14" },
  },
  {
    id: "narin",
    minutes: 50,
    name: {
      tr: "Narin (Yünlü / Elde Yıkama)",
      en: "Delicates (Wool / Hand Wash)",
      ar: "ملابس رقيقة (صوف / غسيل يدوي)",
    },
  },
  {
    id: "yorgan",
    minutes: 110,
    name: {
      tr: "Yorgan (Çift Kişilik)",
      en: "Duvet (Double)",
      ar: "لحاف (مزدوج)",
    },
  },
  { id: "karma", minutes: 90, name: { tr: "Karma", en: "Mix", ar: "مختلط" } },
  {
    id: "soguk-yikama",
    minutes: 70,
    name: { tr: "Soğuk Yıkama", en: "Cold Wash", ar: "غسيل بارد" },
  },
  {
    id: "buharli-havalandirma",
    minutes: 20,
    name: {
      tr: "Buharlı Havalandırma",
      en: "Steam Refresh",
      ar: "إنعاش بالبخار",
    },
  },
  {
    id: "gomlek",
    minutes: 80,
    name: { tr: "Gömlek", en: "Shirts", ar: "قمصان" },
  },
  {
    id: "leke",
    minutes: 160,
    name: { tr: "Leke Programı", en: "Stain Removal", ar: "إزالة البقع" },
  },
  {
    id: "bebek",
    minutes: 140,
    name: { tr: "Bebek+", en: "Baby+", ar: "ملابس الأطفال+" },
  },
  {
    id: "kazan-temizleme",
    minutes: 110,
    name: { tr: "Kazan Temizleme", en: "Drum Clean", ar: "تنظيف الحوض" },
  },
  {
    id: "durulama",
    minutes: 20,
    name: { tr: "Durulama", en: "Rinse", ar: "شطف" },
  },
  {
    id: "sikma-pompa",
    minutes: 15,
    name: { tr: "Sıkma + Pompa", en: "Spin + Drain", ar: "عصر + تصريف" },
  },
];

export const DRY_PROGRAMS: MachineProgram[] = [
  {
    id: "pamuklu",
    minutes: 180,
    name: { tr: "Pamuklu", en: "Cottons", ar: "قطنيات" },
  },
  {
    id: "pamuklu-ekonomik",
    minutes: 200,
    name: { tr: "Pamuklu Ekonomik", en: "Cottons Eco", ar: "قطنيات اقتصادي" },
  },
  {
    id: "sentetik",
    minutes: 90,
    name: { tr: "Sentetik", en: "Synthetics", ar: "صناعيات" },
  },
  { id: "karma", minutes: 120, name: { tr: "Karma", en: "Mix", ar: "مختلط" } },
  {
    id: "havlu",
    minutes: 150,
    name: { tr: "Havlu", en: "Towels", ar: "مناشف" },
  },
  {
    id: "narin",
    minutes: 60,
    name: { tr: "Narin", en: "Delicates", ar: "ملابس رقيقة" },
  },
  {
    id: "gunluk",
    minutes: 70,
    name: { tr: "Günlük", en: "Daily", ar: "يومي" },
  },
  {
    id: "hijyenik-havalandirma",
    minutes: 30,
    name: {
      tr: "Hijyenik Havalandırma",
      en: "Hygiene Refresh",
      ar: "إنعاش صحي",
    },
  },
  {
    id: "hijyenik-kurutma",
    minutes: 150,
    name: { tr: "Hijyenik Kurutma", en: "Hygiene Dry", ar: "تجفيف صحي" },
  },
  {
    id: "ekspres-30",
    minutes: 30,
    name: { tr: "Ekspres 30'", en: "Express 30'", ar: "سريع 30'" },
  },
  {
    id: "gomlek",
    minutes: 40,
    name: { tr: "Gömlek", en: "Shirts", ar: "قمصان" },
  },
  {
    id: "yorgan",
    minutes: 140,
    name: { tr: "Yorgan (Kuş Tüyü)", en: "Duvet (Down)", ar: "لحاف (ريش)" },
  },
  {
    id: "spor",
    minutes: 60,
    name: { tr: "Spor", en: "Sportswear", ar: "ملابس رياضية" },
  },
  { id: "kot", minutes: 120, name: { tr: "Kot", en: "Jeans", ar: "جينز" } },
  {
    id: "zaman-programi",
    minutes: 60,
    name: { tr: "Zaman Programı", en: "Timed Dry", ar: "تجفيف بالوقت" },
  },
];

/** Makinenin sıcaklık seçenekleri (°C). */
export const TEMPERATURES = [20, 30, 40, 60, 90];

/** Makinenin sıkma devirleri (devir/dk). */
export const SPINS = [600, 800, 1000, 1200];

/**
 * Programın seçilen dildeki adı. Eski kayıtlarda program adı (ör. "Pamuklu")
 * saklandığı için bulunamazsa saklanan değer olduğu gibi döner.
 */
export function programName(
  kind: "wash" | "dry",
  id: string | null | undefined,
  locale: Locale = "tr",
): string {
  if (!id) return "";
  const list = kind === "wash" ? WASH_PROGRAMS : DRY_PROGRAMS;

  return list.find((p) => p.id === id || p.name.tr === id)?.name[locale] ?? id;
}

/** Programın tahmini süresi (dakika); bilinmiyorsa `undefined`. */
export function programMinutes(
  kind: "wash" | "dry",
  id: string | null | undefined,
) {
  const list = kind === "wash" ? WASH_PROGRAMS : DRY_PROGRAMS;

  return list.find((p) => p.id === id || p.name.tr === id)?.minutes;
}
