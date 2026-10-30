"use client";

import { useEffect } from "react";
import { Button } from "@heroui/react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <div>
        <h2 className="text-lg font-semibold">Bir şeyler ters gitti</h2>
        <p className="mt-1 text-sm text-muted">
          Lütfen sayfayı yenilemeyi deneyin.
        </p>
      </div>
      <Button onPress={() => reset()}>Tekrar dene</Button>
    </div>
  );
}
