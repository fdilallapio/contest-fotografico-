import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { fileTypeFromBuffer } from "file-type";
import sanitizeHtml from "sanitize-html";
import { prisma } from "@/lib/prisma";
import { computeContestPhase } from "@/lib/contest-phase";
import { rateLimit } from "@/lib/rate-limit";
import { verifyCsrfToken } from "@/lib/csrf";
import { getClientIp } from "@/lib/request-ip";
import { saveOriginal } from "@/lib/storage";
import { processPhoto, generateEmailThumbnail } from "@/lib/image-processing";
import { sendMail, type SendMailAttachment } from "@/lib/email";
import { submissionConfirmationEmail, type SubmissionThemeRecap } from "@/lib/email-templates";
import { getLogoAttachment } from "@/lib/email-logo";

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
};
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_PHOTOS_PER_THEME = 2;
const MAX_ENTRIES = 12; // 6 temi x 2 foto
// Limite sul body dell'intera richiesta (file + overhead multipart/JSON), per
// rifiutare payload abnormemente grandi prima di bufferizzarli in memoria.
const MAX_BODY_SIZE = MAX_FILE_SIZE * MAX_ENTRIES + 2 * 1024 * 1024;

const SubmissionSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().min(5).max(20),
  location: z.string().trim().min(1).max(200),
  gdprConsent: z.literal(true),
  rulesConsent: z.literal(true),
  entries: z
    .array(
      z.object({
        themeSlug: z.string(),
        description: z.string().max(500),
      })
    )
    .min(1)
    .max(MAX_ENTRIES),
});

const clean = (s: string) => sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} });

export async function POST(req: NextRequest) {
  const config = await prisma.contestConfig.findFirst();
  if (!config || computeContestPhase(config, new Date()).phase !== "UPLOAD") {
    return NextResponse.json({ error: "La fase di upload non è attiva" }, { status: 403 });
  }

  if (!(await verifyCsrfToken(req))) {
    return NextResponse.json({ error: "Token di sicurezza non valido, ricarica la pagina" }, { status: 403 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json({ error: "Richiesta troppo grande" }, { status: 413 });
  }

  const ip = getClientIp(req);
  const { success } = rateLimit(`submission:${ip}`, { windowMs: 60 * 60 * 1000, max: 5 });
  if (!success) {
    return NextResponse.json({ error: "Troppe candidature da questo indirizzo, riprova più tardi" }, { status: 429 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string") {
    return NextResponse.json({ error: "Payload mancante" }, { status: 400 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawPayload);
  } catch {
    return NextResponse.json({ error: "Payload JSON non valido" }, { status: 400 });
  }

  const parsed = SubmissionSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const perTheme = new Map<string, number>();
  for (const e of data.entries) perTheme.set(e.themeSlug, (perTheme.get(e.themeSlug) ?? 0) + 1);
  if ([...perTheme.values()].some((n) => n > MAX_PHOTOS_PER_THEME)) {
    return NextResponse.json({ error: `Massimo ${MAX_PHOTOS_PER_THEME} foto per tema` }, { status: 400 });
  }

  const themes = await prisma.theme.findMany({ where: { slug: { in: [...perTheme.keys()] } } });
  const themeBySlug = new Map(themes.map((t) => [t.slug, t]));
  if (themeBySlug.size !== perTheme.size) {
    return NextResponse.json({ error: "Uno o più temi non sono validi" }, { status: 400 });
  }

  const files = formData.getAll("files");
  if (files.length !== data.entries.length || files.some((f) => !(f instanceof File))) {
    return NextResponse.json({ error: "File mancanti o non corrispondenti ai metadati" }, { status: 400 });
  }

  // Validazione reale del contenuto binario (magic bytes) PRIMA di scrivere qualsiasi cosa su disco.
  const validated: { buffer: Buffer; mime: string; ext: string }[] = [];
  for (const f of files as File[]) {
    if (f.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `${f.name} supera il limite di 50MB` }, { status: 400 });
    }
    const buffer = Buffer.from(await f.arrayBuffer());
    const detected = await fileTypeFromBuffer(buffer);
    const ext = detected ? ALLOWED_MIME[detected.mime] : undefined;
    if (!detected || !ext) {
      return NextResponse.json(
        { error: `Formato non supportato per ${f.name}. Formati ammessi: JPEG, PNG, WEBP, HEIC.` },
        { status: 400 }
      );
    }
    validated.push({ buffer, mime: detected.mime, ext });
  }

  // Zod valida la lunghezza sull'input grezzo, prima della sanitizzazione HTML:
  // un valore come "<b></b>" supera min(1) ma diventa stringa vuota dopo clean().
  const firstName = clean(data.firstName);
  const lastName = clean(data.lastName);
  const phone = clean(data.phone);
  const location = clean(data.location);
  if (!firstName || !lastName || !phone || !location) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const existingCandidate = await prisma.candidate.findUnique({ where: { email } });
  if (existingCandidate) {
    return NextResponse.json(
      { error: "Hai già inviato una candidatura con questa email." },
      { status: 409 }
    );
  }

  let candidate;
  try {
    candidate = await prisma.candidate.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        location,
        gdprConsent: true,
        rulesConsent: true,
        consentIp: ip,
      },
    });
  } catch (err) {
    // ripiego per una corsa critica: due invii con la stessa email arrivati
    // nello stesso istante, entrambi passati oltre il controllo sopra
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Hai già inviato una candidatura con questa email." },
        { status: 409 }
      );
    }
    throw err;
  }

  const createdPhotoIds: string[] = [];
  // themeSlug -> ordered list of {photoId, description}, per costruire il recap dopo il processing
  const entriesByTheme = new Map<string, { themeName: string; photoIds: string[]; descriptions: string[] }>();
  for (let i = 0; i < data.entries.length; i++) {
    const entry = data.entries[i];
    const theme = themeBySlug.get(entry.themeSlug)!;
    const { buffer, mime, ext } = validated[i];
    const description = clean(entry.description);

    const originalKey = await saveOriginal(candidate.id, buffer, ext);
    const photo = await prisma.photo.create({
      data: {
        candidateId: candidate.id,
        themeId: theme.id,
        description,
        originalKey,
        originalMime: mime,
        status: "PENDING",
      },
    });
    createdPhotoIds.push(photo.id);

    if (!entriesByTheme.has(theme.slug)) {
      entriesByTheme.set(theme.slug, { themeName: theme.name, photoIds: [], descriptions: [] });
    }
    const group = entriesByTheme.get(theme.slug)!;
    group.photoIds.push(photo.id);
    group.descriptions.push(description);
  }

  // In produzione questo va in coda (BullMQ) per non bloccare la response;
  // qui, in mock/local mode senza infrastruttura di code, processiamo inline.
  await Promise.all(createdPhotoIds.map((id) => processPhoto(id)));

  try {
    const processedPhotos = await prisma.photo.findMany({
      where: { id: { in: createdPhotoIds } },
      select: { id: true, thumbKey: true },
    });
    const thumbKeyByPhotoId = new Map(processedPhotos.map((p) => [p.id, p.thumbKey]));

    // Miniature leggere (88px JPEG) incorporate via CID: la mail resta autonoma
    // e piccola invece di linkare immagini esterne o allegare i thumbnail interi.
    const attachments: SendMailAttachment[] = [];
    const themes: SubmissionThemeRecap[] = [];
    for (const { themeName, photoIds, descriptions } of entriesByTheme.values()) {
      const photos: SubmissionThemeRecap["photos"] = [];
      for (let i = 0; i < photoIds.length; i++) {
        const photoId = photoIds[i];
        const thumbKey = thumbKeyByPhotoId.get(photoId);
        let cid: string | null = null;
        if (thumbKey) {
          try {
            const emailThumb = await generateEmailThumbnail(thumbKey);
            cid = `photo-${photoId}`;
            attachments.push({ filename: `foto-${photoId}.jpg`, content: emailThumb, contentType: "image/jpeg", cid });
          } catch (err) {
            console.error(`[submissions] miniatura email non generata per foto ${photoId}:`, err);
          }
        }
        photos.push({ description: descriptions[i], cid });
      }
      themes.push({ themeName, photos });
    }
    attachments.push(await getLogoAttachment());

    const { subject, html } = submissionConfirmationEmail({ firstName: candidate.firstName, themes });
    await sendMail({ to: candidate.email, subject, html, attachments });
    await prisma.candidate.update({ where: { id: candidate.id }, data: { confirmationEmailSentAt: new Date() } });
  } catch (err) {
    // l'invio dell'email non deve far fallire la candidatura già salvata
    console.error(`[submissions] invio email di conferma fallito per candidate ${candidate.id}:`, err);
  }

  return NextResponse.json({ candidateId: candidate.id, photosSubmitted: createdPhotoIds.length }, { status: 201 });
}
