"use client";

import type { MessageKey } from "@/lib/i18n";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button, Card } from "@heroui/react";
import clsx from "clsx";

import { useI18n } from "@/lib/i18n";

/** Tur bir kez otomatik gösterilir; adımlar değişirse sürüm artırılabilir. */
const DONE_KEY = "talebe-tour-done-v1";

/** Vurgulanan alanın çevresindeki boşluk (px). */
const PAD = 8;

interface Step {
  /** Vurgulanacak alanın `data-tour` değeri; yoksa kart ortada açılır. */
  target?: string;
  title: MessageKey;
  body: MessageKey;
}

const STEPS: Step[] = [
  { title: "tour.welcomeTitle", body: "tour.welcomeBody" },
  { target: "language", title: "tour.langTitle", body: "tour.langBody" },
  { target: "request", title: "tour.requestTitle", body: "tour.requestBody" },
  { title: "tour.formTitle", body: "tour.formBody" },
  { target: "notifications", title: "tour.notifTitle", body: "tour.notifBody" },
  { target: "history", title: "tour.historyTitle", body: "tour.historyBody" },
  { title: "tour.doneTitle", body: "tour.doneBody" },
];

const findTarget = (name?: string) =>
  name ? document.querySelector<HTMLElement>(`[data-tour="${name}"]`) : null;

/** Sayfada görünmeyen alanların (ör. bildirim kutusu yoksa) adımları atlanır. */
const visibleSteps = () =>
  STEPS.filter((s) => {
    if (!s.target) return true;
    const el = findTarget(s.target);

    return !!el && el.getBoundingClientRect().height > 0;
  });

const readDone = () => {
  try {
    return localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return true;
  }
};

/**
 * Talebe sayfasının tanıtma turu. İlk girişte kendiliğinden açılır;
 * "?" düğmesiyle tekrar başlatılır. Alanları `data-tour` ile işaretlenmiş öğeleri vurgular.
 */
export function Tour() {
  const { t } = useI18n();
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const start = useCallback(() => {
    setIndex(0);
    setSteps(visibleSteps());
  }, []);

  const close = useCallback(() => {
    setSteps(null);
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch {
      // Depolama kapalıysa tur bir sonraki girişte yine açılır.
    }
  }, []);

  // İlk girişte sayfa yüklendikten kısa süre sonra kendiliğinden başlar.
  useEffect(() => {
    if (readDone()) return;
    const timer = setTimeout(start, 800);

    return () => clearTimeout(timer);
  }, [start]);

  const step = steps?.[index];

  // Vurgulanan alanı görünür yap ve konumunu izle (kaydırma, boyut değişimi).
  useLayoutEffect(() => {
    const el = findTarget(step?.target);

    if (!el) {
      setRect(null);

      return;
    }

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    el.scrollIntoView({
      block: "center",
      behavior: reduce ? "auto" : "smooth",
    });

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRect(el.getBoundingClientRect()));
    };
    const observer = new ResizeObserver(measure);

    observer.observe(el);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    measure();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [step]);

  useEffect(() => {
    if (!steps) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [steps, close]);

  // Klavye kullananlar için odak her adımda "İleri" düğmesine gelir.
  useEffect(() => {
    if (steps) nextRef.current?.focus();
  }, [steps, index]);

  const isLast = steps ? index === steps.length - 1 : false;

  const params: Record<string, string> = {
    flow: [
      "status.bekliyor",
      "status.yikaniyor",
      "status.kurutuluyor",
      "status.bitti",
    ]
      .map((k) => t(k as MessageKey))
      .join(" → "),
    done: t("status.bitti"),
  };

  // Vurgulanan alan ekranın alt yarısındaysa kart üstte açılır.
  const cardOnTop = rect
    ? rect.top + rect.height / 2 > window.innerHeight / 2
    : false;

  return (
    <>
      <Button
        isIconOnly
        aria-label={t("tour.help")}
        size="sm"
        variant="secondary"
        onPress={start}
      >
        ?
      </Button>

      {steps &&
        step &&
        createPortal(
          <div
            aria-labelledby="tour-title"
            aria-modal="true"
            className="fixed inset-0 z-50"
            role="dialog"
          >
            {rect ? (
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-2xl ring-2 ring-white/80 transition-all duration-300 motion-reduce:transition-none"
                style={{
                  top: rect.top - PAD,
                  left: rect.left - PAD,
                  width: rect.width + PAD * 2,
                  height: rect.height + PAD * 2,
                  boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.6)",
                }}
              />
            ) : (
              <div aria-hidden className="absolute inset-0 bg-black/60" />
            )}

            <div
              className={clsx(
                "absolute inset-x-4 mx-auto max-w-md",
                !rect && "top-1/2 -translate-y-1/2",
                rect &&
                  cardOnTop &&
                  "top-[calc(1rem+env(safe-area-inset-top))]",
                rect &&
                  !cardOnTop &&
                  "bottom-[calc(1rem+env(safe-area-inset-bottom))]",
              )}
            >
              <Card className="shadow-xl">
                <Card.Header>
                  <p className="text-xs text-muted tabular-nums">
                    {t("tour.step", { n: index + 1, total: steps.length })}
                  </p>
                  <Card.Title id="tour-title">{t(step.title)}</Card.Title>
                  <Card.Description>{t(step.body, params)}</Card.Description>
                </Card.Header>
                <Card.Footer className="flex items-center justify-between gap-2">
                  {isLast ? (
                    <span />
                  ) : (
                    <Button size="sm" variant="tertiary" onPress={close}>
                      {t("tour.skip")}
                    </Button>
                  )}
                  <div className="flex gap-2">
                    {index > 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => setIndex(index - 1)}
                      >
                        {t("tour.back")}
                      </Button>
                    )}
                    <Button
                      ref={nextRef}
                      size="sm"
                      onPress={() => (isLast ? close() : setIndex(index + 1))}
                    >
                      {isLast ? t("tour.finish") : t("tour.next")}
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
