"use client";

import { Button } from "@heroui/react";

import { LOCALES, useI18n } from "@/lib/i18n";

/** Dil seçimi sadece talebe sayfasında bulunur. */
export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div aria-label={t("language")} className="flex gap-2" role="group">
      {LOCALES.map((l) => (
        <Button
          key={l.id}
          aria-pressed={locale === l.id}
          className="flex-1"
          size="sm"
          variant={locale === l.id ? "primary" : "secondary"}
          onPress={() => setLocale(l.id)}
        >
          {l.label}
        </Button>
      ))}
    </div>
  );
}
