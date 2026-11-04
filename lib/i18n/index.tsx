"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { I18nProvider as AriaI18nProvider, isRTL } from "@heroui/react";

import { type Locale, type MessageKey, LOCALES, messages } from "./messages";

export type { Locale, MessageKey };
export { LOCALES };

const STORAGE_KEY = "locale";

const isLocale = (v: unknown): v is Locale =>
  v === "tr" || v === "en" || v === "ar";

/** Intl biçimlendirmesi için BCP 47 etiketi (Arapçada Latin rakamlar). */
export const intlTag: Record<Locale, string> = {
  tr: "tr-TR",
  en: "en-US",
  ar: "ar-u-nu-latn",
};

type Stored = { stored: Locale; setStored: (l: Locale) => void };

const StoredContext = createContext<Stored>({
  stored: "tr",
  setStored: () => {},
});
const ScopeContext = createContext<Locale>("tr");

/** Talebenin seçtiği dili saklar. Kapsam (LocaleScope) dışındaki sayfalar Türkçe kalır. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [stored, setStoredState] = useState<Locale>("tr");

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);

      if (isLocale(v)) setStoredState(v);
    } catch {
      // Depolama kapalıysa varsayılan dil kullanılır.
    }
  }, []);

  const setStored = useCallback((l: Locale) => {
    setStoredState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // Depolama kapalıysa seçim sadece bu oturumda geçerli olur.
    }
  }, []);

  const value = useMemo(() => ({ stored, setStored }), [stored, setStored]);

  return (
    <StoredContext.Provider value={value}>{children}</StoredContext.Provider>
  );
}

/**
 * `user`: talebenin seçtiği dil. `tr`: dil seçimi kapalı, her zaman Türkçe.
 * Sayfanın `lang` ve `dir` değerlerini de ayarlar, çıkarken Türkçe/LTR'ye döndürür.
 */
export function LocaleScope({
  mode,
  children,
}: {
  mode: "user" | "tr";
  children: ReactNode;
}) {
  const { stored } = useContext(StoredContext);
  const locale: Locale = mode === "user" ? stored : "tr";

  useEffect(() => {
    const html = document.documentElement;

    html.lang = locale;
    html.dir = isRTL(locale) ? "rtl" : "ltr";

    return () => {
      html.lang = "tr";
      html.dir = "ltr";
    };
  }, [locale]);

  return (
    <ScopeContext.Provider value={locale}>
      <AriaI18nProvider locale={intlTag[locale]}>{children}</AriaI18nProvider>
    </ScopeContext.Provider>
  );
}

export function useI18n() {
  const locale = useContext(ScopeContext);
  const { setStored } = useContext(StoredContext);

  const t = useCallback(
    (key: MessageKey, params?: Record<string, string | number>) => {
      const text = messages[locale][key] ?? messages.tr[key];

      return params
        ? text.replace(/\{(\w+)\}/g, (m, k: string) =>
            k in params ? String(params[k]) : m,
          )
        : text;
    },
    [locale],
  );

  return {
    locale,
    setLocale: setStored,
    t,
    dir: isRTL(locale) ? "rtl" : "ltr",
  };
}
