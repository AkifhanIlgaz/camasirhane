const MAX_SIDE = 1280;

/** Seçilebilecek en büyük ham dosya (telefon fotoğrafları genelde 3–8 MB). */
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
/** Yüklenen fotoğrafın en büyük boyutu (Storage kurallarıyla aynı). */
export const MAX_IMAGE_BYTES = 500_000;

/** Fotoğrafı küçültüp JPEG'e çevirir; sınırı aşarsa kaliteyi düşürür. */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("img.type");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("img.size");
  }

  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");

  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.75, 0.6, 0.45]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );

    if (blob && blob.size <= MAX_IMAGE_BYTES) return blob;
  }
  throw new Error("img.big");
}
