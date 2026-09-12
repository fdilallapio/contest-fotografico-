import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { SendMailAttachment } from "@/lib/email";

/** Content-ID usato nel markup delle email per referenziare il logo: src="cid:logo-comunita". */
export const LOGO_CID = "logo-comunita";

let cached: SendMailAttachment | null = null;

/** Allegato inline (CID) col logo ComUnità, ridimensionato per restare leggero in email. */
export async function getLogoAttachment(): Promise<SendMailAttachment> {
  if (cached) return cached;

  const original = await readFile(path.join(process.cwd(), "public", "logo-comunita.jpeg"));
  const resized = await sharp(original).resize({ height: 72 }).jpeg({ quality: 85 }).toBuffer();

  cached = { filename: "logo-comunita.jpg", content: resized, contentType: "image/jpeg", cid: LOGO_CID };
  return cached;
}
