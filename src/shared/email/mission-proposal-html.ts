function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function proposalBodyHtml(draft: string): string {
  const paragraphs = draft
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#111111;">${escapeHtml(draft.trim())}</p>`;
  }

  return paragraphs
    .map(
      (part) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#111111;">${escapeHtml(part)}</p>`,
    )
    .join("");
}

export function buildMissionOutboundEmailHtml(input: {
  companyName: string;
  employeeName: string;
  proposalDraft: string;
  language: "ru" | "en";
}): string {
  const greeting =
    input.language === "ru" ? "Здравствуйте," : "Hello,";
  const regards =
    input.language === "ru" ? "С уважением," : "Best regards,";
  const tagline = "NULLXES Digital Employees";
  const subtitle =
    input.language === "ru"
      ? "Digital Workforce Operating System"
      : "Digital Workforce Operating System";

  return `<!DOCTYPE html>
<html lang="${input.language}">
  <body style="margin:0;padding:0;background:#f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 24px;border-bottom:1px solid #eeeeee;">
                <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#666666;">NULLXES</p>
                <p style="margin:8px 0 0;font-size:22px;line-height:28px;font-weight:600;color:#000000;">${escapeHtml(input.companyName)}</p>
                <p style="margin:6px 0 0;font-size:13px;line-height:20px;color:#666666;">${escapeHtml(subtitle)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#111111;">${greeting}</p>
                ${proposalBodyHtml(input.proposalDraft)}
                <p style="margin:24px 0 0;font-size:15px;line-height:24px;color:#111111;">${regards}<br/>${escapeHtml(input.employeeName)}<br/>${escapeHtml(tagline)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid #eeeeee;">
                <p style="margin:0;font-size:11px;line-height:18px;color:#999999;">Build, deploy and manage digital employees at enterprise scale.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildMissionContactsDigestHtml(input: {
  missionTitle: string;
  employeeName: string;
  language: "ru" | "en";
  leads: Array<{
    companyName: string;
    contactName?: string;
    contactEmail?: string;
    contactSourceUrl?: string;
    verified: boolean;
    whyFit: string;
  }>;
}): string {
  const title =
    input.language === "ru"
      ? "Контакты миссии · NULLXES"
      : "Mission contacts · NULLXES";
  const intro =
    input.language === "ru"
      ? `${input.employeeName} подготовил(а) контакты для миссии «${input.missionTitle}».`
      : `${input.employeeName} prepared contacts for mission "${input.missionTitle}".`;

  const rows = input.leads
    .map((lead) => {
      const status = lead.verified
        ? input.language === "ru"
          ? "Подтверждён"
          : "Verified"
        : input.language === "ru"
          ? "Не подтверждён"
          : "Unverified";
      const contactLine = [
        lead.contactName,
        lead.contactEmail,
        lead.contactSourceUrl,
      ]
        .filter(Boolean)
        .join(" · ");

      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #eeeeee;vertical-align:top;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#000000;">${escapeHtml(lead.companyName)}</p>
          <p style="margin:4px 0 0;font-size:13px;line-height:20px;color:#444444;">${escapeHtml(contactLine || "—")}</p>
          <p style="margin:6px 0 0;font-size:12px;line-height:18px;color:#666666;">${escapeHtml(lead.whyFit)}</p>
        </td>
        <td style="padding:12px 0 12px 16px;border-bottom:1px solid #eeeeee;vertical-align:top;white-space:nowrap;font-size:12px;color:#666666;">${status}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="${input.language}">
  <body style="margin:0;padding:0;background:#f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;">
            <tr>
              <td style="padding:32px;">
                <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#666666;">NULLXES</p>
                <p style="margin:8px 0 16px;font-size:22px;line-height:28px;font-weight:600;color:#000000;">${escapeHtml(title)}</p>
                <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#444444;">${escapeHtml(intro)}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
