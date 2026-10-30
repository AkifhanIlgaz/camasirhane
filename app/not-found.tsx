import NextLink from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <div>
        <h2 className="text-lg font-semibold">Sayfa bulunamadı</h2>
        <p className="mt-1 text-sm text-muted">
          Aradığınız sayfa mevcut değil.
        </p>
      </div>
      <NextLink
        className="button button--primary button--md"
        href="/"
      >
        Ana sayfaya dön
      </NextLink>
    </div>
  );
}
