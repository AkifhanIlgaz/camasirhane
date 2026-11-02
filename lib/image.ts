const MAX_SIDE = 1024;

/** Seçilebilecek en büyük ham dosya (telefon fotoğrafları genelde 3–8 MB). */
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
/** Kaydedilen fotoğrafın en büyük boyutu (data URL uzunluğu). */
export const MAX_IMAGE_CHARS = 300_000;

/** Fotoğrafı küçültüp JPEG data URL'ine çevirir; sınırı aşarsa kaliteyi düşürür. */
export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Sadece fotoğraf yükleyebilirsiniz.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Fotoğraf en fazla 15 MB olabilir.");
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.7, 0.55, 0.4]) {
    const url = canvas.toDataURL("image/jpeg", quality);
    if (url.length <= MAX_IMAGE_CHARS) return url;
  }
  throw new Error("Fotoğraf çok büyük, başka bir fotoğraf deneyin.");
}
