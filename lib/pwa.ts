/** iPhone/iPad (iPadOS kendini Mac olarak tanıtır). */
export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** Uygulama ana ekrandan (kurulu olarak) mı açıldı? */
export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * Ana ekrana eklemenin yolu tarayıcıya göre değişir:
 * - `inapp`: Instagram/WhatsApp vb. içinden açıldı; önce gerçek tarayıcıda açılmalı.
 * - `ios-safari` / `ios-other`: iPhone'da Paylaş menüsünden eklenir (otomatik değil).
 * - `android-firefox`: tarayıcı menüsünden eklenir.
 * - `prompt`: Chrome/Edge/Samsung; `beforeinstallprompt` ile tek dokunuşla eklenir.
 */
export type InstallContext =
  "inapp" | "ios-safari" | "ios-other" | "android-firefox" | "prompt";

export function getInstallContext(): InstallContext {
  const ua = navigator.userAgent;

  // Android WebView ("; wv)") ve bilinen uygulama içi tarayıcılar.
  if (
    /; wv\)|FBAN|FBAV|Instagram|WhatsApp|Line\/|Snapchat|TikTok|musical_ly|Twitter/i.test(
      ua,
    )
  ) {
    return "inapp";
  }

  if (isIOS()) {
    if (/CriOS|EdgiOS|FxiOS|OPiOS/.test(ua)) return "ios-other";
    // "Safari/" yoksa bir uygulamanın gömülü tarayıcısıdır.
    if (!/Safari\//.test(ua)) return "inapp";

    return "ios-safari";
  }

  if (/Android/.test(ua) && /Firefox\//.test(ua)) return "android-firefox";

  return "prompt";
}
