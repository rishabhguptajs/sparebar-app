// Browser-side photo downscaling. Phone photos are several MB each, and a serverless request body is
// capped (4.5 MB on Vercel), so photos are shrunk before upload. They are also sent to labs as base64.

export const MAX_SIDE = 1536;
export const JPEG_QUALITY = 0.85;

/** Size that fits within max on the long side, keeping the shape. Never enlarges. */
export function fitWithin(width: number, height: number, max = MAX_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Returns a JPEG no larger than MAX_SIDE on its long side. Throws if the browser cannot read the file. */
export async function resizeImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available");
    ctx.fillStyle = "#ffffff"; // flatten transparency, since JPEG has none
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new Error("Could not encode the photo");
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
