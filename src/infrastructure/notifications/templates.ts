export type EmailTemplateVars = {
  preheader: string;
  headline: string;
  body: string;
  details?: Array<{ label: string; value: string }>;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

const INK = "#1C1612";
const GOLD = "#C4A35A";
const CREAM = "#F6F0E6";
const CARD = "#FFFBF5";
const MUTED = "#8A7A6A";

export function renderPremiumEmail(vars: EmailTemplateVars): { html: string; text: string } {
  const detailsRows = (vars.details ?? [])
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};width:38%;">${escapeHtml(row.label)}</td>
          <td style="padding:8px 0;font-size:16px;color:${INK};">${escapeHtml(row.value)}</td>
        </tr>`,
    )
    .join("");

  const cta = vars.ctaUrl
    ? `
      <p style="margin:32px 0 8px;text-align:center;">
        <a href="${escapeHtml(vars.ctaUrl)}" style="display:inline-block;background:${GOLD};color:${INK};text-decoration:none;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:13px;padding:16px 28px;border-radius:999px;">
          ${escapeHtml(vars.ctaLabel ?? "Open")}
        </a>
      </p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(vars.headline)}</title>
</head>
<body style="margin:0;padding:0;background:${INK};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(vars.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding:12px 8px 28px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;border-radius:28px;border:1px solid ${GOLD};line-height:56px;font-family:Georgia,'Times New Roman',serif;font-size:18px;letter-spacing:0.12em;color:${GOLD};">MF</div>
              <p style="margin:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:0.22em;text-transform:uppercase;color:${GOLD};">Meridian Fusion</p>
              <p style="margin:6px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:${CREAM};opacity:0.7;">Cuisine · Uppsala</p>
            </td>
          </tr>
          <tr>
            <td style="background:${CARD};border-radius:24px;padding:36px 32px;">
              <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;color:${INK};">${escapeHtml(vars.headline)}</p>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;color:${INK};">${escapeHtml(vars.body)}</p>
              ${
                detailsRows
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid #E8DCC8;padding-top:8px;">${detailsRows}</table>`
                  : ""
              }
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 8px 8px;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:1.6;color:${CREAM};opacity:0.72;">
              ${escapeHtml(vars.footerNote ?? "Meridian Fusion Cuisine · Kungsängsgatan 1, 75322 Uppsala")}
              <br />
              <a href="https://mfcuisine.se" style="color:${GOLD};text-decoration:none;">mfcuisine.se</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textLines = [
    "Meridian Fusion Cuisine · Uppsala",
    "",
    vars.headline,
    "",
    vars.body,
    "",
    ...(vars.details ?? []).map((row) => `${row.label}: ${row.value}`),
    vars.ctaUrl ? `${vars.ctaLabel ?? "Open"}: ${vars.ctaUrl}` : "",
    "",
    vars.footerNote ?? "Meridian Fusion Cuisine · Kungsängsgatan 1, 75322 Uppsala",
    "https://mfcuisine.se",
  ].filter((line) => line !== undefined);

  return { html, text: textLines.join("\n") };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
