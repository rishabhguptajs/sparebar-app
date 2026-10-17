import "server-only";
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

export async function getObjectBytes(key: string): Promise<{ bytes: Uint8Array; mime: string }> {
  const res = await client().send(new GetObjectCommand({ Bucket: env.r2Bucket(), Key: key }));
  if (!res.Body) throw new Error(`Empty object ${key}`);
  return { bytes: await res.Body.transformToByteArray(), mime: res.ContentType ?? "application/octet-stream" };
}

/** Private bucket: media is served through short-lived signed URLs. */
export async function signedUrl(key: string, seconds = 3600, downloadName?: string) {
  return getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: env.r2Bucket(),
      Key: key,
      ...(downloadName ? { ResponseContentDisposition: `attachment; filename="${downloadName}"` } : {}),
    }),
    { expiresIn: seconds },
  );
}
