import nodemailer, { type Transporter } from "nodemailer";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/**
 * Email transport: real SMTP when SMTP_HOST is configured (production),
 * otherwise a local mock that writes the rendered email to storage/emails/
 * for inspection instead of actually sending it — same mock-first pattern
 * used for object storage (lib/storage.ts) and the database.
 */

let transporter: Transporter | null = null;
let isMock = false;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  } else {
    isMock = true;
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

const MOCK_DIR = path.join(process.cwd(), "storage", "emails");

export interface SendMailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  /** Content-ID for inline embedding: reference it in the HTML as `src="cid:<cid>"`. */
  cid?: string;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: SendMailAttachment[];
}

export async function sendMail({ to, subject, html, attachments }: SendMailInput): Promise<void> {
  const from = process.env.EMAIL_FROM ?? "Contest Fotografico <no-reply@contest.local>";
  getTransporter();
  const info = await transporter!.sendMail({
    from,
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
      cid: a.cid,
    })),
  });

  if (isMock) {
    await mkdir(MOCK_DIR, { recursive: true });
    const safeTo = to.replace(/[^a-z0-9@.-]/gi, "_");
    const filename = `${Date.now()}-${safeTo}.html`;
    await writeFile(path.join(MOCK_DIR, filename), html, "utf-8");
    console.log(`[email:mock] "${subject}" -> ${to} (saved to storage/emails/${filename})`);
  } else {
    console.log(`[email] "${subject}" -> ${to} (messageId: ${info.messageId})`);
  }
}
