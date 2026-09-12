import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 (S3-compatible) storage, split across two buckets — R2's
 * Public Access toggle applies to a whole bucket, not a prefix within one,
 * so a single bucket can't keep originals private while serving derived
 * images publicly. Originals (with EXIF/GPS intact) live in R2_BUCKET_NAME,
 * which never has Public Access enabled; derived WebP variants live in
 * R2_BUCKET_PUBLIC, which does. Callers outside this file don't change:
 * saveOriginal/saveDerived still return an opaque key / a public URL.
 */

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

let client: S3Client | null = null;
function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env("R2_ACCESS_KEY_ID"),
        secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return client;
}

function privateBucket(): string {
  return env("R2_BUCKET_NAME");
}
function publicBucket(): string {
  return env("R2_BUCKET_PUBLIC");
}
function publicBase(): string {
  return env("R2_PUBLIC_URL").replace(/\/$/, "");
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  const chunks: Buffer[] = [];
  // @ts-expect-error — the SDK's Body is an async-iterable stream at runtime in Node
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function saveOriginal(candidateId: string, buffer: Buffer, ext: string): Promise<string> {
  const key = `${candidateId}/${crypto.randomUUID()}${ext}`;
  await s3().send(new PutObjectCommand({ Bucket: privateBucket(), Key: key, Body: buffer }));
  return key; // opaque key, stored in Photo.originalKey
}

export async function readOriginal(key: string): Promise<Buffer> {
  const res = await s3().send(new GetObjectCommand({ Bucket: privateBucket(), Key: key }));
  return streamToBuffer(res.Body);
}

export async function deleteOriginal(key: string): Promise<void> {
  await s3()
    .send(new DeleteObjectCommand({ Bucket: privateBucket(), Key: key }))
    .catch(() => undefined);
}

export async function saveDerived(key: string, buffer: Buffer): Promise<string> {
  await s3().send(
    new PutObjectCommand({ Bucket: publicBucket(), Key: key, Body: buffer, ContentType: "image/webp" })
  );
  return `${publicBase()}/${key}`; // public URL, stored in Photo.thumbKey/mediumKey/fullKey
}

/** Reads back a derived variant given the public URL stored in Photo.thumbKey/mediumKey/fullKey. */
export async function readDerivedByPublicUrl(publicUrl: string): Promise<Buffer> {
  const prefix = `${publicBase()}/`;
  if (!publicUrl.startsWith(prefix)) {
    throw new Error(`Unexpected derived URL: ${publicUrl}`);
  }
  const key = publicUrl.slice(prefix.length);
  const res = await s3().send(new GetObjectCommand({ Bucket: publicBucket(), Key: key }));
  return streamToBuffer(res.Body);
}

/** Removes a derived variant given the public URL stored in Photo.thumbKey/mediumKey/fullKey. */
export async function deleteDerivedByPublicUrl(publicUrl: string | null): Promise<void> {
  const prefix = `${publicBase()}/`;
  if (!publicUrl || !publicUrl.startsWith(prefix)) return;
  const key = publicUrl.slice(prefix.length);
  await s3()
    .send(new DeleteObjectCommand({ Bucket: publicBucket(), Key: key }))
    .catch(() => undefined);
}
