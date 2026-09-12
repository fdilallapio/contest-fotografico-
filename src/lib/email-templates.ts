import { LOGO_CID } from "@/lib/email-logo";

// Palette allineata al sito (src/app/globals.css): riscritta qui perché le
// email non possono importare CSS/token — i valori vanno tenuti in sync a mano.
const COLOR = {
  background: "#F8F9FA",
  card: "#FFFFFF",
  foreground: "#333333",
  muted: "#6B7280",
  border: "#E4E7EB",
  primary: "#D9232A",
  primarySoft: "#FBE4E4",
  accentOrange: "#FF7A1A",
  accentBlue: "#3FC1E8",
  accentGreen: "#2ECC71",
};

const FONT_STACK = "'Poppins','Segoe UI',Helvetica,Arial,sans-serif";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${COLOR.background};font-family:${FONT_STACK};color:${COLOR.foreground};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:${COLOR.card};border-radius:16px;overflow:hidden;">
        <tr><td style="padding:0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="height:6px;background:${COLOR.accentOrange};font-size:0;line-height:0;">&nbsp;</td>
            <td style="height:6px;background:${COLOR.accentBlue};font-size:0;line-height:0;">&nbsp;</td>
            <td style="height:6px;background:${COLOR.primary};font-size:0;line-height:0;">&nbsp;</td>
            <td style="height:6px;background:${COLOR.accentGreen};font-size:0;line-height:0;">&nbsp;</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:24px 32px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td align="left" style="vertical-align:middle;">
              <span style="color:${COLOR.primary};font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">
                Contest Fotografico
              </span>
            </td>
            <td align="right" style="vertical-align:middle;">
              <img src="cid:${LOGO_CID}" alt="ComUnità" height="28" style="display:block;height:28px;width:auto;" />
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:12px 32px 32px;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;background:${COLOR.background};border-top:1px solid ${COLOR.border};">
          <span style="color:${COLOR.muted};font-size:12px;">Ricevi questa email perché ti sei candidato/a al contest fotografico.</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface SubmissionThemeRecap {
  themeName: string;
  photos: { description: string; cid: string | null }[];
}

export function submissionConfirmationEmail({
  firstName,
  themes,
}: {
  firstName: string;
  themes: SubmissionThemeRecap[];
}): { subject: string; html: string } {
  const totalPhotos = themes.reduce((sum, t) => sum + t.photos.length, 0);

  const themesHtml = themes
    .map(
      (t) => `
        <div style="margin-bottom:20px;border:1px solid ${COLOR.border};border-radius:12px;padding:14px 16px;">
          <p style="margin:0 0 10px;font-weight:700;font-size:14px;color:${COLOR.foreground};">
            ${escapeHtml(t.themeName)}
            <span style="color:${COLOR.muted};font-weight:500;"> · ${t.photos.length} foto</span>
          </p>
          <table role="presentation" width="100%" style="border-collapse:collapse;">
            ${t.photos
              .map(
                (p) => `
              <tr>
                <td width="52" style="padding:6px 0;vertical-align:top;">
                  ${
                    p.cid
                      ? `<img src="cid:${p.cid}" width="44" height="44" alt="" style="display:block;width:44px;height:44px;border-radius:8px;border:1px solid ${COLOR.border};object-fit:cover;" />`
                      : `<div style="width:44px;height:44px;border-radius:8px;background:${COLOR.background};border:1px solid ${COLOR.border};"></div>`
                  }
                </td>
                <td style="padding:6px 0 6px 12px;vertical-align:middle;font-size:13px;color:${COLOR.muted};line-height:1.4;">
                  ${escapeHtml(p.description || "Senza descrizione")}
                </td>
              </tr>`
              )
              .join("")}
          </table>
        </div>`
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:${COLOR.foreground};">Ciao ${escapeHtml(firstName)},</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${COLOR.foreground};">
      grazie per aver partecipato al contest fotografico! Abbiamo ricevuto la tua candidatura con
      <strong>${totalPhotos} foto</strong> su ${themes.length} tem${themes.length === 1 ? "a" : "i"}.
    </p>
    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:${COLOR.foreground};">Riepilogo della candidatura</p>
    ${themesHtml}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:${COLOR.foreground};">
      Le tue foto sono ora in fase di revisione. Una volta approvate, parteciperanno alla votazione pubblica:
      si potrà votare online sul sito e di persona in Piazza Duomo (Melfi), durante i giorni di ComUnità.
      Tutte le foto candidate verranno inoltre stampate ed esposte in piazza come installazione permanente.
      Ti terremo aggiornato/a.
    </p>
    <p style="margin:20px 0 0;font-size:14px;color:${COLOR.foreground};">Grazie ancora per il tuo contributo,<br>Il team di ComUnità</p>
  `;

  return { subject: "Candidatura ricevuta — Contest Fotografico", html: layout("Candidatura ricevuta", bodyHtml) };
}

export interface ResultsPhotoRecap {
  themeName: string;
  description: string;
  voteCount: number;
}

export function resultsSummaryEmail({
  firstName,
  photos,
}: {
  firstName: string;
  photos: ResultsPhotoRecap[];
}): { subject: string; html: string } {
  const totalVotes = photos.reduce((sum, p) => sum + p.voteCount, 0);

  const rowsHtml = photos
    .map(
      (p) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${COLOR.border};font-size:14px;">
            <span style="display:block;font-weight:700;color:${COLOR.foreground};">${escapeHtml(p.themeName)}</span>
            <span style="color:${COLOR.muted};">${escapeHtml(p.description || "Senza descrizione")}</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid ${COLOR.border};text-align:right;white-space:nowrap;">
            <span style="display:inline-block;background:${COLOR.primarySoft};color:${COLOR.primary};font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;">
              ${p.voteCount} voti
            </span>
          </td>
        </tr>`
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:${COLOR.foreground};">Ciao ${escapeHtml(firstName)},</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${COLOR.foreground};">
      la fase di votazione del contest fotografico si è conclusa. Vogliamo ringraziarti per il tuo contributo
      e condividere con te quanti voti hanno ricevuto le tue foto.
    </p>
    <table role="presentation" width="100%" style="border-collapse:collapse;">
      ${rowsHtml}
    </table>
    <p style="margin:20px 0 0;font-size:14px;color:${COLOR.foreground};">
      <strong>Totale voti ricevuti:</strong>
      <span style="display:inline-block;background:${COLOR.primary};color:#ffffff;font-size:13px;font-weight:700;padding:4px 12px;border-radius:999px;margin-left:6px;">
        ${totalVotes}
      </span>
    </p>
    <p style="margin:20px 0 0;font-size:14px;color:${COLOR.foreground};">Grazie per aver preso parte a questa edizione del contest!<br>Il team di ComUnità</p>
  `;

  return {
    subject: "I risultati finali del contest — grazie per aver partecipato",
    html: layout("Risultati finali", bodyHtml),
  };
}
