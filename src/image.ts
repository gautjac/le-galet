// Family photos off a phone are often 4–12 MP — far more than a kitchen screen
// needs. Downscale to a sensible max edge and re-encode so IndexedDB stays light
// and the cross-fade never hitches decoding a giant JPEG. EXIF orientation is
// handled by createImageBitmap's imageOrientation option.
const MAX_EDGE = 2048;
const QUALITY = 0.86;

export async function processImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1 && file.size < 1_400_000) {
      bitmap.close();
      return file; // already small enough; keep original bytes
    }
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    return blob ?? file;
  } catch {
    return file; // any decode failure: store what we were handed
  }
}
