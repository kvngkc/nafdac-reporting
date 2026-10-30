import "server-only";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { UPLOADS } from "@/lib/config";

type AllowedMime = (typeof UPLOADS.allowedMime)[number];

export class UploadError extends Error {}

const LOCAL_DIR = path.join(process.cwd(), "uploads");

let s3: S3Client | null = null;
function s3Client() {
  s3 ??= new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
  return s3;
}

const driver = () => process.env.STORAGE_DRIVER ?? "local";

export type StoredEvidence = { storageKey: string; mimeType: AllowedMime; size: number; data?: Uint8Array<ArrayBuffer> };

/**
 * Validates an uploaded image by decoding it (not trusting the browser's MIME type),
 * re-encodes it which drops EXIF/GPS metadata, and stores it under a random key.
 */
export async function storeEvidence(file: File): Promise<StoredEvidence> {
  if (file.size > UPLOADS.maxBytes) throw new UploadError(`"${file.name}" is larger than 5 MB`);
  const input = Buffer.from(await file.arrayBuffer());

  let format: string | undefined;
  try {
    format = (await sharp(input).metadata()).format;
  } catch {
    throw new UploadError(`"${file.name}" is not a valid image`);
  }
  const mimeType = (
    { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as Record<string, AllowedMime | undefined>
  )[format ?? ""];
  if (!mimeType) throw new UploadError(`"${file.name}" must be a JPG, PNG or WebP image`);

  // rotate() applies the EXIF orientation before metadata is discarded.
  const output = await sharp(input)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .toFormat(format as "jpeg" | "png" | "webp")
    .toBuffer();

  const ext = format === "jpeg" ? "jpg" : format;
  const storageKey = `evidence/${randomUUID()}.${ext}`;

  if (driver() === "db") {
    // Bytes are saved with the Evidence row by the caller.
    return { storageKey, mimeType, size: output.length, data: new Uint8Array(output) };
  }
  if (driver() === "s3") {
    await s3Client().send(
      new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: storageKey, Body: output, ContentType: mimeType }),
    );
  } else {
    const dest = path.join(LOCAL_DIR, storageKey);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, output);
  }
  return { storageKey, mimeType, size: output.length };
}

export async function readEvidence({ storageKey, data }: { storageKey: string; data: Uint8Array | null }): Promise<Buffer> {
  if (data) return Buffer.from(data);
  if (!/^evidence\/[0-9a-f-]+\.(jpg|png|webp)$/.test(storageKey)) throw new Error("Bad storage key");
  if (driver() === "s3") {
    const res = await s3Client().send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: storageKey }));
    return Buffer.from(await res.Body!.transformToByteArray());
  }
  return readFile(path.join(LOCAL_DIR, storageKey));
}
