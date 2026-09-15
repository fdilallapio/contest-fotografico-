import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { readOriginal, saveDerived, readDerivedByPublicUrl } from "@/lib/storage";

/**
 * Neon's pooled connection can drop mid-request (e.g. scale-to-zero waking
 * up), which surfaces as a Prisma "Closed" connection error rather than a
 * clean retryable signal. A couple of retries with backoff is enough for
 * Prisma to grab a fresh connection from the pool on the next attempt.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 400): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

/**
 * Generates thumb/medium/full WebP variants from the uploaded original.
 * In production this runs as a queued worker (BullMQ) so upload requests
 * never block on decode/resize; here it's invoked inline right after upload
 * since local/mock mode has no queue infrastructure.
 *
 * sharp/libvips decode JPEG/PNG/WEBP/HEIC natively. Real camera RAW formats
 * (.CR2, .NEF, .ARW, ...) need a dedicated decoder (e.g. libraw) that isn't
 * wired up here — those uploads are marked REJECTED rather than silently
 * mis-processed.
 */
export async function processPhoto(photoId: string): Promise<void> {
  const photo = await withRetry(() => prisma.photo.findUniqueOrThrow({ where: { id: photoId } }));

  try {
    await withRetry(() => prisma.photo.update({ where: { id: photoId }, data: { status: "PROCESSING" } }));

    const original = await readOriginal(photo.originalKey);
    const pipeline = sharp(original, { failOn: "none" }).rotate();

    const [thumb, medium, full] = await Promise.all([
      pipeline.clone().resize(400, undefined, { withoutEnlargement: true }).webp({ quality: 75 }).toBuffer(),
      pipeline.clone().resize(1200, undefined, { withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
      pipeline.clone().resize(2400, undefined, { withoutEnlargement: true }).webp({ quality: 88 }).toBuffer(),
    ]);

    const base = `${photo.candidateId}/${photo.id}`;
    const [thumbKey, mediumKey, fullKey] = await Promise.all([
      saveDerived(`${base}-thumb.webp`, thumb),
      saveDerived(`${base}-medium.webp`, medium),
      saveDerived(`${base}-full.webp`, full),
    ]);

    await withRetry(() =>
      prisma.photo.update({
        where: { id: photoId },
        data: { thumbKey, mediumKey, fullKey, status: "READY" },
      })
    );
  } catch (err) {
    console.error(`[image-processing] failed for photo ${photoId}:`, err);
    try {
      await withRetry(() => prisma.photo.update({ where: { id: photoId }, data: { status: "REJECTED" } }));
    } catch (rejectErr) {
      console.error(`[image-processing] could not even mark photo ${photoId} as REJECTED:`, rejectErr);
    }
  }
}

/**
 * Tiny JPEG for embedding inline (CID) in the confirmation email — much
 * smaller than the on-site thumbnail so an email with many photos stays
 * lightweight. JPEG rather than WebP for the broadest email-client support.
 */
export async function generateEmailThumbnail(thumbKey: string): Promise<Buffer> {
  const thumb = await readDerivedByPublicUrl(thumbKey);
  return sharp(thumb).resize(88, 88, { fit: "cover" }).jpeg({ quality: 55 }).toBuffer();
}
