import "server-only";
import sharp from "sharp";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

let s3: S3Client | undefined;

function client() {
  s3 ??= new S3Client({
    region: "auto",
    endpoint: `https://${env.r2AccountId()}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.r2AccessKeyId(), secretAccessKey: env.r2SecretAccessKey() },
  });
  return s3;
}

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "video/mp4": "mp4",
};

export function extFor(mime: string) {
  return EXT[mime] ?? "bin";
}

export async function putObject(key: string, bytes: Uint8Array, mime: string) {
  await client().send(new PutObjectCommand({ Bucket: env.r2Bucket(), Key: key, Body: bytes, ContentType: mime }));
}

/** A small copy of an image for grids. Returns null for anything that is not an image or cannot be read. */
export async function makeThumb(bytes: Uint8Array, mime: string): Promise<Uint8Array | null> {
  if (!mime.startsWith("image/")) return null;
  try {
    return new Uint8Array(await sharp(bytes).rotate().resize({ width: 480, withoutEnlargement: true }).webp({ quality: 74 }).toBuffer());
  } catch {
    return null;
  }
}

export async function getObjectBytes(key: string): Promise<{ bytes: Uint8Array; mime: string }> {
  const res = await client().send(new GetObjectCommand({ Bucket: env.r2Bucket(), Key: key }));
  if (!res.Body) throw new Error(`Empty object ${key}`);
  return { bytes: await res.Body.transformToByteArray(), mime: res.ContentType ?? "application/octet-stream" };
}

// A signed link carries the time it was signed, so a new one every request means a new address every
// time and the browser downloads the same image again. Signing at the start of the hour keeps the address
// identical for an hour, so the browser reuses its copy. The expiry is extended by the same hour.
const WINDOW_MS = 3600_000;

/** Private bucket: media is served through signed URLs that stay the same within the hour. */
export async function signedUrl(key: string, seconds = 3600, downloadName?: string) {
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: env.r2Bucket(),
      Key: key,
      ResponseCacheControl: "private, max-age=3600",
      ...(downloadName ? { ResponseContentDisposition: `attachment; filename="${downloadName}"` } : {}),
    }),
    { expiresIn: seconds + WINDOW_MS / 1000, signingDate: new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS) },
  );
}
