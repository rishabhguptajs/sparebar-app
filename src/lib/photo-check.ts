// Checks a reference photo in the browser before it is uploaded: size, light and sharpness.
// The pixel maths is a pure function so it can be tested. A photo that fails is a warning, not a block:
// the person may know better than the check.

export type PhotoIssue = "small" | "dark" | "bright" | "blurry";

export const PHOTO_TIPS: Record<PhotoIssue, string> = {
  small: "This photo is small. A larger one gives a sharper face.",
  dark: "This photo is dark. Face the light, or use a brighter one.",
  bright: "This photo is washed out. Avoid strong glare on the face.",
  blurry: "This photo looks blurry. A sharp, in focus photo keeps the face steady.",
};

export const MIN_SIDE = 512;
const DARK_BELOW = 55;
const BRIGHT_ABOVE = 232;
/** Variance of the Laplacian on a 256 px copy. Sharp photos sit well above this. */
const BLUR_BELOW = 40;

/** Mean brightness (0 to 255) and Laplacian variance of an RGBA pixel buffer. */
export function measure(data: ArrayLike<number>, width: number, height: number) {
  const gray = new Float32Array(width * height);
  let sum = 0;
  for (let i = 0; i < gray.length; i++) {
    const g = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    gray[i] = g;
    sum += g;
  }
  let lapSum = 0;
  let lapSq = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const v = gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width] - 4 * gray[i];
      lapSum += v;
      lapSq += v * v;
      n++;
    }
  }
  const mean = n ? lapSum / n : 0;
  return { brightness: sum / Math.max(1, gray.length), sharpness: n ? lapSq / n - mean * mean : 0 };
}

export function judge(opts: { width: number; height: number; brightness: number; sharpness: number }): PhotoIssue[] {
  const issues: PhotoIssue[] = [];
  if (Math.min(opts.width, opts.height) < MIN_SIDE) issues.push("small");
  if (opts.brightness < DARK_BELOW) issues.push("dark");
  if (opts.brightness > BRIGHT_ABOVE) issues.push("bright");
  if (opts.sharpness < BLUR_BELOW) issues.push("blurry");
  return issues;
}

/** Reads the file in the browser and reports what is wrong with it. Returns no issues if the browser cannot read it. */
export async function checkPhoto(file: File): Promise<PhotoIssue[]> {
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(3, Math.round(bitmap.width * scale));
      const h = Math.max(3, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return [];
      ctx.drawImage(bitmap, 0, 0, w, h);
      const { brightness, sharpness } = measure(ctx.getImageData(0, 0, w, h).data, w, h);
      return judge({ width: bitmap.width, height: bitmap.height, brightness, sharpness });
    } finally {
      bitmap.close();
    }
  } catch {
    return [];
  }
}
